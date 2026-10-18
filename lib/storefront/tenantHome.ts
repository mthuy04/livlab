import 'server-only';

import { getCatalog } from './catalog';
import { sortCategories, type CatalogProduct } from './catalogTypes';
import { getConceptBySlug, getPublishedConcepts } from './concepts';
import {
  toCardModel,
  toHotspotViews,
  type ConceptCardModel,
  type ConceptEstimate,
  type ConceptHotspotView,
} from './conceptTypes';
import type { TenantStorefrontConfig } from './tenantConfig';

/**
 * A showroom's homepage, assembled from what the showroom sells.
 *
 * The `showcase` homepage is built from LivLab's own data, which is right for
 * LivLab and wrong on a showroom's storefront: it would put LivLab's products
 * and prices under the showroom's logo. This reads the tenant's catalogue and
 * its concept library through the same functions `/products` and `/concepts`
 * use, so every count, category, brand and price on the page is one the
 * showroom's own catalogue can back — and a product that leaves the catalogue
 * leaves the homepage with it.
 */

/** A product as a homepage card needs it, and nothing more crosses to the client. */
export interface HomeProductView {
  id: string;
  catalogProductId: string;
  sourceType: CatalogProduct['sourceType'];
  href: string;
  brand: string;
  name: string;
  sku: string | null;
  category: string;
  image: string;
  showroomPrice: number | null;
  /** Only a genuinely higher list price the catalogue holds; never derived. */
  referencePrice: number | null;
}

export interface HomeCategory {
  name: string;
  count: number;
  href: string;
  /** First presentable photograph in the category, for stage-style layouts. */
  image: string;
}

export interface HomeBrand {
  name: string;
  count: number;
  href: string;
}

/** The room the `commerce` hero shows: a published concept and its resolved products. */
export interface HomeHeroRoom {
  slug: string;
  titleVi: string;
  image: string;
  imageAlt: string;
  hotspots: ConceptHotspotView[];
  productCount: number;
  estimate: ConceptEstimate;
}

export interface CatalogHomeData {
  tenantId: string;
  productCount: number;
  categories: HomeCategory[];
  brands: HomeBrand[];
  featured: HomeProductView[];
  concepts: ConceptCardModel[];
  heroRoom: HomeHeroRoom | null;
}

const FEATURED_COUNT = 4;

export function toHomeProductView(p: CatalogProduct): HomeProductView {
  return {
    id: p.id,
    catalogProductId: p.catalogProductId,
    sourceType: p.sourceType,
    href: p.href,
    brand: p.brand,
    name: p.name,
    sku: p.sku,
    category: p.category,
    image: p.image,
    showroomPrice: p.showroomPrice,
    referencePrice: p.referencePrice,
  };
}

/**
 * The showroom's picks first, in its order, then topped up with one priced
 * product per category the picks did not cover. A pick that no longer resolves
 * is skipped rather than shown as a gap.
 */
function chooseFeatured(products: CatalogProduct[], picks: string[]): CatalogProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const chosen = picks.map((id) => byId.get(id)).filter((p): p is CatalogProduct => Boolean(p));
  if (chosen.length >= FEATURED_COUNT) return chosen.slice(0, FEATURED_COUNT);

  const covered = new Set(chosen.map((p) => p.category));
  for (const category of sortCategories([...new Set(products.map((p) => p.category))])) {
    if (chosen.length >= FEATURED_COUNT) break;
    if (covered.has(category)) continue;
    const candidate = products.find((p) => p.category === category && p.showroomPrice);
    if (candidate) {
      chosen.push(candidate);
      covered.add(category);
    }
  }
  return chosen;
}

function tally<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

export async function getCatalogHomeData(tenant: TenantStorefrontConfig): Promise<CatalogHomeData> {
  const merchandising = tenant.experience.merchandising;

  let products: CatalogProduct[] = [];
  try {
    products = (await getCatalog(tenant)).products;
  } catch {
    // The homepage still renders — hero copy, Room Studio, consultation — and
    // the sections that need the catalogue simply do not appear.
    products = [];
  }

  const categoryCounts = tally(products.map((p) => p.category));
  const categories: HomeCategory[] = sortCategories([...categoryCounts.keys()]).map((name) => ({
    name,
    count: categoryCounts.get(name) ?? 0,
    href: `/products?category=${encodeURIComponent(name)}`,
    image: products.find((p) => p.category === name)?.image ?? '',
  }));

  const brandCounts = tally(products.map((p) => p.brand));
  const brands: HomeBrand[] = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count, href: `/products?brand=${encodeURIComponent(name)}` }));

  const featured = chooseFeatured(products, merchandising?.featuredProductIds ?? []).map(toHomeProductView);

  let concepts: ConceptCardModel[] = [];
  let heroRoom: HomeHeroRoom | null = null;
  try {
    const published = await getPublishedConcepts(tenant);
    concepts = published.map(toCardModel);

    const heroSlug = merchandising?.heroConceptSlug;
    const hero = heroSlug ? await getConceptBySlug(tenant, heroSlug) : published[0] ?? null;
    if (hero) {
      // One pin per product: a double vanity maps one SKU twice, and two
      // identical price tags on one photograph read as a mistake.
      const seen = new Set<string>();
      const hotspots = toHotspotViews(hero).filter((h) => {
        if (!h.product.imagePresentable || seen.has(h.product.catalogProductId)) return false;
        seen.add(h.product.catalogProductId);
        return true;
      });
      heroRoom = {
        slug: hero.concept.slug,
        titleVi: hero.concept.titleVi,
        image: hero.concept.canonicalImage,
        imageAlt: hero.concept.imageAlt,
        hotspots,
        productCount: hero.products.length,
        estimate: hero.estimate,
      };
      // The hero room leads the page; the concept row shows the others.
      concepts = concepts.filter((c) => c.slug !== hero.concept.slug);
    }
  } catch {
    concepts = [];
  }

  return {
    tenantId: tenant.id,
    productCount: products.length,
    categories,
    brands,
    featured,
    concepts: concepts.slice(0, merchandising?.conceptCount ?? 3),
    heroRoom,
  };
}
