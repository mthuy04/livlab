import type { PlanPoint } from '../room-studio/architecture';
import { partitionGeometry, strip } from '../room-studio/glassGeometry';
import { fixtureVolumes } from './architectureGeometry';
import type { TechnicalContext, TechnicalProductEntry } from './types';

/** Clip an ordered convex polygon to the positive side of a line. */
export function halfPlane(poly: PlanPoint[], distance: (p: PlanPoint) => number) {
  const out: PlanPoint[] = [];
  poly.forEach((b, i) => {
    const a = poly[(i + poly.length - 1) % poly.length];
    const da = distance(a),
      db = distance(b);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push({ x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) });
    }
    if (db >= 0) out.push(b);
  });
  return out;
}

export function area(poly: PlanPoint[]) {
  return (
    Math.abs(
      poly.reduce((sum, a, i) => {
        const b = poly[(i + 1) % poly.length];
        return sum + a.x * b.z - b.x * a.z;
      }, 0)
    ) / 2
  );
}

export function intersection(subject: PlanPoint[], clip: PlanPoint[]) {
  const centre = clip.reduce((c, p) => ({ x: c.x + p.x / clip.length, z: c.z + p.z / clip.length }), {
    x: 0,
    z: 0,
  });
  let out = subject;
  clip.forEach((a, i) => {
    const b = clip[(i + 1) % clip.length];
    const side = (p: PlanPoint) => (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
    const sign = Math.sign(side(centre));
    out = halfPlane(out, (p) => sign * side(p));
  });
  return out;
}

export function frontSpace(context: TechnicalContext, entry: TechnicalProductEntry) {
  const volume = fixtureVolumes(entry, false)?.[0];
  if (!volume) return null;
  const { placed, metadata } = entry;
  const [x, , z] = placed.position,
    s = Math.sin(placed.rotationY),
    c = Math.cos(placed.rotationY);
  const w = metadata.width! / 2,
    d = metadata.depth! / 2;
  const point = (u: number, v: number) => ({ x: x + u * c + v * s, z: z - u * s + v * c });
  let available = Infinity;
  let blockedBy: string | null = null;
  for (const u of [-w, w]) {
    const p = point(u, d);
    for (const [pos, dir, span] of [
      [p.x, s, context.room.length],
      [p.z, c, context.room.width],
    ]) {
      if (Math.abs(dir) > 1e-8) available = Math.min(available, ((Math.sign(dir) * span) / 2 - pos) / dir);
    }
  }
  function measure(poly: PlanPoint[], name: string) {
    const local = poly.map((p) => ({
      x: (p.x - x) * c - (p.z - z) * s,
      z: (p.x - x) * s + (p.z - z) * c - d,
    }));
    const clipped = halfPlane(
      halfPlane(
        halfPlane(local, (p) => p.x + w),
        (p) => w - p.x
      ),
      (p) => p.z
    );
    if (area(clipped) < 1e-10) return;
    const gap = Math.min(...clipped.map((p) => p.z));
    if (gap < available) {
      available = gap;
      blockedBy = name;
    }
  }
  let missingObstacleDimensions = false;
  for (const other of context.entries) {
    if (other.placed.instanceId === placed.instanceId) continue;
    const volumes = fixtureVolumes(other, !!context.counterSupport);
    if (!volumes) {
      missingObstacleDimensions = true;
      continue;
    }
    for (const v of volumes) {
      if (volume.top > v.bottom && volume.bottom < v.top) measure(v.footprint, other.product.name);
    }
  }
  for (const el of context.elements ?? []) {
    if (el.type !== 'shower-partition' || el.height <= volume.bottom || volume.top <= 0) continue;
    const g = partitionGeometry(el);
    measure(strip(g.fixed), 'vách kính');
    if (g.leaf) measure(strip(g.leaf), 'cánh kính');
  }
  const recommendation = metadata.recommendedClearance?.front;
  return {
    available: Math.max(0, available),
    blockedBy,
    missingObstacleDimensions,
    zone:
      recommendation === undefined
        ? []
        : [point(-w, d), point(w, d), point(w, d + recommendation), point(-w, d + recommendation)],
  };
}

/** Shortest segment between two convex footprints on the floor. */
export function footprintGap(a: PlanPoint[], b: PlanPoint[]) {
  if (area(intersection(a, b)) > 1e-10) return { from: a[0], to: a[0], distance: 0 };
  let best = { from: a[0], to: b[0], distance: Infinity };
  for (const [vertices, edges] of [
    [a, b],
    [b, a],
  ])
    for (const p of vertices)
      edges.forEach((q, i) => {
        const end = edges[(i + 1) % edges.length],
          dx = end.x - q.x,
          dz = end.z - q.z;
        const t = Math.max(0, Math.min(1, ((p.x - q.x) * dx + (p.z - q.z) * dz) / (dx * dx + dz * dz || 1)));
        const to = { x: q.x + t * dx, z: q.z + t * dz },
          distance = Math.hypot(p.x - to.x, p.z - to.z);
        if (distance < best.distance) best = { from: p, to, distance };
      });
  return best;
}
