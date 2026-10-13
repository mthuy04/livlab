'use client';

import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import { TEXT, TEXT_FAINT } from '@/components/storefront/home/editorial';

/** Where the image is being rendered. Each surface wants a different frame. */
export type ImageVariant = 'GRID' | 'COMPARE' | 'THUMBNAIL' | 'DETAIL';

/** How tightly the product sits to the frame, per surface. */
const VARIANT_TIGHTNESS: Record<ImageVariant, number> = {
  GRID: 1,
  COMPARE: 0.96,
  THUMBNAIL: 0.88,
  DETAIL: 1,
};

/**
 * A product on its stage.
 *
 * One component for the grid, the quick view, the comparison table, the tray
 * and later the quote summary, so a product is never framed two different
 * ways on two pages.
 *
 * The stage is a single white square. It used to be cream, which turned every
 * white-background manufacturer JPEG into a cream rectangle holding a white
 * rectangle holding a small product — three nested frames. The imagery is now
 * trimmed of its empty margin before it ever reaches here, so one canvas
 * holds one product, scaled to a per-category optical size.
 *
 * When the image audit rejected the asset — a dealer's phone number, a QR
 * code, a bouquet, another showroom's URL — nothing is painted out. The
 * product shows a neutral placeholder instead, which is more honest than an
 * advert and better looking than a watermark.
 */
export default function ProductImage({
  product,
  stage = '#FFFFFF',
  variant = 'GRID',
  eager = false,
}: {
  product: CatalogProduct;
  /** Almost always white: the trimmed asset provides its own breathing room. */
  stage?: string;
  variant?: ImageVariant;
  eager?: boolean;
}) {
  if (!product.imagePresentable || !product.image) {
    return <ProductImagePlaceholder product={product} />;
  }

  const occupancy = opticalScale(product.category, product.name) * VARIANT_TIGHTNESS[variant];
  // The padding is what is left over once the product has its share.
  const padding = Math.max(0, Math.round((1 - occupancy) * 50));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      style={{ backgroundColor: stage, padding: `${padding}%` }}
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
