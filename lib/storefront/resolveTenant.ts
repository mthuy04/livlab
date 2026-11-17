import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { TENANTS, type TenantStorefrontConfig } from './tenantConfig';
import { themeCssVars } from './tenantExperience';
import { normalizeHost, siteContext, type SiteContext } from './tenantSites';
import { tenantFont } from './tenantFonts';

/**
 * Decides which storefront a request is looking at.
 *
 * Runs on the server so the first paint already carries the tenant's branding;
 * resolving on the client would flash LivLab's identity before a showroom's,
 * which is precisely what a white-label product must never do.
 *
 * Resolution order: the request's hostname first — a showroom's own domain
 * always serves that showroom — then the preview choice, which only applies
 * on LivLab's hosts, then LivLab itself. The mapping lives in each tenant's
 * `site.hosts`; see `tenantSites.ts`.
 */

export const TENANT_PREVIEW_COOKIE = 'livlab_tenant_preview';

/**
 * Whether the internal preview switch is usable here.
 *
 * Off in production unless explicitly enabled, so a customer can never land on
 * another showroom's branding by editing a URL.
 */
export function tenantPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_TENANT_PREVIEW === 'true'
  );
}

/**
 * The preview choice, set by /dev/tenant and stored in a cookie.
 *
 * A cookie rather than a query parameter because a root layout never receives
 * searchParams — only pages do — so a query string cannot reach this function.
 */
async function previewTenant(): Promise<TenantStorefrontConfig | null> {
  let slug: string | null = null;
  try {
    slug = (await cookies()).get(TENANT_PREVIEW_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
  if (!slug) return null;

  const tenant = TENANTS[slug];
  if (!tenant) return null;

  // A storefront marked `publicDemo` exists in order to be shown, so it is
  // honoured wherever it is opened — that is what `/s/<slug>` hands out.
  // Everything else is an internal switch and stays behind the dev gate: a
  // tenant backed by a live showroom carries that showroom's prices, and a
  // customer must never reach them by holding someone else's cookie.
  if (tenant.publicDemo) return tenant;
  return tenantPreviewEnabled() ? tenant : null;
}

async function requestHost(): Promise<string | null> {
  try {
    // `host`, not `x-forwarded-host`: on Vercel a request only reaches this
    // deployment through a domain attached to it, and that is what `host` says.
    return normalizeHost((await headers()).get('host'));
  } catch {
    // headers() is unavailable in some rendering contexts; LivLab's own
    // storefront, unindexed, is the safe answer there.
    return null;
  }
}

/**
 * Fills a tenant's contact block from its Showroom record.
 *
 * Contact details belong to the showroom and change without a deploy, so they
 * are read rather than configured. A field the showroom has not filled in stays
 * absent and the footer omits that line — an empty address is better than a
 * placeholder one.
 */
async function withShowroomContact(
  tenant: TenantStorefrontConfig
): Promise<TenantStorefrontConfig> {
  const showroomId = tenant.catalogScope.showroomId;
  if (!showroomId) return tenant;

  try {
    const showroom = await prisma.showroom.findUnique({
      where: { id: showroomId },
      select: { name: true, phone: true, email: true, address: true },
    });
    if (!showroom) return tenant;

    return {
      ...tenant,
      brand: { ...tenant.brand, name: showroom.name || tenant.brand.name },
      contact: {
        phone: showroom.phone ?? undefined,
        email: showroom.email ?? undefined,
        address: showroom.address ?? undefined,
      },
    };
  } catch {
    // A storefront must render even when the database is unreachable. The
    // configured brand is enough to serve the page; contact lines are simply
    // omitted.
    return tenant;
  }
}

/**
 * The tenant for this request, plus where its canonical URLs live and whether
 * it may be indexed. Memoised per request: the layout, the page and their
 * metadata all ask.
 */
export const resolveTenantContext = cache(async (): Promise<SiteContext> => {
  const host = await requestHost();
  const context = siteContext({ host, previewTenant: await previewTenant() });
  return { ...context, tenant: await withShowroomContact(context.tenant) };
});

export async function resolveTenant(): Promise<TenantStorefrontConfig> {
  return (await resolveTenantContext()).tenant;
}

/**
 * The CSS custom properties a tenant controls.
 *
 * Applied once, on the storefront shell, so no component inlines a tenant
 * colour. Everything downstream reads `var(--tenant-*)` and a new tenant
 * needs no component changes at all. The token set is defined beside the
 * experience types, in `tenantExperience.ts`.
 */
export function tenantCssVars(tenant: TenantStorefrontConfig): Record<string, string> {
  const vars = themeCssVars(tenant.brand, tenant.experience.theme);
  const font = tenantFont(tenant.experience.theme.font);
  if (font) vars['--tenant-font-family'] = font.family;
  return vars;
}

/** The class that declares the tenant's font, for <html>. Empty for the default. */
export function tenantFontClass(tenant: TenantStorefrontConfig): string {
  return tenantFont(tenant.experience.theme.font)?.className ?? '';
}
