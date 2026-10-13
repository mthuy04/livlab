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

const NON_STOREFRONT_PREFIXES = ['/showroom', '/admin'];

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

  return (
    <div
      className="storefront flex min-h-screen flex-col"
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
      <main className="flex-1">{children}</main>
      <TenantFooter tenant={tenant} />
    </div>
  );
}
