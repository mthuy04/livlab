/**
 * Turns catalogue facts + asset metadata into the one number the scene needs:
 * how much to scale a loaded GLB so it occupies its real-world size in metres.
 *
 * All scale reasoning lives here. Components pass a measured bounding box in and
 * get a scalar out; they never hold magic numbers.
 */

import type { RoomStudioProduct } from './productAdapter';
import { getCategoryFallbackSize } from './modelMetadata';

export interface RealWorldSize {
  width: number;
  height: number;
  depth: number;
  /** true when these came from the catalogue, false when they are a category
   *  assumption. The UI uses this to avoid presenting a guess as a spec. */
  fromCatalogue: boolean;
}

/**
 * Real-world footprint of a product in metres. Catalogue dimensions win; any
 * axis the catalogue omits is filled from the category assumption so the
 * product still occupies believable space instead of collapsing to zero.
 */
export function getRealWorldSize(product: RoomStudioProduct): RealWorldSize {
  const fallback = getCategoryFallbackSize(product.normalizedCategory);
  const hasAny = product.width !== undefined || product.depth !== undefined || product.height !== undefined;

  return {
    width: product.width ?? fallback.width,
    depth: product.depth ?? fallback.depth,
    height: product.height ?? fallback.height,
    fromCatalogue: hasAny,
  };
}

/**
 * Scale factor for a loaded GLB, from its measured bounding box.
 *
 * An explicit `modelScale` in asset metadata always wins (that is the escape
 * hatch for a badly authored asset). Otherwise the model's largest dimension is
 * matched to the product's largest real-world dimension, which makes the result
 * correct regardless of whether the .glb was authored in metres, centimetres or
 * arbitrary units.
 */
export function resolveModelScale(
  product: RoomStudioProduct,
  measured: { x: number; y: number; z: number }
): number {
  if (product.modelScale && product.modelScale > 0) return product.modelScale;

  const measuredMax = Math.max(measured.x, measured.y, measured.z);
  if (!Number.isFinite(measuredMax) || measuredMax <= 0) return 1;

  const size = getRealWorldSize(product);
  const targetMax = Math.max(size.width, size.height, size.depth);
  if (!Number.isFinite(targetMax) || targetMax <= 0) return 1;

  return targetMax / measuredMax;
}

export function hasModel(product: RoomStudioProduct): boolean {
  return Boolean(product.model3dUrl);
}
