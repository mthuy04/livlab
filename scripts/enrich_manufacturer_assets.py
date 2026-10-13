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
    r'/sanitary/color/|placeholder|share|avatar)',
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


def extract_files(html, sku):
    """Official document links, by the label they sit under."""
    out = []
    seen = set()
    for kind, labels in FILE_LABELS:
        for label in labels:
            idx = html.find(f'{sku} {label}')
            if idx == -1:
                idx = html.find(label)
            if idx == -1:
                continue
            window = html[max(0, idx - 500): idx + 1500]
            for href in re.findall(r'href="(https?://[^"]+)"', window):
                if not re.search(r'(drive\.google|\.pdf|\.dwg|\.zip|\.rar|\.max|\.dxf)', href, re.I):
                    continue
                if href in seen:
                    continue
                seen.add(href)
                out.append({'type': kind, 'sourceUrl': href})
            break
    return out


def extract_product(brand, url, sku):
    html = text(get(url))
    page_text = strip_tags(re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html, flags=re.S))

    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    official_name = strip_tags(h1.group(1)) if h1 else None

    images = []
    if brand == 'INAX':
        # INAX serves an isolated photograph named after the SKU.
        s3 = f'https://inax-vn.s3.ap-southeast-1.amazonaws.com/sanitary/products/{sku}_photo.png'
        try:
            urllib.request.urlopen(urllib.request.Request(s3, headers=UA, method='HEAD'), timeout=20)
            images.append(s3)
        except Exception:  # noqa: BLE001
            pass
        # Only the SKU-named photograph counts as INAX's product image; the
        # rest of the page's S3 assets are swatches and furniture.
        images += [u for u in re.findall(r'https://inax-vn\.s3[^"\'\s>]+\.(?:png|jpg|jpeg|webp)', html)
                   if not BAD_IMAGE.search(u) and sku.upper() in u.upper()]
    else:
        og = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
        if og and not BAD_IMAGE.search(og.group(1)):
            images.append(og.group(1))
        images += [u for u in re.findall(r'https?://[^"\'\s>]+/wp-content/uploads/[^"\'\s>]+\.(?:png|jpg|jpeg|webp)', html)
                   if not BAD_IMAGE.search(u)]

    # Keep order, drop duplicates.
    gallery = list(dict.fromkeys(images))

    record = {
        'manufacturerBrand': brand,
        'manufacturerProductUrl': url,
        'officialName': official_name,
        'officialSku': sku,
        'primaryImage': gallery[0] if gallery else None,
        'galleryImages': gallery[1:6],
        'technicalSpecs': extract_specs(page_text),
        'files': extract_files(html, sku),
        'technologies': sorted(set(re.findall(r'(Aqua Ceramic|CEFIONTECT|Tornado|Rimless|Nano|Proguard|Hyper ?Kill)', page_text, re.I))),
        'manufacturerReferencePrice': None,
        'technicalSourceUrl': url,
        'imageSourceUrl': gallery[0] if gallery else None,
    }

    if brand == 'JOMOO':
        # Haravan exposes the product as JSON: exact SKU, images, list price.
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
            imgs = [i for i in imgs if not BAD_IMAGE.search(i)]
            if imgs:
                record['primaryImage'] = imgs[0]
                record['galleryImages'] = imgs[1:6]
                record['imageSourceUrl'] = imgs[0]
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
        match_types = Counter()
        stats = Counter()

        for i, p in enumerate(items, 1):
            url, match_type = find_match(index, p['sku'])
            match_types[match_type] += 1
            entry = {'matchType': match_type, 'brand': brand, 'sku': p['sku']}
            if url:
                try:
                    entry.update(extract_product(brand, url, p['sku']))
                    entry['manufacturerCheckedAt'] = report['checkedAt']
                    if entry.get('primaryImage'):
                        stats['officialImagesFound'] += 1
                    if entry.get('technicalSpecs'):
                        stats['specsEnriched'] += 1
                    if entry['technicalSpecs'].get('dimensions'):
                        stats['dimensionsEnriched'] += 1
                    for f in entry.get('files', []):
                        stats[f'files{f["type"].title()}'] += 1
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
        print('  ', report['brands'][brand])

    os.makedirs('data/demo', exist_ok=True)
    with open('data/demo/manufacturer-enrichment.json', 'w', encoding='utf-8') as fh:
        json.dump({'checkedAt': report['checkedAt'], 'products': enrichment}, fh, ensure_ascii=False, indent=1)
    with open('data/demo/manufacturer-enrichment-report.json', 'w', encoding='utf-8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)

    print('\nWrote data/demo/manufacturer-enrichment.json')
    print(json.dumps(report['brands'], ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
