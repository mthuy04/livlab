'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import {TEXT, TEXT_FAINT } from '@/components/storefront/home/editorial';
import ProductImage from './ProductImage';

/**
 * A catalogue card: image stage, then brand, name, SKU, price, then actions.
 *
 * No outer border, no shadow, no radius — the stage and the type carry it,
 * the way a sanitaryware catalogue does.
 */

export const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

export default function CatalogProductCard({
  product,
  eager = false,
  saved,
  comparing,
  onToggleSave,
  onToggleCompare,
  onQuickView,
}: {
  product: CatalogProduct;
  /** The first row is above the fold, so it does not wait for the scroll. */
  eager?: boolean;
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
          style={{ aspectRatio: '1 / 1', maxHeight: 320, border: '1px solid #F0F0EE' }}
        >
          <ProductImage product={product} variant="GRID" eager={eager} />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(product.id)}
          aria-label={saved ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`}
          aria-pressed={saved}
          className="absolute transition-opacity hover:opacity-60"
          style={{ top: 12, right: 12 }}
        >
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill={saved ? TEXT : 'none'} aria-hidden="true">
            <path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z" stroke={TEXT} strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      <p className="mt-4" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.10em', color: '#808080' }}>
        {product.brand.toUpperCase()}
      </p>

      <h3 className="mt-2">
        <Link
          href={product.href as Route}
          className="line-clamp-2 transition-opacity hover:opacity-60"
          style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}
        >
          {product.name}
        </Link>
      </h3>

      {product.sku && (
        <p className="mt-1.5" style={{ fontSize: 11.5, color: '#8B8B8B' }}>
          {product.sku}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {product.showroomPrice ? (
          <span style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{formatVnd(product.showroomPrice)}</span>
        ) : (
          <span style={{ fontSize: 14, color: TEXT_FAINT }}>Liên hệ</span>
        )}
        {/* Struck through only when the catalogue really holds a higher list price. */}
        {product.referencePrice && (
          <span style={{ fontSize: 12, color: '#999999', textDecoration: 'line-through' }}>
            {formatVnd(product.referencePrice)}
          </span>
        )}
        {/* Quiet on purpose: a saving is information, not a shout. */}
        {discount !== null && discount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, color: '#597080' }}>−{discount}%</span>
        )}
      </div>

      {product.roomStudioReady && (
        <Link
          href={'/room-studio' as Route}
          className="mt-3 inline-block self-start transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', color: 'var(--tenant-accent)' }}
        >
          THỬ TRONG PHÒNG →
        </Link>
      )}

      <div className="mt-auto flex items-center justify-between gap-4 pt-4">
        <label
          className="inline-flex cursor-pointer items-center gap-2"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: '#686868' }}
        >
          <input
            type="checkbox"
            checked={comparing}
            onChange={() => onToggleCompare(product)}
            className="h-[14px] w-[14px] accent-[color:var(--tenant-accent)]"
            style={{ borderRadius: 0 }}
            aria-label={`So sánh ${product.name}`}
          />
          SO SÁNH
        </label>

        <Link
          href={product.href as Route}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', color: TEXT }}
        >
          XEM CHI TIẾT →
        </Link>
      </div>
    </article>
  );
}
