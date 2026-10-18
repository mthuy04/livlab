'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { LIVLAB_TENANT, type TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';

/**
 * The resolved tenant, for client components that sit outside the storefront
 * shell's props — the quote drawer, Room Studio's panels.
 *
 * Resolution still happens once, on the server, in the root layout; this only
 * hands the result down. The default is the LivLab storefront, so a component
 * rendered without a provider (a test bench, an internal page) behaves exactly
 * as it did before tenants existed.
 */
const TenantContext = createContext<TenantStorefrontConfig>(LIVLAB_TENANT);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantStorefrontConfig;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantStorefrontConfig {
  return useContext(TenantContext);
}
