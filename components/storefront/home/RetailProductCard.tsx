'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Check } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import type { HomeProductView } from '@/lib/storefront/tenantHome';
import { StageImage } from '@/components/storefront/catalog/ProductImage';

/**
 * The `priceLed` product card.
 *
 * Brand and model code first, then the name, then the price at a size that
 * reads from across the grid, then the quote action on the card itself — the
 * hierarchy of a retailer whose customers arrive knowing the model they want.
 * The editorial card puts the photograph forward and the price in a footnote;
 * the data underneath is identical.
 *
 * Nothing is added for effect. The struck price and the percentage appear
 * only when the catalogue holds a list price genuinely above the showroom's,
 * and there are no "HOT" or "NEW" flags because the catalogue has no such
 * facts. Availability is not shown because the catalogue does not know it.
 */

const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

export default function RetailProductCard({
  product,
  tenantId,
  addLabel,
  eager = false,
  index,
  sourceContext = 'HOME_FEATURED',
}: {
  product: HomeProductView;
  tenantId: string;
  addLabel: string;
  eager?: boolean;
  /** 1-based position, shown as "01", where the card is one of a numbered set (a concept's hotspots). */
  index?: number;
  /** Recorded on the quote item: where the customer added it from. */
  sourceContext?: string;
}) {
  const { addCatalogItem, hasItem } = useQuote();
  const inQuote = hasItem(product.id);

  const discount =
    product.referencePrice && product.showroomPrice && product.referencePrice > product.showroomPrice
      ? Math.round((1 - product.showroomPrice / product.referencePrice) * 100)
      : null;

  const addToQuote = () =>
    addCatalogItem({
      catalogProductId: product.catalogProductId,
      productId: product.id,
      sourceType: product.sourceType,
      tenantId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      sku: product.sku,
      image: product.image,
      showroomPrice: product.showroomPrice,
      referencePrice: product.referencePrice,
      sourceContext,
    });

  return (
    <article
      className="group flex flex-col overflow-hidden bg-white transition-colors hover:border-[#D9D6D0]"
      style={{ border: '1px solid #ECEAE6', borderRadius: 'var(--tenant-radius)' }}
    >
      <Link href={product.href as Route} className="relative block aspect-square" tabIndex={-1} aria-hidden="true">
        <StageImage
          src={product.image}
          alt=""
          occupancy={opticalScale(product.category, product.name)}
          eager={eager}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-3 top-3 flex items-center gap-1.5">
          {index !== undefined && (
            <span
              className="grid h-6 min-w-6 place-items-center px-1"
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--tenant-accent-contrast)',
                backgroundColor: 'var(--tenant-accent)',
                borderRadius: 3,
              }}
            >
              {String(index).padStart(2, '0')}
            </span>
          )}
          <span
            className="bg-white px-2 py-1"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', color: '#6E6B66', borderRadius: 3 }}
          >
            {product.category.toUpperCase()}
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4 md:px-5">
        <p className="truncate" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', color: '#8A8782' }}>
          {product.brand.toUpperCase()}
          {product.sku && <span style={{ letterSpacing: '.04em' }}> · {product.sku}</span>}
        </p>

        <h3 className="mt-1.5 min-h-[44px]">
          <Link
            href={product.href as Route}
            className="line-clamp-2 transition-colors hover:text-[color:var(--tenant-accent-ink)]"
            style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: 'var(--tenant-ink)' }}
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {product.showroomPrice ? (
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--tenant-price, var(--tenant-ink))' }}>
              {formatVnd(product.showroomPrice)}
            </span>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--tenant-ink)' }}>Liên hệ báo giá</span>
          )}
          {discount !== null && discount > 0 && (
            <>
              <span style={{ fontSize: 12.5, color: '#9A9893', textDecoration: 'line-through' }}>
                {formatVnd(product.referencePrice!)}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tenant-discount, var(--tenant-ink))' }}>
                −{discount}%
              </span>
            </>
          )}
        </div>
        {product.showroomPrice && (
          <p className="mt-1" style={{ fontSize: 11.5, color: '#8A8782' }}>
            Giá tham khảo
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Link
            href={product.href as Route}
            className="transition-colors hover:text-[color:var(--tenant-accent-ink)]"
            style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.08em', color: 'var(--tenant-ink)' }}
          >
            XEM CHI TIẾT
          </Link>
          <button
            type="button"
            onClick={addToQuote}
            disabled={inQuote}
            aria-label={inQuote ? `${product.name} đã có trong giỏ báo giá` : `Thêm ${product.name} vào giỏ báo giá`}
            className={`inline-flex h-9 items-center gap-1.5 px-3.5 transition-colors ${
              inQuote
                ? 'cursor-default border-transparent bg-[color:var(--tenant-ui-soft,#EEF4F7)] text-[color:var(--tenant-ui-soft-contrast,#123C5A)]'
                : 'border-[color:var(--tenant-ink)] text-[color:var(--tenant-ink)] hover:border-[color:var(--tenant-accent)] hover:bg-[color:var(--tenant-accent)] hover:text-[color:var(--tenant-accent-contrast)]'
            }`}
            style={{ borderWidth: 1, borderStyle: 'solid', borderRadius: 'var(--tenant-radius)', fontSize: 11, fontWeight: 600, letterSpacing: '.08em' }}
          >
            {inQuote ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> ĐÃ THÊM
              </>
            ) : (
              addLabel
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
