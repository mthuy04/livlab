/**
 * What a product detail page is allowed to know.
 *
 * One server-built view model, consumed verbatim by the page. Components do
 * not reconcile a Prisma row against a demo fixture against a manufacturer
 * JSON blob — that reconciliation happens once, in `productDetail.ts`, under
 * a stated precedence, and what comes out the other side is already decided.
 *
 * The shape is deliberately full of nulls and empty arrays rather than
 * placeholder strings. A section renders when its data exists and is absent
 * when it does not; there is no "Chưa cập nhật" card standing in for a fact
 * nobody has.
 *
 * Split from the builder because the builder is server-only (Prisma, the
 * filesystem) while the interactive islands — gallery, actions, anchor nav,
 * sticky bar — need these types in the browser.
 */

import type { Availability, ProductSourceType } from './catalogTypes';

export type MediaSource = 'MANUFACTURER' | 'SHOWROOM' | 'RETAILER' | 'PLACEHOLDER';

/* ── Identity ─────────────────────────────────────────────────────────── */

export interface ProductIdentity {
  /** Canonical across /products, detail, compare, saved, quote. */
  catalogProductId: string;
  sourceType: ProductSourceType;
  sourceRecordId: string;

  /** The storefront key: route segment and client-store id. */
  id: string;
  slug: string;
  brand: string;
  name: string;
  sku: string | null;
  normalizedSku: string;

  category: string;
  subcategory: string | null;
  /** Only when the source states one. Never parsed out of a product name. */
  series: string | null;
}

/* ── Media ────────────────────────────────────────────────────────────── */

export interface ProductMediaItem {
  url: string;
  alt: string;
  kind: 'PRIMARY' | 'DRAWING';
  source: MediaSource;
}

export interface TechnicalDrawing {
  url: string;
  /** "INAX" when the file sits on the manufacturer's own domain, else null. */
  attribution: string | null;
  official: boolean;
}

export interface ProductMedia {
  primary: ProductMediaItem | null;
  /** Everything the gallery may show, primary first. */
  gallery: ProductMediaItem[];
  /** Verified in-situ photography. Empty until a source actually supplies it. */
  lifestyle: ProductMediaItem[];
  technicalDrawing: TechnicalDrawing | null;

  /** False when the audit rejected the only asset: the stage shows a placeholder. */
  presentable: boolean;
  /** Share of the stage the product should occupy, per category. */
  occupancy: number;
  /**
   * True when the asset served is the trimmed, canvas-normalised local copy.
   * The stage pads differently for those, because their margin is known.
   */
  normalized: boolean;
}

/* ── Commerce ─────────────────────────────────────────────────────────── */

export interface ProductPricing {
  showroomPrice: number | null;
  marketReferencePrice: number | null;
  priceType: 'SHOWROOM_OFFER' | 'MARKET_REFERENCE' | 'CATEGORY_REFERENCE' | 'NONE';
  priceUnit: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  checkedAt: string | null;
  promotionPrice: number | null;
  showroomReferencePrice: number | null;
  /** The manufacturer's list price. Never promoted into `showroomPrice`. */
  manufacturerReferencePrice: number | null;
  displayPriceLabel: string;
  /** The single reference figure shown beside the headline, if any. */
  comparePrice: number | null;
  compareLabel: string | null;
  discountPercent: number | null;
  note: string | null;
}

export interface ProductCommercial {
  availability: Availability | null;
  availabilityLabel: string | null;
  leadTimeDays: number | null;
  /**
   * Whether the tenant is a signed showroom with confirmed commercial data,
   * or an internal demo configuration. Demo tenants show manufacturer
   * technical data but never a showroom warranty, stock or dealer claim.
   */
  commercialConfirmed: boolean;
}

/* ── Content ──────────────────────────────────────────────────────────── */

export interface SpecRow {
  label: string;
  value: string;
}

/**
 * A technology the manufacturer states for this SKU.
 *
 * `description` is the brand's own copy, read from the brand's own technology
 * page. A technology without one is never given invented copy: it is listed
 * as a specification instead and never reaches the editorial section.
 */
export interface ProductTechnology {
  name: string;
  description: string;
  sourceUrl: string;
}

export interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

export interface DimensionRow {
  label: string;
  value: string;
  unit: string;
}

export interface ProductDimensions {
  rows: DimensionRow[];
  raw: string | null;
}

export interface ProductDocument {
  label: string;
  /** PDF / DWG / Liên kết — read off the URL, not off the enrichment's type. */
  format: string;
  url: string;
  action: 'VIEW' | 'DOWNLOAD';
  /** Hosted on the manufacturer's own domain. */
  official: boolean;
}

export interface SimulatorRef {
  href: string;
  label: string;
  attribution: string;
  brand: string;
  /** EMBED_ALLOWED opens the LivLab wrapper; EXTERNAL_ONLY opens the brand's own tool. */
  external: boolean;
}

export interface RoomStudioRef {
  ready: boolean;
  href: string | null;
}

export interface RelatedProductRef {
  catalogProductId: string;
  id: string;
  href: string;
  name: string;
  brand: string;
  sku: string | null;
  category: string;
  image: string | null;
  presentable: boolean;
  occupancy: number;
  normalized: boolean;
  showroomPrice: number | null;
  /** Set when the product is not sold by the active tenant. */
  referenceOnly: boolean;
}

export interface ProductProvenance {
  manufacturerUrl: string | null;
  imageSourceUrl: string | null;
  technicalSourceUrl: string | null;
  sourceUrl: string | null;
  sourceCheckedAt: string | null;
  imageSource: MediaSource;
  imageStatus: string;
  /** "Thông số kỹ thuật: INAX" — shown; the URLs above are not. */
  technicalAttribution: string | null;
}

/* ── The page's contract ──────────────────────────────────────────────── */

export type SectionId =
  | 'tong-quan'
  | 'thong-so'
  | 'ban-ve'
  | 'cong-nghe'
  | 'tuong-thich'
  | 'tai-lieu'
  | 'mo-phong';

export interface ProductDetailViewModel {
  tenantId: string;
  identity: ProductIdentity;
  media: ProductMedia;
  pricing: ProductPricing;
  commercial: ProductCommercial;

  /** Two or three factual lines, assembled from structured fields only. */
  summary: string | null;
  /** The 4–6 facts that decide a purchase. A subset of `specifications`. */
  overviewFacts: SpecRow[];
  specifications: SpecGroup[];
  dimensions: ProductDimensions | null;
  technologies: ProductTechnology[];
  compatibility: RelatedProductRef[];
  documents: ProductDocument[];
  manufacturerSimulator: SimulatorRef | null;
  roomStudio: RoomStudioRef;
  relatedProducts: RelatedProductRef[];
  provenance: ProductProvenance;
}

/** Anchors are rendered only for sections the view model actually fills. */
export const SECTION_LABELS: Record<SectionId, string> = {
  'tong-quan': 'TỔNG QUAN',
  'thong-so': 'THÔNG SỐ',
  'ban-ve': 'BẢN VẼ',
  'cong-nghe': 'CÔNG NGHỆ',
  'tuong-thich': 'TƯƠNG THÍCH',
  'tai-lieu': 'TÀI LIỆU',
  'mo-phong': 'MÔ PHỎNG',
};

export function activeSections(vm: ProductDetailViewModel): SectionId[] {
  const ids: SectionId[] = ['tong-quan'];
  if (vm.specifications.some((g) => g.rows.length > 0)) ids.push('thong-so');
  if (vm.media.technicalDrawing || vm.dimensions) ids.push('ban-ve');
  if (vm.technologies.length > 0) ids.push('cong-nghe');
  if (vm.compatibility.length > 0) ids.push('tuong-thich');
  if (vm.documents.length > 0) ids.push('tai-lieu');
  if (vm.manufacturerSimulator || vm.roomStudio.ready) ids.push('mo-phong');
  return ids;
}

export const formatVnd = (value: number): string => `${value.toLocaleString('vi-VN')}đ`;
