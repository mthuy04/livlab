'use client';

import { useEffect } from 'react';
import { syncProductCatalogFromServer } from '@/lib/storage';
import { useTenant } from '@/components/storefront/TenantContext';

export default function CatalogSync() {
  const tenant = useTenant();
  useEffect(() => {
    // White-label storefronts read their tenant-scoped catalogue through the
    // server components/API. The legacy localStorage sync calls the unscoped
    // LivLab endpoint and must never mix that data into a showroom session.
    if (tenant.id !== 'livlab') return;
    syncProductCatalogFromServer();
  }, [tenant.id]);

  return null;
}
