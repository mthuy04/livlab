/**
 * What Room Studio is allowed to claim about a product.
 *
 * Three states, and the difference between the first two is the whole point:
 * a reviewed runtime model is product *geometry*, while official dimensions
 * are only product *size*. Both are useful — "does it fit" is the question
 * customers actually bring to a bathroom — but a size box presented as a model
 * is a promise the scene cannot keep, and the badge that says `3D` next to a
 * grey cuboid is the one this module exists to make impossible.
 *
 * The third state is the one most of the catalogue is in today, and it has to
 * be visible rather than filled in: a product with no trustworthy dimensions
 * cannot be placed, because the only way to place it is to invent a size.
 */

import { isRoomStudioReady, type Product3DAsset } from './product3dAsset';

export type RoomStudioCapability =
  /** A reviewed runtime GLB exists and passed every QA check. */
  | 'VERIFIED_3D'
  /** Trustworthy width, depth and height; the scene draws a true-size volume. */
  | 'EXACT_DIMENSIONS'
  /** Not enough to occupy space honestly. Cannot be placed. */
  | 'NO_DIMENSIONS';

export interface CapabilityBadge {
  label: string;
  /** Hover/assistive text. Says what the badge does and does not mean. */
  title: string;
}

/**
 * Badge copy. `NO_DIMENSIONS` has none on purpose — absence of a claim is the
 * claim, and the disabled add action carries the explanation instead.
 */
export const CAPABILITY_BADGE: Record<RoomStudioCapability, CapabilityBadge | null> = {
  VERIFIED_3D: {
    label: '3D VERIFIED',
    title: 'Model 3D chính hãng, đã kiểm tra kích thước, tỷ lệ và hướng đặt.',
  },
  EXACT_DIMENSIONS: {
    label: 'ĐÚNG KÍCH THƯỚC',
    title:
      'Kích thước thật của sản phẩm, dựng trong phòng bằng khối đúng tỷ lệ. ' +
      'Chưa có hình dạng 3D chi tiết.',
  },
  NO_DIMENSIONS: null,
};

/** Shown where the add action would be. States the missing fact, not a status. */
export const NO_DIMENSIONS_REASON = 'Chưa có kích thước';

export interface DimensionTriple {
  width?: number;
  depth?: number;
  height?: number;
}

/**
 * All three axes, or nothing.
 *
 * Two of three is not "mostly known": the missing axis gets filled from a
 * category average, and a volume that is correct in two directions and assumed
 * in the third is indistinguishable in the scene from one that is correct in
 * all three. The customer cannot see which axis was guessed, so the product
 * does not get to be placed at all.
 */
export function hasCompleteDimensions(d: DimensionTriple): boolean {
  return d.width !== undefined && d.depth !== undefined && d.height !== undefined;
}

/**
 * The single capability decision. Every badge, every add button and every
 * eligibility filter reads this and nothing else.
 *
 * `asset` is the registry record when one exists. A SOURCE_VERIFIED record —
 * which is what the six INAX pilot SKUs are — contributes its manufacturer
 * dimensions and nothing more: the file is a `.max` that no runtime can load,
 * so it cannot raise the product past EXACT_DIMENSIONS no matter how well
 * verified its source is.
 */
export function deriveCapability(
  asset: Product3DAsset | null | undefined,
  catalogueDimensions: DimensionTriple
): RoomStudioCapability {
  if (asset && isRoomStudioReady(asset)) return 'VERIFIED_3D';

  // Manufacturer figures outrank a parsed catalogue string when both exist.
  if (asset?.qa.dimensionsVerified) {
    const { width, depth, height } = asset.dimensionsMm;
    if (width && depth && height) return 'EXACT_DIMENSIONS';
  }

  return hasCompleteDimensions(catalogueDimensions) ? 'EXACT_DIMENSIONS' : 'NO_DIMENSIONS';
}

export function isPlaceable(capability: RoomStudioCapability): boolean {
  return capability !== 'NO_DIMENSIONS';
}

/**
 * Surfaces, not objects. Tiles configure the room's floor and walls through
 * the VẬT LIỆU panel; they have no placement semantics and a 600×600 tile
 * standing in the middle of a bathroom is not a product preview.
 */
export function isSurfaceMaterial(normalizedCategory: string): boolean {
  return normalizedCategory === 'tile';
}
