/**
 * The deterministic tools LivLab Expert is built on.
 *
 * Architectural choice: these run BEFORE the model, not as model-invoked
 * function calls. The consequences are the ones LivLab actually needs —
 *
 *  1. The model can only ever choose from a candidate list that LivLab
 *     produced, so a fabricated SKU is structurally impossible rather than
 *     merely discouraged by the prompt.
 *  2. One Gemini call per user message instead of a multi-turn tool loop,
 *     which is what makes the free tier viable.
 *
 * Product facts are read server-side from the same verified CSV the storefront
 * uses, so the server — not the browser — is the source of truth.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Product } from '@/lib/types';
import { parseCSV, mapCsvRowToProduct } from '@/lib/importVerifiedProducts';
import { normalizeCategory } from '@/lib/visualStudioHelpers';
import { parseDimensionsToMeters } from '@/lib/room-studio/productAdapter';
import type { ExpertProductRef } from './expertContext';

const CSV_PATH = path.join(process.cwd(), 'public', 'data', 'livlab-seed', 'livlab_verified_products_master.csv');

let catalogueCache: Product[] | null = null;

/**
 * Loads the verified product catalogue once per server process.
 *
 * This is the single seam to replace when the catalogue moves to Supabase:
 * swap the file read for a query and everything above keeps working.
 */
export async function loadCatalogue(): Promise<Product[]> {
  if (catalogueCache) return catalogueCache;
  try {
    const raw = await readFile(CSV_PATH, 'utf8');
    // The file carries a UTF-8 BOM. The browser's TextDecoder strips it when
    // the storefront fetches this same CSV, but Node's fs does not — leaving
    // the first header as "\uFEFFid" instead of "id", so every product would
    // fall back to a generated id and stop matching the ids the client holds.
    // That would break "Đưa vào phòng" on every Expert recommendation.
    const csv = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    catalogueCache = parseCSV(csv).map(mapCsvRowToProduct);
  } catch (error) {
    console.error('[LivLab Expert] catalogue load failed', error instanceof Error ? error.message : error);
    catalogueCache = [];
  }
  return catalogueCache;
}

/**
 * Projects a catalogue record into the shape the Expert may see.
 *
 * Dimensions are included ONLY when the catalogue states them. Category
 * fallback sizes (used by the 3D scene so an un-modelled product still occupies
 * believable space) are deliberately NOT applied here — the Expert must be able
 * to say "LivLab chưa có dữ liệu này" rather than quoting an assumption as a
 * specification.
 */
export function toExpertProductRef(product: Product): ExpertProductRef {
  const dims = parseDimensionsToMeters(product.dimensions || product.size);
  const toMm = (m?: number) => (m === undefined ? undefined : Math.round(m * 1000));

  const specs: Record<string, string> = {};
  const put = (key: string, value?: string) => {
    if (value && value.trim()) specs[key] = value.trim();
  };
  put('Chất liệu', product.material);
  put('Bề mặt', product.finish);
  put('Màu', product.color);
  put('Kích thước công bố', product.dimensions || product.size);
  put('Kiểu lắp đặt', product.installationType);
  put('Bảo hành', product.warranty);
  put('Xuất xứ', product.origin);

  return {
    id: product.id,
    sku: product.sku || undefined,
    name: product.name,
    brand: product.brand || undefined,
    category: product.category,
    priceMin: product.priceMin > 0 ? product.priceMin : undefined,
    priceMax: product.priceMax > 0 ? product.priceMax : undefined,
    widthMm: toMm(dims.width),
    depthMm: toMm(dims.depth),
    heightMm: toMm(dims.height),
    knownSpecifications: Object.keys(specs).length > 0 ? specs : undefined,
    imageUrl: product.image || undefined,
    slug: product.slug,
  };
}

export interface SearchProductsCriteria {
  /** Normalised bucket: lavabo / faucet / toilet / shower / mirror / ... */
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Millimetres. Only matches products whose width is actually stated. */
  maxWidthMm?: number;
  maxDepthMm?: number;
  brand?: string;
  /** Free text matched against name and brand. */
  query?: string;
  limit?: number;
}

/**
 * Deterministic catalogue search. Every product the Expert may recommend comes
 * out of here — there is no other path into a recommendation.
 */
export async function searchProducts(criteria: SearchProductsCriteria): Promise<ExpertProductRef[]> {
  const catalogue = await loadCatalogue();
  const needle = criteria.query?.trim().toLowerCase();

  const matches = catalogue.filter((product) => {
    if (criteria.category && normalizeCategory(product.category) !== criteria.category) return false;

    const price = product.priceMin || product.priceMax || 0;
    if (criteria.minPrice !== undefined && price > 0 && price < criteria.minPrice) return false;
    if (criteria.maxPrice !== undefined && price > 0 && price > criteria.maxPrice) return false;

    if (criteria.brand && !(product.brand || '').toLowerCase().includes(criteria.brand.toLowerCase())) return false;

    if (needle) {
      const haystack = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    // A size filter only excludes products whose size is KNOWN and too large.
    // Excluding unknown-size products would silently hide most of the catalogue.
    if (criteria.maxWidthMm !== undefined || criteria.maxDepthMm !== undefined) {
      const dims = parseDimensionsToMeters(product.dimensions || product.size);
      if (criteria.maxWidthMm !== undefined && dims.width !== undefined && dims.width * 1000 > criteria.maxWidthMm) {
        return false;
      }
      if (criteria.maxDepthMm !== undefined && dims.depth !== undefined && dims.depth * 1000 > criteria.maxDepthMm) {
        return false;
      }
    }

    return true;
  });

  // Cheapest first when a budget ceiling was asked for, otherwise priced and
  // photographed products first — those are the ones a customer can act on.
  matches.sort((a, b) => {
    if (criteria.maxPrice !== undefined) return (a.priceMin || 0) - (b.priceMin || 0);
    const byPrice = (b.priceMin > 0 ? 1 : 0) - (a.priceMin > 0 ? 1 : 0);
    if (byPrice !== 0) return byPrice;
    return (b.image ? 1 : 0) - (a.image ? 1 : 0);
  });

  return matches.slice(0, criteria.limit ?? 8).map(toExpertProductRef);
}

/** Known facts for one product, or null when the id is not in LivLab data. */
export async function getProductSpecs(productId: string): Promise<ExpertProductRef | null> {
  const catalogue = await loadCatalogue();
  const found = catalogue.find((p) => p.id === productId || p.sku === productId || p.slug === productId);
  return found ? toExpertProductRef(found) : null;
}

/** Every normalised category present in the catalogue, for prompt grounding. */
export async function listCategories(): Promise<string[]> {
  const catalogue = await loadCatalogue();
  return Array.from(new Set(catalogue.map((p) => normalizeCategory(p.category)))).sort();
}
