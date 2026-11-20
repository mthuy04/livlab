import { Vector3, Spherical, MathUtils } from 'three';
import { DEFAULT_CAMERA_FOV, getDefaultCameraFraming, type RoomDimensions } from './roomGeometry';
import { hit, type WalkWorld } from './walkthrough';
import type { RoomOperation } from './roomOperations';
export type CameraMode = 'overview' | 'plan' | 'product' | 'proposal' | 'walkthrough';
export interface Bounds {
  min: Vector3;
  max: Vector3;
}
export interface Shot {
  eye: Vector3;
  target: Vector3;
}
export interface CameraRequest {
  mode: CameraMode;
  bounds?: Bounds;
}

export function affectedIds(ops: readonly RoomOperation[]) {
  return new Set(
    ops.flatMap((op) =>
      'instanceId' in op
        ? [op.instanceId]
        : 'element' in op
        ? [op.element.id]
        : 'elementId' in op
        ? [op.elementId]
        : []
    )
  );
}
export function subjectBounds(ids: Set<string>, ...worlds: WalkWorld[]): Bounds | undefined {
  const min = new Vector3(Infinity, Infinity, Infinity),
    max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const w of worlds)
    for (const b of w.solids)
      if (ids.has(b.id)) {
        min.min(new Vector3(b.minX, b.bottom, b.minZ));
        max.max(new Vector3(b.maxX, b.top, b.maxZ));
      }
  return Number.isFinite(min.x) ? { min, max } : undefined;
}
export function overviewShot(room: RoomDimensions, aspect: number): Shot {
  const f = getDefaultCameraFraming(room, aspect);
  return { eye: new Vector3(...f.position), target: new Vector3(...f.target) };
}
export function planZoom(room: RoomDimensions, w: number, h: number) {
  return Math.max(1, Math.min(w / (room.length + 0.8), h / (room.width + 0.8)));
}
export function focusShot(bounds: Bounds, world: WalkWorld, aspect: number, direction: Vector3): Shot {
  const target = bounds.min.clone().lerp(bounds.max, 0.5);
  const radius = Math.max(0.2, bounds.max.distanceTo(bounds.min) / 2);
  const halfFov = MathUtils.degToRad(DEFAULT_CAMERA_FOV / 2);
  const distance = Math.max(
    0.85,
    (radius * 1.23) / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * aspect)))
  );
  const heading = Math.atan2(direction.x, direction.z);
  let best: Shot | undefined,
    bestCost = Infinity;
  for (const tilt of [0.36, 0.65, 0.95])
    for (const turn of [0, 0.65, -0.65, 1.4, -1.4, Math.PI]) {
      const y = target.y + distance * Math.sin(tilt),
        flat = distance * Math.cos(tilt);
      const eye = new Vector3(
        target.x + flat * Math.sin(heading + turn),
        y,
        target.z + flat * Math.cos(heading + turn)
      );
      if (hit(world, eye, 0.12, y - 0.1, y + 0.1)) continue;
      let cost = Math.abs(turn) * 0.1 + tilt * 0.05;
      // Prefer a clear view; ignore the interior of the subject's own bounds.
      for (let k = 1; k < 16; k++) {
        const p = eye.clone().lerp(target, k / 16);
        if (
          p.x >= bounds.min.x &&
          p.x <= bounds.max.x &&
          p.z >= bounds.min.z &&
          p.z <= bounds.max.z &&
          p.y >= bounds.min.y &&
          p.y <= bounds.max.y
        )
          break;
        if (hit(world, p, 0.025, p.y - 0.025, p.y + 0.025)) cost += 1;
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = { eye, target };
      }
    }
  return best ?? { eye: target.clone().add(new Vector3(0, distance + 0.25, 0.01)), target };
}
/** Interpolate the shortest azimuth around a moving subject, away from either pole. */
export function glideShot(from: Shot, to: Shot, t: number): Shot {
  const k = t * t * (3 - 2 * t),
    target = from.target.clone().lerp(to.target, k);
  const a = new Spherical().setFromVector3(from.eye.clone().sub(from.target)),
    b = new Spherical().setFromVector3(to.eye.clone().sub(to.target));
  const turn = Math.atan2(Math.sin(b.theta - a.theta), Math.cos(b.theta - a.theta));
  const orbit = new Spherical(
    MathUtils.lerp(a.radius, b.radius, k),
    MathUtils.lerp(a.phi, b.phi, k),
    a.theta + turn * k
  );
  return { target, eye: target.clone().add(new Vector3().setFromSpherical(orbit)) };
}
