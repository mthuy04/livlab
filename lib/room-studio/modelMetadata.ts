/**
 * Centralised 3D-asset metadata. This is the ONLY place a scale number or a
 * .glb path may live — never `scale={0.43}` inside a component.
 *
 * Principle: one SKU -> one master 3D asset, reusable by Product Detail, Room
 * Studio, AR and concept previews alike. No Room-Studio-specific model files.
 *
 * Resolution order:
 *   1. SKU/product-id override in SKU_MODEL_OVERRIDES (authored per product)
 *   2. Category-level representative model from lib/livlabProductModels
 *   3. No model -> Room Studio falls back to a real-world-sized image billboard
 */

import { Product } from '@/lib/types';
import { productModelMap, availableProductModels, Product3DCategory } from '@/lib/livlabProductModels';

export interface ModelMetadata {
  /** Public path to the master GLB, or undefined when none exists yet. */
  model3dUrl?: string;
  /**
   * Explicit multiplier applied AFTER bounding-box normalisation. Only set this
   * for an asset whose authored proportions are wrong; leave undefined and the
   * asset is normalised to its real-world target size automatically.
   */
  modelScale?: number;
  /** Approximate real-world size (metres, largest dimension) used to normalise
   *  a GLB that ships at an arbitrary unit scale. Only a fallback: when the
   *  catalogue states real dimensions, those win. */
  fallbackTargetSize?: number;
  /** Rough file weight in MB, used to warn before a heavy download. */
  approxSizeMb?: number;
}

/**
 * Per-SKU / per-product-id master assets. Empty today — the catalogue has no
 * per-SKU GLBs yet — but this is where they get registered as they are produced,
 * keyed by `Product.sku` or `Product.id`.
 */
export const SKU_MODEL_OVERRIDES: Record<string, ModelMetadata> = {};

/**
 * Representative model per normalised category, used until per-SKU assets exist.
 * Only categories flagged available in lib/livlabProductModels resolve to a file.
 */
const CATEGORY_METADATA: Record<string, ModelMetadata> = {
  lavabo: { fallbackTargetSize: 0.55, approxSizeMb: 17 },
  faucet: { fallbackTargetSize: 0.3 },
  toilet: { fallbackTargetSize: 0.7 },
  shower: { fallbackTargetSize: 1.2 },
  mirror: { fallbackTargetSize: 0.6 },
};

/**
 * Real-world size (metres, largest dimension) assumed for a category when the
 * catalogue does not state dimensions. Used to size the image billboard so an
 * un-modelled product still reads at a believable scale next to a modelled one.
 */
export const CATEGORY_FALLBACK_SIZE: Record<string, { width: number; height: number; depth: number }> = {
  lavabo: { width: 0.55, height: 0.2, depth: 0.4 },
  faucet: { width: 0.05, height: 0.3, depth: 0.15 },
  toilet: { width: 0.38, height: 0.78, depth: 0.68 },
  shower: { width: 0.25, height: 1.2, depth: 0.25 },
  mirror: { width: 0.6, height: 0.8, depth: 0.03 },
  vanity: { width: 0.8, height: 0.8, depth: 0.48 },
  tile: { width: 0.6, height: 0.6, depth: 0.01 },
  lighting: { width: 0.4, height: 0.12, depth: 0.12 },
  accessory: { width: 0.25, height: 0.25, depth: 0.1 },
};

export function getCategoryFallbackSize(normalizedCategory: string) {
  return CATEGORY_FALLBACK_SIZE[normalizedCategory] ?? CATEGORY_FALLBACK_SIZE.accessory;
}

export function getModelMetadata(product: Product, normalizedCategory: string): ModelMetadata {
  const override = SKU_MODEL_OVERRIDES[product.sku] || SKU_MODEL_OVERRIDES[product.id];
  if (override) return override;

  const category = normalizedCategory as Product3DCategory;
  const isAvailable = availableProductModels[category] === true;
  const url = productModelMap[category];

  return {
    ...(CATEGORY_METADATA[normalizedCategory] ?? {}),
    model3dUrl: isAvailable && url ? url : undefined,
  };
}
