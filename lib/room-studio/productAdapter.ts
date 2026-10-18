/**
 * Normalises whatever LivLab's catalogue happens to be today (CSV -> localStorage)
 * into the single shape Room Studio consumes. Every Room Studio component reads
 * RoomStudioProduct and nothing else, so swapping the source for Supabase means
 * rewriting only `loadRoomStudioProducts` below.
 *
 * Nothing here invents data: a field the catalogue does not carry stays
 * undefined, and the UI is responsible for degrading gracefully.
 */

import { Product } from '@/lib/types';
import { normalizeCategory } from '@/lib/visualStudioHelpers';
import { normalizeSku, type CatalogProduct } from '@/lib/storefront/catalogTypes';
import type { RoomStudioCatalog } from '@/lib/storefront/tenantExperience';
import type { CatalogQuoteEntry } from '@/lib/context/QuoteContext';
import { getModelMetadata } from './modelMetadata';
import { findProduct3DAssetForKeys } from './product3dRegistry';
import { deriveCapability, type RoomStudioCapability } from './productCapability';
import type { PlacementType } from './placementRules';

export interface RoomStudioProduct {
  id: string;
  /**
   * SKU with separators dropped — the key the 3D registry is reached by.
   *
   * There is deliberately no `catalogProductId` here. `Product` does not carry
   * one, and the canonical identity is built server-side in
   * `lib/storefront/catalog` from the tenant, which this client-side CSV path
   * does not know. Synthesising one here would produce a second identity that
   * looks canonical and is not, so Room Studio asks the registry with the keys
   * it genuinely holds — the same `{ id, normalizedSku }` pair the storefront's
   * own `roomStudioReady` gate uses.
   */
  normalizedSku?: string;
  sku?: string;
  slug?: string;
  name: string;
  brand?: string;
  /** Raw catalogue category, kept for display. */
  category: string;
  /** LivLab's normalised bucket: lavabo / faucet / toilet / shower / mirror / ... */
  normalizedCategory: string;
  priceMin?: number;
  priceMax?: number;
  priceRange?: string;
  imageUrl?: string;
  /** Real-world size in METRES, parsed from the catalogue when it is stated. */
  width?: number;
  depth?: number;
  height?: number;
  /** Source string the dimensions came from, so the UI can be honest about it. */
  dimensionsLabel?: string;
  model3dUrl?: string;
  modelScale?: number;
  /**
   * The GLB being drawn is a stand-in, not this product.
   *
   * Never true for geometry from `product3dRegistry`; only a per-SKU
   * demonstration override sets it. The scene draws it at the product's true
   * size either way — this exists so the words around it can say which it is.
   */
  illustrativeModel?: boolean;
  /** What Room Studio may claim about this product. The one badge/gate source. */
  capability: RoomStudioCapability;
  placementType: PlacementType;
  /** The original record, so existing flows (quote basket) keep working as-is. */
  source: Product;
  /**
   * Present when the product came from a storefront catalogue. The basket then
   * takes the catalogue's own entry — tenant, catalogue identity and price
   * snapshot — exactly as the product page does, instead of the legacy shape.
   */
  quoteEntry?: CatalogQuoteEntry;
}

/**
 * Parses catalogue dimension strings into metres.
 * Handles the shapes actually present in livlab_verified_products_master.csv,
 * e.g. "550 x 380 x 125 mm", "1200x600mm", "Ø420 mm". Returns undefined fields
 * rather than guesses when the string cannot be read.
 *
 * A string carrying more than three numbers is read as nothing at all. Two
 * rows in the catalogue state two different measurements in one field —
 * "Bề mặt 40 x 40 cm; lỗ khoét 29.5 x 29.5 cm" is a ceiling heater's face
 * and its cutout — and taking the first three numbers turned that into a
 * 400×400×295 box that is not any dimension of the product. A plausible
 * wrong size is worse than a missing one, because nothing downstream can tell
 * it is wrong.
 */
export function parseDimensionsToMeters(raw?: string): {
  width?: number;
  depth?: number;
  height?: number;
} {
  if (!raw) return {};

  const text = raw.toLowerCase();
  const isCm = /\bcm\b/.test(text);
  const isMeters = /\bm\b/.test(text) && !/\bmm\b/.test(text) && !isCm;

  // Grab every number, tolerating both "," and "." as decimal separators.
  const numbers = (text.match(/\d+(?:[.,]\d+)?/g) || [])
    .map((n) => parseFloat(n.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numbers.length === 0) return {};
  if (numbers.length > 3) return {};

  const toMeters = (value: number) => {
    if (isMeters) return value;
    if (isCm) return value / 100;
    // Default unit in this catalogue is millimetres.
    return value / 1000;
  };

  // Catalogue convention is width x depth x height.
  const [a, b, c] = numbers.map(toMeters);
  const sane = (v?: number) => (v !== undefined && v > 0.01 && v < 5 ? v : undefined);

  if (numbers.length === 1) return { width: sane(a) };
  if (numbers.length === 2) return { width: sane(a), depth: sane(b) };
  return { width: sane(a), depth: sane(b), height: sane(c) };
}

/**
 * Placement is derived from structured data first (`mountType`), then from the
 * normalised category. Free-text `installationType` is deliberately NOT parsed —
 * it holds unstructured Vietnamese prose and guessing from it produces wrong
 * placements that look like bugs.
 */
function derivePlacementType(product: Product, normalized: string): PlacementType {
  if (product.mountType === 'wall') return 'wall';
  if (product.mountType === 'floor') return 'floor';

  switch (normalized) {
    case 'mirror':
    case 'faucet':
    case 'shower':
    case 'lighting':
      return 'wall';
    case 'toilet':
    case 'vanity':
      return 'floor';
    // Basins are installed on a vanity top, not on the floor. Resting them at
    // counter height reads correctly even before a vanity is placed under them.
    case 'lavabo':
      return 'counter';
    // Bathroom accessories hang: shelves, rails, hooks, a wall water heater.
    // The old default dropped every one of them on the floor, which the
    // placement types were never wrong about — nothing had asked them.
    case 'accessory':
      return 'wall';
    default:
      return 'floor';
  }
}

export function toRoomStudioProduct(product: Product): RoomStudioProduct {
  const normalizedCategory = normalizeCategory(product.category);
  const normalizedSku = normalizeSku(product.sku) || undefined;
  const parsed = parseDimensionsToMeters(product.dimensions || product.size);
  const metadata = getModelMetadata(product, normalizedCategory);
  const asset = findProduct3DAssetForKeys(product.id, normalizedSku);

  return {
    id: product.id,
    normalizedSku,
    sku: product.sku || undefined,
    slug: product.slug,
    name: product.name,
    brand: product.brand || undefined,
    category: product.category,
    normalizedCategory,
    priceMin: product.priceMin || undefined,
    priceMax: product.priceMax || undefined,
    priceRange: product.priceRange || undefined,
    imageUrl: product.image || undefined,
    width: parsed.width,
    depth: parsed.depth,
    height: parsed.height,
    dimensionsLabel: product.dimensions || product.size || undefined,
    model3dUrl: metadata.model3dUrl,
    modelScale: metadata.modelScale,
    illustrativeModel: metadata.illustrativeModel,
    capability: deriveCapability(asset, parsed),
    placementType: derivePlacementType(product, normalizedCategory),
    source: product,
  };
}

/**
 * The ONLY place Room Studio reaches for catalogue data.
 *
 * `livlab`: the verified-products CSV, parsed client-side and cached in
 * localStorage by lib/importVerifiedProducts (the same source Visual Studio
 * uses, so both studios always show the same catalogue).
 *
 * `tenant`: the storefront's own catalogue, from the same tenant-scoped API
 * the product grid reads. A showroom's Room Studio then offers exactly what
 * that showroom sells, and nothing another catalogue holds.
 */
export async function loadRoomStudioProducts(
  catalog: RoomStudioCatalog = 'livlab'
): Promise<RoomStudioProduct[]> {
  if (catalog === 'tenant') return loadTenantCatalogProducts();
  const { importVerifiedProductsFromCsv } = await import('@/lib/importVerifiedProducts');
  const products = await importVerifiedProductsFromCsv(true);
  return (products || []).map(toRoomStudioProduct);
}

/**
 * Categories the tenant catalogue sells that Room Studio cannot place yet.
 *
 * A bathtub has no placement category here: the classifier files it under
 * accessories, which hang on a wall. Listing tubs would put a 1.7m bath on
 * the wall at shelf height, so they stay on the product pages until Room
 * Studio has a floor-standing bath placement of its own.
 */
const NOT_PLACEABLE_IN_ROOM_STUDIO = new Set(['Bồn tắm']);

/**
 * A catalogue size as Room Studio's "width × depth × height".
 *
 * A Vietnamese retailer lists "dài × rộng × cao", where dài is the longest
 * horizontal side. For a basin or a tub that side runs along the wall; for a
 * floor toilet it runs FROM the wall, so the two horizontal figures swap.
 * Nothing is estimated: three figures or none.
 */
function catalogueSize(p: CatalogProduct, normalizedCategory: string): string | undefined {
  const d = p.dimensions;
  if (!d || !(d.length > 0) || !(d.width > 0) || !(d.height > 0)) return undefined;
  const long = Math.max(d.length, d.width);
  const short = Math.min(d.length, d.width);
  const [along, deep] = normalizedCategory === 'toilet' ? [short, long] : [long, short];
  return `${along} x ${deep} x ${d.height} ${d.unit || 'mm'}`;
}

const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

export function catalogProductToRoomStudio(p: CatalogProduct, tenantId: string): RoomStudioProduct {
  const normalizedCategory = normalizeCategory(p.category);
  const normalizedSku = normalizeSku(p.sku) || undefined;
  const asset = findProduct3DAssetForKeys(p.catalogProductId, p.id, normalizedSku);

  // The manufacturer's verified figures win over the retailer's listing, as
  // they do in `deriveCapability`. Without this the capability would read
  // EXACT_DIMENSIONS from the asset while the scene drew a category-average
  // box, because the size itself would never have reached the product.
  const verified = asset?.qa.dimensionsVerified ? asset.dimensionsMm : null;
  const size =
    verified?.width && verified.depth && verified.height
      ? `${verified.width} x ${verified.depth} x ${verified.height} mm`
      : catalogueSize(p, normalizedCategory);

  const price = p.showroomPrice ?? 0;
  const source: Product = {
    id: p.id,
    slug: p.href.replace(/^\/products\//, ''),
    name: p.name,
    category: p.category,
    brand: p.brand,
    sku: p.sku ?? '',
    // One asking price, as the basket records it — never widened into a range.
    priceMin: price,
    priceMax: price,
    priceRange: p.showroomPrice ? formatVnd(p.showroomPrice) : 'Liên hệ',
    material: p.material ?? undefined,
    finish: p.finish ?? undefined,
    color: p.color ?? undefined,
    dimensions: size,
    installationType: p.installationType ?? undefined,
    warranty: p.warranty ?? undefined,
    origin: p.origin ?? undefined,
    image: p.image,
    description: p.shortDescription ?? '',
    // Required by the legacy shape and read by nothing in Room Studio. The
    // catalogue carries no stock or seller facts, so none are written in.
    availability: '',
    status: '' as Product['status'],
    showroomName: '',
    showroomLocation: '',
    sellerType: '',
  };

  return {
    ...toRoomStudioProduct(source),
    quoteEntry: {
      catalogProductId: p.catalogProductId,
      productId: p.id,
      sourceType: p.sourceType,
      tenantId,
      name: p.name,
      brand: p.brand,
      category: p.category,
      sku: p.sku,
      image: p.image,
      showroomPrice: p.showroomPrice,
      referencePrice: p.referencePrice,
      sourceContext: 'ROOM_STUDIO',
    },
  };
}

async function loadTenantCatalogProducts(): Promise<RoomStudioProduct[]> {
  const res = await fetch('/api/storefront/products');
  if (!res.ok) throw new Error(`catalogue ${res.status}`);
  const data = (await res.json()) as { tenantId: string; products: CatalogProduct[] };
  return (data.products ?? [])
    .filter((p) => !NOT_PLACEABLE_IN_ROOM_STUDIO.has(p.category))
    .map((p) => catalogProductToRoomStudio(p, data.tenantId));
}
