import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '@/lib/prisma';
import type { TenantStorefrontConfig } from './tenantConfig';
import { imageVerdicts, isRejected, type ImageStatus } from './imageQuality';
import { manufacturerRecords, type ImageSource, type ManufacturerRecord } from './manufacturerData';
import { imageAssets } from './imageAssets';
import {
  catalogIdentity,
  isRoomStudioReady,
  isSanitaryware,
  normaliseBrand,
  normalizeSku,
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

// Keyed by file: with more than one fixture tenant, a single slot would hand
// whichever catalogue a warm server loaded first to every tenant after it.
const fixtureCache = new Map<string, DemoFixture>();

async function loadFixture(file: string): Promise<DemoFixture | null> {
  const cached = fixtureCache.get(file);
  if (cached) return cached;
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'demo', file), 'utf8');
    const fixture = JSON.parse(raw) as DemoFixture;
    fixtureCache.set(file, fixture);
    return fixture;
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
      const brand = normaliseBrand(p.brand) as string;
      const normalizedSku = normalizeSku(p.sku);
      return {
        id,
        catalogProductId: catalogIdentity({
          sourceType: 'DEMO_FIXTURE',
          sourceRecordId: id,
          tenantId: tenant.id,
          brand,
          sku: p.sku,
          name: p.name,
        }),
        sourceType: 'DEMO_FIXTURE' as const,
        sourceRecordId: id,
        normalizedSku,
        href: `/products/${id}`,
        sku: p.sku,
        name: p.name,
        brand,
        category: p.category,
        subcategory: p.subcategory,
        // The audit may have found a cleaner sibling than the one the
        // importer picked; prefer it.
        image: verdict?.replacementImage ?? (p.primaryImage as string),
        imageStatus: status,
        imagePresentable: !isRejected(status),
        imageSource: 'RETAILER' as ImageSource,
        manufacturerUrl: null,
        manufacturerReferencePrice: null,
        documents: [],
        galleryImages: [],
        compatibleSkus: [],
        imageProvenance: null,
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
        roomStudioReady: isRoomStudioReady({ id, sku: p.sku, normalizedSku }),
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

      // The Product model has no sku column; the slug carries the code.
      const sku = p.slug ?? null;
      const normalizedSku = normalizeSku(sku);
      const brand = normaliseBrand(p.brand) as string;

      return {
        id: p.id,
        catalogProductId: catalogIdentity({
          sourceType: 'DATABASE',
          sourceRecordId: p.id,
          tenantId: tenant.id,
          brand,
          sku,
          name: p.name,
        }),
        sourceType: 'DATABASE' as const,
        sourceRecordId: p.id,
        normalizedSku,
        href: `/products/${p.slug ?? p.id}`,
        sku,
        name: p.name,
        brand,
        category: normaliseCategory(p.category) as string,
        subcategory: null,
        image: verdict?.replacementImage ?? (p.imageUrl as string),
        imageStatus: status,
        imagePresentable: !isRejected(status),
        imageSource: 'RETAILER' as ImageSource,
        manufacturerUrl: null,
        manufacturerReferencePrice: null,
        documents: [],
        galleryImages: [],
        compatibleSkus: [],
        imageProvenance: null,
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
        roomStudioReady: isRoomStudioReady({ id: p.id, sku, normalizedSku }),
        sourceUrl: p.sourceUrl,
        sourceCheckedAt: null,
      };
    });

  return { tenantId: tenant.id, products, sourceCheckedAt: null, demoNotice: null, withheldForImageQuality: 0 };
}


/**
 * Fold manufacturer data onto a catalogue row.
 *
 * Technical facts from the manufacturer win where they exist, because that is
 * what a manufacturer is the source of truth for. Commercial facts do not move
 * at all: `showroomPrice` and `referencePrice` stay exactly as the showroom
 * set them, and a manufacturer list price lands beside them.
 */
function withManufacturer(product: CatalogProduct, record: ManufacturerRecord | undefined): CatalogProduct {
  if (!record) {
    const host = product.image?.startsWith('http') ? product.image.split('/')[2] : '';
    const source: ImageSource = !product.image
      ? 'PLACEHOLDER'
      : /(^|\.)inax\.com\.vn$|^inax-vn\.s3[\w.-]*amazonaws\.com$|^vn\.toto\.com$/.test(host)
        ? 'MANUFACTURER'
        : /luxbath\.vn|beptungdang\.vn/.test(host)
          ? 'SHOWROOM'
          : host
            ? 'RETAILER'
            : 'PLACEHOLDER';
    return { ...product, imageSource: source };
  }

  const specs = record.technicalSpecs ?? {};
  const image = record.primaryImage ?? product.image;

  return {
    ...product,
    image,
    imageSource: record.primaryImage ? 'MANUFACTURER' : product.imageSource,
    name: product.name,
    dimensionsRaw: specs.dimensions ?? product.dimensionsRaw,
    color: specs.color ?? product.color,
    finish: specs.finish ?? product.finish,
    material: specs.material ?? product.material,
    flushType: specs.flushSystem ?? product.flushType,
    flushVolume: specs.flushVolume ?? product.flushVolume,
    roughIn: specs.roughIn ?? product.roughIn,
    seatType: specs.seatType ?? product.seatType,
    technologies: record.technologies?.length ? record.technologies : product.technologies,
    manufacturerUrl: record.manufacturerProductUrl ?? null,
    manufacturerReferencePrice: record.manufacturerReferencePrice ?? null,
    documents: record.files ?? [],
    galleryImages: record.galleryImages ?? [],
    compatibleSkus: record.compatibleSkus ?? [],
    // The manufacturer's own drawing wins over the retailer's. The retailer
    // copies are re-hosted and some have since 404'd — INAX AC-900VRN-2's is
    // one — while the enrichment verified this URL on the brand's own page
    // under a heading naming this SKU.
    technicalDrawing: record.technicalDrawing ?? product.technicalDrawing,
  };
}

/** Fixture-backed tenants, by tenant id. Everything else reads the database. */
const FIXTURE_TENANTS: Record<string, string> = {
  tungdang: 'tungdang-sanitaryware.json',
  giangson: 'giangson-sanitaryware.json',
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

  // Manufacturer data is merged before anything is filtered, so a product
  // rescued by an official photograph is judged on that photograph.
  const records = await manufacturerRecords();
  const assets = await imageAssets();
  catalog = {
    ...catalog,
    products: catalog.products.map((p) => {
      const enriched = withManufacturer(p, records.get(p.id));
      // The trimmed local copy is what the grid shows; the original stays in
      // provenance so the asset can be traced and swapped later.
      const asset = assets.get(p.id);
      if (!asset?.localPath) return enriched;
      return {
        ...enriched,
        image: asset.localPath,
        imageProvenance: {
          sourceUrl: asset.provenance?.imageSourceUrl ?? enriched.image,
          assetOwner: asset.provenance?.assetOwner ?? enriched.brand,
          sourceType: asset.provenance?.sourceType ?? enriched.imageSource,
          processing: asset.processing ?? [],
        },
      };
    }),
  };

  if (includeUnpresentable) return catalog;

  const presentable = catalog.products.filter((p) => p.imagePresentable);
  return {
    ...catalog,
    products: presentable,
    withheldForImageQuality: catalog.products.length - presentable.length,
  };
}
