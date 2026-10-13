#!/usr/bin/env python3
"""
Normalise catalogue product imagery.

    python3 scripts/normalize_product_images.py [--base http://localhost:3200]

Takes the image each product currently resolves to, trims the empty margin
around the product, adds a little safe padding, and writes a square WebP into
a per-manufacturer namespace. The grid then renders one canvas with the
product filling it, instead of a cream stage wrapping a white JPEG wrapping a
small photograph.

What it is allowed to do: crop empty outer margin, normalise the canvas,
convert format, resize DOWN, compress, keep alpha.

What it must not do, and does not: change a colour, remove part of a product,
reshape anything, invent missing area, strip a marking off the product itself,
or upscale a small asset to fake resolution.

Provenance for every output — source URL, manufacturer, original format and
size, retrieval date — is written to data/demo/image-assets.json so a demo
asset can be traced and swapped for an official dealer pack later.
"""

import io
import json
import os
import re
import sys
import time
import urllib.request
from collections import Counter

from PIL import Image

BASE = 'http://localhost:3200'
if '--base' in sys.argv:
    BASE = sys.argv[sys.argv.index('--base') + 1]

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
TENANTS = ['livlab', 'tungdang', 'luxbath']
OUT_ROOT = 'public/demo/manufacturers'

# A pixel at or above this on every channel counts as empty backdrop.
NEAR_WHITE = 248
# Safe margin left around the product after trimming, as a fraction of the
# trimmed box. White ceramic needs room to breathe against a white stage.
SAFE_PADDING = 0.06
CANVAS = 1200


def fetch(url):
    if url.startswith('/'):
        url = BASE + url
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45).read()


def content_box(im):
    """The product's bounding box: alpha when there is one, else near-white."""
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        alpha = im.convert('RGBA').getchannel('A')
        box = alpha.getbbox()
        if box:
            return box, 'ALPHA'

    rgb = im.convert('RGB')
    w, h = rgb.size
    px = rgb.load()
    step = max(1, min(w, h) // 400)

    def row_empty(y):
        return all(min(px[x, y]) >= NEAR_WHITE for x in range(0, w, step))

    def col_empty(x):
        return all(min(px[x, y]) >= NEAR_WHITE for y in range(0, h, step))

    # Only contiguous margin from each edge is removed, so a white area inside
    # the product — a cistern lid, a highlight — is never touched.
    top = 0
    while top < h - 1 and row_empty(top):
        top += 1
    bottom = h - 1
    while bottom > top and row_empty(bottom):
        bottom -= 1
    left = 0
    while left < w - 1 and col_empty(left):
        left += 1
    right = w - 1
    while right > left and col_empty(right):
        right -= 1

    if right <= left or bottom <= top:
        return None, 'NONE'
    return (left, top, right + 1, bottom + 1), 'NEAR_WHITE'


def normalise(raw):
    im = Image.open(io.BytesIO(raw))
    original = {'format': im.format, 'width': im.size[0], 'height': im.size[1]}

    box, method = content_box(im)
    if not box:
        return None, original, method

    product = im.crop(box)
    pw, ph = product.size
    side = int(max(pw, ph) * (1 + SAFE_PADDING * 2))

    has_alpha = product.mode in ('RGBA', 'LA') or (product.mode == 'P' and 'transparency' in product.info)
    if has_alpha:
        product = product.convert('RGBA')
        canvas = Image.new('RGBA', (side, side), (255, 255, 255, 0))
    else:
        product = product.convert('RGB')
        canvas = Image.new('RGB', (side, side), (255, 255, 255))
    canvas.paste(product, ((side - pw) // 2, (side - ph) // 2))

    # Resize down only. A 300px source stays a 300px source.
    if side > CANVAS:
        canvas = canvas.resize((CANVAS, CANVAS), Image.LANCZOS)

    buf = io.BytesIO()
    canvas.save(buf, 'WEBP', quality=88, method=6)
    return buf.getvalue(), original, method


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', (value or '').lower()).strip('-') or 'unknown'


def main():
    products = {}
    for tenant in TENANTS:
        req = urllib.request.Request(
            f'{BASE}/api/storefront/products?quality=all',
            headers={**UA, 'Cookie': f'livlab_tenant_preview={tenant}'},
        )
        for p in json.loads(urllib.request.urlopen(req, timeout=60).read())['products']:
            products.setdefault(p['id'], p)

    # Only products the storefront will actually show are worth processing.
    todo = [p for p in products.values() if p.get('imagePresentable') and p.get('image')]
    print(f'{len(todo)} presentable products of {len(products)}')

    assets = {}
    stats = Counter()

    for i, p in enumerate(todo, 1):
        brand_dir = os.path.join(OUT_ROOT, slug(p['brand']))
        name = f"{slug(p['sku'] or p['id'])}-primary.webp"
        rel = f"/demo/manufacturers/{slug(p['brand'])}/{name}"
        try:
            raw = fetch(p['image'])
            data, original, method = normalise(raw)
            if not data:
                stats['noContent'] += 1
                continue
            os.makedirs(brand_dir, exist_ok=True)
            with open(os.path.join(brand_dir, name), 'wb') as fh:
                fh.write(data)
            size = Image.open(io.BytesIO(data)).size
            assets[p['id']] = {
                'localPath': rel,
                'width': size[0],
                'height': size[1],
                'processing': ['TRIMMED_WHITESPACE', 'NORMALIZED_CANVAS', 'CONVERTED_WEBP'],
                'trimMethod': method,
                'provenance': {
                    'imageSourceUrl': p['image'],
                    'assetOwner': p['brand'],
                    'sourceType': p.get('imageSource', 'RETAILER'),
                    'originalFormat': original['format'],
                    'originalWidth': original['width'],
                    'originalHeight': original['height'],
                    'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                },
            }
            stats[p.get('imageSource', 'RETAILER')] += 1
            stats['written'] += 1
        except Exception as exc:  # noqa: BLE001 — a broken asset is a result
            stats['failed'] += 1
            assets.setdefault(p['id'], {'error': str(exc)[:80]})
        sys.stdout.write(f'\r  {i}/{len(todo)} written={stats["written"]}   ')
        sys.stdout.flush()

    print()
    os.makedirs('data/demo', exist_ok=True)
    with open('data/demo/image-assets.json', 'w', encoding='utf-8') as fh:
        json.dump({'assets': assets}, fh, ensure_ascii=False, indent=1)
    print('Wrote data/demo/image-assets.json')
    print(dict(stats))


if __name__ == '__main__':
    main()
