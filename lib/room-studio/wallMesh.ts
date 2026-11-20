import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { WallOpening } from './architecture';

type Rect = Pick<WallOpening, 'x' | 'y' | 'width' | 'height'>;

/** Vertical strips allow floor-touching and overlapping cuts, including invalid drafts. */
export function solidWallRects(width: number, height: number, openings: readonly Rect[]) {
  const cuts = openings.map(o => ({
    left: Math.max(0, o.x), right: Math.min(width, o.x + o.width),
    bottom: Math.max(0, o.y), top: Math.min(height, o.y + o.height),
  })).filter(c => c.right > c.left && c.top > c.bottom);
  const edges = [...new Set([0, width, ...cuts.flatMap(c => [c.left, c.right])])].sort((a, b) => a - b);
  const solids: Rect[] = [];
  for (let i = 1; i < edges.length; i++) {
    const x = edges[i - 1], right = edges[i];
    const gaps = cuts.filter(c => c.left < right && c.right > x).sort((a, b) => a.bottom - b.bottom);
    let y = 0;
    for (const gap of gaps) {
      if (gap.bottom > y) solids.push({ x, y, width: right - x, height: gap.bottom - y });
      y = Math.max(y, gap.top);
    }
    if (y < height) solids.push({ x, y, width: right - x, height: height - y });
  }
  return solids;
}

export function surfaceGeometry(width: number, height: number, openings: readonly Rect[]) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const r of solidWallRects(width, height, openings)) {
    const i = positions.length / 3;
    for (const [x, y] of [[r.x, r.y], [r.x+r.width, r.y], [r.x+r.width, r.y+r.height], [r.x, r.y+r.height]]) {
      positions.push(x - width / 2, y - height / 2, 0);
      uvs.push(x / width, y / height);
    }
    indices.push(i, i+1, i+2, i, i+2, i+3);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
