import type { MetadataRoute } from 'next';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import { getCatalog } from '@/lib/storefront/catalog';
import { getPublishedConcepts } from '@/lib/storefront/concepts';
import { sitemapFor } from '@/lib/seo/siteIndex';

/**
 * The sitemap of whichever storefront this host serves — built from the same
 * catalogue and concept library the pages render, so adding or removing a
 * product changes it with no further step.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const context = await resolveTenantContext();
  if (!context.indexable) return [];
  const catalog = await getCatalog(context.tenant).catch(() => null);
  const concepts = await getPublishedConcepts(context.tenant).catch(() => []);
  return sitemapFor(context, {
    products: catalog?.products ?? [],
    catalogCheckedAt: catalog?.sourceCheckedAt ?? null,
    conceptSlugs: concepts.map((c) => c.concept.slug),
  });
}
