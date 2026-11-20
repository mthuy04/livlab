import { ENTRANCE_FRAME_DEPTH, doorGeometry, hingedGeometry, wallFrame, type WallElement, type PlanPoint, type RoomWindow, type ShowerPartition } from './architecture';
import type { RoomDimensions } from './roomGeometry';

export interface Segment { a: PlanPoint; b: PlanPoint }
export const PROFILE_DEPTH = 0.0252;
export const TRACK_SEPARATION = 0.026;
export const GLASS_FINISH = {
  clear: { color: '#E9F1F4', opacity: 0.14, roughness: 0.05 },
  frosted: { color: '#EFF2ED', opacity: 0.53, roughness: 0.78 },
  tinted: { color: '#829E95', opacity: 0.32, roughness: 0.16 },
};

export function windowGeometry(room: RoomDimensions, w: RoomWindow) {
  const frame = wallFrame(room, w.wall);
  const profile = Math.min(0.035, w.width / 8, w.height / 8);
  const opening = { a: frame.point(w.offset), b: frame.point(w.offset + w.width) };
  const centre = frame.point(w.offset + w.width / 2);
  const pivot = w.offset + profile;
  const sweep = hingedGeometry(frame, pivot, 1, -1, w.width - 2 * profile);
  const sash = { a: sweep.hinge, b: sweep.tip(w.mechanism === 'casement' && w.open ? Math.PI / 2 : 0) };
  return { centre, opening, profile, sash, sweep, yaw: frame.yaw };
}

export function partitionGeometry(p: ShowerPartition) {
  const theta = p.rotation * Math.PI / 180;
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const frame = {
    point: (u: number, d = 0) => ({ x: p.x + (u - p.length / 2) * cos - d * sin, z: p.z + (u - p.length / 2) * sin + d * cos }),
    local: (q: PlanPoint) => ({ u: (q.x - p.x) * cos + (q.z - p.z) * sin + p.length / 2, depth: -(q.x - p.x) * sin + (q.z - p.z) * cos }),
  };
  const line = (from: number, to: number, d = 0): Segment => ({ a: frame.point(from, d), b: frame.point(to, d) });
  const span = line(0, p.length);
  const half = p.length / 2;
  const left = p.entrySide === 'left';
  const sliding = p.mechanism === 'sliding';
  const entry = p.mechanism === 'fixed' ? null : left ? line(0, half) : line(half, p.length);
  const fixed = !entry ? span : left ? line(half, p.length) : line(0, half);
  const sweep = p.mechanism === 'hinged' ? hingedGeometry(frame, left ? 0 : p.length, left ? 1 : -1, p.swing === 'forward' ? 1 : -1, half) : null;
  let leaf: Segment | null = null;
  if (sweep) leaf = { a: sweep.hinge, b: sweep.tip(p.open ? Math.PI / 2 : 0) };
  if (sliding) {
    const start = (left !== p.open) ? 0 : half;
    leaf = line(start, start + half, TRACK_SEPARATION);
  }
  const travel = sliding ? line(0, p.length, TRACK_SEPARATION) : null;
  return { frame, span, fixed, entry, sweep, leaf, travel };
}

export function strip(segment: Segment, thickness = PROFILE_DEPTH): PlanPoint[] {
  const dx = segment.b.x - segment.a.x, dz = segment.b.z - segment.a.z;
  const scale = thickness / (2 * Math.hypot(dx, dz));
  const nx = -dz * scale, nz = dx * scale;
  return [{ x: segment.a.x + nx, z: segment.a.z + nz }, { x: segment.b.x + nx, z: segment.b.z + nz },
  { x: segment.b.x - nx, z: segment.b.z - nz }, { x: segment.a.x - nx, z: segment.a.z - nz }];
}

/** Include intermediate extrema of a quarter-turn on world X/Z axes. */
export function sweepExtrema(s: ReturnType<typeof hingedGeometry>) {
  const a = s.tip(0), b = s.tip(Math.PI / 2);
  const points = [s.hinge, a, b];
  for (const key of ['x', 'z'] as const) {
    const angle = Math.atan2(b[key] - s.hinge[key], a[key] - s.hinge[key]);
    for (const t of [angle, angle + Math.PI, angle - Math.PI]) if (t > 0 && t < Math.PI / 2) points.push(s.tip(t));
  }
  return points;
}

export function partitionExtent(p: ShowerPartition) {
  const g = partitionGeometry(p);
  const points = [...strip(g.span), ...(g.leaf ? strip(g.leaf) : []), ...(g.travel ? strip(g.travel) : []),
  ...(g.sweep ? sweepExtrema(g.sweep) : [])];
  const xs = points.map(q => q.x), zs = points.map(q => q.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

/** Keep a nearby invalid placement visible while keeping unbounded drafts out of both views. */
export function canDrawPartition(room: RoomDimensions, p: ShowerPartition) {
  return p.length > 0 && p.length <= Math.hypot(room.length, room.width) &&
    p.height > 0 && p.height <= room.height && Math.abs(p.x) <= room.length && Math.abs(p.z) <= room.width;
}

export function partitionFits(room: RoomDimensions, p: ShowerPartition) {
  if (p.length <= 0 || p.height <= 0 || p.height > room.height || Math.abs(p.rotation) > 180) return false;
  const e = partitionExtent(p), eps = 1e-8;
  return e.minX >= -room.length / 2 - eps && e.maxX <= room.length / 2 + eps &&
    e.minZ >= -room.width / 2 - eps && e.maxZ <= room.width / 2 + eps;
}

export function movePartition(room: RoomDimensions, p: ShowerPartition, dx: number, dz: number): ShowerPartition {
  const e = partitionExtent(p);
  const move = (delta: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(delta * 100) / 100));
  return {
    ...p, x: p.x + move(dx, -room.length / 2 - e.minX, room.length / 2 - e.maxX),
    z: p.z + move(dz, -room.width / 2 - e.minZ, room.width / 2 - e.maxZ)
  };
}


/** Actual jambs and horizontal members, for openings that meet at a room corner. */
export function openingFrameVolumes(room: RoomDimensions, el: WallElement) {
  const frame = wallFrame(room, el.wall);
  const isWindow = el.type === 'window';
  const profile = isWindow ? windowGeometry(room, el).profile : doorGeometry(room, el).jamb;
  const depth = isWindow ? profile : ENTRANCE_FRAME_DEPTH;
  const sill = isWindow ? el.sill : 0;
  const member = (u: number, length: number, bottom: number, height: number) => ({
    footprint: strip({ a: frame.point(el.offset + u), b: frame.point(el.offset + u + length) }, depth),
    bottom: sill + bottom, top: sill + bottom + height,
  });
  return [
    member(0, profile, 0, el.height),
    member(el.width - profile, profile, 0, el.height),
    member(0, el.width, el.height - profile, profile),
    ...(isWindow ? [member(0, el.width, 0, profile)] : []),
  ];
}
