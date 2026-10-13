#!/usr/bin/env python3
"""
Looks for manufacturer 3D sources on the manufacturers' own pages, and records
what is actually there rather than what the section headings promise.

Why this is separate from `enrich_manufacturer_assets.py`: that script collects
documents, and a document link only exists when there is a document. This one
has to record an *absence* — a product page that offers a "3D Max Files"
heading and nothing under it. The two are different findings and the
difference matters, because "we never looked" and "we looked and the shelf was
empty" lead to completely different next steps.

INAX Vietnam renders a fixed four-section template on every product page:

    Downloads
      CAD Files           <ul class="file"><li><a href="...">SKU</a>
      Installation Files  <ul class="file"><li><a href="...">SKU</a>
      3D Max Files        <ul class="file"><li><a href="...">SKU</a>
      Spec Files          <ul class="file"><li><a href="...">SKU</a>

The headings are always present. An empty `href=""` is the signal that no file
exists for that SKU, which is why reading the headings alone would overcount
3D availability on every page on the site.

    python3 scripts/discover_manufacturer_3d.py
"""

import json
import os
import re
import sys
import time
import urllib.request
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data/demo/manufacturer-3d-source-audit.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 LivLab-asset-audit'

SECTION_TYPES = [
    ('THREE_D', re.compile(r'3D\s*Max|3DS|\b3D\b', re.I)),
    ('CAD', re.compile(r'\bCAD\b', re.I)),
    ('INSTALLATION', re.compile(r'Installation|Lắp đặt', re.I)),
    ('SPEC', re.compile(r'\bSpec\b|Thông số', re.I)),
]

# Extension -> the format we will have to deal with later. A Drive link hides
# the extension, so it stays unknown until someone opens it.
FORMAT_BY_EXT = {
    '.max': 'MAX', '.3ds': '3DS', '.fbx': 'FBX', '.obj': 'OBJ', '.skp': 'SKP',
    '.rfa': 'RFA', '.rvt': 'RVT', '.step': 'STEP', '.stp': 'STEP', '.igs': 'IGES', '.iges': 'IGES',
    '.glb': 'GLB', '.gltf': 'GLTF', '.dwg': 'DWG', '.dxf': 'DXF',
    '.zip': 'ARCHIVE', '.rar': 'ARCHIVE', '.7z': 'ARCHIVE', '.pdf': 'PDF',
}


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', 'ignore'), r.status


def declared_format(url):
    """Format from the URL alone. Never guessed from the section heading."""
    path = url.split('?')[0].split('#')[0].lower()
    for ext, fmt in FORMAT_BY_EXT.items():
        if path.endswith(ext):
            return fmt
    if 'drive.google' in path or 'docs.google' in path:
        # §15: the host says nothing about the payload. A Drive link under a 3D
        # heading may hold a .max, a .zip or a PDF, and only opening it tells.
        return 'UNKNOWN_REMOTE_FILE'
    return 'UNKNOWN'


def _token(value):
    """SKU comparison token. INAX names one file `4_-_AC_-_4005VN_-_FN.max`,
    so dashes, underscores and spaces all have to fall out before the SKU
    inside it can be seen."""
    return re.sub(r'[^A-Z0-9]', '', (value or '').upper())


def resolve_remote_filename(url, timeout=40):
    """
    The real filename behind a share link.

    §4: the heading says "3D Max Files" and the URL says nothing at all —
    `app.box.com/s/br6ru...` carries no extension — so the format is read off
    the share page's own metadata rather than invented from the heading. Box
    and Drive both name the file in the page they serve.
    """
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(400_000).decode('utf-8', 'ignore')
    except Exception as err:
        return None, f'FETCH_FAILED: {type(err).__name__}'

    for pattern in (r'"name"\s*:\s*"([^"]{3,120})"',
                    r'<title>([^<]{3,160})</title>',
                    r'itemName["\']?\s*[:=]\s*["\']([^"\']{3,120})'):
        found = re.findall(pattern, body)
        for candidate in found:
            name = unescape(candidate).strip()
            name = re.sub(r'\s*-\s*Google Drive\s*$', '', name).strip()
            if re.search(r'\.(max|3ds|fbx|obj|skp|rfa|rvt|step|stp|igs|iges|glb|gltf|dwg|dxf|zip|rar|pdf)$', name, re.I):
                return name, 'FILENAME_FROM_SHARE_PAGE'
    return None, 'FILENAME_NOT_DETERMINED'


def parse_inax_downloads(html):
    """
    Every Downloads row on an INAX product page, with its section.

    Reads the rows rather than the headings: the headings are a template and
    are always there, so a row with an empty href is the page saying "no file",
    and it is recorded as such instead of being dropped.
    """
    out = []
    # <p class="title-2 ...">SECTION</p> <ul class="file"> <li><a href="...">text</a>
    pattern = re.compile(
        r'<p[^>]*class="[^"]*title-2[^"]*"[^>]*>(.*?)</p>\s*<ul[^>]*class="[^"]*file[^"]*"[^>]*>(.*?)</ul>',
        re.S | re.I,
    )
    for m in pattern.finditer(html):
        heading = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        section_type = next((t for t, rx in SECTION_TYPES if rx.search(heading)), 'OTHER')
        for a in re.finditer(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', m.group(2), re.S | re.I):
            href = unescape(a.group(1)).strip()
            text = re.sub(r'<[^>]+>', '', a.group(2)).strip()
            out.append({
                'sectionHeading': heading,
                'sectionType': section_type,
                'linkText': text,
                'url': href or None,
                'present': bool(href),
                'declaredFormat': declared_format(href) if href else None,
            })
    return out


def inax_candidate_urls(sku):
    """
    INAX pages live at /products/<category>/<sku>/ and the category is not in
    the catalogue, so the few real ones are tried in turn. Cheaper and far less
    intrusive than crawling the sitemap for thirteen SKUs.
    """
    s = sku.lower()
    cats = ['toilet', 'lavatory', 'faucet', 'shower', 'bathtub', 'urinal', 'accessories']
    return [f'https://www.inax.com.vn/products/{c}/{s}/' for c in cats]


def discover_inax(sku, delay=1.0):
    for url in inax_candidate_urls(sku):
        try:
            html, status = fetch(url)
        except Exception:
            time.sleep(delay)
            continue
        if status != 200 or 'Downloads' not in html:
            time.sleep(delay)
            continue
        rows = parse_inax_downloads(html)
        time.sleep(delay)
        three_d = [r for r in rows if r['sectionType'] == 'THREE_D']
        with_file = [r for r in three_d if r['present']]
        for row in with_file:
            name, how = resolve_remote_filename(row['url'])
            row['actualFileName'] = name
            row['actualFormat'] = (
                FORMAT_BY_EXT.get('.' + name.rsplit('.', 1)[-1].lower(), 'UNKNOWN') if name else 'UNKNOWN_ARCHIVE'
            )
            row['formatEvidence'] = how
            # The filename carrying the SKU is what makes this an exact match
            # rather than a model from the same family.
            row['exactness'] = (
                'EXACT_COMMERCIAL_SKU'
                if name and _token(sku) in _token(name)
                else 'UNVERIFIED'
            )
            time.sleep(0.6)
        return {
            'manufacturerUrl': url,
            'pageFound': True,
            'rows': rows,
            'threeDSectionPresent': bool(three_d),
            'threeDFileCount': len(with_file),
            'result': 'FOUND_EXACT_3D' if with_file else 'NO_3D_FOUND',
        }
    return {
        'manufacturerUrl': None,
        'pageFound': False,
        'rows': [],
        'threeDSectionPresent': False,
        'threeDFileCount': 0,
        'result': 'PRODUCT_PAGE_NOT_FOUND',
    }


def main():
    catalog_skus = sys.argv[1].split(',') if len(sys.argv) > 1 else []
    # Named in the brief as pages said to expose 3D. Checked to prove the
    # parser finds a file when one is there — never added to the catalogue.
    parser_qa_skus = ['AL-638V', 'AL-622V', 'AL-682V', 'AL-289VFC', 'CFV-102A']

    results = {'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
               'brand': 'INAX', 'activeCatalog': [], 'parserQa': []}

    for group, skus in (('activeCatalog', catalog_skus), ('parserQa', parser_qa_skus)):
        for sku in skus:
            if not sku:
                continue
            found = discover_inax(sku)
            print(f"  {sku:14} {found['result']:24} 3D section={'yes' if found['threeDSectionPresent'] else 'no ':3} "
                  f"files={found['threeDFileCount']}  {found['manufacturerUrl'] or ''}")
            results[group].append({'sku': sku, **found})

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"\nda ghi {os.path.relpath(OUT, ROOT)}")


if __name__ == '__main__':
    main()
