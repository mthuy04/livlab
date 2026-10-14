import { Suspense } from 'react';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getCatalog } from '@/lib/storefront/catalog';
import CompareView from '@/components/storefront/catalog/CompareView';
import { TEXT_MUTED } from '@/components/storefront/home/editorial';

/**
 * Side-by-side comparison of up to three products from the same category.
 *
 * Tenant-scoped like the catalogue: an id that is not in this tenant's
 * catalogue simply does not resolve, so a link cannot be edited into showing
 * another showroom's product.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const tenant = await resolveTenant();
  const { ids } = await searchParams;
  const wanted = (ids ?? '').split(',').filter(Boolean).slice(0, 3);

  let products: Awaited<ReturnType<typeof getCatalog>>['products'] = [];
  try {
    const catalog = await getCatalog(tenant);
    products = wanted
      .map((id) => catalog.products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  } catch {
    products = [];
  }

  return (
    <Suspense fallback={<div className="home-container py-20" style={{ color: TEXT_MUTED }}>Đang tải…</div>}>
      <CompareView products={products} />
    </Suspense>
  );
}
