import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  LIVLAB_TENANT,
  TENANTS,
  type TenantStorefrontConfig,
} from './tenantConfig';

/**
 * Decides which storefront a request is looking at.
 *
 * Runs on the server so the first paint already carries the tenant's branding;
 * resolving on the client would flash LivLab's identity before a showroom's,
 * which is precisely what a white-label product must never do.
 *
 * Resolution order today is hostname, then an internal override. Subdomains
 * and custom domains slot into the same function later without any caller
 * changing.
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

/** Hostnames mapped to a tenant. Real custom domains belong here later. */
const HOST_TENANTS: Record<string, string> = {
  // livlab.vercel.app and local development both get the default storefront.
};

/**
 * The preview choice, set by /dev/tenant and stored in a cookie.
 *
 * A cookie rather than a query parameter because a root layout never receives
 * searchParams — only pages do — so a query string cannot reach this function.
 */
async function previewTenantSlug(): Promise<string | null> {
  if (!tenantPreviewEnabled()) return null;
  try {
    return (await cookies()).get(TENANT_PREVIEW_COOKIE)?.value ?? null;
  } catch {
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

export async function resolveTenant(): Promise<TenantStorefrontConfig> {
  const preview = await previewTenantSlug();
  if (preview && TENANTS[preview]) {
    return withShowroomContact(TENANTS[preview]);
  }

  try {
    const host = (await headers()).get('host')?.split(':')[0] ?? '';
    const bySlug = HOST_TENANTS[host];
    if (bySlug && TENANTS[bySlug]) {
      return withShowroomContact(TENANTS[bySlug]);
    }
  } catch {
    // headers() is unavailable in some rendering contexts. Falling through to
    // the default storefront is correct; failing the page is not.
  }

  return LIVLAB_TENANT;
}

/**
 * The CSS custom properties a tenant controls.
 *
 * Applied once, on the storefront shell, so no component inlines a tenant
 * colour. Everything downstream reads var(--tenant-accent) and a new tenant
 * needs no component changes at all.
 */
export function tenantCssVars(tenant: TenantStorefrontConfig): Record<string, string> {
  return {
    '--tenant-accent': tenant.brand.accent,
    '--tenant-accent-hover': tenant.brand.accentHover,
    '--tenant-accent-contrast': tenant.brand.accentContrast,
  };
}
