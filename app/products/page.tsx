import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import { getCatalog } from '@/lib/storefront/catalog';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structuredData';
import CatalogClient from '@/components/storefront/catalog/CatalogClient';
import { TEXT, TEXT_MUTED, DIVIDER } from '@/components/storefront/home/editorial';

/**
 * The tenant's product catalogue.
 *
 * The page resolves the tenant on the server and hands its id down; the
 * catalogue itself is fetched from the tenant-scoped API, which is the only
 * thing that decides which products a storefront may show.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The listing has one indexable URL per category: `/products` and
 * `/products?category=<name>`. Sorting, paging, brand and price filters are
 * views of those and canonicalise to them.
 */
async function listing(searchParams: Props['searchParams']) {
  const { tenant, origin } = await resolveTenantContext();
  const raw = (await searchParams).category;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  let products: CatalogProduct[] | undefined;
  try {
    products = (await getCatalog(tenant)).products;
  } catch {
    products = undefined; // The client shows its own error state and retry.
  }
  const category = requested && products?.some((p) => p.category === requested) ? requested : null;
  const path = category ? `/products?category=${encodeURIComponent(category)}` : '/products';
  return { tenant, origin, products, category, path };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tenant, products, category, path } = await listing(searchParams);
  const count = category ? products?.filter((p) => p.category === category).length : products?.length;
  const brands = [...new Set((products ?? []).filter((p) => !category || p.category === category).map((p) => p.brand).filter(Boolean))];
  const brandText = brands.length > 0 && brands.length <= 4 ? ` ${brands.join(', ')}` : '';
  const subject = category ?? 'Thiết bị phòng tắm';
  return {
    title: `${subject}${brandText} | ${tenant.brand.name}`,
    description: count
      ? `Xem ${count} mẫu ${subject.toLowerCase()}${brandText} kèm hình ảnh, thông số kỹ thuật và giá tham khảo tại ${tenant.brand.name}.`
      : undefined,
    alternates: { canonical: path },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const { tenant, origin, products, category, path } = await listing(searchParams);

  return (
    <>
      <div className="home-container" style={{ paddingTop: 28, paddingBottom: 30 }}>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}>
            <li>
              <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
            </li>
            <li aria-hidden="true">/</li>
            {category ? (
              <>
                <li>
                  <Link href={'/products' as Route} className="transition-opacity hover:opacity-60">SẢN PHẨM</Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" style={{ color: TEXT }}>{category.toUpperCase()}</li>
              </>
            ) : (
              <li aria-current="page" style={{ color: TEXT }}>SẢN PHẨM</li>
            )}
          </ol>
        </nav>

        <h1 style={{ marginTop: 20, fontSize: 'clamp(28px, 1.3rem + 1vw, 35px)', fontWeight: 550, lineHeight: 1.1, letterSpacing: '.015em', color: TEXT }}>
          {(category ?? 'Thiết bị phòng tắm').toUpperCase()}
        </h1>
        <p className="max-w-[620px]" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
          Khám phá thiết bị vệ sinh theo danh mục, thương hiệu và thông số phù hợp với không gian của bạn.
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${DIVIDER}` }} />

      <Suspense fallback={<div className="home-container py-20" style={{ fontSize: 15, color: TEXT_MUTED }}>Đang tải…</div>}>
        <CatalogClient tenantId={tenant.id} initialProducts={products} />
      </Suspense>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: 'Trang chủ', path: '/' },
            { name: 'Sản phẩm', path: '/products' },
            ...(category ? [{ name: category, path }] : []),
          ]),
        ]}
      />
    </>
  );
}
