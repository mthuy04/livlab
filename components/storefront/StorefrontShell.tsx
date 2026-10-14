'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import TenantHeader from './TenantHeader';
import TenantFooter from './TenantFooter';

/**
 * Owns tenant theming and the customer-facing chrome.
 *
 * Pages never build navigation or read tenant colours themselves. The accent
 * is applied once here as CSS custom properties, so adding a showroom is a
 * configuration change and touches no component.
 *
 * The showroom workspace and admin are deliberately excluded. They are
 * operational software with their own density and their own shell, and
 * wrapping them in storefront typography would restyle every table in them.
 */

/**
 * `/pub/tool` is a manufacturer simulator wrapper: it carries its own minimal
 * header and gives the rest of the viewport to the tool, so the storefront
 * chrome would be a second header stacked on a first. `/dev` is internal QA
 * tooling for the same reason — a showroom's navigation above a bounding-box
 * inspector is noise, and it costs the tool a sixth of the screen.
 */
const NON_STOREFRONT_PREFIXES = ['/showroom', '/admin', '/pub/tool', '/dev'];

/**
 * Storefront chrome, application behaviour.
 *
 * Room Studio keeps the showroom's header — the customer is still shopping —
 * but it is an editor, not a document: the viewport is the working surface, and
 * a marketing footer under it turns the whole page into something to scroll
 * past the tools. These routes get exactly the viewport and no page scroll, so
 * the 3D canvas and the panels divide a known height between them instead of
 * each guessing.
 */
const APP_SURFACE_PREFIXES = ['/room-studio'];

export default function StorefrontShell({
  tenant,
  children,
}: {
  tenant: TenantStorefrontConfig;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (NON_STOREFRONT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  const isAppSurface = APP_SURFACE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div
      className={`storefront flex flex-col ${
        isAppSurface ? 'h-[100svh] overflow-hidden' : 'min-h-screen'
      }`}
      data-tenant={tenant.slug}
      style={
        {
          '--tenant-accent': tenant.brand.accent,
          '--tenant-accent-hover': tenant.brand.accentHover,
          '--tenant-accent-contrast': tenant.brand.accentContrast,
        } as React.CSSProperties
      }
    >
      <TenantHeader tenant={tenant} />
      {/* `min-h-0` lets an app surface's `h-full` resolve to the leftover space
          rather than to the content's own height. */}
      <main className={isAppSurface ? 'min-h-0 flex-1' : 'flex-1'}>{children}</main>
      {!isAppSurface && <TenantFooter tenant={tenant} />}
    </div>
  );
}
