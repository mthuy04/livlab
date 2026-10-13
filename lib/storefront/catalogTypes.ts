/**
 * Catalogue shapes and the pure helpers both sides need.
 *
 * Split out of `catalog.ts` because that module is server-only — it reaches
 * for Prisma and the filesystem — while the grid, the filter panel and the
 * compare table all need these types and labels in the browser.
 */

import { availableProductModels } from '@/lib/livlabProductModels';

export type Availability = 'AVAILABLE' | 'TO_ORDER' | 'OUT_OF_STOCK' | 'UNKNOWN';

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

export interface CatalogProduct {
  id: string;
  /** Route segment for the existing detail page, which resolves slug or id. */
  href: string;
  sku: string | null;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;

  image: string;
  additionalImages: string[];
  technicalDrawing: string | null;

  /** What the showroom asks. The headline figure on a card. */
  showroomPrice: number | null;
  /** List/reference price, shown struck through only when it is higher. */
  referencePrice: number | null;

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
 * Whether Room Studio can actually place a product.
 *
 * Readiness is per 3D category, not per SKU: `availableProductModels` marks
 * which categories have a usable .glb, and today only lavabo does. Flagging a
 * product as placeable on anything looser would put customers in an empty
 * room — so the filter is driven by that table and hidden when it matches
 * nothing in the current catalogue.
 */
function roomStudioCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('lavabo') && !c.includes('vòi')) return 'lavabo';
  if (c.includes('vòi')) return 'faucet';
  if (c.includes('bồn cầu')) return 'toilet';
  if (c.includes('sen')) return 'shower';
  if (c.includes('gương')) return 'mirror';
  return 'unknown';
}

export function isRoomStudioReady(category: string): boolean {
  const key = roomStudioCategory(category) as keyof typeof availableProductModels;
  return availableProductModels[key] === true;
}
