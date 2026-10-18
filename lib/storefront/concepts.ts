import 'server-only';

import { getCatalog } from './catalog';
import type { CatalogProduct } from './catalogTypes';
import type { TenantStorefrontConfig } from './tenantConfig';
import { CONCEPT_LIBRARY } from './conceptLibrary';
import {
  isCustomerFacing,
  meetsPublicationBar,
  ZONE_OF,
  type ConceptEstimate,
  type ResolvedConcept,
  type StorefrontConcept,
} from './conceptTypes';

/**
 * Concepts, resolved against the catalogue of the storefront asking.
 *
 * A concept record names SKUs; it does not own them. Whether a SKU is a
 * product *here* is a question only this tenant's catalogue can answer, and it
 * answers differently tomorrow. So nothing is read out of the record and
 * rendered: every hotspot is resolved through `getCatalog`, and one that no
 * longer resolves is dropped before the page sees it.
 *
 * That is also the fail-safe. The alternative — rendering the brand and SKU
 * off the hotspot and linking to `/products/<sku>` — produces a hotspot that
 * looks authoritative and leads to a 404, which is worse than no hotspot at
 * all. A product that leaves the catalogue takes its hotspot with it, and if
 * enough of them go the concept drops below the publication bar and leaves the
 * grid on its own.
 */

/** Cheap per-request memo; `getCatalog` is the expensive half. */
async function catalogIndex(tenant: TenantStorefrontConfig): Promise<Map<string, CatalogProduct>> {
  const { products } = await getCatalog(tenant);
  const index = new Map<string, CatalogProduct>();
  for (const product of products) {
    index.set(product.catalogProductId, product);
    index.set(`id:${product.id}`, product);
  }
  return index;
}

/**
 * Whether this storefront is allowed to see a concept at all.
 *
 * `tenantId: null` marks a LivLab curated concept, offered to every showroom.
 * Anything else belongs to one tenant and is invisible to the others — a
 * concept carries SKUs and prices, so leaking one leaks a competitor's range.
 */
function visibleTo(concept: StorefrontConcept, tenant: TenantStorefrontConfig): boolean {
  return concept.tenantId === null || concept.tenantId === tenant.id;
}

/**
 * The equipment total, or an honest refusal to give one.
 *
 * Built from what this showroom charges — `showroomPrice` — never from a
 * manufacturer's list price, and never from a number typed into the concept
 * record. If any mapped product has no price here, no total is shown at all:
 * a sum that silently omits the one unpriced item is always too low, and too
 * low is the direction that costs the showroom the conversation.
 */
function estimate(products: CatalogProduct[]): ConceptEstimate {
  if (products.length === 0) return { kind: 'CONTACT', productCount: 0 };

  const prices = products.map((p) => p.showroomPrice);
  if (prices.some((p) => p === null || p === undefined || p <= 0)) {
    return { kind: 'CONTACT', productCount: products.length };
  }

  const total = (prices as number[]).reduce((sum, p) => sum + p, 0);
  /**
   * A band rather than a point. The concept prices the fixtures it names, and
   * a real bathroom takes a few more — stops, traps, a seat upgrade — so a
   * single exact figure would read as a quotation. ±12% says "about this" in
   * the only way a number can.
   */
  return {
    kind: 'RANGE',
    min: Math.round((total * 0.88) / 1_000_000) * 1_000_000,
    max: Math.round((total * 1.12) / 1_000_000) * 1_000_000,
    productCount: products.length,
  };
}

function resolve(
  concept: StorefrontConcept,
  index: Map<string, CatalogProduct>,
  tenant: TenantStorefrontConfig
): ResolvedConcept {
  const hotspots = concept.hotspots
    .filter(isCustomerFacing)
    .map((h) => {
      const replacementId = tenant.experience.merchandising?.conceptProductMap?.[h.targetType];
      const product = index.get(h.catalogProductId!) ?? (replacementId ? index.get(`id:${replacementId}`) : undefined);
      return product
        ? {
            ...h,
            catalogProductId: product.catalogProductId,
            matchConfidence: replacementId ? ('CURATED_SUGGESTION' as const) : h.matchConfidence,
            product,
          }
        : null;
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);

  // A double vanity puts one SKU behind two hotspots. The image shows two
  // objects and the list shows one product; both are correct.
  const seen = new Set<string>();
  const products = hotspots
    .filter((h) => {
      if (seen.has(h.product.catalogProductId)) return false;
      seen.add(h.product.catalogProductId);
      return true;
    })
    .map((h) => ({
      product: h.product,
      match: h.matchConfidence,
      zone: ZONE_OF[h.targetType],
    }));

  return { concept, hotspots, products, estimate: estimate(products.map((p) => p.product)) };
}

/**
 * Everything this storefront may show on `/concepts`.
 *
 * Two gates, both applied here rather than trusted to the record: the record's
 * own `publicationStatus`, and the live check that enough of its hotspots
 * still resolve. A concept that passed QA in March and lost two products in
 * June is not published today, and no page has to remember to ask.
 */
export async function getPublishedConcepts(
  tenant: TenantStorefrontConfig
): Promise<ResolvedConcept[]> {
  const index = await catalogIndex(tenant);
  return CONCEPT_LIBRARY.filter(
    (c) => c.publicationStatus === 'PUBLISHED_VERIFIED' && visibleTo(c, tenant)
  )
    .map((c) => resolve(c, index, tenant))
    .filter(meetsPublicationBar);
}

/**
 * One concept, or `null`.
 *
 * `null` covers every reason a slug might not resolve — unknown, archived,
 * another tenant's, or published but no longer passing the bar — because the
 * page's answer to all four is the same 404. Distinguishing them in the
 * response would tell a crawler which slugs exist on other storefronts.
 */
export async function getConceptBySlug(
  tenant: TenantStorefrontConfig,
  slug: string
): Promise<ResolvedConcept | null> {
  const concept = CONCEPT_LIBRARY.find((c) => c.slug === slug);
  if (!concept || concept.publicationStatus !== 'PUBLISHED_VERIFIED') return null;
  if (!visibleTo(concept, tenant)) return null;

  const resolved = resolve(concept, await catalogIndex(tenant), tenant);
  return meetsPublicationBar(resolved) ? resolved : null;
}

/** Slugs for `generateStaticParams`. Published only. */
export function publishedSlugs(): string[] {
  return CONCEPT_LIBRARY.filter((c) => c.publicationStatus === 'PUBLISHED_VERIFIED').map(
    (c) => c.slug
  );
}
