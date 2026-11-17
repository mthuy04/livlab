import type { MetadataRoute } from 'next';
import { LIVLAB_TENANT } from '@/lib/storefront/tenantConfig';
import { absoluteUrl, type SiteContext } from '@/lib/storefront/tenantSites';

/**
 * robots.txt and sitemap.xml, per host.
 *
 * Pure: the route files resolve the request's context and catalogue and hand
 * them in, so the rules here can be tested without a server.
 */

/**
 * Never useful in search and not meant for strangers. Pages that are merely
 * personal — the quote basket, the lookup, login — are NOT listed: they carry
 * `noindex`, and a crawler that is blocked from a page cannot read its noindex.
 * `/showroom$` and `/showroom/` rather than `/showroom`, which would also
 * block LivLab's public `/showrooms`.
 */
export const PRIVATE_PATHS = ['/api/', '/admin', '/showroom$', '/showroom/', '/dev', '/image-check', '/s/'];

export function robotsFor(context: SiteContext): MetadataRoute.Robots {
  if (!context.indexable) {
    // Crawlable so every page's noindex is seen; no sitemap to advertise.
    return { rules: [{ userAgent: '*', allow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE_PATHS }],
    sitemap: absoluteUrl(context.origin, '/sitemap.xml'),
  };
}

export interface SitemapInput {
  products: { id: string; category: string | null }[];
  /** When the catalogue was last checked against its sources, if known. */
  catalogCheckedAt: string | null;
  conceptSlugs: string[];
}

export function sitemapFor(context: SiteContext, input: SitemapInput): MetadataRoute.Sitemap {
  if (!context.indexable) return [];
  const { tenant, origin } = context;
  const at = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({
    url: absoluteUrl(origin, path),
    ...extra,
  });
  const catalogModified = input.catalogCheckedAt ? new Date(input.catalogCheckedAt) : undefined;
  const entries: MetadataRoute.Sitemap = [at('/', { changeFrequency: 'weekly', priority: 1 })];

  if (input.products.length > 0) {
    entries.push(at('/products', { changeFrequency: 'weekly', priority: 0.8, lastModified: catalogModified }));
    const categories = [...new Set(input.products.map((p) => p.category).filter((c): c is string => Boolean(c)))];
    for (const category of categories) {
      entries.push(
        at(`/products?category=${encodeURIComponent(category)}`, {
          changeFrequency: 'weekly',
          priority: 0.7,
          lastModified: catalogModified,
        })
      );
    }
    // Product pages only where they are indexable: a tenant publishing its
    // own catalogue. LivLab's reference library stays out, as its pages do.
    if (tenant.site?.indexProducts || tenant.catalogScope.showroomId) {
      for (const product of input.products) {
        entries.push(
          at(`/products/${encodeURIComponent(product.id)}`, {
            changeFrequency: 'monthly',
            priority: 0.6,
            lastModified: catalogModified,
          })
        );
      }
    }
  }

  if (input.conceptSlugs.length > 0) {
    entries.push(at('/concepts', { changeFrequency: 'monthly', priority: 0.6 }));
    for (const slug of input.conceptSlugs) {
      entries.push(at(`/concepts/${encodeURIComponent(slug)}`, { changeFrequency: 'monthly', priority: 0.5 }));
    }
  }

  if (tenant.features.roomStudio) entries.push(at('/room-studio', { changeFrequency: 'monthly', priority: 0.5 }));
  if (tenant.business) entries.push(at('/contact', { changeFrequency: 'yearly', priority: 0.6 }));
  if (tenant.id === LIVLAB_TENANT.id) {
    entries.push(at('/about', { changeFrequency: 'yearly', priority: 0.4 }), at('/blog', { changeFrequency: 'weekly', priority: 0.4 }));
  }
  return entries;
}
