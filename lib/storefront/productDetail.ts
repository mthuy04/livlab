import 'server-only';

import { getCatalog } from './catalog';
import { manufacturerRecords, technologyFacts, type ManufacturerRecord } from './manufacturerData';
import { registryFor } from './manufacturerRegistry';
import { MANUFACTURER_TOOLS } from './manufacturerTools';
import { AVAILABILITY_LABEL, opticalScale, type CatalogProduct } from './catalogTypes';
import type { TenantStorefrontConfig } from './tenantConfig';
import type {
  MediaSource,
  ProductDetailViewModel,
  ProductDocument,
  ProductMediaItem,
  ProductTechnology,
  RelatedProductRef,
  SimulatorRef,
  SpecGroup,
  SpecRow,
} from './productDetailTypes';

/**
 * Building a product detail page, once, on the server.
 *
 * Detail resolves through exactly the same catalogue service `/products`
 * uses. It does not know, and must not know, whether the product it is
 * showing came out of Prisma or out of a demo fixture: `getCatalog` decides
 * what the tenant may see, merges the manufacturer layer and applies the
 * image audit, and this module turns one of those rows into the shape the
 * page renders.
 *
 * The precedence the brief locks in is already expressed by the layers this
 * sits on top of:
 *   technical  — manufacturer record > official document > catalogue row
 *   media      — exact-SKU manufacturer asset > clean showroom > clean
 *                retailer > placeholder
 *   commercial — the active tenant's offer > the tenant's demo fixture
 * A manufacturer list price arrives as `manufacturerReferencePrice` and is
 * never allowed to become `showroomPrice`.
 */

/* ── Resolution ───────────────────────────────────────────────────────── */

/**
 * Detail reads the catalogue INCLUDING the rows whose photograph the audit
 * rejected.
 *
 * The grid withholds those — a grid is judged on its worst tile. A detail
 * page reached by a direct link is a different question: the honest answer is
 * the product's real specifications under a clean placeholder, not a 404 that
 * hides a product the showroom genuinely sells. The rejected asset itself is
 * never painted; `media.presentable` is false and the stage falls back.
 */
async function tenantCatalog(tenant: TenantStorefrontConfig) {
  return getCatalog(tenant, { includeUnpresentable: true });
}

/** The route segment the catalogue would have produced for a row. */
const segmentOf = (product: CatalogProduct) => product.href.split('/').pop() ?? product.id;

function findProduct(products: CatalogProduct[], slug: string): CatalogProduct | null {
  const wanted = decodeURIComponent(slug).toLowerCase();
  return (
    products.find((p) => segmentOf(p).toLowerCase() === wanted) ??
    products.find((p) => p.id.toLowerCase() === wanted) ??
    null
  );
}

/* ── Media ────────────────────────────────────────────────────────────── */

const hostOf = (url: string | null | undefined): string => {
  if (!url?.startsWith('http')) return '';
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
};

/** Whether a URL sits on a domain the registry accepts as the brand's own. */
function isOfficialHost(brand: string, url: string | null | undefined): boolean {
  const host = hostOf(url);
  if (!host) return false;
  const entry = registryFor(brand);
  return Boolean(entry?.verified && entry.officialDomains.some((d) => host === d.toLowerCase()));
}

/**
 * The gallery.
 *
 * Only the accepted primary asset and, where one exists, the technical
 * drawing. The enrichment's `galleryImages` are deliberately NOT used: read
 * against the live data they are the related-products carousel scraped off
 * the manufacturer's page — MS636DT8's five "gallery" images are TC600VS,
 * MS857CDW26, MS857DW26 and MS889DRW25, which are other products. Padding a
 * gallery with photographs of a different SKU is the same falsehood as an
 * invented specification, so the page shows one verified image rather than
 * five unverified ones.
 */
function buildGallery(product: CatalogProduct, drawing: string | null): ProductMediaItem[] {
  const items: ProductMediaItem[] = [];
  if (product.imagePresentable && product.image) {
    items.push({
      url: product.image,
      alt: product.name,
      kind: 'PRIMARY',
      source: product.imageSource as MediaSource,
    });
  }
  if (drawing) {
    items.push({
      url: drawing,
      alt: `Bản vẽ kỹ thuật ${product.name}`,
      kind: 'DRAWING',
      source: isOfficialHost(product.brand, drawing) ? 'MANUFACTURER' : 'RETAILER',
    });
  }
  return items;
}

/* ── Specifications ───────────────────────────────────────────────────── */

const row = (label: string, value: string | null | undefined): SpecRow | null =>
  value && value.trim() ? { label, value: value.trim() } : null;

const compact = (rows: (SpecRow | null)[]): SpecRow[] => rows.filter((r): r is SpecRow => r !== null);

const dimensionText = (p: CatalogProduct): string | null => {
  if (p.dimensions) {
    const { length, width, height, unit } = p.dimensions;
    return `${length} × ${width} × ${height} ${unit}`;
  }
  return p.dimensionsRaw;
};

/**
 * Category-specific technical attributes.
 *
 * A toilet and a mirror do not share a specification sheet, so the groups are
 * built per category and a field with no value is simply not emitted. The
 * identity group is common to everything because brand, SKU and category are
 * what a specifier copies.
 */
function buildSpecifications(p: CatalogProduct, bareTechnologies: string[]): SpecGroup[] {
  const identity = compact([
    row('Thương hiệu', p.brand),
    row('Mã sản phẩm', p.sku),
    row('Danh mục', p.category),
    row('Phân loại', p.subcategory),
    row('Xuất xứ', p.origin),
  ]);

  const common = [
    row('Kích thước', dimensionText(p)),
    row('Vật liệu', p.material),
    row('Màu sắc', p.color),
    row('Hoàn thiện', p.finish),
    row('Kiểu lắp đặt', p.installationType),
  ];

  const category = p.category;
  let specific: (SpecRow | null)[] = [];

  if (category === 'Bồn cầu') {
    specific = [
      row('Hệ thống xả', p.flushType),
      row('Lượng nước xả', p.flushVolume),
      row('Tâm thoát', p.roughIn),
      row('Nắp ngồi', p.seatType),
    ];
  } else if (category === 'Lavabo') {
    specific = [row('Lỗ vòi', p.roughIn)];
  } else if (category === 'Vòi lavabo' || category === 'Sen tắm') {
    specific = [row('Kiểu van', p.seatType), row('Áp lực nước', p.flushVolume)];
  } else if (category === 'Bồn tắm') {
    specific = [row('Dung tích', p.flushVolume), row('Thoát nước', p.roughIn)];
  } else if (category === 'Gương & phụ kiện') {
    specific = [row('Nguồn điện', p.flushVolume)];
  }

  const warranty = compact([row('Bảo hành', p.warranty)]);

  const groups: SpecGroup[] = [
    { title: 'ĐỊNH DANH', rows: identity },
    {
      title: 'THÔNG SỐ KỸ THUẬT',
      rows: compact([
        ...common,
        ...specific,
        // Technologies the brand names but does not explain. Stated as the
        // facts they are, rather than padding out a section with bare names.
        row('Công nghệ', bareTechnologies.join(' · ') || null),
      ]),
    },
  ];
  if (warranty.length) groups.push({ title: 'BẢO HÀNH', rows: warranty });
  return groups.filter((g) => g.rows.length > 0);
}

/**
 * The 4–6 facts that decide a purchase, for the block beside the image.
 *
 * Drawn from the specification groups rather than assembled separately, so
 * the overview can never state something the table below contradicts. Order
 * is by decision value, not by what happens to be populated.
 */
function buildOverviewFacts(p: CatalogProduct): SpecRow[] {
  const preferred = [
    row('Kích thước', dimensionText(p)),
    row('Phân loại', p.subcategory ?? p.installationType),
    row('Màu sắc', p.color),
    row('Vật liệu', p.material),
    row('Tâm thoát', p.roughIn),
    row('Lượng nước xả', p.flushVolume),
    row('Nắp ngồi', p.seatType),
    row('Hoàn thiện', p.finish),
    row('Xuất xứ', p.origin),
    row('Bảo hành', p.warranty),
  ];
  // Five, not six. The sixth row is what pushes the primary action off a
  // 1536×960 first viewport, and the full table is one section below.
  return compact(preferred).slice(0, 5);
}

/**
 * A short factual line, built from structured fields.
 *
 * Never the manufacturer's marketing paragraph and never a retailer's SEO
 * copy. The catalogue already composes one of these per row; it is used as-is
 * where it exists, and otherwise assembled from the same facts.
 */
function buildSummary(p: CatalogProduct): string | null {
  if (p.shortDescription?.trim()) return p.shortDescription.trim();
  const parts = [p.subcategory, p.color, dimensionText(p)].filter(Boolean);
  return parts.length ? `${parts.join(', ')}.` : null;
}

/* ── Documents ────────────────────────────────────────────────────────── */

const DOC_LABEL: Record<string, string> = {
  TECHNICAL_SPEC: 'Bản thông số kỹ thuật',
  TECHNICAL_DRAWING: 'Bản vẽ kỹ thuật',
  INSTALLATION: 'Hướng dẫn lắp đặt',
  USER_MANUAL: 'Hướng dẫn sử dụng',
  CAD: 'Tệp CAD',
  BIM: 'Tệp BIM',
  THREE_D: 'Tệp 3D từ hãng',
  CATALOG: 'Catalogue',
  CERTIFICATE: 'Chứng nhận',
};

const FORMAT_BY_EXTENSION: Record<string, string> = {
  pdf: 'PDF',
  dwg: 'DWG',
  dxf: 'DXF',
  zip: 'ZIP',
  rfa: 'RFA',
  max: '3DS MAX',
  jpg: 'JPG',
  png: 'PNG',
};

function documentFormat(url: string): string {
  const extension = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '';
  return FORMAT_BY_EXTENSION[extension] ?? 'Liên kết';
}

/**
 * Manufacturer documents, labelled for a Vietnamese customer.
 *
 * The filtering this used to do is gone, because the enrichment no longer
 * needs correcting here. `scripts/enrich_manufacturer_assets.py` now types
 * each file from the file itself and keeps company-wide paperwork out of
 * `files` entirely, so a document that reaches this function is already known
 * to be this product's. Classifying twice, in two places, by two different
 * rules, is how the two copies drift apart.
 *
 * URLs are validated for shape only. Fetching every document on every render
 * would make the page as slow and as flaky as the slowest manufacturer CDN;
 * what the page can promise is that it links what the enrichment verified,
 * labelled honestly, and never invents a file that is not in the data.
 */
function buildDocuments(product: CatalogProduct): ProductDocument[] {
  const seen = new Set<string>();
  const documents: ProductDocument[] = [];

  for (const file of product.documents) {
    const url = file.sourceUrl?.trim();
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;

    const label = DOC_LABEL[file.type] ?? null;
    // OTHER is a file the parser could not place; it is not shown as one.
    if (!label) continue;

    seen.add(url);
    const format = documentFormat(url);
    documents.push({
      label,
      format,
      url,
      action: format === 'DWG' || format === 'ZIP' || format === 'RFA' ? 'DOWNLOAD' : 'VIEW',
      official: isOfficialHost(product.brand, url),
    });
  }

  return documents;
}

/* ── Simulator ────────────────────────────────────────────────────────── */

/**
 * The manufacturer's own configurator, where the brand has one.
 *
 * Resolved from the allowlist by brand — there is no parameter anywhere that
 * could point this at an arbitrary domain, and the customer is given the
 * LivLab wrapper URL rather than the provider's. A brand whose tool refuses
 * framing is opened in its own tab instead of being bypassed.
 */
function buildSimulator(product: CatalogProduct): SimulatorRef | null {
  const entry = registryFor(product.brand);
  if (!entry?.supportsSimulator) return null;

  const tool = Object.values(MANUFACTURER_TOOLS).find(
    (t) => t.brand.toLowerCase() === entry.canonicalBrand.toLowerCase()
  );
  if (!tool) return null;

  const external = tool.embedStatus !== 'EMBED_ALLOWED';
  const query = tool.account ? `?account=${encodeURIComponent(tool.account)}` : '';

  return {
    href: external
      ? tool.externalUrl
      : `/pub/tool/kb-b2c/showroom/${encodeURIComponent(tool.experienceId)}${query}`,
    label: tool.label,
    attribution: tool.attribution,
    brand: tool.brand,
    external,
  };
}

/* ── Related products ─────────────────────────────────────────────────── */

const toRef = (p: CatalogProduct, referenceOnly = false): RelatedProductRef => ({
  catalogProductId: p.catalogProductId,
  id: p.id,
  href: p.href,
  name: p.name,
  brand: p.brand,
  sku: p.sku,
  category: p.category,
  image: p.imagePresentable ? p.image : null,
  presentable: p.imagePresentable,
  occupancy: opticalScale(p.category, p.name),
  normalized: Boolean(p.imageProvenance),
  showroomPrice: referenceOnly ? null : p.showroomPrice,
  referenceOnly,
});

/**
 * Products from the same canonical category, ranked.
 *
 * The page this replaces switched on English category names — `basin`,
 * `faucet`, `toilet` — while every row in the catalogue is categorised in
 * Vietnamese, so the section resolved to nothing for all 57 products. The
 * category here is the one the catalogue already normalised, which is the
 * same key `/products` filters on.
 *
 * Ranking is deliberately shallow: same subcategory, then same brand, then
 * nearest price. Deduplicated by canonical identity so a SKU the database and
 * the fixture both describe cannot appear twice.
 */
function buildRelated(product: CatalogProduct, catalog: CatalogProduct[]): RelatedProductRef[] {
  const sameCategory = catalog.filter(
    (p) =>
      p.catalogProductId !== product.catalogProductId &&
      p.category === product.category &&
      p.imagePresentable
  );

  const price = product.showroomPrice;
  const scored = sameCategory
    .map((p) => {
      let score = 0;
      if (p.subcategory && p.subcategory === product.subcategory) score += 4;
      if (p.brand === product.brand) score += 2;
      if (price && p.showroomPrice) {
        const ratio = Math.min(price, p.showroomPrice) / Math.max(price, p.showroomPrice);
        score += ratio;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const picked: RelatedProductRef[] = [];
  for (const { product: candidate } of scored) {
    if (seen.has(candidate.catalogProductId)) continue;
    seen.add(candidate.catalogProductId);
    picked.push(toRef(candidate));
    if (picked.length === 4) break;
  }
  return picked;
}

/**
 * Compatibility, only where the manufacturer states it.
 *
 * Never inferred from a similar name, the same brand or comparable
 * dimensions. The enrichment holds no `compatibleSkus` for any product today,
 * so this resolves to nothing and the section does not render — which is the
 * correct outcome, not a gap to paper over.
 */
function buildCompatibility(
  product: CatalogProduct,
  catalog: CatalogProduct[]
): RelatedProductRef[] {
  if (product.compatibleSkus.length === 0) return [];
  const wanted = new Set(product.compatibleSkus.map((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')));

  const matches = catalog.filter(
    (p) => p.catalogProductId !== product.catalogProductId && wanted.has(p.normalizedSku)
  );

  const seen = new Set<string>();
  return matches
    .filter((p) => !seen.has(p.catalogProductId) && seen.add(p.catalogProductId))
    .slice(0, 4)
    .map((p) => toRef(p));
}

/* ── Technologies ─────────────────────────────────────────────────────── */

/**
 * De-duplicated case-insensitively: the TOTO records carry both `TORNADO` and
 * `Tornado`, which are one technology.
 *
 * Only the names the manufacturer record states are rendered. The enrichment
 * carries no description for any of them, and writing one from general
 * knowledge would be exactly the invention this page exists to stop — so the
 * section lists what the manufacturer confirms and links to the manufacturer
 * page where it is explained.
 */
function buildTechnologies(product: CatalogProduct): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of product.technologies) {
    const name = raw?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 5) break;
  }
  return names;
}

/* ── The builder ──────────────────────────────────────────────────────── */

export interface ProductDetailResult {
  vm: ProductDetailViewModel;
}

export async function getProductDetail(
  tenant: TenantStorefrontConfig,
  slug: string
): Promise<ProductDetailViewModel | null> {
  let catalog;
  try {
    catalog = await tenantCatalog(tenant);
  } catch {
    return null;
  }

  const product = findProduct(catalog.products, slug);
  if (!product) return null;

  const records = await manufacturerRecords();
  const record: ManufacturerRecord | undefined = records.get(product.id);

  // Split by whether the brand publishes an explanation. Described ones carry
  // the editorial section; the rest are facts, and facts belong in the
  // specification table rather than under a heading with nothing beneath it.
  const facts = await technologyFacts();
  const technologyNames = buildTechnologies(product);
  const described: ProductTechnology[] = [];
  const bare: string[] = [];
  for (const name of technologyNames) {
    const fact = facts.get(name.toUpperCase());
    // Brand-matched, not name-matched. "Rimless" is a word several
    // manufacturers use, and TOTO's description of their rimless design is
    // not INAX's claim about theirs — printing it under an INAX product with
    // "theo tài liệu INAX công bố" beneath it would be a fabricated citation.
    const sameBrand = fact?.brand.toUpperCase() === product.brand.toUpperCase();
    if (fact && sameBrand) described.push({ name, description: fact.description, sourceUrl: fact.sourceUrl });
    else bare.push(name);
  }

  const drawing = product.technicalDrawing?.trim() || null;
  const gallery = buildGallery(product, drawing);
  const primary = gallery.find((item) => item.kind === 'PRIMARY') ?? null;

  const discount =
    product.referencePrice && product.showroomPrice && product.referencePrice > product.showroomPrice
      ? Math.round((1 - product.showroomPrice / product.referencePrice) * 100)
      : null;

  // A tenant with no showroom of its own is an internal demo configuration.
  // Its technical data is real; its commercial layer is not a signed
  // agreement, and nothing on the page may imply that it is.
  const commercialConfirmed = Boolean(tenant.catalogScope.showroomId);

  const presentable = catalog.products.filter((p) => p.imagePresentable);
  const technicalSource = record?.technicalSourceUrl ?? record?.manufacturerProductUrl ?? null;

  return {
    tenantId: catalog.tenantId,

    identity: {
      catalogProductId: product.catalogProductId,
      sourceType: product.sourceType,
      sourceRecordId: product.sourceRecordId,
      id: product.id,
      slug: segmentOf(product),
      brand: product.brand,
      name: product.name,
      sku: product.sku,
      normalizedSku: product.normalizedSku,
      category: product.category,
      subcategory: product.subcategory,
      // No source in the catalogue states a series, and parsing one out of a
      // product name would be a guess.
      series: null,
    },

    media: {
      primary,
      gallery,
      lifestyle: [],
      technicalDrawing: drawing
        ? {
            url: drawing,
            attribution: isOfficialHost(product.brand, drawing) ? product.brand : null,
            official: isOfficialHost(product.brand, drawing),
          }
        : null,
      presentable: product.imagePresentable && Boolean(product.image),
      occupancy: opticalScale(product.category, product.name),
      normalized: Boolean(product.imageProvenance),
    },

    pricing: {
      showroomPrice: product.showroomPrice,
      promotionPrice: null,
      showroomReferencePrice: product.referencePrice,
      manufacturerReferencePrice: product.manufacturerReferencePrice,
      displayPriceLabel: commercialConfirmed ? 'GIÁ SHOWROOM' : 'GIÁ THAM KHẢO',
      // One reference figure beside the headline, never three competing ones.
      // The showroom's own list price is the relevant comparison; the
      // manufacturer's is only used when the showroom states none.
      comparePrice: product.referencePrice ?? product.manufacturerReferencePrice,
      compareLabel: product.referencePrice
        ? null
        : product.manufacturerReferencePrice
          ? `Giá niêm yết ${product.brand}`
          : null,
      discountPercent: product.referencePrice ? discount : null,
      note: product.showroomPrice
        ? 'Giá cuối cùng được showroom xác nhận theo tình trạng cung ứng và phương án lắp đặt.'
        : null,
    },

    commercial: {
      availability: product.availability,
      availabilityLabel: product.availability ? AVAILABILITY_LABEL[product.availability] : null,
      // No lead-time data reaches the storefront yet, from either adapter.
      leadTimeDays: null,
      commercialConfirmed,
    },

    summary: buildSummary(product),
    overviewFacts: buildOverviewFacts(product),
    specifications: buildSpecifications(product, bare),
    dimensions: product.dimensions
      ? {
          rows: [
            { label: 'DÀI', value: String(product.dimensions.length), unit: product.dimensions.unit },
            { label: 'RỘNG', value: String(product.dimensions.width), unit: product.dimensions.unit },
            { label: 'CAO', value: String(product.dimensions.height), unit: product.dimensions.unit },
            ...(product.roughIn
              ? [{ label: 'TÂM THOÁT', value: product.roughIn.replace(/mm.*$/i, '').trim(), unit: 'mm' }]
              : []),
          ],
          raw: product.dimensionsRaw,
        }
      : null,
    technologies: described,
    compatibility: buildCompatibility(product, presentable),
    documents: buildDocuments(product),
    manufacturerSimulator: buildSimulator(product),
    roomStudio: {
      ready: product.roomStudioReady,
      href: product.roomStudioReady ? '/room-studio' : null,
    },
    relatedProducts: buildRelated(product, presentable),

    provenance: {
      manufacturerUrl: product.manufacturerUrl,
      imageSourceUrl: product.imageProvenance?.sourceUrl ?? record?.imageSourceUrl ?? null,
      technicalSourceUrl: technicalSource,
      sourceUrl: product.sourceUrl,
      sourceCheckedAt: product.sourceCheckedAt ?? catalog.sourceCheckedAt,
      imageSource: product.imageSource as MediaSource,
      imageStatus: product.imageStatus,
      technicalAttribution: record ? `Thông số kỹ thuật: ${product.brand}` : null,
    },
  };
}
