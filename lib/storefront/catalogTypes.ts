/**
 * Catalogue shapes and the pure helpers both sides need.
 *
 * Split out of `catalog.ts` because that module is server-only — it reaches
 * for Prisma and the filesystem — while the grid, the filter panel and the
 * compare table all need these types and labels in the browser.
 */

import { hasSkuMasterModel } from '@/lib/room-studio/modelMetadata';

export type Availability = 'AVAILABLE' | 'TO_ORDER' | 'OUT_OF_STOCK' | 'UNKNOWN';

/**
 * `AC-989VN` and `AC989VN` are the same product; `#` and `/` carry meaning in
 * the original and are preserved there, but drop out of the comparison token.
 *
 * Defined here rather than in `manufacturerData` because that module is
 * server-only and the canonical identity is needed on both sides.
 */
export const normalizeSku = (sku: string | null | undefined): string =>
  (sku ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * The canonical identity for a catalogue row.
 *
 * One function, two adapters. A fixture row has no database primary key, so
 * it gets a deterministic identity from what does identify it — the tenant it
 * is demonstrated under, the brand and the normalised SKU — rather than an
 * array index or a hash that moves when the fixture is re-sorted.
 */
export function catalogIdentity(input: {
  sourceType: ProductSourceType;
  sourceRecordId: string;
  tenantId: string;
  brand: string;
  sku: string | null;
  name: string;
}): string {
  const token = normalizeSku(input.sku);
  if (input.sourceType === 'DATABASE') return `db:${input.sourceRecordId}`;
  // Without a SKU the name is the only thing left that identifies the row.
  const tail = token || normalizeSku(input.name).slice(0, 32);
  return `demo:${input.tenantId}:${input.brand.toUpperCase()}:${tail}`;
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  AVAILABLE: 'Có thể cung ứng',
  TO_ORDER: 'Cần đặt hàng',
  OUT_OF_STOCK: 'Tạm hết',
  UNKNOWN: 'Liên hệ xác nhận',
};

/** Where a normalised asset came from, and what was done to it. */
export interface ImageProvenance {
  sourceUrl: string;
  assetOwner: string;
  sourceType: string;
  processing: string[];
}

export interface CatalogDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

/** Which adapter produced a row. The page never branches on it; dedupe does. */
export type ProductSourceType = 'DATABASE' | 'DEMO_FIXTURE';

/** Whether a row is a purchasable identity or only a sourced catalogue type. */
export type CatalogRecordType = 'PRODUCT_TYPE' | 'VERIFIED_SKU';
export type VerificationStatus = 'SOURCE_EXTRACTED' | 'SOURCE_VERIFIED' | 'UNVERIFIED';
export type CatalogPriceType = 'SHOWROOM_OFFER' | 'MARKET_REFERENCE' | 'CATEGORY_REFERENCE' | 'NONE';

export interface CatalogProduct {
  /**
   * The storefront key: route segment, save/compare id, quote line id.
   * Deterministic in both adapters — the Prisma id for a database row, and
   * `brand-sku` for a fixture row — so it is stable across deploys.
   */
  id: string;

  /**
   * The canonical cross-source identity.
   *
   * `id` is stable per source; this is stable per *product*. A SKU that the
   * database holds and the demo fixture also holds is one product, and must
   * not appear twice in a related-products row or a comparison because two
   * adapters named it differently. Built in one place — `catalogIdentity()` —
   * so no component ever assembles an id of its own.
   */
  catalogProductId: string;
  sourceType: ProductSourceType;
  /** The primary key in the backing source, kept for traceability. */
  sourceRecordId: string;
  /** `AC-989VN` and `AC989VN` compare equal through this. */
  normalizedSku: string;

  /** Route segment for the detail page, which resolves slug or id. */
  href: string;
  sku: string | null;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;

  /** Product types are browse/RFQ records and must never be presented as SKUs. */
  recordType: CatalogRecordType;
  verificationStatus: VerificationStatus;
  originalSourceLabel: string | null;
  rightsStatus: string | null;
  /** Research evidence only; never used as the rendered product image. */
  sourceImageEvidenceUrl: string | null;
  sourceImageMatchCount: number | null;

  image: string;
  additionalImages: string[];
  technicalDrawing: string | null;

  /** What the showroom asks. The headline figure on a card. */
  showroomPrice: number | null;
  /** List/reference price, shown struck through only when it is higher. */
  referencePrice: number | null;
  /** Independent external reference; never a Giang Sơn selling price. */
  marketReferencePrice: number | null;
  priceType: CatalogPriceType;
  priceUnit: string | null;
  priceSourceName: string | null;
  priceSourceUrl: string | null;
  priceCheckedAt: string | null;

  dimensions: CatalogDimensions | null;
  dimensionsRaw: string | null;
  color: string | null;
  finish: string | null;
  material: string | null;
  origin: string | null;
  warranty: string | null;

  installationType: string | null;
  seatType: string | null;
  flushType: string | null;
  flushVolume: string | null;
  roughIn: string | null;
  technologies: string[];

  shortDescription: string | null;
  /** Null when the tenant has no commercial data for the row. */
  availability: Availability | null;
  roomStudioReady: boolean;

  sourceUrl: string | null;
  sourceCheckedAt: string | null;

  /**
   * What the image audit made of this product's photograph, and whether the
   * grid should fall back to a placeholder rather than show it.
   */
  imageStatus: string;
  imagePresentable: boolean;

  /* ── Manufacturer-sourced, where an exact SKU match exists ───────────── */

  /** Where the picture came from. Reported internally, never shown as a claim. */
  imageSource: 'MANUFACTURER' | 'SHOWROOM' | 'RETAILER' | 'PLACEHOLDER';
  /** The manufacturer's own product page, kept for auditability. */
  manufacturerUrl: string | null;
  /** The manufacturer's list price. Never conflated with the showroom's. */
  manufacturerReferencePrice: number | null;
  /** Official CAD / installation / 3D / spec links, by reference only. */
  documents: { type: string; sourceUrl: string }[];
  galleryImages: string[];
  /** Only where the manufacturer states it. Compatibility is never inferred. */
  compatibleSkus: string[];
  /** Set when the normalised local copy is being served. */
  imageProvenance: ImageProvenance | null;
}

/**
 * How much of its stage each kind of product should fill.
 *
 * These are optical targets, not facts about the product: a toilet and a
 * towel rail photographed to the same brief still need different scales to
 * carry the same visual weight in a grid. Now that imagery is trimmed of its
 * empty margin, the product itself can sit close to the frame.
 */
export const CATEGORY_OPTICAL_SCALE: Record<string, number> = {
  'Bồn cầu': 0.86,
  Lavabo: 0.82,
  'Vòi lavabo': 0.77,
  'Sen tắm': 0.82,
  'Bồn tắm': 0.86,
  'Gương & phụ kiện': 0.84,
};

/** Small hardware reads as a speck at a scale meant for a bathtub. */
const SMALL_ACCESSORY = /(lô giấy|móc|thanh (vắt )?khăn|kệ|vòi xịt|thoát sàn|phụ kiện)/i;
const MIRROR = /gương/i;

export function opticalScale(category: string, name: string): number {
  if (SMALL_ACCESSORY.test(name) && !MIRROR.test(name)) return 0.72;
  return CATEGORY_OPTICAL_SCALE[category] ?? 0.80;
}

export interface Catalog {
  tenantId: string;
  products: CatalogProduct[];
  /** Shown in the internal data notes, never to a customer as a guarantee. */
  sourceCheckedAt: string | null;
  demoNotice: string | null;
}

/**
 * The storefront sells bathrooms, and only these six categories.
 *
 * LivLab's own catalogue also holds lights and wall tile, which are real
 * master data but not sanitaryware — they are excluded from the storefront
 * scope here rather than deleted anywhere.
 */
export const SANITARYWARE_CATEGORIES = [
  'Bồn cầu',
  'Lavabo',
  'Vòi lavabo',
  'Sen tắm',
  'Bồn tắm',
  'Gương & phụ kiện',
] as const;

/** Display order. Categories outside it sort alphabetically after. */
export const CATEGORY_ORDER: readonly string[] = SANITARYWARE_CATEGORIES;

export const isSanitaryware = (category: string): boolean =>
  (SANITARYWARE_CATEGORIES as readonly string[]).includes(category);

/**
 * A warranty line must not name a showroom LivLab has no agreement with.
 * Factual manufacturer terms pass through; anything naming a seller is
 * reduced to the manufacturer's own policy.
 */
export function safeWarranty(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/showroom|đại lý|cửa hàng|luxbath|tùng đăng|tung dang/i.test(trimmed)) {
    return 'Theo chính sách hãng';
  }
  return trimmed;
}

export function sortCategories(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'vi');
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Brand casing from the dataset, so TOTO and Toto do not become two filters. */
const BRAND_CASING: Record<string, string> = {
  toto: 'TOTO',
  inax: 'INAX',
  jomoo: 'JOMOO',
  viglacera: 'Viglacera',
  caesar: 'Caesar',
  huge: 'Huge',
  mowoen: 'Mowoen',
  'american standard': 'American Standard',
  grohe: 'GROHE',
  kohler: 'Kohler',
};

export const normaliseBrand = (raw: string | null): string | null => {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return BRAND_CASING[key] ?? raw.trim();
};

/**
 * Whether Room Studio can actually place THIS product.
 *
 * Readiness used to be read off `availableProductModels`, which is a table of
 * *categories* that have a representative .glb — today only lavabo, and that
 * file is a generic basin. Offering "thử trong phòng" on the strength of it
 * told a customer they were seeing their SKU in a room while showing them a
 * different object, which is the same falsehood the detail page's old 3D
 * viewer made.
 *
 * So readiness is now per SKU: a product is placeable when a LivLab master
 * asset has been authored and registered for it. `SKU_MODEL_OVERRIDES` is
 * empty today, so this returns false everywhere and the CTA is hidden —
 * correctly — and turns itself on per product as assets land. A manufacturer
 * CAD, 3DS MAX or technical drawing is NOT a LivLab-ready asset and is
 * deliberately not consulted here.
 */
export function isRoomStudioReady(keys: {
  id?: string | null;
  sku?: string | null;
  normalizedSku?: string | null;
}): boolean {
  return hasSkuMasterModel(keys.sku, keys.normalizedSku, keys.id);
}
