#!/usr/bin/env python3
"""
Make each product asset's own background the same colour as the stage it sits on.

    python3 scripts/match_stage_background.py [--check]

A white ceramic product on a pure-white stage has almost no edge: the object
fades into its frame. The fix is a very slightly neutral stage — but 78 of the
87 normalised assets carry a baked opaque white background, so tinting the
stage alone would show the asset as a bright white rectangle inside a neutral
frame, which is worse than the problem.

So the background travels with the asset. Pixels that are near-white AND
reachable from the canvas edge are repainted to the stage colour; everything
enclosed by the product's own outline is left alone, so white tank lids and
white porcelain keep their colour. The flood stops at the product's edge, and
where anti-aliasing leaves a pixel behind, the residue is white against
near-white and invisible at any size the page renders.

Writes in place and records the step in data/demo/image-assets.json.
"""

import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

STAGE = (248, 248, 247)   # #F8F8F7 — the storefront's media stage
NEAR_WHITE = 250          # a pixel this bright on every channel is backdrop
CHECK = '--check' in sys.argv


def repaint(path: Path) -> tuple[bool, int]:
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()

    def is_backdrop(x, y):
        r, g, b, a = px[x, y]
        return a == 0 or (r >= NEAR_WHITE and g >= NEAR_WHITE and b >= NEAR_WHITE)

    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_backdrop(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_backdrop(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))

    painted = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, a = px[x, y]
        if a != 0:
            px[x, y] = (*STAGE, 255)
            painted += 1
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_backdrop(nx, ny):
                seen[ny * w + nx] = 1
                queue.append((nx, ny))

    if painted and not CHECK:
        im.save(path, 'WEBP', quality=90, method=6)
    return painted > 0, painted


def main():
    assets = sorted(Path('public/demo/manufacturers').glob('*/*.webp'))
    changed = []
    for path in assets:
        did, painted = repaint(path)
        if did:
            changed.append((str(path), painted))
    print(f'{len(changed)} of {len(assets)} assets repainted'
          f'{" (check only, nothing written)" if CHECK else ""}')

    if CHECK or not changed:
        return
    doc_path = Path('data/demo/image-assets.json')
    doc = json.loads(doc_path.read_text(encoding='utf-8'))
    touched = {p.replace('public', '') for p, _ in changed}
    n = 0
    for asset in doc['assets'].values():
        if asset.get('localPath') in touched:
            steps = asset.setdefault('processing', [])
            if 'STAGE_BACKGROUND_MATCHED' not in steps:
                steps.append('STAGE_BACKGROUND_MATCHED')
            n += 1
    doc_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{n} asset records updated')


if __name__ == '__main__':
    main()
