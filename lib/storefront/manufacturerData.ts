import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Manufacturer-sourced product data, joined on brand + normalised SKU.
 *
 * The split this module exists to keep: a manufacturer is the source of truth
 * for what a product *is* — its photograph, its dimensions, its technologies,
 * its CAD and installation files — and a showroom is the source of truth for
 * what it *costs here* and whether it can be had. So this merges the first and
 * never the second. `showroomPrice` is not touched; a manufacturer list price
 * arrives as `manufacturerReferencePrice` and stays separate.
 *
 * `scripts/enrich_manufacturer_assets.py` produces the file. Matching there is
 * by SKU alone — a title that looks similar is never enough — and an ambiguous
 * code is recorded as NO_MATCH rather than guessed.
 */

export type MatchType = 'EXACT_SKU' | 'NORMALIZED_SKU' | 'MANUAL_CONFIRMED' | 'NO_MATCH';

export interface ManufacturerDocument {
  type: 'CAD' | 'INSTALLATION' | 'THREE_D' | 'SPEC';
  sourceUrl: string;
}

export interface ManufacturerRecord {
  matchType: MatchType;
  brand: string;
  sku: string;
  manufacturerProductUrl?: string;
  manufacturerCheckedAt?: string;
  officialName?: string;
  officialSku?: string;
  primaryImage?: string | null;
  galleryImages?: string[];
  technicalSpecs?: Record<string, string>;
  technologies?: string[];
  files?: ManufacturerDocument[];
  manufacturerReferencePrice?: number | null;
  technicalSourceUrl?: string;
  imageSourceUrl?: string | null;
  compatibleSkus?: string[];
}

let cache: Map<string, ManufacturerRecord> | null = null;

export async function manufacturerRecords(): Promise<Map<string, ManufacturerRecord>> {
  if (cache) return cache;
  cache = new Map();
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'demo', 'manufacturer-enrichment.json'), 'utf8');
    const file = JSON.parse(raw) as { products: Record<string, ManufacturerRecord> };
    for (const [id, record] of Object.entries(file.products ?? {})) {
      if (record.matchType !== 'NO_MATCH') cache.set(id, record);
    }
  } catch {
    // No enrichment yet: the catalogue runs on retailer data alone.
  }
  return cache;
}

/** Where the picture on a card came from. Reported, never shown as a claim. */
export type ImageSource = 'MANUFACTURER' | 'SHOWROOM' | 'RETAILER' | 'PLACEHOLDER';

/**
 * `AC-989VN` and `AC989VN` are the same product; `#` and `/` carry meaning in
 * the original and are preserved there, but drop out of the comparison token.
 */
export const normalizeSku = (sku: string | null): string =>
  (sku ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
