'use client';

import { useEffect } from 'react';
import { syncProductCatalogFromServer } from '@/lib/storage';

export default function CatalogSync() {
  useEffect(() => {
    syncProductCatalogFromServer();
  }, []);

  return null;
}
