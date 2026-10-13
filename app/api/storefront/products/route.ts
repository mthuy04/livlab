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
export async function GET() {
  const tenant = await resolveTenant();

  try {
    const catalog = await getCatalog(tenant);
    return NextResponse.json(
      {
        tenantId: catalog.tenantId,
        products: catalog.products,
        sourceCheckedAt: catalog.sourceCheckedAt,
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
