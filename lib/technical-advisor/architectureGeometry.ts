import type { hingedGeometry, PlanPoint } from '../room-studio/architecture';
import { BASIN_COUNTER, basinCounterExtent } from '../room-studio/environment';
import type { TechnicalProductEntry } from './types';

type Sweep = ReturnType<typeof hingedGeometry>;
type Point = [number, number];
const EPS = 1e-8; // numerical tolerance in metres

function clipPositive(points: Point[], axis: 0 | 1) {
  const clipped: Point[] = [];
  points.forEach((b, i) => {
    const a = points[(i + points.length - 1) % points.length];
    if ((a[axis] > 0) !== (b[axis] > 0)) {
      const t = a[axis] / (a[axis] - b[axis]);
      clipped.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
    if (b[axis] > 0) clipped.push(b);
  });
  return clipped;
}

/** Clip an oriented footprint to the swing quadrant, then test the exact circle.
 * The display arc's sample count has no effect on interference findings. */
export function intersectsSweep(sweep: Sweep, footprint: PlanPoint[]): boolean {
  const points = footprint.map((point): Point => {
    const { u, depth } = sweep.frame.local(point);
    return [(u - sweep.pivot) * sweep.hand, depth * sweep.inward];
  });
  const polygon = clipPositive(clipPositive(points, 0), 1);
  if (polygon.length < 3) return false;
  return polygon.some(([x, y], i) => {
    const b = polygon[(i + 1) % polygon.length];
    const dx = b[0] - x, dy = b[1] - y;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(x * dx + y * dy) / len2)) : 0;
    return Math.hypot(x + t * dx, y + t * dy) < sweep.radius - EPS;
  });
}

export function fixtureVolumes(entry: TechnicalProductEntry, counter: boolean) {
  const { width, height, depth, dimensionsOrigin } = entry.metadata;
  if (dimensionsOrigin !== 'CATALOGUE' || width === undefined || height === undefined || depth === undefined ||
    ![width, height, depth].every(n => Number.isFinite(n) && n > 0)) return null;
  const { position: [x, y, z], rotationY, placementType } = entry.placed;
  const cos = Math.cos(rotationY), sin = Math.sin(rotationY);
  const volume = (w: number, back: number, front: number, bottom: number, top: number) => ({
    bottom, top, footprint: [[-w / 2, back], [w / 2, back], [w / 2, front], [-w / 2, front]].map(([u, v]) =>
      ({ x: x + u * cos + v * sin, z: z - u * sin + v * cos })),
  });
  const bottom = y - height / 2;
  const volumes = [volume(width, -depth / 2, depth / 2, bottom, y + height / 2)];
  if (counter && placementType === 'counter') {
    const c = basinCounterExtent({ width, height, depth });
    const underTop = bottom - BASIN_COUNTER.top;
    volumes.push(volume(c.width, c.back, c.front, underTop, bottom), volume(c.cabinet.width, c.cabinet.back, c.cabinet.front, bottom - c.below, underTop));
  }
  return volumes;
}

/** Separating-axis test for oriented convex footprints. Mere contact is allowed. */
export function footprintsOverlap(a: PlanPoint[], b: PlanPoint[]): boolean {
  for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
    const start = poly[i], end = poly[(i + 1) % poly.length];
    const nx = end.z - start.z, nz = start.x - end.x, length = Math.hypot(nx, nz);
    if (length === 0) continue;
    const project = (p: PlanPoint) => (p.x * nx + p.z * nz) / length;
    const pa = a.map(project), pb = b.map(project);
    if (Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)) <= EPS) return false;
  }
  return true;
}

/** Straight sector boundaries and interiors are covered by the clipped polygons.
 * Check intersections of the two circular boundaries as well for thin arc-only overlaps. */
export function sweepsOverlap(a: Sweep, b: Sweep) {
  if (intersectsSweep(a, [b.hinge, ...b.arc]) || intersectsSweep(b, [a.hinge, ...a.arc])) return true;
  const dx = b.hinge.x - a.hinge.x, dz = b.hinge.z - a.hinge.z, distance = Math.hypot(dx, dz);
  if (distance <= Math.abs(a.radius - b.radius) + EPS || distance >= a.radius + b.radius - EPS) return false;
  const along = (distance * distance + a.radius * a.radius - b.radius * b.radius) / (2 * distance);
  const off = Math.sqrt(Math.max(0, a.radius * a.radius - along * along));
  const insideQuadrant = (s: Sweep, p: PlanPoint) => {
    const q = s.frame.local(p);
    return (q.u - s.pivot) * s.hand > EPS && q.depth * s.inward > EPS;
  };
  return [-1, 1].some(sign => {
    const p = { x: a.hinge.x + (along * dx - sign * off * dz) / distance, z: a.hinge.z + (along * dz + sign * off * dx) / distance };
    return insideQuadrant(a, p) && insideQuadrant(b, p);
  });
}
