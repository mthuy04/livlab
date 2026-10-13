'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { AVAILABILITY_LABEL } from '@/lib/storefront/catalogTypes';
import { formatVnd } from './CatalogProductCard';
import { TEXT, TEXT_MUTED, STAGE } from '@/components/storefront/home/editorial';

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

const BORDER = '#E7E7E5';
const GROUP_BG = '#F5F5F3';
const DIFF_BG = '#F4F7F8';
const ZEBRA = '#FCFCFB';

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
      <section className="home-container pb-9 pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: '#777777' }}>
            <li><Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>SO SÁNH</li>
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 1.4rem + 1vw, 36px)', fontWeight: 500, color: TEXT }}>
              So sánh sản phẩm
            </h1>
            <p className="mt-3" style={{ fontSize: 15, color: TEXT_MUTED }}>
              Đối chiếu giá, kích thước và thông số quan trọng trước khi lựa chọn.
            </p>
          </div>

          <label className="flex shrink-0 cursor-pointer items-center gap-3" style={{ fontSize: 13, color: TEXT }}>
            <input
              type="checkbox"
              checked={differencesOnly}
              onChange={(e) => setDifferencesOnly(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--tenant-accent)]"
            />
            Chỉ hiển thị điểm khác biệt
          </label>
        </div>
      </section>

      <section className="home-container pb-24">
        <div className="no-scrollbar overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Product header, sticky under the 74px storefront header. */}
            <div className="sticky top-[74px] z-20 grid bg-white" style={{ gridTemplateColumns: columns }}>
              <div style={{ borderBottom: `1px solid ${BORDER}` }} />
              {products.map((p) => (
                <div key={p.id} className="px-6 pb-6 pt-4" style={{ borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full object-contain p-6"
                    style={{ height: 230, backgroundColor: STAGE }}
                  />
                  <p className="mt-5" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.11em', color: '#777777' }}>
                    {p.brand.toUpperCase()}
                  </p>
                  <h2 className="mt-2">
                    <Link href={p.href as Route} className="transition-opacity hover:opacity-60" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}>
                      {p.name}
                    </Link>
                  </h2>
                  {p.sku && <p className="mt-2" style={{ fontSize: 12, color: '#888888' }}>{p.sku}</p>}

                  {p.showroomPrice && (
                    <p className="mt-4 flex flex-wrap items-baseline gap-2" style={{ fontSize: 17, fontWeight: 600, color: TEXT }}>
                      {formatVnd(p.showroomPrice)}
                      {lowestPrice !== null && p.showroomPrice === lowestPrice && (
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', color: 'var(--tenant-accent)' }}>
                          Thấp nhất
                        </span>
                      )}
                    </p>
                  )}
                  {p.referencePrice && (
                    <p className="mt-1" style={{ fontSize: 12, color: '#999999', textDecoration: 'line-through' }}>
                      {formatVnd(p.referencePrice)}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em' }}>
                    <Link href={p.href as Route} style={{ color: TEXT }}>XEM CHI TIẾT →</Link>
                    {p.roomStudioReady && (
                      <Link href={'/room-studio' as Route} style={{ color: 'var(--tenant-accent)' }}>THỬ TRONG PHÒNG</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {groups.map((group) => (
              <div key={group.title}>
                <div className="grid" style={{ gridTemplateColumns: columns, backgroundColor: GROUP_BG, borderBottom: '1px solid #D9D9D7' }}>
                  <div className="px-4 py-3.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}>
                    {group.title}
                  </div>
                  {products.map((p) => <div key={p.id} />)}
                </div>

                {group.rows.map((row, rowIndex) => {
                  const values = products.map((p) => row.value(p));
                  const differs = new Set(values.map((v) => String(v))).size > 1;
                  return (
                    <div
                      key={row.key}
                      className="grid"
                      style={{ gridTemplateColumns: columns, borderBottom: `1px solid ${BORDER}`, backgroundColor: rowIndex % 2 === 1 ? ZEBRA : undefined }}
                    >
                      <div className="flex min-h-[60px] items-center px-4 py-3" style={{ fontSize: 13, color: TEXT_MUTED }}>
                        {row.label}
                      </div>
                      {products.map((p, index) => {
                        const value = values[index];
                        return (
                          <div
                            key={p.id}
                            className="flex min-h-[60px] items-center px-6 py-3"
                            style={{
                              borderLeft: `1px solid ${BORDER}`,
                              fontSize: 14,
                              color: value ? TEXT : '#999999',
                              backgroundColor: differs ? DIFF_BG : undefined,
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

        <div className="mt-14 pt-9" style={{ borderTop: '1px solid #DDDDDA' }}>
          <h2 style={{ fontSize: 26, fontWeight: 500, color: TEXT }}>Đã chọn được sản phẩm phù hợp?</h2>
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={'/quote' as Route}
              className="inline-flex items-center"
              style={{
                height: 43, paddingInline: 24,
                backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)',
                fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
              }}
            >
              YÊU CẦU BÁO GIÁ
            </Link>
            <Link href={'/room-studio' as Route} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
              THỬ TRONG ROOM STUDIO →
            </Link>
          </div>
          <p className="mt-6" style={{ fontSize: 13, color: TEXT_MUTED }}>
            Giá tham khảo. Giá cuối do showroom xác nhận theo tồn kho và phương án lắp đặt.
          </p>
        </div>
      </section>
    </>
  );
}
