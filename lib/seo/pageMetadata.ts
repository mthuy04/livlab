import type { Metadata } from 'next';
import { LIVLAB_TENANT } from '@/lib/storefront/tenantConfig';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';

/**
 * Metadata for a page that belongs to LivLab itself — its pitch to showrooms,
 * its guides, its policies.
 *
 * On LivLab it is canonical at `path`. On a showroom's storefront the page
 * still renders, but it is not indexed: a LivLab sales page or a LivLab
 * article must not become a search result on giangson.livlab.space, nor
 * compete with the same page on www.livlab.space.
 */
export async function livlabPageMetadata(path: string, base: Metadata): Promise<Metadata> {
  const { tenant } = await resolveTenantContext();
  if (tenant.id !== LIVLAB_TENANT.id) return { ...base, robots: { index: false, follow: true } };
  return { ...base, alternates: { canonical: path } };
}
