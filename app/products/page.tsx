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
      <div className="home-container" style={{ paddingTop: 28, paddingBottom: 30 }}>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}>
            <li>
              <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>SẢN PHẨM</li>
          </ol>
        </nav>

        <h1 style={{ marginTop: 20, fontSize: 'clamp(28px, 1.3rem + 1vw, 35px)', fontWeight: 550, lineHeight: 1.1, letterSpacing: '.015em', color: TEXT }}>
          THIẾT BỊ PHÒNG TẮM
        </h1>
        <p className="max-w-[620px]" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
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
