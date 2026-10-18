'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { AVAILABILITY_LABEL } from '@/lib/storefront/catalogTypes';
import { formatVnd } from './CatalogProductCard';
import ProductImage from './ProductImage';
import {TEXT, TEXT_MUTED, TEXT_FAINT } from '@/components/storefront/home/editorial';

/**
 * Side-by-side comparison, grouped rather than one endless table.
 *
 * Rows are generated from the products on screen: a row nobody has a value
 * for is dropped, and a value one product lacks reads "Chưa có dữ liệu"
 * rather than being filled in with a guess. Cells that differ get a very
 * quiet tint — the point is to find the differences, not to score them, so
 * there is no green, no red and no "best".
 *
 * Price comparison is within this tenant only: product against product, and
 * each product's list price against the showroom's. Never another showroom.
 */

const BORDER = '#ECECEA';
/** Barely there: enough to find a difference, not enough to shout about it. */
const DIFF_BG = '#F8FAFB';

type Row = { key: string; label: string; value: (p: CatalogProduct) => string | null };

const GENERAL: Row[] = [
  { key: 'category', label: 'Danh mục', value: (p) => [p.category, p.subcategory].filter(Boolean).join(' · ') || null },
  { key: 'brand', label: 'Thương hiệu', value: (p) => p.brand },
  { key: 'sku', label: 'Mã sản phẩm', value: (p) => p.sku },
  { key: 'dimensions', label: 'Kích thước', value: (p) => p.dimensionsRaw },
  { key: 'color', label: 'Màu sắc', value: (p) => p.color },
  { key: 'origin', label: 'Xuất xứ', value: (p) => p.origin },
];

const COMMERCIAL: Row[] = [
  { key: 'showroomPrice', label: 'Giá showroom', value: (p) => (p.showroomPrice ? formatVnd(p.showroomPrice) : null) },
  { key: 'referencePrice', label: 'Giá tham khảo', value: (p) => (p.referencePrice ? formatVnd(p.referencePrice) : null) },
  {
    key: 'saving',
    label: 'Tiết kiệm',
    value: (p) =>
      p.referencePrice && p.showroomPrice ? formatVnd(p.referencePrice - p.showroomPrice) : null,
  },
  { key: 'warranty', label: 'Bảo hành', value: (p) => p.warranty },
  {
    key: 'availability',
    label: 'Tình trạng cung ứng',
    value: (p) => (p.availability ? AVAILABILITY_LABEL[p.availability] : null),
  },
];

const TECHNICAL: Record<string, Row[]> = {
  'Bồn cầu': [
    { key: 'type', label: 'Loại bồn cầu', value: (p) => p.subcategory ?? p.installationType },
    { key: 'flushType', label: 'Kiểu xả', value: (p) => p.flushType },
    { key: 'flushVolume', label: 'Lượng nước xả', value: (p) => p.flushVolume },
    { key: 'roughIn', label: 'Tâm thoát', value: (p) => p.roughIn },
    { key: 'seat', label: 'Kiểu nắp', value: (p) => p.seatType },
    { key: 'tech', label: 'Công nghệ bề mặt', value: (p) => (p.technologies.length ? p.technologies.join(', ') : null) },
  ],
  Lavabo: [
    { key: 'install', label: 'Kiểu lắp', value: (p) => p.subcategory ?? p.installationType },
    { key: 'material', label: 'Chất liệu', value: (p) => p.material },
    { key: 'finish', label: 'Bề mặt', value: (p) => p.finish },
    { key: 'tech', label: 'Công nghệ', value: (p) => (p.technologies.length ? p.technologies.join(', ') : null) },
  ],
  'Vòi lavabo': [
    { key: 'type', label: 'Loại', value: (p) => p.subcategory ?? p.installationType },
    { key: 'finish', label: 'Bề mặt', value: (p) => p.finish },
    { key: 'material', label: 'Chất liệu', value: (p) => p.material },
  ],
  'Sen tắm': [
    { key: 'type', label: 'Loại', value: (p) => p.subcategory ?? p.installationType },
    { key: 'finish', label: 'Bề mặt', value: (p) => p.finish },
    { key: 'material', label: 'Chất liệu', value: (p) => p.material },
  ],
  'Bồn tắm': [
    { key: 'type', label: 'Kiểu', value: (p) => p.subcategory ?? p.installationType },
    { key: 'material', label: 'Vật liệu', value: (p) => p.material },
  ],
  'Gương & phụ kiện': [
    { key: 'type', label: 'Loại', value: (p) => p.subcategory ?? p.installationType },
    { key: 'finish', label: 'Bề mặt', value: (p) => p.finish },
  ],
};

const EXPERIENCE: Row[] = [
  { key: 'roomStudio', label: 'Room Studio', value: (p) => (p.roomStudioReady ? 'Thử được trong Room Studio' : null) },
  { key: 'docs', label: 'Tài liệu kỹ thuật', value: (p) => (p.technicalDrawing ? 'Có bản vẽ kỹ thuật' : null) },
];

export default function CompareView({ products }: { products: CatalogProduct[] }) {
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [headerPassed, setHeaderPassed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  /**
   * The product header cannot be sticky itself: it lives inside the table's
   * horizontal scroll container, and a horizontal scroll container is a
   * scroll container on both axes, so `position: sticky` has nothing to stick
   * to. A compact bar outside it takes over once the header scrolls away.
   */
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderPassed(entry.boundingClientRect.bottom < 120 && !entry.isIntersecting),
      { rootMargin: '-120px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const category = products[0]?.category ?? '';

  const groups = useMemo(() => {
    const all = [
      { title: 'THÔNG TIN CHUNG', rows: GENERAL },
      { title: 'GIÁ & DỊCH VỤ', rows: COMMERCIAL },
      { title: 'THÔNG SỐ KỸ THUẬT', rows: TECHNICAL[category] ?? [] },
      { title: 'TRẢI NGHIỆM LIVLAB', rows: EXPERIENCE },
    ];

    return all
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => {
          // A row nobody has a value for is not a comparison.
          if (!products.some((p) => row.value(p))) return false;
          if (!differencesOnly) return true;
          return new Set(products.map((p) => String(row.value(p)))).size > 1;
        }),
      }))
      .filter((group) => group.rows.length > 0);
  }, [category, products, differencesOnly]);

  /** The cheapest of the selected products — a fact, not a recommendation. */
  const lowestPrice = useMemo(() => {
    const prices = products.map((p) => p.showroomPrice).filter((v): v is number => typeof v === 'number');
    return prices.length > 1 ? Math.min(...prices) : null;
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="home-container py-24 text-center">
        <p style={{ fontSize: 20, fontWeight: 500, color: TEXT }}>Chưa có sản phẩm nào để so sánh</p>
        <p className="mt-3" style={{ fontSize: 15, color: TEXT_MUTED }}>
          Chọn tối đa 3 sản phẩm cùng danh mục trong danh mục sản phẩm.
        </p>
        <Link
          href={'/products' as Route}
          className="mt-6 inline-flex items-center"
          style={{
            height: 43, paddingInline: 24,
            backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)',
            fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
          }}
        >
          VỀ DANH MỤC
        </Link>
      </div>
    );
  }

  const columns = `220px repeat(${products.length}, minmax(0, 1fr))`;

  return (
    <>
      <section className="home-container" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
            <li><Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>SO SÁNH</li>
          </ol>
        </nav>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 1.3rem + 1vw, 34px)', fontWeight: 500, color: TEXT }}>
              So sánh sản phẩm
            </h1>
            <p style={{ marginTop: 10, fontSize: 15, color: TEXT_MUTED }}>
              Đối chiếu giá, kích thước và thông số quan trọng trước khi lựa chọn.
            </p>
          </div>

          <label className="flex shrink-0 cursor-pointer items-center gap-2.5 pb-1" style={{ fontSize: 13, color: TEXT }}>
            <input
              type="checkbox"
              checked={differencesOnly}
              onChange={(e) => setDifferencesOnly(e.target.checked)}
              className="h-[14px] w-[14px] accent-[color:var(--tenant-accent)]"
              style={{ borderRadius: 0 }}
            />
            Chỉ hiển thị điểm khác biệt
          </label>
        </div>
      </section>

      {/* Compact identity bar: keeps the products named while the table scrolls. */}
      {headerPassed && (
      <div
        className="sticky top-[74px] z-30 hidden bg-white md:block"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="home-container">
          <div className="grid items-center" style={{ gridTemplateColumns: columns, height: 86 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT_FAINT }}>THÔNG SỐ</p>
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-6 py-3" style={{ borderLeft: `1px solid ${BORDER}` }}>
                <span className="block shrink-0" style={{ width: 48, height: 48 }}>
                  <ProductImage product={p} variant="THUMBNAIL" eager />
                </span>
                <span className="min-w-0">
                  <span className="block truncate" style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{p.name}</span>
                  {p.showroomPrice && (
                    <span className="block" style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                      {formatVnd(p.showroomPrice)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      <section className="home-container pb-24">
        <div className="no-scrollbar overflow-x-auto">
          <div className="min-w-[760px]">
            {/* The full product header; the compact bar above mirrors it. */}
            <div ref={headerRef} className="grid bg-white" style={{ gridTemplateColumns: columns }}>
              <div style={{ borderBottom: `1px solid ${BORDER}` }} />
              {products.map((p) => (
                <div key={p.id} className="px-6 pb-5 pt-2" style={{ borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}>
                  <div style={{ height: 178 }}>
                    <ProductImage product={p} variant="COMPARE" eager />
                  </div>
                  <p className="mt-4" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.10em', color: '#808080' }}>
                    {p.brand.toUpperCase()}
                  </p>
                  <h2 className="mt-2">
                    <Link href={p.href as Route} className="transition-opacity hover:opacity-60" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}>
                      {p.name}
                    </Link>
                  </h2>
                  {p.sku && <p className="mt-2" style={{ fontSize: 11.5, color: '#8B8B8B' }}>{p.sku}</p>}

                  <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
                    {p.showroomPrice && (
                      <span style={{ fontSize: 17, fontWeight: 600, color: TEXT }}>{formatVnd(p.showroomPrice)}</span>
                    )}
                    {p.referencePrice && (
                      <span style={{ fontSize: 12, color: '#999999', textDecoration: 'line-through' }}>
                        {formatVnd(p.referencePrice)}
                      </span>
                    )}
                  </div>
                  {/* A caption, not a badge — and only when it says something. */}
                  {lowestPrice !== null && p.showroomPrice === lowestPrice && (
                    <p className="mt-1.5" style={{ fontSize: 11, color: 'var(--tenant-accent-ink)' }}>
                      Giá thấp hơn trong nhóm so sánh
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em' }}>
                    <Link href={p.href as Route} style={{ color: TEXT }}>XEM CHI TIẾT →</Link>
                    {p.roomStudioReady && (
                      <Link href={'/room-studio' as Route} style={{ color: 'var(--tenant-accent-ink)' }}>THỬ TRONG PHÒNG →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {groups.map((group) => (
              <div key={group.title}>
                <div style={{ paddingTop: 28, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: 'var(--tenant-accent-ink)' }}>
                    {group.title}
                  </p>
                </div>

                {group.rows.map((row) => {
                  const values = products.map((p) => row.value(p));
                  const differs = new Set(values.map((v) => String(v))).size > 1;
                  return (
                    <div
                      key={row.key}
                      className="grid bg-white"
                      style={{ gridTemplateColumns: columns, borderBottom: `1px solid ${BORDER}` }}
                    >
                      <div className="flex min-h-[56px] items-center px-4 py-3" style={{ fontSize: 13, color: '#737373' }}>
                        {row.label}
                      </div>
                      {products.map((p, index) => {
                        const value = values[index];
                        return (
                          <div
                            key={p.id}
                            className="flex min-h-[56px] items-center py-3"
                            style={{
                              paddingInline: 24,
                              // A 3px rule and a little weight, rather than a
                              // block of colour across the row.
                              borderLeft: differs ? '3px solid var(--tenant-accent)' : `1px solid ${BORDER}`,
                              paddingLeft: differs ? 22 : 24,
                              backgroundColor: differs ? DIFF_BG : undefined,
                              fontSize: 14,
                              fontWeight: differs ? 500 : 400,
                              color: value ? TEXT : TEXT_FAINT,
                            }}
                          >
                            {value ?? 'Chưa có dữ liệu'}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: TEXT }}>Đã chọn được sản phẩm phù hợp?</h2>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={'/quote' as Route}
              className="inline-flex items-center"
              style={{
                height: 40, paddingInline: 18,
                backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)',
                fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
              }}
            >
              YÊU CẦU BÁO GIÁ
            </Link>
            <Link href={'/room-studio' as Route} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
              THỬ TRONG ROOM STUDIO →
            </Link>
          </div>
          <p className="mt-5" style={{ fontSize: 12, color: TEXT_FAINT }}>
            Giá tham khảo. Giá cuối do showroom xác nhận theo tồn kho và phương án lắp đặt.
          </p>
        </div>
      </section>
    </>
  );
}
