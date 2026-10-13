'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { formatVnd } from './CatalogProductCard';
import { TEXT, TEXT_MUTED, DIVIDER, STAGE } from '@/components/storefront/home/editorial';

/**
 * The comparison table.
 *
 * Rows are generated from the products on screen: a row whose value is
 * missing for every product is dropped, and a value missing for one of them
 * reads "Chưa có dữ liệu" rather than being filled in with a guess.
 *
 * Price comparison here means two things, and neither is a competitor: the
 * showroom prices of the products side by side, and within one product the
 * gap between its list price and the showroom's.
 */

type Row = { label: string; value: (p: CatalogProduct) => string | null };

const GENERAL_ROWS: Row[] = [
  { label: 'Thương hiệu', value: (p) => p.brand },
  { label: 'Mã sản phẩm', value: (p) => p.sku },
  { label: 'Danh mục', value: (p) => [p.category, p.subcategory].filter(Boolean).join(' · ') || null },
  { label: 'Giá showroom', value: (p) => (p.showroomPrice ? formatVnd(p.showroomPrice) : null) },
  { label: 'Giá niêm yết', value: (p) => (p.referencePrice ? formatVnd(p.referencePrice) : null) },
  {
    label: 'Chênh lệch',
    value: (p) =>
      p.referencePrice && p.showroomPrice
        ? `Tiết kiệm ${formatVnd(p.referencePrice - p.showroomPrice)}`
        : null,
  },
  { label: 'Kích thước', value: (p) => p.dimensionsRaw },
  { label: 'Màu sắc', value: (p) => p.color },
  { label: 'Chất liệu', value: (p) => p.material },
  { label: 'Bề mặt', value: (p) => p.finish },
  { label: 'Xuất xứ', value: (p) => p.origin },
  { label: 'Bảo hành', value: (p) => p.warranty },
  { label: 'Room Studio', value: (p) => (p.roomStudioReady ? 'Thử được trong Room Studio' : null) },
  { label: 'Tài liệu kỹ thuật', value: (p) => (p.technicalDrawing ? 'Có bản vẽ kỹ thuật' : null) },
];

/** Rows that only make sense for one kind of product. */
const CATEGORY_ROWS: Record<string, Row[]> = {
  'Bồn cầu': [
    { label: 'Loại bồn cầu', value: (p) => p.subcategory ?? p.installationType },
    { label: 'Kiểu xả', value: (p) => p.flushType },
    { label: 'Lượng nước xả', value: (p) => p.flushVolume },
    { label: 'Tâm thoát', value: (p) => p.roughIn },
    { label: 'Kiểu nắp', value: (p) => p.seatType },
    { label: 'Công nghệ bề mặt', value: (p) => (p.technologies.length ? p.technologies.join(', ') : null) },
  ],
  Lavabo: [
    { label: 'Kiểu lắp', value: (p) => p.subcategory ?? p.installationType },
    { label: 'Công nghệ', value: (p) => (p.technologies.length ? p.technologies.join(', ') : null) },
  ],
  'Vòi lavabo': [
    { label: 'Kiểu', value: (p) => p.subcategory ?? p.installationType },
    { label: 'Bề mặt', value: (p) => p.finish },
  ],
  'Sen tắm': [
    { label: 'Kiểu', value: (p) => p.subcategory ?? p.installationType },
    { label: 'Bề mặt', value: (p) => p.finish },
  ],
  'Bồn tắm': [
    { label: 'Kiểu', value: (p) => p.subcategory ?? p.installationType },
    { label: 'Vật liệu', value: (p) => p.material },
  ],
  'Gương & phụ kiện': [{ label: 'Loại', value: (p) => p.subcategory ?? p.installationType }],
};

export default function CompareView({ products }: { products: CatalogProduct[] }) {
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
            height: 42, paddingInline: 20,
            backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)',
            fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
          }}
        >
          VỀ DANH MỤC
        </Link>
      </div>
    );
  }

  const category = products[0].category;
  const rows = [...GENERAL_ROWS, ...(CATEGORY_ROWS[category] ?? [])].filter((row) =>
    products.some((p) => row.value(p))
  );

  return (
    <div className="home-container py-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href={'/products' as Route} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT_MUTED }}>
          ← VỀ DANH MỤC
        </Link>
      </nav>

      <h1 style={{ fontSize: 'clamp(28px, 1.4rem + 1vw, 36px)', fontWeight: 500, letterSpacing: '.015em', color: TEXT }}>
        So sánh sản phẩm
      </h1>
      <p className="mt-3" style={{ fontSize: 15, color: TEXT_MUTED }}>
        {products.length} sản phẩm · {category}
      </p>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="sr-only">Bảng so sánh thông số sản phẩm</caption>
          <thead className="sticky top-[74px] z-10 bg-white">
            <tr>
              <th scope="col" className="w-[160px] text-left align-bottom" style={{ borderBottom: `1px solid ${DIVIDER}` }} />
              {products.map((p) => (
                <th key={p.id} scope="col" className="p-3 text-left align-bottom" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full max-w-[200px] object-contain"
                    style={{ backgroundColor: STAGE }}
                  />
                  <span className="mt-3 block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: '#777777' }}>
                    {p.brand.toUpperCase()}
                  </span>
                  <Link
                    href={p.href as Route}
                    className="mt-1.5 block transition-opacity hover:opacity-60"
                    style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: TEXT }}
                  >
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="py-4 pr-4 text-left align-top" style={{ borderBottom: `1px solid ${DIVIDER}`, fontSize: 13, fontWeight: 500, color: TEXT_MUTED }}>
                  {row.label}
                </th>
                {products.map((p) => {
                  const value = row.value(p);
                  return (
                    <td
                      key={p.id}
                      className="p-4 align-top"
                      style={{ borderBottom: `1px solid ${DIVIDER}`, fontSize: 14, color: value ? TEXT : '#AAAAAA' }}
                    >
                      {value ?? 'Chưa có dữ liệu'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8" style={{ fontSize: 13, color: TEXT_MUTED }}>
        Giá tham khảo. Giá cuối do showroom xác nhận theo tồn kho và phương án lắp đặt.
      </p>
    </div>
  );
}
