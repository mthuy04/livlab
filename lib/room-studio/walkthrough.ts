import {
  WALLS,
  ENTRANCE_LEAF_THICKNESS,
  doorGeometry,
  isWallElement,
  openingFitsWall,
  wallFrame,
  wallOpenings,
  type ArchitecturalElement,
  type PlanPoint,
  type RoomWall,
} from './architecture';
import { openingFrameVolumes, partitionGeometry, strip, windowGeometry } from './glassGeometry';
import { solidWallRects } from './wallMesh';
import { fixtureVolumes } from '../technical-advisor/architectureGeometry';
import type { TechnicalProductEntry } from '../technical-advisor/types';
import type { RoomDimensions } from './roomGeometry';

// Virtual visitor dimensions in metres. These are camera comfort settings.
export const VISITOR = { radius: 0.18, height: 1.72, eye: 1.6, speed: 1.35 };
type Volume = { footprint: PlanPoint[]; bottom: number; top: number };
export type Obstacle = Volume & { id: string; minX: number; maxX: number; minZ: number; maxZ: number };
export function buildWalkWorld(
  room: RoomDimensions,
  elements: readonly ArchitecturalElement[],
  entries: TechnicalProductEntry[],
  counter: boolean
) {
  const solids: Obstacle[] = [];
  const unknown: string[] = [];
  const portals: { wall: RoomWall; start: number; end: number }[] = [];
  function add(id: string, v: Volume) {
    const xs = v.footprint.map((p) => p.x),
      zs = v.footprint.map((p) => p.z);
    solids.push({
      ...v,
      id,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    });
  }
  const openings = elements.filter(isWallElement).filter((e) => openingFitsWall(room, e));
  const cuts = wallOpenings(room, { niche: false }, openings);
  for (const wall of WALLS) {
    const frame = wallFrame(room, wall);
    for (const r of solidWallRects(
      frame.span,
      room.height,
      cuts.filter((c) => c.wall === wall)
    )) {
      add(wall, {
        footprint: strip({ a: frame.point(r.x), b: frame.point(r.x + r.width) }, 0.04),
        bottom: r.y,
        top: r.y + r.height,
      });
    }
  }
  for (const el of openings) {
    openingFrameVolumes(room, el).forEach((v) => add(el.id, v));
    if (el.type === 'entrance-door') {
      const g = doorGeometry(room, el);
      add(el.id, {
        footprint: strip({ a: g.hinge, b: g.tip(el.open ? Math.PI / 2 : 0) }, ENTRANCE_LEAF_THICKNESS),
        bottom: 0,
        top: g.leafHeight,
      });
      if (el.open && g.leafHeight >= VISITOR.height)
        portals.push({ wall: el.wall, start: el.offset + g.jamb, end: el.offset + el.width - g.jamb });
    } else {
      const g = windowGeometry(room, el);
      add(el.id, { footprint: strip(g.sash, g.profile), bottom: el.sill, top: el.sill + el.height });
    }
  }
  for (const el of elements)
    if (el.type === 'shower-partition' && el.length > 0 && el.height > 0) {
      const g = partitionGeometry(el);
      for (const seg of [g.fixed, g.leaf])
        if (seg) add(el.id, { footprint: strip(seg), bottom: 0, top: el.height });
      if (g.travel)
        add(el.id, { footprint: strip(g.travel, 0.052), bottom: el.height - 0.018, top: el.height });
    }
  for (const entry of entries) {
    const volumes = fixtureVolumes(entry, counter);
    if (volumes) volumes.forEach((v) => add(entry.placed.instanceId, v));
    else unknown.push(entry.placed.instanceId);
  }
  return { room, solids, portals, openings, unknown };
}
export type WalkWorld = ReturnType<typeof buildWalkWorld>;

/** A circle against a convex horizontal section with an independent height interval. */
export function hit(
  world: WalkWorld,
  p: PlanPoint,
  radius = VISITOR.radius,
  bottom = 0,
  top = VISITOR.height
) {
  for (const b of world.solids) {
    if (
      b.bottom >= top ||
      b.top <= bottom ||
      p.x < b.minX - radius ||
      p.x > b.maxX + radius ||
      p.z < b.minZ - radius ||
      p.z > b.maxZ + radius
    )
      continue;
    let positive = false,
      negative = false,
      closest = Infinity,
      nx = 0,
      nz = 0;
    for (let i = 0; i < b.footprint.length; i++) {
      const a = b.footprint[i],
        end = b.footprint[(i + 1) % b.footprint.length];
      const dx = end.x - a.x,
        dz = end.z - a.z,
        px = p.x - a.x,
        pz = p.z - a.z;
      const cross = dx * pz - dz * px;
      positive ||= cross > 1e-10;
      negative ||= cross < -1e-10;
      const t = Math.max(0, Math.min(1, (px * dx + pz * dz) / (dx * dx + dz * dz || 1)));
      const x = px - t * dx,
        z = pz - t * dz,
        dist = x * x + z * z;
      if (dist < closest) {
        closest = dist;
        nx = x;
        nz = z;
      }
    }
    if (!(positive && negative) || closest < radius * radius) {
      const len = Math.hypot(nx, nz) || 1;
      return { id: b.id, nx: nx / len, nz: nz / len };
    }
  }
  return null;
}
function inDomain(w: WalkWorld, p: PlanPoint) {
  if (Math.abs(p.x) <= w.room.length / 2 && Math.abs(p.z) <= w.room.width / 2) return true;
  // Only the modeled doorway has an exterior landing; the rest of the building is unknown.
  return w.portals.some((portal) => {
    const local = wallFrame(w.room, portal.wall).local(p);
    return (
      local.depth <= 0 &&
      local.depth >= -0.65 &&
      local.u >= portal.start + VISITOR.radius &&
      local.u <= portal.end - VISITOR.radius
    );
  });
}
export function walkSpawn(world: WalkWorld) {
  if (world.unknown.length) return null;
  const acceptable = (p: PlanPoint) =>
    Math.abs(p.x) < world.room.length / 2 && Math.abs(p.z) < world.room.width / 2 && !hit(world, p);
  for (const door of world.openings)
    if (door.type === 'entrance-door') {
      const frame = wallFrame(world.room, door.wall),
        u = door.offset + door.width / 2;
      for (const depth of [0.28, 0.5, 0.78, 1.05]) {
        const p = frame.point(u, depth);
        if (acceptable(p)) return { ...p, yaw: frame.yaw + Math.PI, entrance: door.id };
      }
    }
  const { length, width } = world.room;
  for (let z = width / 2 - 0.24; z >= -width / 2 + VISITOR.radius; z -= 0.12) {
    for (let i = 0; i <= Math.ceil(length / 0.12); i++) {
      const x = Math.ceil(i / 2) * 0.12 * (i % 2 ? 1 : -1);
      if (Math.abs(x) > length / 2 - VISITOR.radius) continue;
      if (acceptable({ x, z })) return { x, z, yaw: 0, entrance: null };
    }
  }
  return null;
}
export function walkDelta(yaw: number, side: number, forward: number, metres: number) {
  const scale = metres / Math.max(1, Math.hypot(side, forward));
  return {
    x: (side * Math.cos(yaw) - forward * Math.sin(yaw)) * scale,
    z: (-side * Math.sin(yaw) - forward * Math.cos(yaw)) * scale,
  };
}
export function walkMove(w: WalkWorld, start: PlanPoint, dx: number, dz: number) {
  let { x, z } = start;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (VISITOR.radius * 0.4)));
  let blocked = false;
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps,
      sz = dz / steps,
      next = { x: x + sx, z: z + sz };
    const obstacle = hit(w, next);
    if (!obstacle && inDomain(w, next)) {
      x = next.x;
      z = next.z;
      continue;
    }
    blocked = true;
    // Find the last free point before sliding. Rejecting the entire final substep
    // leaves a frame-rate-dependent gap that the next short frame can creep into.
    let free = 0,
      blockedAt = 1;
    for (let j = 0; j < 9; j++) {
      const fraction = (free + blockedAt) / 2;
      const sample = { x: x + sx * fraction, z: z + sz * fraction };
      if (inDomain(w, sample) && !hit(w, sample)) free = fraction;
      else blockedAt = fraction;
    }
    x += free * sx;
    z += free * sz;
    const remaining = 1 - free;
    const normal = obstacle ? sx * obstacle.nx + sz * obstacle.nz : 0;
    const slide = obstacle && {
      x: x + remaining * (sx - normal * obstacle.nx),
      z: z + remaining * (sz - normal * obstacle.nz),
    };
    if (slide && inDomain(w, slide) && !hit(w, slide)) {
      x = slide.x;
      z = slide.z;
    } else if (inDomain(w, { x: next.x, z }) && !hit(w, { x: next.x, z })) x = next.x;
    else if (inDomain(w, { x, z: next.z }) && !hit(w, { x, z: next.z })) z = next.z;
  }
  return { x, z, blocked };
}
