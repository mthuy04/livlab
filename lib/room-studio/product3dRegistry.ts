import {
  PIVOT_FOR_PLACEMENT,
  isRoomStudioReady as assetIsReady,
  type Product3DAsset,
} from './product3dAsset';

/**
 * The manifest. One entry per verified asset, keyed by canonical catalogue id.
 *
 * Six entries, all at SOURCE_VERIFIED and none READY. INAX publishes a 3DS
 * MAX file per product under "3D Max Files", and for these six the filename
 * the manufacturer chose carries the commercial SKU — which is what makes the
 * identity exact rather than a family resemblance.
 *
 * None of them can be placed in a room yet. A .max needs Autodesk 3ds Max to
 * export, no converter here reads it, and the catalogue holds no official
 * dimensions for these SKUs, so the mesh could not be checked against a spec
 * even once it existed. `isRoomStudioReady` fails on all seven QA flags, which
 * is the point: a registered source and a usable asset are different things,
 * and the lifecycle keeps them apart rather than letting "we found a file"
 * become "the customer can place it".
 *
 * Nothing resolves a model by guessing a filename from a SKU, and no category
 * stand-in reaches this file: a basin the customer did not choose, placed in
 * their room under the name of the basin they did, is the failure this whole
 * layer exists to make impossible.
 */
const REGISTRY: Record<string, Product3DAsset> = {
  'demo:tungdang:INAX:AC1008VRN': {
    id: 'inax-ac-1008vrn-src',
    catalogProductId: 'demo:tungdang:INAX:AC1008VRN',
    brand: 'INAX',
    sku: 'AC-1008VRN',
    normalizedSku: 'AC1008VRN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/br6ru4nr1n1ikyoi1hcjgdtwhqxx6iow',
      originalFileName: 'AC-1008VRN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-1008vrn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
  'demo:tungdang:INAX:AC4005VN': {
    id: 'inax-ac-4005vn-src',
    catalogProductId: 'demo:tungdang:INAX:AC4005VN',
    brand: 'INAX',
    sku: 'AC-4005VN',
    normalizedSku: 'AC4005VN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/rcqxfbjkj9ltkrlm5vviy6jjzfokfzf1',
      originalFileName: '4_-_AC_-_4005VN_-_FN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-4005vn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
  'demo:tungdang:INAX:AC2700VN': {
    id: 'inax-ac-2700vn-src',
    catalogProductId: 'demo:tungdang:INAX:AC2700VN',
    brand: 'INAX',
    sku: 'AC-2700VN',
    normalizedSku: 'AC2700VN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/g1jb83m9dq97a7174iqv9gvn3by3ybzp',
      originalFileName: 'AC-2700VN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-2700vn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
  'demo:tungdang:INAX:AC1135VN': {
    id: 'inax-ac-1135vn-src',
    catalogProductId: 'demo:tungdang:INAX:AC1135VN',
    brand: 'INAX',
    sku: 'AC-1135VN',
    normalizedSku: 'AC1135VN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/krjrdhfnakzse75m4zrl3cgpp5atut0s',
      originalFileName: 'AC-1135VN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-1135vn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
  'demo:tungdang:INAX:AC1035VN': {
    id: 'inax-ac-1035vn-src',
    catalogProductId: 'demo:tungdang:INAX:AC1035VN',
    brand: 'INAX',
    sku: 'AC-1035VN',
    normalizedSku: 'AC1035VN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/93cn279dbftqfu4y4y0m431zw0mqjhze',
      originalFileName: 'AC-1035VN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-1035vn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
  'demo:tungdang:INAX:AC1017VRN': {
    id: 'inax-ac-1017vrn-src',
    catalogProductId: 'demo:tungdang:INAX:AC1017VRN',
    brand: 'INAX',
    sku: 'AC-1017VRN',
    normalizedSku: 'AC1017VRN',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://app.box.com/s/kkbn2cx6i2h4imdqvbbadivgi4mqbevb',
      originalFileName: 'AC-1017VRN.max',
      originalFormat: 'MAX',
      checkedAt: '2026-10-13T18:19:52Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
      retrievalMethod: 'Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-1017vrn/',
    },
    identity: {
      relationType: 'EXACT_PRODUCT',
      note: 'Tên file hãng đặt chứa đúng SKU thương mại.',
    },
    dimensionsMm: {},
    placement: {
      type: 'FLOOR_TOILET',
      pivot: PIVOT_FOR_PLACEMENT.FLOOR_TOILET,
      defaultRotation: [0, 0, 0],
    },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: {
      identityVerified: true,
      dimensionsVerified: false,
      scaleVerified: false,
      pivotVerified: false,
      orientationVerified: false,
      materialsVerified: false,
      performanceVerified: false,
    },
    assetVersion: 1,
    note: 'Nguồn .max — cần 3ds Max để xuất. Kích thước chính thức chưa có trong catalog; phải đọc từ bản thông số của hãng trước khi kiểm tỷ lệ.',
  },
};

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
