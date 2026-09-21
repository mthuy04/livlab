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
import { getModelMetadata } from './modelMetadata';
import type { PlacementType } from './placementRules';

export interface RoomStudioProduct {
  id: string;
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
  placementType: PlacementType;
  /** The original record, so existing flows (quote basket) keep working as-is. */
  source: Product;
}

/**
 * Parses catalogue dimension strings into metres.
 * Handles the shapes actually present in livlab_verified_products_master.csv,
 * e.g. "550 x 380 x 125 mm", "1200x600mm", "Ø420 mm". Returns undefined fields
 * rather than guesses when the string cannot be read.
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
    default:
      return 'floor';
  }
}

export function toRoomStudioProduct(product: Product): RoomStudioProduct {
  const normalizedCategory = normalizeCategory(product.category);
  const parsed = parseDimensionsToMeters(product.dimensions || product.size);
  const metadata = getModelMetadata(product, normalizedCategory);

  return {
    id: product.id,
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
    placementType: derivePlacementType(product, normalizedCategory),
    source: product,
  };
}

/**
 * The ONLY place Room Studio reaches for catalogue data.
 *
 * Today: the verified-products CSV, parsed client-side and cached in
 * localStorage by lib/importVerifiedProducts (the same source Visual Studio
 * uses, so both studios always show the same catalogue).
 * Later: replace this body with a Supabase/`/api/products` fetch — no component
 * changes required.
 */
export async function loadRoomStudioProducts(): Promise<RoomStudioProduct[]> {
  const { importVerifiedProductsFromCsv } = await import('@/lib/importVerifiedProducts');
  const products = await importVerifiedProductsFromCsv(true);
  return (products || []).map(toRoomStudioProduct);
}
