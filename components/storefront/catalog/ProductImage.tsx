'use client';

import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import { TEXT, TEXT_FAINT } from '@/components/storefront/home/editorial';

/**
 * A product on its stage.
 *
 * One component for the grid, the quick view and the comparison table, so a
 * product is never cropped two different ways on two pages. The stage is a
 * plain square; inside it the product is scaled to a per-category optical
 * size, because source photography frames a toilet and a towel rail nothing
 * alike and a single scale leaves one of them a speck.
 *
 * When the image audit rejected the asset — a dealer's phone number, a QR
 * code, a bouquet, another showroom's URL — nothing is painted out. The
 * product shows a neutral placeholder instead, which is more honest than an
 * advert and better looking than a watermark.
 */
export default function ProductImage({
  product,
  stage,
  eager = false,
}: {
  product: CatalogProduct;
  /** The stage background. Compare uses a slightly lighter plate. */
  stage: string;
  eager?: boolean;
}) {
  if (!product.imagePresentable || !product.image) {
    return <ProductImagePlaceholder product={product} />;
  }

  const scale = opticalScale(product.category, product.name);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      style={{ backgroundColor: stage, padding: `${Math.round((1 - scale) * 50)}%` }}
    />
  );
}

/** Brand, SKU and a plain line. No illustration, no invented product. */
export function ProductImagePlaceholder({ product }: { product: CatalogProduct }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center"
      style={{ backgroundColor: '#F6F6F4' }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}>
        {product.brand.toUpperCase()}
      </span>
      {product.sku && (
        <span style={{ fontSize: 11.5, color: TEXT_FAINT }}>{product.sku}</span>
      )}
      <span className="mt-1" style={{ fontSize: 11, color: TEXT_FAINT }}>
        Ảnh sản phẩm đang cập nhật
      </span>
    </div>
  );
}
