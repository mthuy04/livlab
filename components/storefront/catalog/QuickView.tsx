'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { formatVnd } from './CatalogProductCard';
import {TEXT, DIVIDER } from '@/components/storefront/home/editorial';
import ProductImage from './ProductImage';

/** A short look at one product. Full specs live on the detail page. */
export default function QuickView({
  product,
  onClose,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
}) {
  if (!product) return null;

  const specs: [string, string][] = (
    [
      ['Kích thước', product.dimensionsRaw],
      ['Màu sắc', product.color],
      ['Chất liệu', product.material],
      ['Bề mặt', product.finish],
      ['Tâm thoát', product.roughIn],
      ['Bảo hành', product.warranty],
    ] as [string, string | null][]
  )
    .filter((row): row is [string, string] => Boolean(row[1]))
    .slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[900px] overflow-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Đóng" className="px-4 py-3" style={{ fontSize: 18 }}>
            ×
          </button>
        </div>

        <div className="grid gap-8 px-6 pb-8 md:grid-cols-2 md:px-10 md:pb-10">
          <div className="aspect-square w-full">
            <ProductImage product={product} variant="DETAIL" eager />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: '#777777' }}>
              {product.brand.toUpperCase()}
            </p>
            <h2 className="mt-2" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.35, color: TEXT }}>
              {product.name}
            </h2>
            {product.sku && (
              <p className="mt-1.5" style={{ fontSize: 13, color: '#777777' }}>
                {product.sku}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3">
              {product.showroomPrice ? (
                <span style={{ fontSize: 20, fontWeight: 600, color: TEXT }}>{formatVnd(product.showroomPrice)}</span>
              ) : (
                <span style={{ fontSize: 15, color: '#777777' }}>Liên hệ</span>
              )}
              {product.referencePrice && (
                <span style={{ fontSize: 14, color: '#999999', textDecoration: 'line-through' }}>
                  {formatVnd(product.referencePrice)}
                </span>
              )}
            </div>
            <p className="mt-1" style={{ fontSize: 12, color: '#777777' }}>
              Giá tham khảo
            </p>

            {specs.length > 0 && (
              <dl className="mt-6" style={{ borderTop: `1px solid ${DIVIDER}` }}>
                {specs.map(([term, value]) => (
                  <div key={term} className="flex gap-5 py-2.5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                    <dt className="w-[110px] shrink-0" style={{ fontSize: 13, color: '#777777' }}>{term}</dt>
                    <dd style={{ fontSize: 13, color: TEXT }}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={product.href as Route}
                className="inline-flex items-center"
                style={{
                  height: 42,
                  paddingInline: 20,
                  backgroundColor: 'var(--tenant-accent)',
                  color: 'var(--tenant-accent-contrast)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.08em',
                }}
              >
                XEM CHI TIẾT
              </Link>
              {product.roomStudioReady && (
                <Link href={'/room-studio' as Route} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
                  THỬ TRONG ROOM STUDIO →
                </Link>
              )}
              <Link href={'/quote' as Route} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
                YÊU CẦU BÁO GIÁ →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
