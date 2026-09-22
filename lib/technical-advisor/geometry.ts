/**
 * Geometry helpers for the rules.
 *
 * The important one is rotation. Room Studio's drag clamp treats every product
 * as an axis-aligned box, which is fine for keeping a drag inside the room but
 * wrong for validation: a 0.72m-wide toilet rotated 90° occupies 0.72m along Z,
 * not X. These helpers apply `rotationY` before any bounds or overlap test.
 *
 * Only yaw is considered, because Room Studio only ever rotates products about
 * the vertical axis — a consumer never needs pitch or roll.
 */

import type { Vec3 } from '@/lib/room-studio/placementRules';

export interface Aabb {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface BoxSpec {
  /** Centre of the box, metres. */
  position: Vec3;
  /** Extents along the product's own axes before rotation, metres. */
  width: number;
  height: number;
  depth: number;
  /** Yaw in radians. */
  rotationY: number;
}

/**
 * World-axis-aligned bounds of a yaw-rotated box.
 *
 * For a box rotated by θ about Y, the world footprint is
 *   halfX = |w/2·cosθ| + |d/2·sinθ|
 *   halfZ = |w/2·sinθ| + |d/2·cosθ|
 * which is exact for any angle, not just multiples of 90°. Height is unchanged
 * by yaw.
 */
export function getWorldAabb(box: BoxSpec): Aabb {
  const cos = Math.abs(Math.cos(box.rotationY));
  const sin = Math.abs(Math.sin(box.rotationY));
  const halfW = box.width / 2;
  const halfD = box.depth / 2;
  const halfH = box.height / 2;

  const halfX = halfW * cos + halfD * sin;
  const halfZ = halfW * sin + halfD * cos;

  const [x, y, z] = box.position;
  return {
    minX: x - halfX,
    maxX: x + halfX,
    minY: y - halfH,
    maxY: y + halfH,
    minZ: z - halfZ,
    maxZ: z + halfZ,
  };
}

/** Overlap depth on each axis; negative or zero means no overlap on that axis. */
export function getOverlap(a: Aabb, b: Aabb): { x: number; y: number; z: number } {
  return {
    x: Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX),
    y: Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY),
    z: Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ),
  };
}

export function getAabbFootprintArea(box: Aabb): number {
  return Math.max(0, box.maxX - box.minX) * Math.max(0, box.maxZ - box.minZ);
}

/** Straight-line distance between two points, metres. */
export function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Horizontal distance only — the relevant one for reaching a drain or tap. */
export function horizontalDistance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function formatCm(metres: number): string {
  return `${Math.round(metres * 100)} cm`;
}
