/**
 * Placement behaviour, kept out of every component so there is exactly one
 * definition of "where does this go and where may it move".
 *
 * Convention: a placed product's `position` is the CENTRE of its real-world
 * bounding box (which matches how <Center> normalises a loaded GLB), in metres,
 * in the room's coordinate frame (see roomGeometry for the axis convention).
 */

import type { RoomDimensions } from './roomGeometry';
import { getRoomBounds } from './roomGeometry';
import type { RealWorldSize } from './assetResolver';

export type PlacementType = 'floor' | 'wall' | 'counter' | 'ceiling';

/** Which wall a wall-mounted product is attached to. Front is left open. */
export type WallId = 'back' | 'left' | 'right';

export type Vec3 = [number, number, number];

export interface PlacementContext {
  dimensions: RoomDimensions;
  size: RealWorldSize;
  placementType: PlacementType;
  wall?: WallId;
}

/** Mounting height (centre of the product, metres) when it hangs on a wall. */
const WALL_MOUNT_HEIGHT: Record<string, number> = {
  mirror: 1.55,
  faucet: 1.0,
  shower: 1.6,
  lighting: 2.0,
};

const CLEARANCE = 0.02;

/** Standard vanity/counter top height in metres. A countertop basin rests on
 *  this rather than on the floor, so it reads at the height it will really be
 *  installed at even before a vanity is placed under it. */
export const COUNTER_HEIGHT = 0.85;

/** Resting height of a product's CENTRE for the surface it stands on. */
export function getRestingHeight(placementType: PlacementType, size: RealWorldSize): number {
  if (placementType === 'counter') return COUNTER_HEIGHT + size.height / 2;
  return size.height / 2;
}

export function getWallMountHeight(normalizedCategory: string, size: RealWorldSize, room: RoomDimensions): number {
  const preferred = WALL_MOUNT_HEIGHT[normalizedCategory] ?? 1.2;
  const half = size.height / 2;
  return Math.min(Math.max(preferred, half + CLEARANCE), room.height - half - CLEARANCE);
}

/**
 * Where a newly added product lands. Deliberately simple and deterministic:
 * floor items go near the back-left quadrant, wall items centre on the back
 * wall. `index` nudges repeats along so they do not stack invisibly.
 */
export function getDefaultPlacement(
  ctx: PlacementContext,
  normalizedCategory: string,
  index = 0
): { position: Vec3; rotationY: number; wall: WallId } {
  const { dimensions, size, placementType } = ctx;
  const bounds = getRoomBounds(dimensions);
  const wall: WallId = ctx.wall ?? 'back';
  const nudge = index * 0.35;

  if (placementType === 'wall') {
    const y = getWallMountHeight(normalizedCategory, size, dimensions);
    // Flat against the back wall, pushed out by half its own depth.
    const position: Vec3 = [
      clampToRange(-dimensions.length * 0.2 + nudge, bounds.minX + size.width / 2, bounds.maxX - size.width / 2),
      y,
      bounds.minZ + size.depth / 2 + CLEARANCE,
    ];
    return { position, rotationY: 0, wall };
  }

  if (placementType === 'ceiling') {
    return {
      position: [nudge, dimensions.height - size.height / 2 - CLEARANCE, 0],
      rotationY: 0,
      wall,
    };
  }

  // Floor / counter: stand on its surface, back edge near the back wall.
  const position: Vec3 = [
    clampToRange(-dimensions.length * 0.25 + nudge, bounds.minX + size.width / 2, bounds.maxX - size.width / 2),
    getRestingHeight(placementType, size),
    clampToRange(bounds.minZ + size.depth / 2 + CLEARANCE, bounds.minZ + size.depth / 2, bounds.maxZ - size.depth / 2),
  ];
  return { position, rotationY: 0, wall };
}

function clampToRange(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

/**
 * Keeps a product inside the room. This is the basic deterministic validity
 * check the MVP promises — not a full technical advisor.
 *
 * Floor products keep y pinned to their resting height; wall products keep the
 * axis that pins them to their wall, and are free in the other two.
 */
export function clampToRoom(position: Vec3, ctx: PlacementContext): Vec3 {
  const { dimensions, size, placementType } = ctx;
  const bounds = getRoomBounds(dimensions);
  const halfW = size.width / 2;
  const halfD = size.depth / 2;
  const halfH = size.height / 2;

  const x = clampToRange(position[0], bounds.minX + halfW, bounds.maxX - halfW);

  if (placementType === 'wall') {
    const wall = ctx.wall ?? 'back';
    const y = clampToRange(position[1], bounds.minY + halfH + CLEARANCE, bounds.maxY - halfH - CLEARANCE);
    if (wall === 'left') {
      return [bounds.minX + halfD + CLEARANCE, y, clampToRange(position[2], bounds.minZ + halfW, bounds.maxZ - halfW)];
    }
    if (wall === 'right') {
      return [bounds.maxX - halfD - CLEARANCE, y, clampToRange(position[2], bounds.minZ + halfW, bounds.maxZ - halfW)];
    }
    return [x, y, bounds.minZ + halfD + CLEARANCE];
  }

  if (placementType === 'ceiling') {
    return [x, bounds.maxY - halfH - CLEARANCE, clampToRange(position[2], bounds.minZ + halfD, bounds.maxZ - halfD)];
  }

  // Floor and counter products keep their resting height: dragging moves them
  // across their surface, it never lifts them off it.
  const restingY = Math.min(getRestingHeight(placementType, size), bounds.maxY - halfH - CLEARANCE);
  return [x, restingY, clampToRange(position[2], bounds.minZ + halfD, bounds.maxZ - halfD)];
}

/** True when a product's footprint would be pushed outside the room. */
export function isWithinRoom(position: Vec3, ctx: PlacementContext): boolean {
  const clamped = clampToRoom(position, ctx);
  return (
    Math.abs(clamped[0] - position[0]) < 1e-6 &&
    Math.abs(clamped[1] - position[1]) < 1e-6 &&
    Math.abs(clamped[2] - position[2]) < 1e-6
  );
}

/** Axis-aligned footprint overlap on the floor plane, ignoring height. */
export function footprintsOverlap(
  a: { position: Vec3; size: RealWorldSize },
  b: { position: Vec3; size: RealWorldSize }
): boolean {
  const overlapX = Math.abs(a.position[0] - b.position[0]) < (a.size.width + b.size.width) / 2;
  const overlapZ = Math.abs(a.position[2] - b.position[2]) < (a.size.depth + b.size.depth) / 2;
  const overlapY = Math.abs(a.position[1] - b.position[1]) < (a.size.height + b.size.height) / 2;
  return overlapX && overlapZ && overlapY;
}

// ─── Technical Advisor surface ────────────────────────────────────────────────
//
// These were placeholders in the Room Studio phase. The Technical Advisor now
// implements them for real, in lib/technical-advisor/, as pure rules over
// geometry and declared product data.
//
// They are not re-exported from here, because a rule needs far more context
// than a single placement (the whole room, every other product, the declared
// utility points). Call the engine instead:
//
//   import { runTechnicalAdvisor } from '@/lib/technical-advisor/engine';
//
// The individual rules live at:
//   clearance              -> rules/clearanceRule.ts
//   installation surface   -> rules/placementSurfaceRule.ts
//   plumbing compatibility -> rules/plumbingPointRule.ts
//   room bounds            -> rules/roomBoundsRule.ts
//   collision              -> rules/collisionRule.ts
//
// Door collision is still genuinely unimplemented: RoomState carries no door
// geometry yet, so there is nothing deterministic to check against. It is
// deliberately absent rather than stubbed, so no caller can mistake an empty
// array for "no door problems".
