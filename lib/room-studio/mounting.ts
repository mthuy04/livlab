/**
 * How a product meets the room, as one context the placement rules read.
 *
 * Most products are anchored by their category's rule (a toilet stands on the
 * floor, a basin rests at counter height). A reconstructed model carries its
 * own: the toilet's measured gap to the wall, the shower's mixer height, the
 * basin's counter height from its installation drawing. Every caller that
 * places, moves or re-flows a product asks here, so there is one answer.
 */

import type { RoomDimensions } from './roomGeometry';
import type { RoomStudioProduct } from './productAdapter';
import type { PlacedProduct } from './roomState';
import { getRealWorldSize } from './assetResolver';
import { COUNTER_HEIGHT, type PlacementContext } from './placementRules';

/** Wall-mounted geometry whose origin is ON the wall plane sits just off it, never inside. */
const FLUSH_TO_WALL = 0.001;

/** Vertical distance from a model's own origin to the centre of its envelope, metres. */
function originToCentreY(product: RoomStudioProduct): number {
  const b = product.reconstruction?.boundsM;
  if (!b) return 0;
  return (b.min[1] + b.max[1]) / 2;
}

export function placementContextFor(
  product: RoomStudioProduct,
  dimensions: RoomDimensions,
  placed?: Pick<PlacedProduct, 'rotationY' | 'wall' | 'mountHeight'>
): PlacementContext {
  const ctx: PlacementContext = {
    dimensions,
    size: getRealWorldSize(product),
    placementType: product.placementType,
    wall: placed?.wall,
    rotationY: placed?.rotationY,
  };
  const mounting = product.reconstruction?.mounting;
  if (!mounting) return ctx;

  if (mounting.kind === 'FLOOR') {
    ctx.wallGap = mounting.wallGapMm / 1000;
  } else if (mounting.kind === 'WALL_MIXER') {
    const offset = originToCentreY(product);
    const { default: preferred, min, max } = mounting.mixerHeightMm;
    ctx.wallGap = FLUSH_TO_WALL;
    ctx.centreYRange = [min / 1000 + offset, max / 1000 + offset];
    ctx.preferredCentreY = preferred / 1000 + offset;
  } else if (mounting.kind === 'COUNTERTOP') {
    ctx.counterHeight = placed?.mountHeight ?? mounting.counterHeightMm.default / 1000;
  }
  return ctx;
}

/**
 * The installation height a customer reasons in, for products that have one:
 * the mixer's centre for a shower column, the counter top for a countertop
 * basin. Metres above the floor, or null.
 */
export function installationHeight(product: RoomStudioProduct, placed: PlacedProduct): number | null {
  const mounting = product.reconstruction?.mounting;
  if (mounting?.kind === 'WALL_MIXER') return placed.position[1] - originToCentreY(product);
  if (product.placementType === 'counter') {
    return placed.mountHeight ?? (mounting?.kind === 'COUNTERTOP' ? mounting.counterHeightMm.default / 1000 : COUNTER_HEIGHT);
  }
  return null;
}

/** The range a customer may set that height to, metres, or null when it is fixed. */
export function installationHeightRange(product: RoomStudioProduct): [number, number] | null {
  const mounting = product.reconstruction?.mounting;
  if (mounting?.kind === 'WALL_MIXER') return [mounting.mixerHeightMm.min / 1000, mounting.mixerHeightMm.max / 1000];
  if (mounting?.kind === 'COUNTERTOP') return [mounting.counterHeightMm.min / 1000, mounting.counterHeightMm.max / 1000];
  if (product.placementType === 'counter') return [0.7, 0.95];
  return null;
}

/** What that height is called, in the customer's words. */
export function installationHeightLabel(product: RoomStudioProduct): string | null {
  const mounting = product.reconstruction?.mounting;
  if (mounting?.kind === 'WALL_MIXER') return 'Cao độ bộ trộn';
  if (product.placementType === 'counter') return 'Cao mặt bàn';
  return null;
}

/**
 * The centre y that puts the installation height at `height`.
 *
 * For a counter product the height is stored on the placement too, because
 * the clamp re-derives a counter product's y from it on every move.
 */
export function centreYForInstallationHeight(product: RoomStudioProduct, height: number): number {
  const mounting = product.reconstruction?.mounting;
  if (mounting?.kind === 'WALL_MIXER') return height + originToCentreY(product);
  return height + getRealWorldSize(product).height / 2;
}

export const MOUNTING_LABEL: Record<string, string> = {
  floor: 'Đặt sàn',
  wall: 'Gắn tường',
  counter: 'Đặt trên mặt bàn',
  ceiling: 'Gắn trần',
};
