import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getCatalog } from '@/lib/storefront/catalog';

/**
 * The storefront catalogue, scoped to the resolved tenant.
 *
 * `/api/products` returns every ACTIVE row in the database with no tenant
 * filter, which on a showroom's storefront hands the customer a competing
 * showroom's products and prices. This route resolves the tenant first and
 * asks the catalogue layer, which is the only thing that decides what a
 * tenant may see.
 */
export async function GET(request: Request) {
  const tenant = await resolveTenant();
  // An internal escape hatch for cleanup work: ?quality=all keeps the products
  // whose photography the audit rejected.
  const includeUnpresentable = new URL(request.url).searchParams.get('quality') === 'all';

  try {
    const catalog = await getCatalog(tenant, { includeUnpresentable });
    return NextResponse.json(
      {
        tenantId: catalog.tenantId,
        products: catalog.products,
        sourceCheckedAt: catalog.sourceCheckedAt,
        withheldForImageQuality: catalog.withheldForImageQuality,
      },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Chưa thể tải danh mục sản phẩm.' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
