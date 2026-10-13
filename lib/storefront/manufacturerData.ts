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

/**
 * The canonical document classes the enrichment emits.
 *
 * Decided from the file itself — extension, then filename, then the visible
 * anchor label — rather than from the heading a link happens to sit under.
 * The parser used to take the type from whichever label it had matched last,
 * which filed TOTO's user manual and its company-wide origin-data spreadsheet
 * as `CAD`.
 */
export type ManufacturerDocumentType =
  | 'TECHNICAL_SPEC'
  | 'TECHNICAL_DRAWING'
  | 'INSTALLATION'
  | 'USER_MANUAL'
  | 'CAD'
  | 'BIM'
  | 'THREE_D'
  | 'CATALOG'
  | 'CERTIFICATE'
  | 'OTHER';

export interface ManufacturerDocument {
  type: ManufacturerDocumentType;
  sourceUrl: string;
  /** The link's visible text, where the page gave one. */
  label?: string | null;
  /** The heading the link sits under, kept for provenance. */
  sourceSection?: string;
  /** Which signal decided the type: EXTENSION, FILENAME, ANCHOR_LABEL, SECTION. */
  typeEvidence?: string;
  specificityEvidence?: string;
}

/** One image considered for a product's gallery, and what was decided about it. */
export interface GalleryCandidate {
  url: string;
  sourceSection: string;
  relation:
    | 'CURRENT_PRODUCT'
    | 'LIFESTYLE_CURRENT_PRODUCT'
    | 'TECHNICAL_DRAWING'
    | 'RELATED_PRODUCT'
    | 'COMPATIBLE_PRODUCT'
    | 'PROMOTIONAL'
    | 'UNKNOWN';
  accepted: boolean;
  foreignSku?: string[];
  reason?: string;
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
  /** The manufacturer's own dimensioned drawing for this SKU. */
  technicalDrawing?: string | null;
  /**
   * Files the manufacturer links from this product's page that are not about
   * this product — company paperwork and all-product spreadsheets. Kept as
   * provenance so the enrichment stays auditable; never shown as a product
   * document.
   */
  companyDocuments?: string[];
  galleryAudit?: GalleryCandidate[];
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
 * Re-exported so server callers that already depend on this module keep one
 * import. The definition lives in `catalogTypes` because the canonical
 * identity it feeds is needed on the client too, and this module is
 * server-only.
 */
export { normalizeSku } from './catalogTypes';
