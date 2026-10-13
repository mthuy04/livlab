#!/usr/bin/env python3
"""
Catalogue image QA.

    python3 scripts/audit_catalog_images.py [--base http://localhost:3200]

Fetches every image the storefront currently exposes, for every tenant, and
measures it. Nothing is guessed from a filename alone: each asset is opened
and inspected, and the report records what was measured so a status can be
argued with.

Writes data/demo/image-audit.json and prints a summary.

Statuses
    CLEAN                  isolated product, clean background, enough pixels
    ACCEPTABLE             usable, but margins or fill are off
    LOW_RESOLUTION         longest edge under 500px
    PROMOTIONAL            colour/graphics that are not the product
    WATERMARKED            text or marks banded around the edges
    WRONG_TENANT_BRANDING  another showroom's mark inside the image
    MISSING                no asset, or it would not load
    NEEDS_REPLACEMENT      fails the bar and has no cleaner sibling
"""

import io
import json
import os
import sys
import urllib.request
from collections import Counter

from PIL import Image

BASE = 'http://localhost:3200'
if '--base' in sys.argv:
    BASE = sys.argv[sys.argv.index('--base') + 1]

TENANTS = ['livlab', 'tungdang', 'luxbath']
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

# Hosts that belong to a specific showroom. An image served from one of these
# carries that showroom's branding more often than not.
SHOWROOM_HOSTS = {'luxbath.vn': 'luxbath', 'beptungdang.vn': 'tungdang'}

# A manufacturer's own CDN. An image from here belongs to the product, not to
# any showroom, so it can never be cross-tenant contamination.
MANUFACTURER_HOSTS = (
    'inax-vn.s3.ap-southeast-1.amazonaws.com',
    'inax-vn.s3-ap-southeast-1.amazonaws.com',
    'product.hstatic.net',
    'www.inax.com.vn',
    'vn.toto.com',
    'jomoo.vn',
    'cdn.hstatic.net',
)

NEAR_WHITE = 238


def fetch(url):
    if url.startswith('/'):
        url = BASE + url
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=45).read()


def measure(raw):
    """Open an asset and pull out the few numbers a status can rest on.

    The useful question for a catalogue grid is not "does this file contain a
    watermark" — that needs OCR — but "is this an isolated product on a clean
    plate". Two measurements answer it: how white the outer ring is, and how
    much colour or dark text sits in that ring. A flower, a phone number, a
    dealer logo and a sky-blue advert all land there; a product's own badge
    sits in the middle, where it belongs.
    """
    im = Image.open(io.BytesIO(raw))
    fmt = im.format
    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    rgb = im.convert('RGB')
    w, h = rgb.size
    px = rgb.load()

    step = max(1, min(w, h) // 240)
    ring = 0.12
    minx, miny, maxx, maxy = w, h, 0, 0
    sampled = 0
    ring_total = ring_white = ring_sat = ring_dark = 0
    # Shading. A photograph of white ceramic is full of soft mid greys; a
    # line drawing is white or black with almost nothing between.
    mid_tone = ink = 0
    # Model-code captions and dealer strips live along the bottom edge.
    foot_total = foot_ink = 0

    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px[x, y]
            sampled += 1
            mx, mn = max(r, g, b), min(r, g, b)
            if r < NEAR_WHITE or g < NEAR_WHITE or b < NEAR_WHITE:
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
            in_ring = (
                x < w * ring or x > w * (1 - ring) or y < h * ring or y > h * (1 - ring)
            )
            if mx < 236:
                ink += 1
                if 120 < mx < 236:
                    mid_tone += 1
            if y > h * 0.86:
                foot_total += 1
                if mx < 150 or (mx > 60 and (mx - mn) / mx > 0.20):
                    foot_ink += 1
            if in_ring:
                ring_total += 1
                if mn >= 232:
                    ring_white += 1
                if mx > 60 and (mx - mn) / mx > 0.20:
                    ring_sat += 1
                if mx < 120:
                    ring_dark += 1

    fill_w = (maxx - minx) / w if maxx > minx else 0
    fill_h = (maxy - miny) / h if maxy > miny else 0
    t = max(1, ring_total)
    return {
        'width': w,
        'height': h,
        'format': fmt,
        'hasAlpha': has_alpha,
        'bytes': len(raw),
        'fillWidth': round(fill_w, 3),
        'fillHeight': round(fill_h, 3),
        'ringWhite': round(ring_white / t, 3),
        'ringSaturated': round(ring_sat / t, 4),
        'ringDark': round(ring_dark / t, 4),
        'footInk': round(foot_ink / max(1, foot_total), 4),
        'inkFraction': round(ink / max(1, sampled), 4),
        'midToneFraction': round(mid_tone / max(1, sampled), 4),
    }


def classify(m, url, tenant_id):
    host = url.split('/')[2] if url.startswith('http') else ''
    owner = None if host in MANUFACTURER_HOSTS else SHOWROOM_HOSTS.get(host)
    longest = max(m['width'], m['height'])
    isolated = m['ringWhite'] >= 0.90

    # Colour or text in the ring around an otherwise white plate is something
    # added to the photograph: a bouquet, a dealer mark, a phone number.
    dressed = isolated and (
        m['ringSaturated'] > 0.012 or m['ringDark'] > 0.012 or m['footInk'] > 0.045
    )

    if dressed and owner and owner != tenant_id.lower():
        return 'WRONG_TENANT_BRANDING'
    if dressed:
        return 'WATERMARKED' if m['ringSaturated'] <= 0.012 else 'PROMOTIONAL'
    # A dimension diagram, a CAD preview or a spec plate is line art: nearly
    # all of its ink is black-on-white with no shading between. A photograph
    # of white ceramic is the opposite — almost every non-white pixel is a
    # mid grey. Measured across this catalogue, line art sits at 0.19–0.58 and
    # photographs at 0.96 and up.
    if m['inkFraction'] > 0.004 and m['midToneFraction'] / max(m['inkFraction'], 1e-6) < 0.72:
        return 'NEEDS_REPLACEMENT'
    if not isolated:
        # A room, a warehouse floor or an advert background. Fine on a detail
        # gallery, wrong as the one image in a catalogue grid.
        return 'NEEDS_REPLACEMENT'
    if m['fillHeight'] < 0.30 or m['fillWidth'] < 0.15:
        return 'NEEDS_REPLACEMENT'
    if longest < 500:
        return 'LOW_RESOLUTION'
    if longest < 800:
        return 'ACCEPTABLE'
    return 'CLEAN'


REJECTED = {
    'PROMOTIONAL',
    'WATERMARKED',
    'WRONG_TENANT_BRANDING',
    'NEEDS_REPLACEMENT',
    'MISSING',
}


def fixture_alternatives():
    """Extra images the importer already captured, keyed by catalogue id."""
    try:
        with open('data/demo/tungdang-sanitaryware.json', encoding='utf-8') as fh:
            fixture = json.load(fh)
    except OSError:
        return {}
    out = {}
    for p in fixture['products']:
        key = f"{(p.get('brand') or 'x').lower()}-{(p.get('sku') or p['name']).lower()}"
        key = ''.join(c if c.isalnum() else '-' for c in key).strip('-')[:90]
        while '--' in key:
            key = key.replace('--', '-')
        out[key] = [i for i in (p.get('additionalImages') or []) if i]
    return out


def main():
    report = {'base': BASE, 'tenants': {}}
    overall = Counter()

    for tenant in TENANTS:
        req = urllib.request.Request(
            # Every product, withheld ones included: the audit is what decides
            # which are withheld, so it cannot read a list it already filtered.
            f'{BASE}/api/storefront/products?quality=all',
            headers={**UA, 'Cookie': f'livlab_tenant_preview={tenant}'},
        )
        data = json.loads(urllib.request.urlopen(req, timeout=60).read())
        products = data['products']
        alternatives = fixture_alternatives()
        rows = []
        counts = Counter()

        for i, p in enumerate(products, 1):
            # Judge the SOURCE, not the presentation copy. A normalised asset
            # has had its empty margin trimmed, so the product now touches the
            # frame and every "isolated on a clean plate" test would fail — but
            # what the audit is looking for (dealer marks, promo graphics, line
            # art) lives in the original.
            provenance = p.get('imageProvenance') or {}
            audited = provenance.get('sourceUrl') or p['image']
            row = {
                'id': p['id'],
                'brand': p['brand'],
                'sku': p['sku'],
                'category': p['category'],
                'image': audited,
                'renderedImage': p['image'],
            }
            if not audited:
                row['status'] = 'MISSING'
            else:
                try:
                    row.update(measure(fetch(audited)))
                    row['status'] = classify(row, audited, data['tenantId'])
                except Exception as exc:  # noqa: BLE001 — a broken asset is a result
                    row['status'] = 'MISSING'
                    row['error'] = str(exc)[:90]
            # A failing primary may have a clean sibling already captured.
            if row['status'] in REJECTED:
                for alt in alternatives.get(p['id'], []):
                    if alt == audited:
                        continue
                    try:
                        alt_m = measure(fetch(alt))
                    except Exception:  # noqa: BLE001
                        continue
                    alt_status = classify(alt_m, alt, data['tenantId'])
                    if alt_status not in REJECTED:
                        row['replacementImage'] = alt
                        row['replacementStatus'] = alt_status
                        row['originalStatus'] = row['status']
                        row['status'] = alt_status
                        row.update({k: alt_m[k] for k in alt_m})
                        break

            host = row['image'].split('/')[2] if row['image'].startswith('http') else 'local'
            row['imageSourceType'] = (
                'MANUFACTURER' if host in MANUFACTURER_HOSTS
                else 'SHOWROOM' if host in SHOWROOM_HOSTS
                else 'RETAILER' if host != 'local'
                else 'PLACEHOLDER'
            )
            row['imageSourceHost'] = host
            counts[row['status']] += 1
            overall[row['status']] += 1
            rows.append(row)
            sys.stdout.write(f'\r  {tenant}: {i}/{len(products)}   ')
            sys.stdout.flush()

        print()
        report['tenants'][tenant] = {'total': len(rows), 'counts': dict(counts), 'products': rows}
        print(f'  {tenant}: ' + ', '.join(f'{k} {v}' for k, v in counts.most_common()))

    os.makedirs('data/demo', exist_ok=True)
    with open('data/demo/image-audit.json', 'w', encoding='utf-8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)

    print('\nOverall:', dict(overall.most_common()))
    print('Wrote data/demo/image-audit.json')


if __name__ == '__main__':
    main()
