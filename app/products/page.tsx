import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import CatalogClient from '@/components/storefront/catalog/CatalogClient';
import { TEXT, TEXT_MUTED, DIVIDER } from '@/components/storefront/home/editorial';

/**
 * The tenant's product catalogue.
 *
 * The page resolves the tenant on the server and hands its id down; the
 * catalogue itself is fetched from the tenant-scoped API, which is the only
 * thing that decides which products a storefront may show.
 */
export default async function ProductsPage() {
  const tenant = await resolveTenant();

  return (
    <>
      <div className="home-container pb-8 pt-7">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}>
            <li>
              <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>SẢN PHẨM</li>
          </ol>
        </nav>

        <h1 className="mt-6" style={{ fontSize: 'clamp(30px, 1.4rem + 1vw, 36px)', fontWeight: 500, lineHeight: 1.15, letterSpacing: '.015em', color: TEXT }}>
          Thiết bị phòng tắm
        </h1>
        <p className="mt-4 max-w-[620px]" style={{ fontSize: 16, lineHeight: 1.65, color: TEXT_MUTED }}>
          Khám phá thiết bị vệ sinh theo danh mục, thương hiệu và thông số phù hợp với không gian của bạn.
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${DIVIDER}` }} />

      <Suspense fallback={<div className="home-container py-20" style={{ fontSize: 15, color: TEXT_MUTED }}>Đang tải…</div>}>
        <CatalogClient tenantId={tenant.id} />
      </Suspense>
    </>
  );
}
