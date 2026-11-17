import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { absoluteUrl } from '@/lib/storefront/tenantSites';

/**
 * schema.org JSON-LD, built only from facts the page itself shows.
 *
 * What is deliberately absent: ratings and reviews (none are collected here),
 * stock (no inventory feed reaches the storefront), opening hours and map
 * coordinates (not confirmed by the business). An `Offer` is emitted only
 * where the price is the business's own selling price — a catalogue of
 * manufacturer reference prices describes products, not offers.
 */

export type JsonLdObject = Record<string, unknown>;

export function websiteJsonLd(tenant: TenantStorefrontConfig, origin: string): JsonLdObject {
  const names = tenant.seo.alternateNames ?? [];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: tenant.seo.siteName ?? tenant.brand.name,
    ...(names.length ? { alternateName: names } : {}),
    url: absoluteUrl(origin, '/'),
    inLanguage: 'vi-VN',
    ...(tenant.business ? { publisher: { '@id': `${origin}/#business` } } : {}),
  };
}

export function localBusinessJsonLd(tenant: TenantStorefrontConfig, origin: string): JsonLdObject | null {
  const business = tenant.business;
  if (!business) return null;
  const logo = tenant.brand.logo ? absoluteUrl(origin, tenant.brand.logo) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': business.schemaType,
    '@id': `${origin}/#business`,
    name: business.name,
    url: absoluteUrl(origin, '/'),
    telephone: business.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.streetAddress,
      addressLocality: business.locality,
      addressCountry: business.country,
    },
    ...(logo ? { logo, image: logo } : {}),
    ...(business.sameAs.length ? { sameAs: business.sameAs } : {}),
  };
}

export function breadcrumbJsonLd(origin: string, crumbs: { name: string; path: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(origin, crumb.path),
    })),
  };
}

export interface ProductJsonLdInput {
  origin: string;
  path: string;
  name: string;
  brand: string | null;
  sku: string | null;
  category: string | null;
  description: string | null;
  images: string[];
  /** Only the business's own selling price. Omit for reference prices. */
  offerPrice?: number | null;
}

export function productJsonLd(input: ProductJsonLdInput): JsonLdObject {
  const url = absoluteUrl(input.origin, input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url,
    ...(input.brand ? { brand: { '@type': 'Brand', name: input.brand } } : {}),
    ...(input.sku ? { sku: input.sku, mpn: input.sku } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.images.length
      ? { image: input.images.map((src) => (src.startsWith('http') ? src : absoluteUrl(input.origin, src))) }
      : {}),
    ...(input.offerPrice && input.offerPrice > 0
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: input.offerPrice,
            priceCurrency: 'VND',
            seller: { '@id': `${input.origin}/#business` },
          },
        }
      : {}),
  };
}

/** JSON for a <script> body. `<` is escaped so no string in the data can close the tag. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
