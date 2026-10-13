import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '@/lib/prisma';
import type { TenantStorefrontConfig } from './tenantConfig';
import { imageVerdicts, isRejected, type ImageStatus } from './imageQuality';
import {
  isRoomStudioReady,
  isSanitaryware,
  normaliseBrand,
  safeWarranty,
  type Availability,
  type CatalogDimensions,
  type CatalogProduct,
} from './catalogTypes';

export * from './catalogTypes';

/**
 * Reading the tenant's catalogue.
 *
 * One shape, two sources. A showroom tenant reads the database scoped to its
 * own ShowroomProductOffer rows; a demo tenant reads a JSON fixture. Either
 * way the page receives `CatalogProduct[]` and never learns which it was.
 *
 * The scoping is the point. `/api/products` returns every ACTIVE row in the
 * database with no tenant filter at all, which on a showroom's own storefront
 * shows the customer another showroom's products and prices.
 */

export interface Catalog {
  tenantId: string;
  products: CatalogProduct[];
  /** Shown in the internal data notes, never to a customer as a guarantee. */
  sourceCheckedAt: string | null;
  demoNotice: string | null;
  /** Held back because their only photograph failed the image audit. */
  withheldForImageQuality: number;
}

/**
 * Database categories use their own spellings. Mapping them onto the display
 * taxonomy keeps one set of category filters across both sources.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  'Sen tắm': 'Sen tắm',
  'Vòi lavabo': 'Vòi lavabo',
  'Vòi sen': 'Sen tắm',
  Lavabo: 'Lavabo',
  'Tủ lavabo': 'Lavabo',
  'Bồn cầu': 'Bồn cầu',
  'Bồn tắm': 'Bồn tắm',
  'Gương': 'Gương & phụ kiện',
  'Phụ kiện': 'Gương & phụ kiện',
};

const normaliseCategory = (raw: string | null): string | null =>
  raw ? CATEGORY_ALIASES[raw] ?? raw : null;

interface DemoFixture {
  sourceCheckedAt: string;
  notice: string;
  products: {
    sourceUrl: string;
    sourceCheckedAt: string;
    name: string;
    brand: string | null;
    sku: string | null;
    category: string;
    subcategory: string | null;
    primaryImage: string | null;
    additionalImages: string[];
    technicalDrawing: string | null;
    referencePrice: number | null;
    showroomPrice: number | null;
    dimensions: CatalogDimensions | null;
    dimensionsRaw: string | null;
    color: string | null;
    finish: string | null;
    material: string | null;
    origin: string | null;
    warranty: string | null;
    installationType: string | null;
    seatType: string | null;
    flushType: string | null;
    flushVolume: string | null;
    roughIn: string | null;
    technologies: string[];
    shortDescription: string | null;
  }[];
}

let fixtureCache: DemoFixture | null = null;

async function loadFixture(file: string): Promise<DemoFixture | null> {
  if (fixtureCache) return fixtureCache;
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'demo', file), 'utf8');
    fixtureCache = JSON.parse(raw) as DemoFixture;
    return fixtureCache;
  } catch {
    return null;
  }
}

/** A stable id for a fixture row: brand + SKU, which is also the dedupe key. */
const fixtureId = (brand: string | null, sku: string | null, name: string) =>
  `${(brand ?? 'x').toLowerCase()}-${(sku ?? name).toLowerCase()}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

async function fromFixture(tenant: TenantStorefrontConfig, file: string): Promise<Catalog> {
  const fixture = await loadFixture(file);
  if (!fixture)
    return { tenantId: tenant.id, products: [], sourceCheckedAt: null, demoNotice: null, withheldForImageQuality: 0 };
  const verdicts = await imageVerdicts(tenant.id);

  const products: CatalogProduct[] = fixture.products
    // §39: a card needs a name, a brand, a category and an image.
    .filter((p) => p.name && p.brand && p.category && p.primaryImage && isSanitaryware(p.category))
    .map((p) => {
      const id = fixtureId(p.brand, p.sku, p.name);
      const verdict = verdicts.get(id);
      const status = (verdict?.status ?? 'ACCEPTABLE') as ImageStatus;
      return {
        id,
        href: `/products/${id}`,
        sku: p.sku,
        name: p.name,
        brand: normaliseBrand(p.brand) as string,
        category: p.category,
        subcategory: p.subcategory,
        // The audit may have found a cleaner sibling than the one the
        // importer picked; prefer it.
        image: verdict?.replacementImage ?? (p.primaryImage as string),
        imageStatus: status,
        imagePresentable: !isRejected(status),
        additionalImages: p.additionalImages ?? [],
        technicalDrawing: p.technicalDrawing,
        showroomPrice: p.showroomPrice,
        // Only a genuinely higher list price is a reference price.
        referencePrice:
          p.referencePrice && p.showroomPrice && p.referencePrice > p.showroomPrice
            ? p.referencePrice
            : null,
        dimensions: p.dimensions,
        dimensionsRaw: p.dimensionsRaw,
        color: p.color,
        finish: p.finish,
        material: p.material,
        origin: p.origin,
        warranty: safeWarranty(p.warranty),
        installationType: p.installationType,
        seatType: p.seatType,
        flushType: p.flushType,
        flushVolume: p.flushVolume,
        roughIn: p.roughIn,
        technologies: p.technologies ?? [],
        shortDescription: p.shortDescription,
        // The fixture carries no commercial state, and inventing one would be
        // the exact thing this catalogue must not do.
        availability: null,
        roomStudioReady: isRoomStudioReady(p.category),
        sourceUrl: p.sourceUrl,
        sourceCheckedAt: p.sourceCheckedAt,
      };
    });

  return {
    tenantId: tenant.id,
    products,
    sourceCheckedAt: fixture.sourceCheckedAt,
    demoNotice: fixture.notice,
    withheldForImageQuality: 0,
  };
}

async function fromDatabase(tenant: TenantStorefrontConfig): Promise<Catalog> {
  const { showroomId } = tenant.catalogScope;
  const verdicts = await imageVerdicts(tenant.id);

  // A showroom tenant sells what it has offered. A tenant with no offer rows
  // yet falls back to the LivLab catalogue rather than an empty shop, but it
  // still never sees another showroom's offers or prices.
  const offers = showroomId
    ? await prisma.showroomProductOffer.findMany({
        where: { showroomId, isOffered: true },
        select: {
          productId: true,
          showroomPrice: true,
          promotionPrice: true,
          availability: true,
        },
      })
    : [];

  const offerByProduct = new Map(offers.map((o) => [o.productId, o]));

  const rows = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(offers.length > 0
        ? { id: { in: offers.map((o) => o.productId) } }
        : showroomId
          ? { OR: [{ showroomId }, { showroomId: null }] }
          : {}),
      ...(tenant.catalogScope.categories.length > 0
        ? { category: { in: tenant.catalogScope.categories } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const products: CatalogProduct[] = rows
    .filter(
      (p) =>
        p.name && p.brand && p.category && p.imageUrl && isSanitaryware(normaliseCategory(p.category) ?? '')
    )
    .map((p) => {
      const offer = offerByProduct.get(p.id);
      const verdict = verdicts.get(p.id);
      const status = (verdict?.status ?? 'ACCEPTABLE') as ImageStatus;
      const showroomPrice = offer?.promotionPrice ?? offer?.showroomPrice ?? p.priceMin ?? null;
      const reference = offer?.promotionPrice ? (offer.showroomPrice ?? p.priceMax) : p.priceMax;

      return {
        id: p.id,
        href: `/products/${p.slug ?? p.id}`,
        // The Product model has no sku column; the id is the stable code.
        sku: p.slug ?? null,
        name: p.name,
        brand: normaliseBrand(p.brand) as string,
        category: normaliseCategory(p.category) as string,
        subcategory: null,
        image: verdict?.replacementImage ?? (p.imageUrl as string),
        imageStatus: status,
        imagePresentable: !isRejected(status),
        additionalImages: [],
        technicalDrawing: null,
        showroomPrice,
        referencePrice: reference && showroomPrice && reference > showroomPrice ? reference : null,
        dimensions: null,
        dimensionsRaw: p.dimensions,
        color: null,
        finish: p.finish,
        material: p.material,
        origin: null,
        warranty: safeWarranty(p.warranty),
        installationType: null,
        seatType: null,
        flushType: null,
        flushVolume: null,
        roughIn: null,
        technologies: [],
        shortDescription: null,
        availability: offer ? (offer.availability as Availability) : null,
        roomStudioReady: isRoomStudioReady(normaliseCategory(p.category) ?? ''),
        sourceUrl: p.sourceUrl,
        sourceCheckedAt: null,
      };
    });

  return { tenantId: tenant.id, products, sourceCheckedAt: null, demoNotice: null, withheldForImageQuality: 0 };
}

/** Fixture-backed tenants, by tenant id. Everything else reads the database. */
const FIXTURE_TENANTS: Record<string, string> = {
  tungdang: 'tungdang-sanitaryware.json',
};

/**
 * The tenant's catalogue.
 *
 * `includeUnpresentable` keeps the products whose only photograph failed the
 * image audit. The storefront leaves them out: a grid is judged on its worst
 * tile, and a dealer's phone number baked into a product shot is worse than a
 * shorter catalogue. The records stay in the data for cleanup, and the count
 * of what was held back travels with the catalogue so it can be reported
 * rather than quietly lost.
 */
export async function getCatalog(
  tenant: TenantStorefrontConfig,
  { includeUnpresentable = false }: { includeUnpresentable?: boolean } = {}
): Promise<Catalog> {
  const fixture = FIXTURE_TENANTS[tenant.id];
  let catalog: Catalog;
  try {
    catalog = fixture ? await fromFixture(tenant, fixture) : await fromDatabase(tenant);
  } catch {
    // Surfaced as the error state rather than an empty catalogue.
    throw new Error('CATALOG_UNAVAILABLE');
  }

  if (includeUnpresentable) return catalog;

  const presentable = catalog.products.filter((p) => p.imagePresentable);
  return {
    ...catalog,
    products: presentable,
    withheldForImageQuality: catalog.products.length - presentable.length,
  };
}
