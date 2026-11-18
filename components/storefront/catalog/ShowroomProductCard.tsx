'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Bookmark, Check, Plus } from 'lucide-react';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { useQuote } from '@/lib/context/QuoteContext';
import s from './ShowroomCatalog.module.css';

const vnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

/**
 * The showroom catalogue card: a large stone stage, then brand and model,
 * the name, a labelled price, and two clear actions — details, or straight
 * into the quote basket. Compare and save stay one tap away.
 */
export default function ShowroomProductCard({
  product,
  tenantId,
  eager = false,
  saved,
  comparing,
  onToggleSave,
  onToggleCompare,
  onQuickView,
}: {
  product: CatalogProduct;
  tenantId: string;
  eager?: boolean;
  saved: boolean;
  comparing: boolean;
  onToggleSave: (id: string) => void;
  onToggleCompare: (product: CatalogProduct) => void;
  onQuickView: (product: CatalogProduct) => void;
}) {
  const { addCatalogItem, hasItem, openDrawer } = useQuote();
  const inQuote = hasItem(product.id);
  const discount =
    product.referencePrice && product.showroomPrice
      ? Math.round((1 - product.showroomPrice / product.referencePrice) * 100)
      : 0;

  return (
    <article className={s.card}>
      <div className={s.stage}>
        <button type="button" onClick={() => onQuickView(product)} aria-label={`Xem nhanh ${product.name}`} className={s.stageButton}>
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 30vw"
              priority={eager}
              unoptimized={product.image.startsWith('http')}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => onToggleSave(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`}
          className={s.save}
        >
          <Bookmark aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        </button>
        <span className={s.quickHint} aria-hidden="true">Xem nhanh</span>
      </div>

      <div className={s.body}>
        <p className={s.meta}>
          <b>{product.brand}</b>
          {product.sku ? ` · ${product.sku}` : ''}
        </p>
        <h3 className={s.title}>
          <Link href={product.href as Route}>{product.name}</Link>
        </h3>

        <div className={s.priceBlock}>
          {product.showroomPrice ? (
            <>
              <p className={s.priceLabel}>{product.priceBasis ?? 'Giá tham khảo'}</p>
              <p className={s.price}>
                <strong>{vnd(product.showroomPrice)}</strong>
                {product.referencePrice && discount > 0 && (
                  <>
                    <s>{vnd(product.referencePrice)}</s>
                    <em>−{discount}%</em>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className={s.price}>
              <strong>Liên hệ báo giá</strong>
            </p>
          )}
        </div>

        <div className={s.actions}>
          <Link href={product.href as Route} className={s.detail}>
            Xem chi tiết
          </Link>
          <button
            type="button"
            className={s.quote}
            data-added={inQuote}
            onClick={() => {
              if (!inQuote) {
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
                  sourceContext: 'CATALOG',
                });
              }
              openDrawer();
            }}
          >
            {inQuote ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {inQuote ? 'Đã thêm' : 'Báo giá'}
          </button>
        </div>

        <label className={s.compare}>
          <input type="checkbox" checked={comparing} onChange={() => onToggleCompare(product)} />
          So sánh
        </label>
      </div>
    </article>
  );
}
