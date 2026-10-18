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
  /**
   * Yaw, radians. A floor or counter product is kept inside the room by its
   * ROTATED footprint: a 1.6m bath turned a quarter takes 1.6m of the room's
   * width, not its length. Wall products are not rotated off their wall.
   */
  rotationY?: number;
  /** Gap between a wall-backed product and its wall, metres. Default 2cm. */
  wallGap?: number;
  /** Top of the counter a counter product rests on, metres. Default 0.85m. */
  counterHeight?: number;
  /**
   * For a wall product anchored by its own origin (a mixer): the range its
   * CENTRE may occupy, metres. Intersected with the room, never widened.
   */
  centreYRange?: [number, number];
  /** Where a wall product's centre goes when it is first placed, metres. */
  preferredCentreY?: number;
}

/** Half-extents of a footprint after yaw, the exact form for any angle. */
export function rotatedHalfExtents(size: RealWorldSize, rotationY = 0): { halfX: number; halfZ: number } {
  const cos = Math.abs(Math.cos(rotationY));
  const sin = Math.abs(Math.sin(rotationY));
  return {
    halfX: (size.width / 2) * cos + (size.depth / 2) * sin,
    halfZ: (size.width / 2) * sin + (size.depth / 2) * cos,
  };
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
export function getRestingHeight(
  placementType: PlacementType,
  size: RealWorldSize,
  counterHeight: number = COUNTER_HEIGHT
): number {
  if (placementType === 'counter') return counterHeight + size.height / 2;
  return size.height / 2;
}

/** The centre heights a wall product may take, inside the room and its own range. */
function wallCentreRange(ctx: PlacementContext): [number, number] {
  const half = ctx.size.height / 2;
  let lo = half + CLEARANCE;
  let hi = ctx.dimensions.height - half - CLEARANCE;
  if (ctx.centreYRange) {
    lo = Math.max(lo, ctx.centreYRange[0]);
    hi = Math.min(hi, ctx.centreYRange[1]);
  }
  return [lo, hi];
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
    const [lo, hi] = wallCentreRange(ctx);
    const y =
      ctx.preferredCentreY !== undefined
        ? clampToRange(ctx.preferredCentreY, lo, hi)
        : getWallMountHeight(normalizedCategory, size, dimensions);
    // Flat against the back wall, pushed out by half its own depth.
    const position: Vec3 = [
      clampToRange(-dimensions.length * 0.2 + nudge, bounds.minX + size.width / 2, bounds.maxX - size.width / 2),
      y,
      bounds.minZ + size.depth / 2 + (ctx.wallGap ?? CLEARANCE),
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
  const rotationY = ctx.rotationY ?? 0;
  const { halfX, halfZ } = rotatedHalfExtents(size, rotationY);
  const position: Vec3 = [
    clampToRange(-dimensions.length * 0.25 + nudge, bounds.minX + halfX, bounds.maxX - halfX),
    getRestingHeight(placementType, size, ctx.counterHeight),
    clampToRange(bounds.minZ + halfZ + (ctx.wallGap ?? CLEARANCE), bounds.minZ + halfZ, bounds.maxZ - halfZ),
  ];
  return { position, rotationY, wall };
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

  if (placementType === 'wall') {
    const wall = ctx.wall ?? 'back';
    const gap = ctx.wallGap ?? CLEARANCE;
    const [lo, hi] = wallCentreRange(ctx);
    const y = clampToRange(position[1], lo, hi);
    if (wall === 'left') {
      return [bounds.minX + halfD + gap, y, clampToRange(position[2], bounds.minZ + halfW, bounds.maxZ - halfW)];
    }
    if (wall === 'right') {
      return [bounds.maxX - halfD - gap, y, clampToRange(position[2], bounds.minZ + halfW, bounds.maxZ - halfW)];
    }
    return [clampToRange(position[0], bounds.minX + halfW, bounds.maxX - halfW), y, bounds.minZ + halfD + gap];
  }

  if (placementType === 'ceiling') {
    const x = clampToRange(position[0], bounds.minX + halfW, bounds.maxX - halfW);
    return [x, bounds.maxY - halfH - CLEARANCE, clampToRange(position[2], bounds.minZ + halfD, bounds.maxZ - halfD)];
  }

  // Floor and counter products keep their resting height: dragging moves them
  // across their surface, it never lifts them off it. The footprint is the
  // rotated one, so a turned bath cannot be pushed through a side wall.
  const { halfX, halfZ } = rotatedHalfExtents(size, ctx.rotationY ?? 0);
  const restingY = Math.min(getRestingHeight(placementType, size, ctx.counterHeight), bounds.maxY - halfH - CLEARANCE);
  return [
    clampToRange(position[0], bounds.minX + halfX, bounds.maxX - halfX),
    restingY,
    clampToRange(position[2], bounds.minZ + halfZ, bounds.maxZ - halfZ),
  ];
}

/**
 * Whether a product can stand in this room at all, and which way round.
 *
 * Asked before a product is placed, because `clampToRoom` cannot help a
 * product larger than the room: with nowhere valid to go it would park the
 * centre in the middle and leave both ends inside the walls. The product is
 * never shrunk to fit — the answer is a reason, and the customer changes the
 * room or the product.
 */
export function fitInRoom(ctx: PlacementContext): { fits: boolean; rotationY: number; reason?: string } {
  const { dimensions, size, placementType } = ctx;
  const m = (v: number) => `${v.toFixed(2).replace('.', ',')} m`;
  const base = placementType === 'counter' ? ctx.counterHeight ?? COUNTER_HEIGHT : 0;
  if (placementType !== 'wall' && base + size.height > dimensions.height) {
    return {
      fits: false,
      rotationY: 0,
      reason: `Sản phẩm cao ${m(base + size.height)} tính từ sàn, phòng chỉ cao ${m(dimensions.height)}.`,
    };
  }
  if (placementType === 'wall' || placementType === 'ceiling') {
    const [lo, hi] = placementType === 'wall' ? wallCentreRange(ctx) : [0, dimensions.height];
    if (size.width > dimensions.length || size.depth > dimensions.width || lo > hi) {
      return {
        fits: false,
        rotationY: 0,
        reason:
          lo > hi
            ? `Sản phẩm cao ${m(size.height)}; ở cao độ lắp yêu cầu nó vượt quá trần ${m(dimensions.height)}.`
            : `Sản phẩm rộng ${m(size.width)}, sâu ${m(size.depth)}; tường trong của phòng dài ${m(dimensions.length)}.`,
      };
    }
    return { fits: true, rotationY: 0 };
  }
  const preferred = ctx.rotationY ?? 0;
  const fitsAt = (yaw: number) => {
    const { halfX, halfZ } = rotatedHalfExtents(size, yaw);
    return halfX * 2 <= dimensions.length + 1e-6 && halfZ * 2 <= dimensions.width + 1e-6;
  };
  if (fitsAt(preferred)) return { fits: true, rotationY: preferred };
  if (fitsAt(preferred + Math.PI / 2)) return { fits: true, rotationY: preferred + Math.PI / 2 };
  const long = Math.max(size.width, size.depth);
  const short = Math.min(size.width, size.depth);
  return {
    fits: false,
    rotationY: preferred,
    reason:
      `Sản phẩm chiếm ${m(long)} × ${m(short)} trên sàn, phòng chỉ ${m(dimensions.length)} × ` +
      `${m(dimensions.width)} — không đặt được theo hướng nào.`,
  };
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
