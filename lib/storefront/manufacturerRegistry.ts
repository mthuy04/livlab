/**
 * Which domains LivLab accepts as a manufacturer's own.
 *
 * The enrichment pipeline reads this before it opens anything. A retailer, a
 * reseller, a marketplace listing or an SEO clone is never a manufacturer
 * source, however complete its product page looks — if the domain is not
 * listed here as verified, the brand is simply not enriched.
 *
 * `verified` means someone checked the domain is the brand's own Vietnamese
 * site, and that its robots.txt permits the paths used. The three verified
 * entries are crawled through the sitemaps their robots.txt advertises; INAX
 * additionally disallows /search/ and /?s=, and neither is used.
 */

export interface ManufacturerRegistryEntry {
  canonicalBrand: string;
  aliases: string[];
  officialDomains: string[];
  country: string;
  verified: boolean;
  supportsProductPages: boolean;
  supportsTechnicalDocuments: boolean;
  supportsCad: boolean;
  supports3d: boolean;
  supportsSimulator: boolean;
  /** Why a brand is not enriched, when it is not. */
  note?: string;
}

export const MANUFACTURER_REGISTRY: ManufacturerRegistryEntry[] = [
  {
    canonicalBrand: 'TOTO',
    aliases: ['Toto', 'TOTO Vietnam'],
    officialDomains: ['vn.toto.com'],
    country: 'VN',
    verified: true,
    supportsProductPages: true,
    supportsTechnicalDocuments: true,
    supportsCad: true,
    supports3d: false,
    supportsSimulator: true,
  },
  {
    canonicalBrand: 'INAX',
    aliases: ['Inax', 'LIXIL INAX'],
    officialDomains: ['www.inax.com.vn', 'inax-vn.s3.ap-southeast-1.amazonaws.com'],
    country: 'VN',
    verified: true,
    supportsProductPages: true,
    supportsTechnicalDocuments: true,
    supportsCad: true,
    supports3d: true,
    supportsSimulator: true,
  },
  {
    canonicalBrand: 'JOMOO',
    aliases: ['Jomoo'],
    officialDomains: ['jomoo.vn', 'product.hstatic.net', 'cdn.hstatic.net'],
    country: 'VN',
    verified: true,
    supportsProductPages: true,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
  },
  // Below: present in the catalogue, but no official Vietnamese product-page
  // source has been verified yet, so nothing is ingested for them.
  {
    canonicalBrand: 'Viglacera',
    aliases: [],
    officialDomains: [],
    country: 'VN',
    verified: false,
    supportsProductPages: false,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
    note: 'Official domain not yet verified; 1 catalogue SKU.',
  },
  {
    canonicalBrand: 'Caesar',
    aliases: [],
    officialDomains: [],
    country: 'VN',
    verified: false,
    supportsProductPages: false,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
    note: 'Official domain not yet verified; 3 catalogue SKUs.',
  },
  {
    canonicalBrand: 'American Standard',
    aliases: ['AmericanStandard'],
    officialDomains: [],
    country: 'VN',
    verified: false,
    supportsProductPages: false,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
    note: 'Official domain not yet verified; 1 catalogue SKU.',
  },
  {
    canonicalBrand: 'COTTO',
    aliases: ['Cotto'],
    officialDomains: [],
    country: 'VN',
    verified: false,
    supportsProductPages: false,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
    note: 'Official domain not yet verified; 1 catalogue SKU.',
  },
  {
    canonicalBrand: 'Duravit',
    aliases: [],
    officialDomains: [],
    country: 'VN',
    verified: false,
    supportsProductPages: false,
    supportsTechnicalDocuments: false,
    supportsCad: false,
    supports3d: false,
    supportsSimulator: false,
    note: 'Official domain not yet verified; 1 catalogue SKU.',
  },
];

/**
 * Brands present in the catalogue with no manufacturer behind them — a
 * retailer house brand, or a name with no verifiable manufacturer site.
 * Never treated as a manufacturer source.
 */
export const UNVERIFIED_BRANDS = ['Bancoot', 'GLS', 'Karat', 'Premier', 'Techbath', 'Miken', 'Đình Quốc', 'CleanMax', 'Duraqua', 'Huge', 'Mowoen', 'Ariston'];

export const registryFor = (brand: string): ManufacturerRegistryEntry | undefined =>
  MANUFACTURER_REGISTRY.find(
    (e) => e.canonicalBrand.toLowerCase() === brand.toLowerCase() ||
      e.aliases.some((a) => a.toLowerCase() === brand.toLowerCase())
  );
