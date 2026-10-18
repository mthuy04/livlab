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
import { getProduct3DAsset, hasReadyAssetForKeys } from './product3dRegistry';

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
  /**
   * The geometry is a stand-in, not this product.
   *
   * The scene still draws it, at the product's true size, so "does it fit?" is
   * still answered honestly. What changes is the wording: every surface that
   * shows the product alongside this model has to say the shape is
   * illustrative, because a 3D object in a room reads as "this is yours" and
   * nothing else on screen corrects that.
   *
   * Never set for an asset from `product3dRegistry` — that registry only holds
   * geometry that IS the product, and a flag saying otherwise there would mean
   * one of the two is wrong.
   */
  illustrativeModel?: boolean;
}

/**
 * Per-SKU overrides for assets that need one.
 *
 * This is no longer the registry — `lib/room-studio/product3dRegistry` is, and
 * it holds the source, the identity, the measured dimensions and the seven QA
 * checks that a bare path cannot carry. What stays here is the narrow escape
 * hatch: a scale multiplier for an asset whose authored proportions are wrong.
 * Two registries would eventually disagree, so this one no longer answers the
 * readiness question.
 */
/**
 * The three entries below are demonstration stand-ins, requested so Room
 * Studio has something to show before the first exact asset lands.
 *
 * They point every one of these basins at the same `lavabo.glb`, which is not
 * any of them. That is the arrangement this file once had by category and
 * which was removed for good reason — so what makes it tolerable here is what
 * is different about it:
 *
 *   - It is three named products, not a category. Choosing a basin outside
 *     this list still gets a true-size placeholder; nothing is silently
 *     substituted for a product nobody listed.
 *   - It never reaches `product3dRegistry`, so these can never become
 *     `VERIFIED_3D`, never gain a badge, and never pass the activation gate.
 *   - `illustrativeModel` travels with them, so the workspace says the shape
 *     is an illustration wherever it draws one.
 *
 * Delete an entry the moment that SKU gets a real asset: the registry wins
 * over this file in `getModelMetadata`, so a stale line here would be
 * harmless but misleading to read.
 */
const DEMO_LAVABO_STANDIN: ModelMetadata = {
  model3dUrl: '/models/bathroom/lavabo.glb',
  approxSizeMb: 16.3,
  illustrativeModel: true,
};

export const SKU_MODEL_OVERRIDES: Record<string, ModelMetadata> = {
  // Chậu Lavabo TOTO LT1705#XW Đặt Bàn — 550 x 380 x 125 mm
  'llv-lav-toto-lt1705-xw': DEMO_LAVABO_STANDIN,
  // Chậu Lavabo TOTO LT1735#XW Đặt Bàn — 550 x 380 x 125 mm
  'llv-lav-toto-lt1735-xw': DEMO_LAVABO_STANDIN,
  // Chậu Lavabo Dương Bàn Đá TOTO LW573JW/F#W — 420 x 420 x 125 mm
  'llv-lav-toto-lw573jwf': DEMO_LAVABO_STANDIN,
};

/**
 * Whether a LivLab master 3D asset exists for this specific product.
 *
 * The storefront asks this before offering "thử trong Room Studio". It is
 * deliberately NOT satisfied by the category stand-ins in
 * `lib/livlabProductModels` — those are representative models, and placing a
 * generic basin while naming a customer's chosen SKU is a false claim. Nor is
 * it satisfied by a manufacturer CAD, 3DS MAX file or technical drawing:
 * those are source material, not a converted, reviewed LivLab asset.
 *
 * Empty registry today, so this is false for every product and the CTA is
 * hidden. Registering a SKU above turns it on for that product alone.
 */
export function hasSkuMasterModel(...keys: (string | null | undefined)[]): boolean {
  return hasReadyAssetForKeys(...keys);
}

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
  bathtub: { width: 1.6, height: 0.56, depth: 0.75 },
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
  // The verified asset wins over everything. A registered record carries its
  // own reviewed GLB; nothing below may override or substitute for it.
  const asset = getProduct3DAsset(product.id);
  if (asset?.runtime.glbUrl) {
    return {
      model3dUrl: asset.runtime.glbUrl,
      ...(SKU_MODEL_OVERRIDES[product.sku] ?? SKU_MODEL_OVERRIDES[product.id] ?? {}),
      approxSizeMb: asset.runtime.fileSizeBytes
        ? Math.round((asset.runtime.fileSizeBytes / 1_048_576) * 10) / 10
        : undefined,
    };
  }

  const override = SKU_MODEL_OVERRIDES[product.sku] || SKU_MODEL_OVERRIDES[product.id];
  if (override?.model3dUrl) return override;

  const category = normalizedCategory as Product3DCategory;
  const isAvailable = availableProductModels[category] === true;
  const url = productModelMap[category];

  return {
    ...(CATEGORY_METADATA[normalizedCategory] ?? {}),
    model3dUrl: isAvailable && url ? url : undefined,
  };
}
