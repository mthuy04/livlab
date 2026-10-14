#!/usr/bin/env python3
"""
Manufacturer asset enrichment.

    python3 scripts/enrich_manufacturer_assets.py [--base http://localhost:3200]

Joins the demo catalogue to the manufacturers' own product pages on brand +
normalised SKU, and takes from them the things a manufacturer is the source of
truth for: a clean isolated photograph, dimensions, colour, technologies, and
links to CAD / installation / 3D files.

It never touches commercial truth. Showroom price, promotion and availability
stay with the showroom; a manufacturer list price is stored separately as
`manufacturerReferencePrice` and never overwrites `showroomPrice`.

Matching is by SKU only. A product is never mapped to a near-looking model on
the strength of its title, and an ambiguous SKU is recorded as NO_MATCH.

Sources (all advertise these sitemaps in robots.txt; INAX disallows /search/
and /?s=, so neither is used):
    INAX   https://www.inax.com.vn/product-sitemap*.xml
    TOTO   https://vn.toto.com/product-sitemap*.xml
    JOMOO  https://jomoo.vn/sitemap_products_1.xml  (+ Haravan's .js per product)

Writes data/demo/manufacturer-enrichment.json and -report.json.
"""

import json
import os
import re
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from html import unescape

BASE = 'http://localhost:3200'
if '--base' in sys.argv:
    BASE = sys.argv[sys.argv.index('--base') + 1]

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
TENANTS = ['livlab', 'tungdang', 'luxbath']
PRIORITY_BRANDS = ['INAX', 'JOMOO', 'TOTO', 'Viglacera', 'Caesar', 'American Standard']

SITEMAPS = {
    'INAX': [f'https://www.inax.com.vn/product-sitemap{i}.xml' for i in ('', '2', '3')],
    'TOTO': [f'https://vn.toto.com/product-sitemap{i}.xml' for i in ('', '2', '3', '4', '5')],
    'JOMOO': ['https://jomoo.vn/sitemap_products_1.xml'],
}


def get(url, timeout=40):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()


def text(raw):
    return raw.decode('utf-8', 'ignore')


def strip_tags(s):
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', s)).split())


# ── SKU normalisation ──────────────────────────────────────────────────────
#
# `AC-989VN` and `AC989VN` are the same product. `#` and `/` are kept in the
# original because they separate a colour or a variant, but a comparison token
# drops everything non-alphanumeric so the two spellings meet.

def normalize_sku(sku):
    return re.sub(r'[^A-Z0-9]', '', (sku or '').upper())


def slug_token(url):
    """The comparable token a product URL carries."""
    return normalize_sku(url.rstrip('/').rsplit('/', 1)[-1])


# ── Manufacturer indexes ───────────────────────────────────────────────────

def load_sitemap_urls(urls):
    out = []
    for sm in urls:
        try:
            body = text(get(sm))
        except Exception:  # noqa: BLE001 — a missing shard is not fatal
            continue
        out += re.findall(r'<loc>([^<]+)</loc>', body)
    return sorted(set(out))


def build_index(brand):
    """normalised-token → product URL, for one manufacturer."""
    index = {}
    for url in load_sitemap_urls(SITEMAPS[brand]):
        if '/product-sitemap' in url or url.endswith('.xml'):
            continue
        index.setdefault(slug_token(url), url)
    return index


def find_match(index, sku):
    """Exact first, then the normalised token, then a contained token."""
    norm = normalize_sku(sku)
    if not norm or len(norm) < 4:
        return None, 'NO_MATCH'
    if norm in index:
        return index[norm], 'EXACT_SKU'
    # A URL that carries the code plus a descriptive prefix, e.g.
    # `ban-cau-mot-khoi-11306-2-1-31ka-2` for `11306-2-1/31KA-2`.
    hits = [(token, url) for token, url in index.items() if norm in token]
    if not hits:
        return None, 'NO_MATCH'
    if len(hits) == 1:
        return hits[0][1], 'NORMALIZED_SKU'

    # Several hits are usually one product listed under a Vietnamese and an
    # English slug. What follows the code is what distinguishes a variant, so
    # if every hit carries the same tail they are the same product; if they
    # differ, the code is genuinely ambiguous and nothing is guessed.
    tails = {token[token.index(norm) + len(norm):] for token, _ in hits}
    if len(tails) == 1:
        return min(hits, key=lambda h: len(h[0]))[1], 'NORMALIZED_SKU'
    return None, 'NO_MATCH'


# ── Page extraction ────────────────────────────────────────────────────────

SPEC_LABELS = [
    ('dimensions', ['Kích thước', 'Dimensions']),
    ('color', ['Màu sắc', 'Màu', 'Colour', 'Color']),
    ('flushSystem', ['Hệ thống xả', 'Kiểu xả']),
    ('flushVolume', ['Lượng nước xả', 'Lượng nước']),
    ('roughIn', ['Tâm thoát', 'Tâm xả']),
    ('material', ['Chất liệu', 'Vật liệu']),
    ('finish', ['Bề mặt', 'Lớp phủ']),
    ('seatType', ['Nắp', 'Kiểu nắp']),
]

FILE_LABELS = [
    ('CAD', ['CAD']),
    ('INSTALLATION', ['Installation', 'Lắp đặt', 'Hướng dẫn']),
    ('THREE_D', ['3D', '3DS', '3D Max']),
    ('SPEC', ['Spec', 'Thông số']),
]

# Never a primary product image.
BAD_IMAGE = re.compile(
    r'(flag-|icon|favicon|logo|award|banner|global\.png|ban-ve|drawing|2d|infographic|'
    # INAX serves colour swatches from /sanitary/color/. A swatch is a tile of
    # flat colour, not a product, and taking one gave twelve SKUs a blank
    # square where their photograph should be.
    r'/sanitary/color/|placeholder|share|avatar|'
    # Carousel and viewer furniture: arrows, zoom controls, bin and menu icons.
    r'arrow|detail-plus|detail-close|trash|close-icon|menu-icon|network-icon|'
    r'catalogue-icon|-icon\d*\.|pdf\.jpg|spinner|loading)',
    re.I,
)


def extract_specs(page_text):
    specs = {}
    for key, labels in SPEC_LABELS:
        for label in labels:
            m = re.search(rf'{re.escape(label)}\s*[:：]\s*([^|•\n]{{2,80}}?)(?=\s{{2,}}|$|[A-ZĐ][a-zà-ỹ]+\s*:)', page_text)
            if m:
                value = m.group(1).strip(' .;,')
                if 1 < len(value) < 80:
                    specs[key] = value
                    break
    return specs


# ── Page regions ───────────────────────────────────────────────────────────
#
# Why a page is segmented before anything is read out of it.
#
# The previous parser swept the whole document with one regex per asset kind.
# A manufacturer product page is not one product: it carries a related-products
# carousel, a coordinating-accessories strip, promotional banners and a site
# footer, all serving images from the same /wp-content/uploads/ prefix. TOTO
# MS636DT8's gallery came out holding TC600VS, MS857CDW26, MS857DW26 and
# MS889DRW25 — four other products — because nothing in the extractor knew
# which part of the page it was standing in.
#
# Everything below is anchored to the nearest preceding section marker, so an
# asset is read as belonging to the section it actually sits in.

SECTION_MARKERS = re.compile(
    r'<h[1-4][^>]*>(?P<h>.*?)</h[1-4]>'
    r'|<div[^>]+class="[^"]*title-section[^"]*"[^>]*>(?P<t>.*?)</div>'
    r'|<div[^>]+class="(?P<c>[^"]*(?:main-img|view-slider|product-gallery|list-filter|'
    r'product-filter|related|recommend|accessor|carousel|slider-nav|footer|breadcrumb)[^"]*)"',
    re.S | re.I,
)

# What a section heading means. Vietnamese first: these are Vietnamese sites.
SECTION_KINDS = [
    ('RELATED', [
        'sản phẩm tương tự', 'sản phẩm liên quan', 'sản phẩm cùng', 'có thể bạn',
        'gợi ý', 'đã xem', 'xem thêm sản phẩm', 'khác cùng',
        'related', 'recommend', 'similar', 'recently viewed', 'you may also',
        'list-filter', 'product-filter', 'carousel',
    ]),
    ('COMPATIBLE', [
        'phụ kiện', 'kết hợp', 'đồng bộ', 'trọn bộ', 'combo', 'đi kèm',
        'accessor', 'compatible', 'goes with', 'coordinat',
    ]),
    ('PROMOTIONAL', [
        'khuyến mãi', 'ưu đãi', 'chương trình', 'tin tức', 'sự kiện', 'bài viết',
        'promotion', 'banner', 'news', 'event', 'blog', 'award',
    ]),
    ('DRAWING', ['bản vẽ', 'kích thước', 'drawing', 'dimension', 'sơ đồ']),
    ('INSTALLATION', ['lắp đặt', 'lắp ráp', 'installation', 'install']),
    ('MANUAL', ['sử dụng', 'vận hành', 'bảo quản', 'user manual', 'instruction']),
    ('SPEC', ['thông số', 'specification', 'tech spec', 'datasheet']),
    ('DOWNLOAD', ['tải', 'tài liệu', 'download', 'document', 'catalog']),
    ('MEDIA', ['main-img', 'view-slider', 'product-gallery']),
    ('DESCRIPTION', ['mô tả', 'description', 'giới thiệu', 'đặc điểm', 'tính năng']),
    ('CHROME', ['footer', 'breadcrumb', 'menu', 'danh mục']),
]


def section_kind(label):
    low = (label or '').lower()
    for kind, needles in SECTION_KINDS:
        if any(n in low for n in needles):
            return kind
    return 'UNKNOWN'


def section_map(html):
    """[(offset, kind, label)] for every section marker, in document order."""
    marks = [(0, 'HEAD', 'document head')]
    for m in SECTION_MARKERS.finditer(html):
        label = strip_tags(m.group('h') or m.group('t') or '') or (m.group('c') or '')
        marks.append((m.start(), section_kind(label), label[:60]))
    return marks


def section_at(marks, offset):
    kind, label = 'UNKNOWN', ''
    for pos, k, lab in marks:
        if pos > offset:
            break
        kind, label = k, lab
    return kind, label


# ── Asset URLs ─────────────────────────────────────────────────────────────

def canonical_asset(url):
    """The real upload URL behind a CDN or WebP-Express variant.

    TOTO serves /wp-content/webp-express/webp-images/uploads/…/X.jpg.webp for
    the same file as /wp-content/uploads/…/X.jpg. Two spellings of one asset
    defeat de-duplication and hide the filename the SKU check reads, so both
    collapse to the original here.
    """
    url = re.sub(r'/wp-content/webp-express/webp-images/uploads/', '/wp-content/uploads/', url)
    url = re.sub(r'\.(png|jpe?g)\.webp$', r'.\1', url, flags=re.I)
    url = re.sub(r'\.pagespeed\.[a-z]{2}\.[\w-]+\.(png|jpe?g|webp)$', r'.\1', url, flags=re.I)
    return url


ASSET_TOKEN = re.compile(r'[A-Za-z]{1,4}[0-9]{2,6}[A-Za-z0-9#-]{0,10}')


def asset_tokens(*texts):
    """SKU-shaped tokens appearing in a filename, alt text or nearby markup."""
    out = set()
    for t in texts:
        for raw in ASSET_TOKEN.findall(t or ''):
            norm = normalize_sku(raw)
            if len(norm) >= 5:
                out.add(norm)
    return out


DRAWING_HINT = re.compile(r'(ban-ve|ban_ve|bản vẽ|drawing|kich-thuoc|kích thước|dimension|_2d|-2d|schem)', re.I)
LIFESTYLE_HINT = re.compile(r'(lifestyle|khong-gian|không gian|phong-tam|phòng tắm|room|scene|ambiance|interior)', re.I)


def _is_current(token, current):
    """A token naming this product, allowing for a variant suffix.

    `MS636` and `MS636DT8XW` are both this product; `MS857CDW26` is not.
    """
    return any(token == c or token.startswith(c) or c.startswith(token) for c in current if c)


def foreign_skus(tokens, current_tokens, brand_tokens):
    """Tokens that name a DIFFERENT product in this manufacturer's catalogue.

    Checked against the brand's own sitemap index rather than a guess, so the
    evidence for rejecting an image is that the manufacturer publishes a
    separate product page under that code.
    """
    out = set()
    for t in tokens:
        if len(t) < 6 or _is_current(t, current_tokens):
            continue
        if any(k == t or k.startswith(t) or t.startswith(k) for k in brand_tokens):
            out.add(t)
    return out


def classify_image(url, alt, section_kind_, current_tokens, foreign_tokens, sku=''):
    """Which product an image belongs to, and in what role.

    Returns one of the relations the enrichment contract allows. The SKU
    cross-check comes first and is decisive: a filename or alt text naming
    another product in the manufacturer's own catalogue is that product's
    image, whatever section it was found in and however similar it looks.
    """
    filename = url.rsplit('/', 1)[-1]
    found = asset_tokens(filename, alt)
    foreign = foreign_skus(found, current_tokens, foreign_tokens)

    # The token scanner needs letters followed by digits, which a hyphenated
    # code such as AC-900VRN-2 does not present. Comparing the normalised SKU
    # against the normalised filename catches those directly.
    norm_sku = normalize_sku(sku)
    blob = normalize_sku(filename) + '|' + normalize_sku(alt or '')
    if norm_sku and len(norm_sku) >= 5 and norm_sku in blob:
        found = found | {norm_sku}

    # An explicit drawing heading decides before the SKU check does.
    # Manufacturers publish one dimensioned drawing per product family, so the
    # file is routinely named after a sibling model: TOTO files MS636DT8's 2D
    # drawing under the name of the TC600VS seat it ships with, and captions it
    # "Bản vẽ 2D của bàn cầu một khối MS636DT8" on this page. It is still a
    # drawing, and a drawing never enters the gallery either way.
    if section_kind_ == 'DRAWING':
        return 'TECHNICAL_DRAWING', sorted(foreign)

    if foreign:
        return ('COMPATIBLE_PRODUCT' if section_kind_ == 'COMPATIBLE' else 'RELATED_PRODUCT'), sorted(foreign)

    if section_kind_ in ('RELATED',):
        return 'RELATED_PRODUCT', []
    if section_kind_ == 'COMPATIBLE':
        return 'COMPATIBLE_PRODUCT', []
    if section_kind_ in ('PROMOTIONAL', 'CHROME'):
        return 'PROMOTIONAL', []

    names_current = any(_is_current(t, current_tokens) for t in found)
    if DRAWING_HINT.search(url) or DRAWING_HINT.search(alt or ''):
        return ('TECHNICAL_DRAWING' if names_current else 'UNKNOWN'), []

    if names_current:
        if LIFESTYLE_HINT.search(url) or LIFESTYLE_HINT.search(alt or ''):
            return 'LIFESTYLE_CURRENT_PRODUCT', []
        return 'CURRENT_PRODUCT', []

    # In the product's own media region with nothing pointing elsewhere.
    if section_kind_ == 'MEDIA':
        return 'CURRENT_PRODUCT', []
    if section_kind_ == 'DESCRIPTION':
        return 'LIFESTYLE_CURRENT_PRODUCT', []

    return 'UNKNOWN', []


GALLERY_RELATIONS = ('CURRENT_PRODUCT', 'LIFESTYLE_CURRENT_PRODUCT')


# ── Documents ──────────────────────────────────────────────────────────────
#
# Canonical types are decided by the file, not by the nearest heading. The
# previous parser took the type from whichever label loop found a match, then
# accepted every link within 2000 characters of it — which is how a user manual
# (HDSD_…pdf) and a company-wide origin-data spreadsheet
# (Du-lieu-nguon-goc-xuat-xu…xlsx.pdf) were both filed as CAD on MS636DT8.

CAD_EXT = ('.dwg', '.dxf', '.dwf')
THREE_D_EXT = ('.3ds', '.max', '.skp', '.obj', '.fbx', '.glb', '.gltf', '.stl')
BIM_EXT = ('.rvt', '.ifc', '.rfa')
SHEET_EXT = ('.xls', '.xlsx', '.csv')

FILENAME_RULES = [
    ('TECHNICAL_DRAWING', ['ban-ve', 'ban_ve', 'banve', 'drawing', 'kich-thuoc', '_2d', 'schematic']),
    ('TECHNICAL_SPEC', ['tskt', 'thong-so', 'thong_so', 'spec', 'datasheet', 'technical-data']),
    ('INSTALLATION', ['hdld', 'huong-dan-lap-dat', 'lap-dat', 'lapdat', 'install', 'setup', 'fitting']),
    ('USER_MANUAL', ['hdsd', 'huong-dan-su-dung', 'su-dung', 'sudung', 'manual', 'user-guide', 'operation']),
    ('CERTIFICATE', ['chung-nhan', 'chungnhan', 'certificate', 'cert', 'iso', 'nguon-goc', 'xuat-xu',
                     'origin', 'conformity', 'cq-co', 'test-report']),
    ('CATALOG', ['catalog', 'catalogue', 'brochure', 'leaflet', 'bang-gia', 'price-list']),
    ('BIM', ['bim', 'revit']),
    ('THREE_D', ['3d', '3ds', '3dmax', 'sketchup']),
    ('CAD', ['cad']),
]

LABEL_RULES = [
    ('CAD', ['cad']),
    ('THREE_D', ['3d', '3ds', '3d max', 'sketchup']),
    ('BIM', ['bim', 'revit']),
    ('TECHNICAL_DRAWING', ['bản vẽ', 'ban ve', 'drawing', 'kích thước']),
    ('TECHNICAL_SPEC', ['thông số', 'specification', 'spec sheet', 'datasheet']),
    ('INSTALLATION', ['lắp đặt', 'installation', 'hướng dẫn lắp']),
    ('USER_MANUAL', ['sử dụng', 'user manual', 'hướng dẫn sử dụng', 'operation']),
    ('CERTIFICATE', ['chứng nhận', 'certificate', 'xuất xứ', 'nguồn gốc']),
    ('CATALOG', ['catalog', 'catalogue', 'brochure']),
]

SECTION_TO_TYPE = {
    'DRAWING': 'TECHNICAL_DRAWING',
    'INSTALLATION': 'INSTALLATION',
    'MANUAL': 'USER_MANUAL',
    'SPEC': 'TECHNICAL_SPEC',
}


def classify_document(href, label, section_kind_):
    """Canonical type, plus the evidence it was decided on.

    Extension is the strongest evidence and is trusted outright. A filename
    token is next, then the visible anchor label, then — only for formats that
    carry no type of their own, such as a PDF or a Drive link — the section the
    link sits under.
    """
    low = href.lower()
    path = low.split('?')[0]
    name = path.rsplit('/', 1)[-1]

    if path.endswith(CAD_EXT):
        return 'CAD', 'EXTENSION'
    if path.endswith(THREE_D_EXT):
        return 'THREE_D', 'EXTENSION'
    if path.endswith(BIM_EXT):
        return 'BIM', 'EXTENSION'

    # A spreadsheet is never CAD and never a drawing, whatever it sits beside.
    is_sheet = path.endswith(SHEET_EXT) or '.xlsx.' in name or '.xls.' in name

    for kind, needles in FILENAME_RULES:
        if any(n in name for n in needles):
            if is_sheet and kind in ('CAD', 'THREE_D', 'BIM', 'TECHNICAL_DRAWING'):
                continue
            return kind, 'FILENAME'

    low_label = (label or '').lower()
    for kind, needles in LABEL_RULES:
        if any(n in low_label for n in needles):
            # CAD and 3D are format claims: a label alone cannot make a PDF or
            # a spreadsheet into one.
            if kind in ('CAD', 'THREE_D', 'BIM') and not path.endswith(CAD_EXT + THREE_D_EXT + BIM_EXT):
                if not path.endswith(('.zip', '.rar', '.7z')):
                    continue
            return kind, 'ANCHOR_LABEL'

    if is_sheet:
        return 'OTHER', 'SPREADSHEET'

    mapped = SECTION_TO_TYPE.get(section_kind_)
    if mapped:
        return mapped, 'SECTION'

    return 'OTHER', 'FALLBACK'


GENERIC_DOC_HINT = re.compile(
    r'(du-lieu-nguon-goc|nguon-goc-xuat-xu|bang-gia|price-list|company|cong-ty|'
    r'chinh-sach|policy|catalogue-tong|tong-hop|all-product|full-range)', re.I)


def document_is_product_specific(href, sku, section_label):
    """Whether a file belongs to this product rather than to the company.

    A product page links company-wide paperwork too. Those files are real, but
    presenting an all-products origin-data spreadsheet as this product's
    documentation is a false claim about what the showroom holds.
    """
    name = href.rsplit('/', 1)[-1]
    norm_sku = normalize_sku(sku)
    if norm_sku and norm_sku in normalize_sku(name):
        return True, 'SKU_IN_FILENAME'
    # The model family without its variant suffix, e.g. MS636 for MS636DT8.
    family = re.match(r'([A-Z]+[0-9]{3,5})', norm_sku or '')
    if family and family.group(1) in normalize_sku(name):
        return True, 'FAMILY_IN_FILENAME'
    if norm_sku and norm_sku in normalize_sku(section_label or ''):
        return True, 'SKU_IN_SECTION_HEADING'
    if GENERIC_DOC_HINT.search(name):
        return False, 'COMPANY_WIDE_FILENAME'
    # A file the manufacturer lists in this product's own download section,
    # named for an internal document number rather than the model. TOTO's user
    # manual HDSD_Ban_cau_0IM067301S1_Rv06.pdf is one: genuinely this product's
    # paperwork, with nothing in the filename to prove it. Page association is
    # accepted provisionally, and the cross-product pass in main() takes it
    # back if the same file turns out to be linked from many other products.
    if section_label:
        return True, 'PRODUCT_PAGE_SECTION'
    return False, 'NO_PRODUCT_EVIDENCE'

# Hosts that serve a file behind a share link, plus the extensions that name a
# file directly.
#
# `app.box.com` was missing, and that single omission is why this enrichment
# reported no 3D sources at all. INAX publishes its 3D Max files on Box with
# extensionless share URLs — `app.box.com/s/br6ru4nr1n1ikyoi1hcjgdtwhqxx6iow`
# — so neither the host nor the path matched, the link was skipped before it
# was ever classified, and six active SKUs looked like they had nothing. The
# `THREE_D` label and the `.max` extension were both already here; the link
# just never reached them.
DOC_HREF = re.compile(
    r'(drive\.google|docs\.google|dropbox\.com|box\.com|'
    r'(?:\.pdf|\.dwg|\.dxf|\.dwf|\.zip|\.rar|\.7z|\.max|\.3ds|\.skp|\.obj|\.fbx|'
    r'\.igs|\.iges|\.step|\.stp|'
    r'\.glb|\.gltf|\.stl|\.rvt|\.rfa|\.ifc|\.xlsx?|\.docx?)(?:$|[?#]))', re.I)


def extract_files(html, sku):
    """Official document links, typed by the file rather than by its neighbours."""
    marks = section_map(html)
    out, seen = [], set()

    for m in re.finditer(r'<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
        href = unescape(m.group(1))
        if not DOC_HREF.search(href):
            continue
        if href in seen:
            continue
        seen.add(href)

        label = strip_tags(m.group(2))[:80]
        kind, label_section = section_at(marks, m.start())
        # A bare "tại đây" tells us nothing; the heading above it does.
        effective_label = label if len(label) > 4 else label_section
        doc_type, evidence = classify_document(href, effective_label, kind)
        specific, why = document_is_product_specific(href, sku, label_section)

        out.append({
            'type': doc_type,
            'sourceUrl': href,
            'label': label or None,
            'sourceSection': label_section or kind,
            'typeEvidence': evidence,
            'productSpecific': specific,
            'specificityEvidence': why,
        })
    return out


IMG_TAG = re.compile(
    r'<img[^>]+(?:src|data-src|data-lazy-src)="(?P<src>[^"]+)"[^>]*?(?:alt="(?P<alt>[^"]*)")?[^>]*>',
    re.I)


def image_candidates(html, brand, sku, foreign_tokens):
    """Every image on the page, with where it sits and whose product it is."""
    marks = section_map(html)
    current_tokens = asset_tokens(sku) | {normalize_sku(sku)}
    seen, out = set(), []

    def add(url, alt, offset):
        url = canonical_asset(unescape(url))
        if not url.startswith('http') or url.startswith('data:'):
            return
        if not re.search(r'\.(png|jpe?g|webp)(?:$|[?#])', url, re.I):
            return
        if url in seen:
            return
        seen.add(url)
        kind, label = section_at(marks, offset)
        if BAD_IMAGE.search(url):
            out.append({'url': url, 'sourceSection': label or kind,
                        'relation': 'PROMOTIONAL', 'accepted': False,
                        'reason': 'NON_PRODUCT_ASSET'})
            return
        relation, foreign = classify_image(url, alt or '', kind, current_tokens, foreign_tokens, sku)
        rec = {'url': url, 'sourceSection': label or kind, 'relation': relation,
               'accepted': relation in GALLERY_RELATIONS}
        if foreign:
            rec['foreignSku'] = foreign
        out.append(rec)

    og = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
    if og:
        add(og.group(1), f'og image {sku}', 0)

    for m in IMG_TAG.finditer(html):
        add(m.group('src'), m.group('alt'), m.start())

    if brand == 'INAX':
        # INAX's product photograph is an S3 object named after the SKU and is
        # not always referenced by an <img> on the page. Only a SKU-named S3
        # asset counts: the rest of that bucket is colour swatches and room
        # furniture, which is what once gave twelve SKUs a blank square.
        for s3 in (f'https://inax-vn.s3.ap-southeast-1.amazonaws.com/sanitary/products/{sku}_photo.png',
                   f'https://inax-vn.s3-ap-southeast-1.amazonaws.com/sanitary/products/{sku}.png'):
            if s3 in seen:
                continue
            try:
                urllib.request.urlopen(urllib.request.Request(s3, headers=UA, method='HEAD'), timeout=20)
            except Exception:  # noqa: BLE001
                continue
            seen.add(s3)
            out.insert(0, {'url': s3, 'sourceSection': 'INAX S3 product photo',
                           'relation': 'CURRENT_PRODUCT', 'accepted': True})
            break

        for u in re.findall(r'https://inax-vn\.s3[^"\'\s>]+\.(?:png|jpg|jpeg|webp)', html):
            if normalize_sku(sku) in normalize_sku(u) and not BAD_IMAGE.search(u):
                add(u, f'INAX {sku}', html.find(u))

    return out


def extract_product(brand, url, sku, foreign_tokens):
    html = text(get(url))
    html = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html, flags=re.S | re.I)
    page_text = strip_tags(html)

    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    official_name = strip_tags(h1.group(1)) if h1 else None

    candidates = image_candidates(html, brand, sku, foreign_tokens)
    gallery = [c['url'] for c in candidates if c['accepted']]
    drawings = [c['url'] for c in candidates if c['relation'] == 'TECHNICAL_DRAWING']

    files = extract_files(html, sku)
    product_files = [f for f in files if f['productSpecific']]

    record = {
        'manufacturerBrand': brand,
        'manufacturerProductUrl': url,
        'officialName': official_name,
        'officialSku': sku,
        'primaryImage': gallery[0] if gallery else None,
        'galleryImages': gallery[1:6],
        'technicalDrawing': drawings[0] if drawings else None,
        'technicalSpecs': extract_specs(page_text),
        'files': [{k: v for k, v in f.items() if k != 'productSpecific'} for f in product_files],
        'companyDocuments': [f['sourceUrl'] for f in files if not f['productSpecific']],
        'galleryAudit': candidates,
        'technologies': sorted(set(re.findall(
            r'(Aqua Ceramic|CEFIONTECT|Tornado|Rimless|Nano|Proguard|Hyper ?Kill)', page_text, re.I))),
        'manufacturerReferencePrice': None,
        'technicalSourceUrl': url,
        'imageSourceUrl': gallery[0] if gallery else None,
    }

    if brand == 'JOMOO':
        # Haravan exposes the product as JSON: exact SKU, images, list price.
        # That list is the manufacturer's own record of this product, so every
        # image in it is CURRENT_PRODUCT by construction — no page scraping,
        # and no carousel to be confused by.
        try:
            data = json.loads(text(get(url.rstrip('/') + '.js', timeout=30)))
            record['officialName'] = data.get('title') or record['officialName']
            variants = data.get('variants') or []
            if variants:
                record['officialSku'] = variants[0].get('sku') or sku
                price = variants[0].get('price')
                # Haravan reports in hundredths.
                if isinstance(price, int) and price > 0:
                    record['manufacturerReferencePrice'] = price // 100
            imgs = [i if i.startswith('http') else 'https:' + i for i in (data.get('images') or [])]
            imgs = [canonical_asset(i) for i in imgs if not BAD_IMAGE.search(i)]
            if imgs:
                record['primaryImage'] = imgs[0]
                record['galleryImages'] = imgs[1:6]
                record['imageSourceUrl'] = imgs[0]
                record['galleryAudit'] = [
                    {'url': i, 'sourceSection': 'Haravan product record',
                     'relation': 'CURRENT_PRODUCT', 'accepted': True} for i in imgs
                ] + [c for c in candidates if not c['accepted']]
        except Exception:  # noqa: BLE001
            pass

    return record


# ── Main ───────────────────────────────────────────────────────────────────

def catalog_products():
    """Every product the storefront knows, withheld ones included."""
    seen = {}
    for tenant in TENANTS:
        req = urllib.request.Request(
            f'{BASE}/api/storefront/products?quality=all',
            headers={**UA, 'Cookie': f'livlab_tenant_preview={tenant}'},
        )
        for p in json.loads(get_req(req))['products']:
            seen.setdefault(p['id'], {**p, 'tenants': []})
            seen[p['id']]['tenants'].append(tenant)
    return list(seen.values())


def get_req(req):
    return urllib.request.urlopen(req, timeout=60).read()


def main():
    products = catalog_products()
    by_brand = defaultdict(list)
    for p in products:
        if p['brand'] in PRIORITY_BRANDS and p['sku']:
            by_brand[p['brand']].append(p)

    enrichment = {}
    gallery_audit = {}
    report = {'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'brands': {}}

    only = None
    if '--brands' in sys.argv:
        only = {b.strip().upper() for b in sys.argv[sys.argv.index('--brands') + 1].split(',')}

    previous = {}
    if only:
        try:
            with open('data/demo/manufacturer-enrichment.json', encoding='utf-8') as fh:
                previous = json.load(fh).get('products', {})
            with open('data/demo/manufacturer-enrichment-report.json', encoding='utf-8') as fh:
                report['brands'] = json.load(fh).get('brands', {})
        except OSError:
            pass
        enrichment.update(previous)

    for brand in PRIORITY_BRANDS:
        if only and brand.upper() not in only:
            continue
        items = by_brand.get(brand, [])
        if not items:
            continue
        print(f'\n{brand}: {len(items)} SKUs')

        index = build_index(brand) if brand in SITEMAPS else {}
        if brand not in SITEMAPS:
            report['brands'][brand] = {
                'attempted': len(items),
                'note': 'No official sitemap wired for this brand.',
                'matchTypes': {'NO_MATCH': len(items)},
            }
            for p in items:
                enrichment[p['id']] = {'matchType': 'NO_MATCH', 'brand': brand, 'sku': p['sku']}
            continue

        print(f'  index: {len(index)} product URLs')
        # Every other product this manufacturer publishes. An image whose
        # filename or alt text names one of these belongs to that product, and
        # is what put four other toilets in MS636DT8's gallery.
        brand_tokens = set(index)
        match_types = Counter()
        stats = Counter()
        audit_rows = []

        for i, p in enumerate(items, 1):
            url, match_type = find_match(index, p['sku'])
            match_types[match_type] += 1
            entry = {'matchType': match_type, 'brand': brand, 'sku': p['sku']}
            if url:
                try:
                    entry.update(extract_product(brand, url, p['sku'], brand_tokens))
                    entry['manufacturerCheckedAt'] = report['checkedAt']
                    if entry.get('primaryImage'):
                        stats['officialImagesFound'] += 1
                    if entry.get('technicalSpecs'):
                        stats['specsEnriched'] += 1
                    if entry['technicalSpecs'].get('dimensions'):
                        stats['dimensionsEnriched'] += 1
                    if entry.get('technicalDrawing'):
                        stats['technicalDrawings'] += 1
                    for f in entry.get('files', []):
                        stats[f'doc_{f["type"]}'] += 1
                    for c in entry.get('galleryAudit', []):
                        stats['galleryAccepted' if c['accepted'] else 'galleryRejected'] += 1
                        if not c['accepted']:
                            stats[f'rejected_{c["relation"]}'] += 1
                        audit_rows.append({'product': p['id'], **c})
                except Exception as exc:  # noqa: BLE001
                    entry['error'] = str(exc)[:80]
                    match_types[match_type] -= 1
                    match_types['NO_MATCH'] += 1
                    entry['matchType'] = 'NO_MATCH'
            enrichment[p['id']] = entry
            sys.stdout.write(f'\r  {i}/{len(items)} matched={sum(v for k, v in match_types.items() if k != "NO_MATCH")}   ')
            sys.stdout.flush()
            time.sleep(0.2)

        print()
        report['brands'][brand] = {
            'attempted': len(items),
            'indexSize': len(index),
            'matchTypes': dict(match_types),
            **{k: v for k, v in stats.items()},
        }
        gallery_audit[brand] = audit_rows
        print('  ', report['brands'][brand])

    # A file linked from many different products' pages is the manufacturer's
    # paperwork, not this product's documentation, even when its filename gives
    # nothing away. Frequency is the evidence; one pass once every page is in.
    doc_owners = defaultdict(set)
    for pid, entry in enrichment.items():
        for f in entry.get('files') or []:
            doc_owners[f['sourceUrl']].add(pid)
    # Five, not two: one document legitimately covers a model family, and a
    # family can run to four SKUs in this catalogue. Company paperwork appears
    # on far more pages than that.
    shared = {u for u, owners in doc_owners.items() if len(owners) >= 5}
    demoted = 0
    for entry in enrichment.values():
        keep = []
        for f in entry.get('files') or []:
            if f['sourceUrl'] in shared and f.get('specificityEvidence') not in (
                    'SKU_IN_FILENAME', 'FAMILY_IN_FILENAME', 'SKU_IN_SECTION_HEADING'):
                entry.setdefault('companyDocuments', []).append(f['sourceUrl'])
                demoted += 1
                continue
            keep.append(f)
        if 'files' in entry:
            entry['files'] = keep
    report['companyWideDocumentsDemoted'] = demoted

    os.makedirs('data/demo', exist_ok=True)
    with open('data/demo/manufacturer-gallery-audit.json', 'w', encoding='utf-8') as fh:
        json.dump({'checkedAt': report['checkedAt'], 'candidates': gallery_audit},
                  fh, ensure_ascii=False, indent=1)
    with open('data/demo/manufacturer-enrichment.json', 'w', encoding='utf-8') as fh:
        json.dump({'checkedAt': report['checkedAt'], 'products': enrichment}, fh, ensure_ascii=False, indent=1)
    with open('data/demo/manufacturer-enrichment-report.json', 'w', encoding='utf-8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)

    print('\nWrote data/demo/manufacturer-enrichment.json')
    print(json.dumps(report['brands'], ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
