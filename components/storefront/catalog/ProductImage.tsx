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
 * How much of a normalised asset's own canvas the product occupies.
 *
 * `scripts/normalize_product_images.py` trims the empty margin and re-centres
 * the product on a square canvas with a fixed safe padding, which measures
 * 89.3% across every asset it has produced. Knowing that number is what lets
 * the detail stage hit its occupancy target: padding the box by the naive
 * `(1 - target)/2` on top of the asset's own margin compounds the two and
 * lands a toilet at 77% of the frame instead of 86%.
 *
 * Only applied where `normalized` says the trimmed copy is what is being
 * served. An un-normalised source has an unknown margin, so the conservative
 * padding stays.
 */
const NORMALIZED_ASSET_FILL = 0.893;

export function stagePadding(occupancy: number, normalized: boolean): number {
  const target = normalized ? Math.min(1, occupancy / NORMALIZED_ASSET_FILL) : occupancy;
  return Math.max(0, Math.round((1 - target) * 50 * 10) / 10);
}

/**
 * A product on its stage.
 *
 * One component for the grid, the quick view, the comparison table, the tray
 * and the detail page, so a product is never framed two different ways on two
 * pages.
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
    return <ProductImagePlaceholder brand={product.brand} sku={product.sku} />;
  }

  return (
    <StageImage
      src={product.image}
      alt={product.name}
      stage={stage}
      occupancy={opticalScale(product.category, product.name) * VARIANT_TIGHTNESS[variant]}
      // The grid's framing predates the measurement above and is left as it
      // is; only the detail stage, which is where a small product is actually
      // a problem, uses the asset-aware padding.
      normalized={variant === 'DETAIL' && Boolean(product.imageProvenance)}
      eager={eager}
    />
  );
}

/**
 * The stage without a `CatalogProduct` to hand.
 *
 * Detail and its related-product row carry a view model, not a catalogue row,
 * and should not have to fabricate one to reuse the framing rules.
 */
export function StageImage({
  src,
  alt,
  occupancy,
  normalized = false,
  stage = '#FFFFFF',
  eager = false,
  sizes,
  className = '',
}: {
  src: string;
  alt: string;
  occupancy: number;
  normalized?: boolean;
  stage?: string;
  eager?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      {...(eager ? { fetchPriority: 'high' as const } : {})}
      decoding="async"
      sizes={sizes}
      className={`h-full w-full object-contain ${className}`}
      style={{ backgroundColor: stage, padding: `${stagePadding(occupancy, normalized)}%` }}
    />
  );
}

/** Brand, SKU and a plain line. No illustration, no invented product. */
export function ProductImagePlaceholder({
  brand,
  sku,
}: {
  brand: string;
  sku: string | null;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center"
      style={{ backgroundColor: '#F6F6F4' }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}>
        {brand.toUpperCase()}
      </span>
      {sku && <span style={{ fontSize: 11.5, color: TEXT_FAINT }}>{sku}</span>}
      <span className="mt-1" style={{ fontSize: 11, color: TEXT_FAINT }}>
        Ảnh sản phẩm đang cập nhật
      </span>
    </div>
  );
}
