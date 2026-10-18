/**
 * What a concept is, and what a hotspot is allowed to claim.
 *
 * The library this replaces was generated: 34 records sharing 9 stock
 * photographs, with every hotspot stamped from one of six hardcoded coordinate
 * templates. Nothing in that data distinguished a mapping somebody had checked
 * from one a loop had invented, so the page had no way to be honest and no way
 * to be wrong — it simply asserted.
 *
 * The distinction lives in the type now. `matchConfidence` has no "probably"
 * value that renders like a fact: an unverifiable fixture is `UNVERIFIED` or
 * `GENERIC_FIXTURE`, and neither reaches a customer. The three states that do
 * render carry different words, because "this is the product" and "here is a
 * similar one" are different promises.
 */

import type { CatalogProduct } from './catalogTypes';

/* ------------------------------------------------------------------ taxonomy */

/**
 * Four dimensions that do not overlap, replacing one "Phong cách" filter that
 * mixed Japandi (a look), Budget (a price) and Compact (a constraint) into the
 * same list of options.
 */
export type ConceptStyle =
  | 'MODERN_MINIMAL'
  | 'SCANDINAVIAN'
  | 'SMART_MODERN'
  | 'SERENE_LUXURY'
  | 'WARM_LUXURY'
  | 'MODERN_SPA'
  | 'MONOCHROME_CONTEMPORARY'
  | 'JAPANDI'
  | 'DARK_HOTEL_LUXURY'
  | 'COASTAL_MINIMAL';

export type ConceptUseCase =
  | 'URBAN_APARTMENT'
  | 'YOUNG_FAMILY'
  | 'SMART_LIVING'
  | 'PREMIUM_SUITE'
  | 'MASTER_BATHROOM'
  | 'CALM_DAILY_RETREAT'
  | 'DESIGN_STATEMENT'
  | 'RELAXED_HOME'
  | 'HOTEL_PREMIUM'
  | 'BRIGHT_PREMIUM_HOME';

export type ConceptAreaBand =
  | 'COMPACT'
  | 'COMPACT_TO_MEDIUM'
  | 'MEDIUM'
  | 'MEDIUM_TO_LARGE'
  | 'LARGE';

export type ConceptBudgetBand =
  | 'ENTRY'
  | 'ENTRY_TO_MID'
  | 'MID'
  | 'MID_TO_PREMIUM'
  | 'PREMIUM'
  | 'PREMIUM_PLUS';

export type ConceptTone =
  | 'LIGHT_NEUTRAL'
  | 'WARM_LIGHT'
  | 'WARM_NEUTRAL'
  | 'WARM_STONE'
  | 'NATURAL_WARM'
  | 'COOL_NEUTRAL'
  | 'BLACK_WHITE'
  | 'LIGHT_WOOD_WARM_NEUTRAL'
  | 'CHARCOAL_BROWN'
  | 'COOL_BLUE_GRAY';

/* -------------------------------------------------------------- customer view */

/**
 * The customer never picks from the five internal styles.
 *
 * A storefront filter answers "what am I in the mood for", and five engineering
 * constants are not moods. These coarse buckets are what the filter column
 * offers; the mapping below is the only place the two vocabularies meet.
 */
export type StyleFacet =
  | 'MODERN'
  | 'SCANDINAVIAN'
  | 'JAPANDI'
  | 'SMART'
  | 'HOTEL'
  | 'CONTRAST'
  | 'LUXURY'
  | 'SPA'
  | 'COASTAL';
export type AreaFacet = 'SMALL' | 'MEDIUM' | 'LARGE';

export const STYLE_FACET_OF: Record<ConceptStyle, StyleFacet> = {
  MODERN_MINIMAL: 'MODERN',
  SCANDINAVIAN: 'SCANDINAVIAN',
  SMART_MODERN: 'SMART',
  SERENE_LUXURY: 'SPA',
  WARM_LUXURY: 'LUXURY',
  MODERN_SPA: 'MODERN',
  MONOCHROME_CONTEMPORARY: 'CONTRAST',
  JAPANDI: 'JAPANDI',
  // Hotel rather than Luxury: the palette is dark, but the band a customer
  // filters by should follow what the mapped products cost, not the walls.
  DARK_HOTEL_LUXURY: 'HOTEL',
  COASTAL_MINIMAL: 'COASTAL',
};

export const AREA_FACET_OF: Record<ConceptAreaBand, AreaFacet> = {
  COMPACT: 'SMALL',
  COMPACT_TO_MEDIUM: 'SMALL',
  MEDIUM: 'MEDIUM',
  MEDIUM_TO_LARGE: 'MEDIUM',
  LARGE: 'LARGE',
};

export const STYLE_FACET_LABEL: Record<StyleFacet, string> = {
  MODERN: 'Hiện đại',
  SCANDINAVIAN: 'Scandinavian',
  SMART: 'Smart',
  JAPANDI: 'Japandi',
  HOTEL: 'Khách sạn',
  CONTRAST: 'Tương phản',
  LUXURY: 'Luxury',
  SPA: 'Spa / nghỉ dưỡng',
  COASTAL: 'Coastal',
};

export const AREA_FACET_LABEL: Record<AreaFacet, string> = {
  SMALL: 'Nhỏ',
  MEDIUM: 'Trung bình',
  LARGE: 'Rộng',
};

/** Shown on a card, under the style. The internal band is never displayed. */
export const AREA_BAND_LABEL: Record<ConceptAreaBand, string> = {
  COMPACT: 'Nhỏ gọn',
  COMPACT_TO_MEDIUM: 'Nhỏ – trung bình',
  MEDIUM: 'Trung bình',
  MEDIUM_TO_LARGE: 'Trung bình – rộng',
  LARGE: 'Rộng',
};

/**
 * Budget filtering runs on the money, not on the band.
 *
 * The page this replaces compared `c.budgetRange === budget` against a display
 * string, so a record spelled `30-60 triệu` with an ASCII hyphen never matched
 * the option spelled `30–60 triệu` with an en dash — 18 of 34 concepts were
 * unreachable through the most-used filter in the column. Ranges are numbers
 * here and the label is derived, so the two cannot drift apart.
 */
export type BudgetFacet = 'UNDER_30' | 'FROM_30_TO_60' | 'FROM_60_TO_100' | 'OVER_100';

export const BUDGET_FACET_LABEL: Record<BudgetFacet, string> = {
  UNDER_30: 'Dưới 30 triệu',
  FROM_30_TO_60: '30–60 triệu',
  FROM_60_TO_100: '60–100 triệu',
  OVER_100: 'Trên 100 triệu',
};

const BUDGET_FACET_RANGE: Record<BudgetFacet, [number, number]> = {
  UNDER_30: [0, 30_000_000],
  FROM_30_TO_60: [30_000_000, 60_000_000],
  FROM_60_TO_100: [60_000_000, 100_000_000],
  OVER_100: [100_000_000, Number.POSITIVE_INFINITY],
};

/** A concept belongs to a band when its estimate overlaps that band at all. */
export function budgetFacetMatches(facet: BudgetFacet, estimate: ConceptEstimate): boolean {
  if (estimate.kind !== 'RANGE') return false;
  const [lo, hi] = BUDGET_FACET_RANGE[facet];
  return estimate.min < hi && estimate.max >= lo;
}

/* -------------------------------------------------------------------- hotspot */

/**
 * How far the evidence actually goes.
 *
 * Only the first three render. The rest exist so that a fixture nobody could
 * match is recorded as unmatched rather than quietly dropped — the difference
 * between "we checked and the showroom does not stock this" and "nobody
 * looked" is the difference between a catalogue gap and an unknown.
 *
 * `CURATED_SUGGESTION` runs the other way from the two above it. Those match a
 * product to a room that already existed; this one is a room art-directed
 * around products the showroom chose for each position. The object drawn
 * there is still an illustration, not that product — so the claim is "the
 * showroom suggests this here", never "this is what you see".
 */
export type ConceptHotspotMatch =
  | 'EXACT_VISUAL'
  | 'CLOSE_VISUAL_MATCH'
  | 'CURATED_SUGGESTION'
  | 'GENERIC_FIXTURE'
  | 'UNVERIFIED'
  | 'REJECTED';

/** The match levels a customer is shown. */
export type CustomerFacingMatch = 'EXACT_VISUAL' | 'CLOSE_VISUAL_MATCH' | 'CURATED_SUGGESTION';

export type ConceptHotspotTarget =
  | 'TOILET'
  | 'BASIN'
  | 'FAUCET'
  | 'SHOWER'
  | 'BATHTUB'
  | 'MIRROR'
  | 'VANITY'
  | 'ACCESSORY';

export type ConceptQaStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export const TARGET_LABEL: Record<ConceptHotspotTarget, string> = {
  TOILET: 'bồn cầu',
  BASIN: 'lavabo',
  FAUCET: 'vòi lavabo',
  SHOWER: 'sen tắm',
  BATHTUB: 'bồn tắm',
  MIRROR: 'gương',
  VANITY: 'tủ lavabo',
  ACCESSORY: 'phụ kiện',
};

/** Which zone of the room a product sits in, for grouping the list below. */
export type ConceptZone = 'WC' | 'BASIN' | 'SHOWER' | 'BATH';

export const ZONE_LABEL: Record<ConceptZone, string> = {
  WC: 'KHU VỆ SINH',
  BASIN: 'KHU LAVABO',
  SHOWER: 'KHU TẮM',
  BATH: 'BỒN TẮM',
};

export const ZONE_OF: Record<ConceptHotspotTarget, ConceptZone> = {
  TOILET: 'WC',
  BASIN: 'BASIN',
  FAUCET: 'BASIN',
  MIRROR: 'BASIN',
  VANITY: 'BASIN',
  SHOWER: 'SHOWER',
  BATHTUB: 'BATH',
  ACCESSORY: 'BASIN',
};

export interface ConceptHotspot {
  id: string;
  conceptId: string;
  targetType: ConceptHotspotTarget;

  /**
   * Percentages of the *natural* image, never of the box it is drawn into.
   *
   * The stage renders the asset uncropped for exactly this reason: an
   * `object-fit: cover` crop moves every fixture under a coordinate that did
   * not move, and the hotspot slides off the thing it names.
   */
  xPct: number;
  yPct: number;

  /** Roughly where the fixture is, so a point can be checked against it. */
  bbox?: { xPct: number; yPct: number; widthPct: number; heightPct: number };

  /** Canonical catalogue identity. Absent for anything that did not match. */
  catalogProductId?: string;
  brand?: string;
  sku?: string;

  matchConfidence: ConceptHotspotMatch;
  qaStatus: ConceptQaStatus;
  /** Why this confidence and not a higher one. Internal; never rendered. */
  note?: string;
  /**
   * Which way the desktop preview opens, when the default (away from the
   * nearer edge) would cover another fixture the reader is meant to see.
   */
  popover?: { x: 'left' | 'right'; y: 'up' | 'down' };
}

/** The two states a customer may see, and the words each one is allowed. */
export const MATCH_LABEL: Record<CustomerFacingMatch, string> = {
  EXACT_VISUAL: 'Sản phẩm trong concept',
  CLOSE_VISUAL_MATCH: 'Sản phẩm gợi ý tương đồng',
  CURATED_SUGGESTION: 'Sản phẩm gợi ý trong concept',
};

/** What a match does NOT claim, said where the product is shown. Null when nothing needs saying. */
export const MATCH_CAVEAT: Record<CustomerFacingMatch, string | null> = {
  EXACT_VISUAL: null,
  CLOSE_VISUAL_MATCH:
    'Gợi ý sản phẩm tương đồng với thiết bị trong ảnh, không phải ảnh chụp chính sản phẩm này.',
  CURATED_SUGGESTION:
    'Sản phẩm showroom gợi ý cho vị trí này. Ảnh concept là hình minh hoạ không gian, không phải ảnh dựng chính xác của sản phẩm.',
};

/**
 * A hotspot reaches a customer only from here.
 *
 * One predicate, used by the stage, the product list, the card count and the
 * quote payload alike, so none of them can disagree about what is published.
 */
export function isCustomerFacing(h: ConceptHotspot): boolean {
  return (
    h.qaStatus === 'VERIFIED' &&
    (h.matchConfidence === 'EXACT_VISUAL' ||
      h.matchConfidence === 'CLOSE_VISUAL_MATCH' ||
      h.matchConfidence === 'CURATED_SUGGESTION') &&
    Boolean(h.catalogProductId)
  );
}

/* -------------------------------------------------------------------- concept */

export type ConceptPublicationStatus = 'DRAFT' | 'QA_PENDING' | 'PUBLISHED_VERIFIED' | 'ARCHIVED';

export type ConceptImageSourceType = 'LIVLAB_GENERATED' | 'SHOWROOM' | 'MANUFACTURER' | 'OTHER';

export interface StorefrontConcept {
  id: string;
  slug: string;

  title: string;
  titleVi: string;

  /**
   * Three lengths, each written for one place, rather than one paragraph
   * stretched or truncated to fit three.
   *
   * A card that carries the full story stops being a card, and a detail page
   * that carries only the card's line has nothing to say once the reader has
   * decided to look. The rule for all three is the same: say why the room is
   * like this — light, circulation, how the materials sit together — not what
   * objects are in it. The photograph already lists the objects.
   *
   * None of it may claim a product capability. What a fixture *does* is the
   * catalogue's to state, from data; what a room *feels* like is this copy's.
   */

  /** ~20–30 words. The grid, under the title. */
  shortDescription: string;
  /** ~90–140 words. The editorial section under the stage. */
  conceptStory: string;
  /** Exactly three. Spatial observations, never product claims. */
  designPrinciples: [string, string, string];

  canonicalImage: string;
  imageAlt: string;
  /**
   * Perceptual fingerprint of the hero.
   *
   * Two published concepts sharing one photograph is the failure that made the
   * old library read as padding, and it is not a thing an editor reliably
   * notices once a library is large. `assertUniqueHeroImages()` fails the build
   * on it instead.
   */
  imageHash: string;
  imageSourceType: ConceptImageSourceType;
  /** The asset this was produced from, kept for provenance. */
  imageSourceId: string;

  style: ConceptStyle;
  useCase: ConceptUseCase;
  areaBand: ConceptAreaBand;
  budgetBand: ConceptBudgetBand;
  tone: ConceptTone;

  publicationStatus: ConceptPublicationStatus;
  /** Set only when the status is not PUBLISHED_VERIFIED. Internal. */
  qaNote?: string;

  hotspots: ConceptHotspot[];

  /** `null` means a LivLab curated concept, offered to every storefront. */
  tenantId: string | null;

  /**
   * For a named, authored concept: lead with its name and state the facts a
   * card would otherwise derive from the bands. The generated library rooms
   * leave this unset and keep their derived labels.
   */
  presentation?: ConceptPresentation;
}

export interface ConceptPresentation {
  /** Show `title` ("Golden Retreat") as the heading and `titleVi` as its subtitle. */
  leadWithName: boolean;
  /** Room type, e.g. "Master bathroom". */
  roomType?: string;
  /** Replaces the derived style facet label on cards and the detail page. */
  styleLabel?: string;
  /** A stated size range, e.g. "10–14 m²", in place of the area band label. */
  areaLabel?: string;
  /** Positioning, e.g. "Cao cấp". Never a price. */
  budgetLabel?: string;
}

/* ------------------------------------------------------------------- estimate */

/**
 * What the equipment in a concept costs, or an honest admission that we
 * cannot say.
 *
 * A total is only shown when every published hotspot resolved to a product the
 * active tenant actually prices. One missing price makes the sum wrong in a
 * direction that always favours us, so the whole figure is withheld instead.
 */
export type ConceptEstimate =
  | { kind: 'RANGE'; min: number; max: number; productCount: number }
  | { kind: 'CONTACT'; productCount: number };

/** A concept resolved against one tenant's catalogue, ready to render. */
export interface ResolvedConcept {
  concept: StorefrontConcept;
  /** Only hotspots whose product still resolves for this tenant. */
  hotspots: Array<ConceptHotspot & { product: CatalogProduct }>;
  /** Distinct products, in reading order. A product mapped twice appears once. */
  products: Array<{ product: CatalogProduct; match: ConceptHotspotMatch; zone: ConceptZone }>;
  estimate: ConceptEstimate;
}

/**
 * What a card needs, and nothing else.
 *
 * The grid is interactive — filters live in the browser — so whatever the grid
 * renders crosses to the client. A `ResolvedConcept` carries a full
 * `CatalogProduct` per hotspot, which would put the tenant's pricing, supplier
 * notes and image provenance into the page source of a listing that shows none
 * of it. This is the projection that crosses instead.
 */
export interface ConceptCardModel {
  slug: string;
  titleVi: string;
  /** Set when the concept leads with its name; `titleVi` is then the subtitle. */
  name: string | null;
  /** "Style · area", from the presentation when stated, else from the bands. */
  metaLabel: string;
  /** Every product is the showroom's own pick for its position (`CURATED_SUGGESTION`). */
  curated: boolean;
  shortDescription: string;
  image: string;
  imageAlt: string;
  styleFacet: StyleFacet;
  areaFacet: AreaFacet;
  areaLabel: string;
  productCount: number;
  estimate: ConceptEstimate;
  /** Verified hotspot positions, for the resting preview dots. */
  dots: Array<{ id: string; xPct: number; yPct: number }>;
}

/** "Hiện đại cao cấp · 10–14 m²" — stated labels where the concept gives them. */
export function conceptMetaLabel(concept: StorefrontConcept): string {
  const style = concept.presentation?.styleLabel ?? STYLE_FACET_LABEL[STYLE_FACET_OF[concept.style]];
  const area = concept.presentation?.areaLabel ?? AREA_BAND_LABEL[concept.areaBand];
  return `${style} · ${area}`;
}

export function toCardModel(resolved: ResolvedConcept): ConceptCardModel {
  const { concept, products, estimate } = resolved;
  return {
    slug: concept.slug,
    titleVi: concept.titleVi,
    name: concept.presentation?.leadWithName ? concept.title : null,
    metaLabel: conceptMetaLabel(concept),
    curated: products.length > 0 && products.every((p) => p.match === 'CURATED_SUGGESTION'),
    shortDescription: concept.shortDescription,
    image: concept.canonicalImage,
    imageAlt: concept.imageAlt,
    styleFacet: STYLE_FACET_OF[concept.style],
    areaFacet: AREA_FACET_OF[concept.areaBand],
    areaLabel: AREA_BAND_LABEL[concept.areaBand],
    productCount: products.length,
    estimate,
    dots: resolved.hotspots.slice(0, 4).map((h) => ({ id: h.id, xPct: h.xPct, yPct: h.yPct })),
  };
}

/**
 * A product as the stage and the list below it need it.
 *
 * Same reasoning as `ConceptCardModel`: the detail page is interactive, so
 * everything it renders crosses to the browser, and a `CatalogProduct` carries
 * far more about a showroom's sourcing than a hotspot should publish.
 */
export interface ConceptProductView {
  catalogProductId: string;
  /** Catalogue row id, the key the quote basket and product pages use. */
  id: string;
  sourceType: CatalogProduct['sourceType'];
  href: string;
  brand: string;
  name: string;
  sku: string | null;
  category: string;
  image: string | null;
  imagePresentable: boolean;
  showroomPrice: number | null;
  /** Only a list price the catalogue genuinely holds above the showroom's. */
  referencePrice: number | null;
  marketReferencePrice: number | null;
  priceType: CatalogProduct['priceType'];
  priceUnit: string | null;
  recordType: CatalogProduct['recordType'];
  verificationStatus: CatalogProduct['verificationStatus'];
  /** One stated fact for a compact preview — the size, else the type. Never invented. */
  keyFact: string | null;
}

export interface ConceptHotspotView {
  id: string;
  targetType: ConceptHotspotTarget;
  xPct: number;
  yPct: number;
  match: CustomerFacingMatch;
  popover?: ConceptHotspot['popover'];
  product: ConceptProductView;
}

/**
 * Whether the asset is a dimension drawing rather than a photograph.
 *
 * Read from the publisher's own filename — these assets are published as
 * "Bản Vẽ Kỹ Thuật …" — so this is metadata, not a guess about pixels.
 *
 * A drawing is fine evidence for a mapping: its elevation gives body height,
 * spout height and reach to the millimetre, which is how the basin mixer in
 * the two compact rooms was matched at all. It is not fine as a thumbnail.
 * Measured at the 76px the hotspot card renders, the line work flattens to a
 * grey smudge — nothing darker than #B5B5B5, a tonal spread of 7.5 — so a
 * reader sees neither a product nor a drawing.
 *
 * The placeholder the catalogue already designed for a failed asset says the
 * brand and the SKU and is legible. It is the better of the two.
 *
 * This belongs upstream: the image audit marks both of these `ACCEPTABLE`,
 * which is simply wrong. Correcting it there would also drop the products out
 * of the catalogue entirely — `getCatalog` withholds anything unpresentable —
 * and whether a showroom stops listing a product it genuinely sells is the
 * catalogue owner's call, not this module's.
 */
const isTechnicalDrawing = (p: CatalogProduct): boolean =>
  /b%E1%BA%A3n-v%E1%BA%BD|ban-ve|B%E1%BA%A3n%20V%E1%BA%BD/i.test(
    p.imageProvenance?.sourceUrl ?? ''
  );

const productView = (p: CatalogProduct): ConceptProductView => ({
  catalogProductId: p.catalogProductId,
  id: p.id,
  sourceType: p.sourceType,
  href: p.href,
  brand: p.brand,
  name: p.name,
  sku: p.sku,
  category: p.category,
  image: p.image,
  imagePresentable: p.imagePresentable && !isTechnicalDrawing(p),
  showroomPrice: p.showroomPrice,
  referencePrice: p.referencePrice,
  marketReferencePrice: p.marketReferencePrice,
  priceType: p.priceType,
  priceUnit: p.priceUnit,
  recordType: p.recordType,
  verificationStatus: p.verificationStatus,
  keyFact: p.dimensionsRaw ?? p.subcategory ?? null,
});

export function toHotspotViews(resolved: ResolvedConcept): ConceptHotspotView[] {
  return resolved.hotspots.map((h) => ({
    id: h.id,
    targetType: h.targetType,
    xPct: h.xPct,
    yPct: h.yPct,
    match: h.matchConfidence as CustomerFacingMatch,
    popover: h.popover,
    product: productView(h.product),
  }));
}

/** Products grouped by the zone they sit in. Empty zones are not returned. */
export function groupByZone(
  resolved: ResolvedConcept
): Array<{ zone: ConceptZone; items: Array<{ product: ConceptProductView; match: ConceptHotspotMatch }> }> {
  const order: ConceptZone[] = ['WC', 'BASIN', 'SHOWER', 'BATH'];
  return order
    .map((zone) => ({
      zone,
      items: resolved.products
        .filter((p) => p.zone === zone)
        .map((p) => ({ product: productView(p.product), match: p.match })),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * The publication floor, in code.
 *
 * Called by the resolver rather than trusted to the record, because the record
 * cannot know whether a mapped SKU is still in this tenant's catalogue today.
 *
 * Lowered from three to two. The floor was set when the failure it guarded
 * against was invention — a library of 216 hotspots stamped from six
 * coordinate templates — and three verified points was a reasonable proof that
 * someone had actually looked. That is no longer the failure in front of it.
 * Every hotspot now carries a written argument and was checked against a
 * product photograph; the rooms that fell short did so because this showroom
 * sells five categories and the scenes are furnished from eight.
 *
 * So the floor had started rejecting honest work for being thin, which is not
 * what it was for. Two verified products in a room, labelled "gợi ý tương
 * đồng" and pointing at things the showroom really stocks, is a smaller claim
 * than three — not a weaker one.
 *
 * One constant, and reverting it re-hides exactly the two rooms it admitted.
 */
export const MIN_PUBLISHED_HOTSPOTS = 2;

export function meetsPublicationBar(resolved: Pick<ResolvedConcept, 'hotspots' | 'products'>): boolean {
  return resolved.hotspots.length >= MIN_PUBLISHED_HOTSPOTS && resolved.products.length > 0;
}
