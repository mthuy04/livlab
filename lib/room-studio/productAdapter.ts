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
import {
  allReconstructions,
  canRenderReconstruction,
  envelopeOf,
  findReconstruction,
  variantFile,
  type ReconstructedModel,
  type ReconstructionMounting,
} from './reconstructionRegistry';

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
  /**
   * Present when the scene draws LivLab's reconstruction of this exact SKU.
   * Carries what the scene needs to anchor it by its own origin and what the
   * words around it must say. Absent for every other product.
   */
  reconstruction?: {
    modelId: string;
    variant: 'web' | 'basin_only';
    /** Variants the customer may switch between in the room. */
    variants: Array<{ id: 'web' | 'basin_only'; label: string }>;
    /** Model-space bounds of the variant being drawn, metres. */
    boundsM: { min: [number, number, number]; max: [number, number, number] };
    mounting: ReconstructionMounting;
    /** Parts of this variant that are not the product, in a customer's words. */
    illustrativeParts?: string;
  };
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
    case 'bathtub':
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

/**
 * Room Studio's own category for a bathtub.
 *
 * The shared classifier (also used by Visual Studio) files "bồn tắm" under
 * accessories, which hang on a wall. Room Studio needs it on the floor, so it
 * is recognised here rather than by changing what Visual Studio's suggestions
 * pick from.
 */
function roomStudioCategory(category: string): string {
  const lower = (category || '').toLowerCase();
  if (lower.includes('bồn tắm') || lower.includes('bathtub')) return 'bathtub';
  return normalizeCategory(category);
}

const PLACEMENT_FOR_MOUNTING: Record<ReconstructionMounting['kind'], PlacementType> = {
  FLOOR: 'floor',
  WALL_MIXER: 'wall',
  COUNTERTOP: 'counter',
};

/**
 * The same product, drawn with LivLab's reconstruction of its SKU.
 *
 * The size becomes the model's own measured envelope — the box the geometry
 * really occupies — because that is what collides, clears doors and fits
 * against walls. For a toilet, a tub and a basin it equals the manufacturer's
 * figures; for a shower column, which has no "box" on its spec sheet, it is
 * the measured extent of the reconstructed column.
 *
 * Scale is exactly 1: the files are authored in metres and measured to match.
 * Nothing here normalises a largest dimension to anything.
 */
export function withReconstruction(
  product: RoomStudioProduct,
  model: ReconstructedModel,
  variant?: string | null
): RoomStudioProduct {
  const file = variantFile(model, variant);
  const env = envelopeOf(file);
  const variantId = (Object.entries(model.files).find(([, f]) => f === file)?.[0] ?? model.defaultVariant) as
    | 'web'
    | 'basin_only';
  const mm = (m: number) => Math.round(m * 1000);
  return {
    ...product,
    normalizedCategory: model.category,
    width: env.width,
    depth: env.depth,
    height: env.height,
    dimensionsLabel:
      variantId === model.defaultVariant
        ? model.envelopeLabel
        : `${mm(env.width)} x ${mm(env.depth)} x ${mm(env.height)} mm (${file.label.toLowerCase()})`,
    model3dUrl: file.url,
    modelScale: 1,
    illustrativeModel: false,
    capability: 'PROTOTYPE_3D',
    placementType: PLACEMENT_FOR_MOUNTING[model.mounting.kind],
    reconstruction: {
      modelId: model.id,
      variant: variantId,
      variants: model.roomVariants.map((id) => ({ id, label: model.files[id]?.label ?? id })),
      boundsM: file.boundsM,
      mounting: model.mounting,
      illustrativeParts: file.illustrativeParts,
    },
  };
}

/** The reconstruction a product resolves to, if it may be drawn. */
export function reconstructionFor(product: Pick<RoomStudioProduct, 'brand' | 'sku'>): ReconstructedModel | null {
  const model = findReconstruction(product.brand, product.sku);
  return canRenderReconstruction(model) ? model : null;
}

export function toRoomStudioProduct(product: Product): RoomStudioProduct {
  const normalizedCategory = roomStudioCategory(product.category);
  const normalizedSku = normalizeSku(product.sku) || undefined;
  const parsed = parseDimensionsToMeters(product.dimensions || product.size);
  const metadata = getModelMetadata(product, normalizedCategory);
  const asset = findProduct3DAssetForKeys(product.id, normalizedSku);
  const base = baseRoomStudioProduct(product, normalizedCategory, normalizedSku, parsed, metadata, asset);

  // A manufacturer master outranks a reconstruction; a reconstruction
  // outranks a size box. Exact brand + SKU, or nothing.
  const model = base.capability === 'VERIFIED_3D' ? null : reconstructionFor(base);
  return model ? withReconstruction(base, model) : base;
}

function baseRoomStudioProduct(
  product: Product,
  normalizedCategory: string,
  normalizedSku: string | undefined,
  parsed: ReturnType<typeof parseDimensionsToMeters>,
  metadata: ReturnType<typeof getModelMetadata>,
  asset: ReturnType<typeof findProduct3DAssetForKeys>
): RoomStudioProduct {
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
  const mapped = (products || []).map(toRoomStudioProduct);
  return [...mapped, ...livlab3dLibraryProducts(mapped)];
}

/**
 * LivLab's own 3D library, offered in LivLab's Room Studio only.
 *
 * Each reconstructed SKU that LivLab's catalogue does not already list is
 * offered once, under a stable id, with no price, stock or seller written in
 * — the library knows the product's size and shape, not what it costs or who
 * stocks it, so the basket records it as "Liên hệ". A showroom's Room Studio
 * never receives these: it shows a model only where the showroom's own
 * catalogue carries the exact SKU.
 *
 * Kept out of the shared CSV on purpose: Visual Studio reads that file too,
 * and an unpriced row would sort first in its budget picks.
 */
export function livlab3dLibraryProducts(existing: RoomStudioProduct[]): RoomStudioProduct[] {
  const listed = new Set(existing.filter((p) => p.reconstruction).map((p) => p.reconstruction!.modelId));
  return allReconstructions()
    .filter((model) => canRenderReconstruction(model) && !listed.has(model.id))
    .map((model) => {
      const id = `livlab-3d-${model.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const source: Product = {
        id,
        slug: id,
        name: model.name,
        category: model.catalogueCategory,
        subCategory: model.subCategory,
        brand: model.brand,
        sku: model.sku,
        priceMin: 0,
        priceMax: 0,
        priceRange: 'Liên hệ',
        dimensions: model.envelopeLabel,
        image: model.thumbnailUrl,
        imageAlt: `Ảnh dựng từ mô hình 3D tái tạo của ${model.sku}, không phải ảnh chụp sản phẩm`,
        imageVerified: false,
        description: '',
        // Required by the legacy shape and read by nothing in Room Studio.
        // No stock or seller fact is known, so none is written in.
        availability: '',
        status: '' as Product['status'],
        showroomName: '',
        showroomLocation: '',
        sellerType: '',
      };
      return toRoomStudioProduct(source);
    });
}

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
  const normalizedCategory = roomStudioCategory(p.category);
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
  // Bathtubs are listed again now that Room Studio stands them on the floor;
  // a tub without all three stated dimensions still cannot be placed.
  return (data.products ?? []).map((p) => catalogProductToRoomStudio(p, data.tenantId));
}
