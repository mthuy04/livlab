import Link from 'next/link';
import type { Route } from 'next';
import { ProductImagePlaceholder, StageImage } from '@/components/storefront/catalog/ProductImage';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import { DIVIDER, TEXT, TEXT_FAINT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import { formatVnd } from '@/lib/storefront/productDetailTypes';
import {
  MATCH_LABEL,
  ZONE_LABEL,
  type ConceptHotspotMatch,
  type ConceptProductView,
  type ConceptZone,
} from '@/lib/storefront/conceptTypes';

/**
 * The products in the room, grouped by zone.
 *
 * The two claims are separated rather than mixed into one list, because they
 * are different claims. "Sản phẩm trong concept" says the object in the
 * photograph is this product; "Sản phẩm gợi ý tương đồng" says the showroom
 * sells something very like it. For the Phase-1 library every row is the
 * second kind, and the note at the top says so plainly instead of letting the
 * grid imply the first.
 *
 * Empty zones are not rendered: a "BỒN TẮM" heading over nothing is how a
 * page starts looking like a template.
 */
export default function ConceptProductList({
  zones,
  exactCount,
}: {
  zones: Array<{ zone: ConceptZone; items: Array<{ product: ConceptProductView; match: ConceptHotspotMatch }> }>;
  exactCount: number;
}) {
  if (zones.length === 0) return null;

  const total = zones.reduce((n, z) => n + z.items.length, 0);

  return (
    <section className="home-container" style={{ paddingTop: 44 }}>
      <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 40 }}>
        <h2 style={{ fontSize: 'clamp(22px, 1.2rem + .6vw, 31px)', fontWeight: 500, lineHeight: 1.12, color: TEXT }}>
          SẢN PHẨM TRONG KHÔNG GIAN
        </h2>

        <p className="max-w-[640px]" style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.65, color: TEXT_MUTED }}>
          {exactCount === 0 ? (
            <>
              {total} sản phẩm showroom có bán, được chọn tương đồng với thiết bị trong ảnh. Ảnh
              concept là cảnh dựng minh hoạ, không phải ảnh chụp chính các sản phẩm này.
            </>
          ) : (
            <>
              {exactCount} sản phẩm xuất hiện trong ảnh, {total - exactCount} sản phẩm gợi ý tương đồng.
            </>
          )}
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {zones.map((group) => (
            <div key={group.zone}>
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '.12em',
                  color: TEXT_FAINT,
                  paddingBottom: 14,
                  borderBottom: `1px solid ${DIVIDER}`,
                }}
              >
                {ZONE_LABEL[group.zone]}
              </h3>

              {group.items.map(({ product, match }) => (
                <article
                  key={product.catalogProductId}
                  className="flex gap-5"
                  style={{ paddingBlock: 20, borderBottom: `1px solid ${DIVIDER}` }}
                >
                  <div style={{ width: 92, flexShrink: 0 }}>
                    {product.imagePresentable && product.image ? (
                      <StageImage
                        src={product.image}
                        alt={product.name}
                        stage="#F8F8F7"
                        occupancy={opticalScale(product.category, product.name) * 0.82}
                      />
                    ) : (
                      <div style={{ aspectRatio: '1' }}>
              <ProductImagePlaceholder brand={product.brand} sku={product.sku} />
            </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', color: TEXT_FAINT }}>
                      {product.brand.toUpperCase()}
                    </p>
                    <p style={{ marginTop: 5, fontSize: 14.5, lineHeight: 1.42, color: TEXT }}>
                      {product.name}
                    </p>
                    {product.sku && (
                      <p style={{ marginTop: 4, fontSize: 11.5, color: TEXT_FAINT }}>{product.sku}</p>
                    )}

                    {(match === 'EXACT_VISUAL' || match === 'CLOSE_VISUAL_MATCH') && (
                      <p style={{ marginTop: 8, fontSize: 11, color: TEXT_MUTED }}>
                        {MATCH_LABEL[match]}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      {product.showroomPrice != null && product.showroomPrice > 0 ? (
                        <p style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>
                          {formatVnd(product.showroomPrice)}
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: TEXT_MUTED }}>Liên hệ showroom</p>
                      )}
                      <Link
                        href={product.href as Route}
                        className="transition-opacity hover:opacity-60"
                        style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: TEXT }}
                      >
                        XEM CHI TIẾT →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
