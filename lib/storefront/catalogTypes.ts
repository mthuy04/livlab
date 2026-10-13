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
}

export interface Catalog {
  tenantId: string;
  products: CatalogProduct[];
  /** Shown in the internal data notes, never to a customer as a guarantee. */
  sourceCheckedAt: string | null;
  demoNotice: string | null;
}

/** Display order. Categories outside it sort alphabetically after. */
export const CATEGORY_ORDER = [
  'Bồn cầu',
  'Lavabo',
  'Vòi lavabo',
  'Sen tắm',
  'Bồn tắm',
  'Gương & phụ kiện',
];

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
