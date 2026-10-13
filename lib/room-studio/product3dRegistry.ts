import {
  isRoomStudioReady as assetIsReady,
  type Product3DAsset,
} from './product3dAsset';

/**
 * The manifest. One entry per verified asset, keyed by canonical catalogue id.
 *
 * Empty, and that is the correct state today: the audit found no 3D geometry
 * for any SKU in this catalogue. The manufacturers publish specification
 * sheets, installation drawings and — for eight TOTO products — a DWG that
 * TOTO itself labels "Bản vẽ 2D". None of that is geometry a room can be
 * furnished with. `scripts/audit_3d_assets.mjs` reproduces that finding.
 *
 * An entry arrives here only after a source has been registered, converted,
 * measured against the manufacturer's own figures and reviewed by a person.
 * Nothing resolves a model by guessing a filename from a SKU, and no category
 * stand-in reaches this file: a basin the customer did not choose, placed in
 * their room under the name of the basin they did, is the failure this whole
 * layer exists to make impossible.
 */
const REGISTRY: Record<string, Product3DAsset> = {};

/**
 * Secondary lookup by brand + normalised SKU, for callers that hold a SKU but
 * not the catalogue id. Built from the same records, so the two cannot drift.
 */
const BY_SKU: Record<string, Product3DAsset> = Object.values(REGISTRY).reduce(
  (acc, asset) => {
    acc[`${asset.brand.toUpperCase()}:${asset.normalizedSku}`] = asset;
    return acc;
  },
  {} as Record<string, Product3DAsset>
);

/** The verified asset for a catalogue product, or null. Never a near match. */
export function getProduct3DAsset(catalogProductId: string | null | undefined): Product3DAsset | null {
  if (!catalogProductId) return null;
  return REGISTRY[catalogProductId] ?? null;
}

export function getProduct3DAssetBySku(
  brand: string | null | undefined,
  normalizedSku: string | null | undefined
): Product3DAsset | null {
  if (!brand || !normalizedSku) return null;
  return BY_SKU[`${brand.toUpperCase()}:${normalizedSku}`] ?? null;
}

/**
 * Whether Room Studio may offer this product. The one call sites should make.
 *
 * Deliberately not satisfied by a manufacturer CAD, a 3DS MAX package or a
 * technical drawing: those are source material for an asset, not an asset.
 */
export function isProductRoomStudioReady(catalogProductId: string | null | undefined): boolean {
  return assetIsReady(getProduct3DAsset(catalogProductId));
}

/**
 * Secondary index on the normalised SKU alone, for callers that hold neither a
 * catalogue id nor a brand.
 *
 * A SKU is not globally unique across manufacturers, so this is a weaker key
 * than the other two and is checked last. It is here because the storefront's
 * readiness gate is handed `{ id, sku, normalizedSku }` and nothing else; a
 * registration that collides is caught by `findSkuIndexCollisions()` rather
 * than silently resolving to whichever record was written second.
 */
const BY_NORMALIZED_SKU: Record<string, Product3DAsset[]> = Object.values(REGISTRY).reduce(
  (acc, asset) => {
    acc[asset.normalizedSku] = [...(acc[asset.normalizedSku] ?? []), asset];
    return acc;
  },
  {} as Record<string, Product3DAsset[]>
);

export function findSkuIndexCollisions(): Array<{ normalizedSku: string; brands: string[] }> {
  return Object.entries(BY_NORMALIZED_SKU)
    .filter(([, assets]) => new Set(assets.map((a) => a.brand)).size > 1)
    .map(([normalizedSku, assets]) => ({ normalizedSku, brands: assets.map((a) => a.brand) }));
}

/**
 * Whether any of the keys the storefront holds resolves to a READY asset.
 *
 * This is the single gate behind `CatalogProduct.roomStudioReady`, and so
 * behind the Product Detail CTA and the catalogue's Room Studio filter.
 */
export function hasReadyAssetForKeys(
  ...keys: Array<string | null | undefined>
): boolean {
  for (const key of keys) {
    if (!key) continue;
    const byId = REGISTRY[key];
    if (byId && assetIsReady(byId)) return true;
    const bySku = BY_NORMALIZED_SKU[key];
    if (bySku?.some(assetIsReady)) return true;
  }
  return false;
}

/** Every registered asset, for the audit script and the dev review page. */
export function allProduct3DAssets(): Product3DAsset[] {
  return Object.values(REGISTRY);
}

/**
 * Assets whose GLB path is shared by more than one SKU.
 *
 * Legitimate when two commercial SKUs are the same body in different finishes,
 * and a disaster when it happened by accident — which is how one basin came to
 * stand in for the whole category. Shared geometry has to be stated, so the
 * audit reports every case and a person decides which kind it is.
 */
export function findSharedGlbUrls(): Array<{ glbUrl: string; catalogProductIds: string[] }> {
  const byUrl = new Map<string, string[]>();
  for (const asset of Object.values(REGISTRY)) {
    const url = asset.runtime.glbUrl;
    if (!url) continue;
    byUrl.set(url, [...(byUrl.get(url) ?? []), asset.catalogProductId]);
  }
  return [...byUrl.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([glbUrl, catalogProductIds]) => ({ glbUrl, catalogProductIds }));
}
