import type { MetadataRoute } from 'next';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import { robotsFor } from '@/lib/seo/siteIndex';

// Per host: reading the request's host makes this a request-time route.
export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsFor(await resolveTenantContext());
}
