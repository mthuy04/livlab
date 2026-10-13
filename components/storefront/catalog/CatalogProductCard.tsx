'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { TEXT, STAGE } from '@/components/storefront/home/editorial';

/**
 * A catalogue card: image stage, then brand, name, SKU, price, then actions.
 *
 * No outer border, no shadow, no radius — the stage and the type carry it,
 * the way a sanitaryware catalogue does.
 */

export const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

export default function CatalogProductCard({
  product,
  scale,
  saved,
  comparing,
  onToggleSave,
  onToggleCompare,
  onQuickView,
}: {
  product: CatalogProduct;
  scale: number;
  saved: boolean;
  comparing: boolean;
  onToggleSave: (id: string) => void;
  onToggleCompare: (product: CatalogProduct) => void;
  onQuickView: (product: CatalogProduct) => void;
}) {
  const discount =
    product.referencePrice && product.showroomPrice
      ? Math.round((1 - product.showroomPrice / product.referencePrice) * 100)
      : null;

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Xem nhanh ${product.name}`}
          className="block w-full overflow-hidden"
          // Square, but capped so a three-up row at 1536 does not hand each
          // product a 430px stage.
          style={{ backgroundColor: STAGE, aspectRatio: '1 / 1', maxHeight: 340 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-[13%] transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ transform: `scale(${scale})` }}
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(product.id)}
          aria-label={saved ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`}
          aria-pressed={saved}
          className="absolute right-2 top-2 p-2 transition-opacity hover:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={saved ? TEXT : 'none'} aria-hidden="true">
            <path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z" stroke={TEXT} strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <p className="mt-4" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: '#777777' }}>
        {product.brand.toUpperCase()}
      </p>

      <h3 className="mt-2">
        <Link
          href={product.href as Route}
          className="line-clamp-3 transition-opacity hover:opacity-60"
          style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}
        >
          {product.name}
        </Link>
      </h3>

      {product.sku && (
        <p className="mt-1.5" style={{ fontSize: 12, color: '#777777' }}>
          {product.sku}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {product.showroomPrice ? (
          <span style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{formatVnd(product.showroomPrice)}</span>
        ) : (
          <span style={{ fontSize: 14, color: '#777777' }}>Liên hệ</span>
        )}
        {/* Struck through only when the catalogue really holds a higher list price. */}
        {product.referencePrice && (
          <span style={{ fontSize: 13, color: '#999999', textDecoration: 'line-through' }}>
            {formatVnd(product.referencePrice)}
          </span>
        )}
        {discount !== null && discount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tenant-accent)' }}>-{discount}%</span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 pt-4">
        <label
          className="inline-flex cursor-pointer items-center gap-2"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: '#555555' }}
        >
          <input
            type="checkbox"
            checked={comparing}
            onChange={() => onToggleCompare(product)}
            className="h-[15px] w-[15px] accent-[color:var(--tenant-accent)]"
            aria-label={`So sánh ${product.name}`}
          />
          SO SÁNH
        </label>

        <div className="flex items-center gap-4">
          {product.roomStudioReady && (
            <Link
              href={'/room-studio' as Route}
              className="transition-opacity hover:opacity-60"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', color: 'var(--tenant-accent)' }}
            >
              THỬ TRONG PHÒNG
            </Link>
          )}
          <Link
            href={product.href as Route}
            className="transition-opacity group-hover:opacity-100 hover:opacity-60"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', color: TEXT }}
          >
            XEM CHI TIẾT →
          </Link>
        </div>
      </div>
    </article>
  );
}
