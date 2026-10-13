import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { FeaturedRoom } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';

/**
 * A room photograph with product markers.
 *
 * A marker is a link, not a toggle: clicking it opens that product. The old
 * popup made you click twice to reach the same page and covered the room while
 * you did it. The room's products are also listed under the photograph, so the
 * same products are reachable on a phone, where there is no hover.
 *
 * Server component — there is no state left to hold.
 */
export default function ShoppableSpace({ room }: { room: FeaturedRoom }) {
  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  // The detail page resolves a product by slug OR by id, and most catalogue
  // rows carry no slug, so the id is the working link for them.
  const hrefFor = (p: { slug: string | null; id: string }) => `/products/${p.slug ?? p.id}` as Route;

  return (
    <div>
      <div className="relative">
        <Image
          src={room.image}
          alt={room.title}
          width={2400}
          height={1350}
          sizes="100vw"
          priority={false}
          className="aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
        />

        {room.hotspots.map((hotspot) => {
          // The label opens away from the nearer edge so it never clips.
          const flip = hotspot.xPercent > 58;
          return (
            <Link
              key={hotspot.id}
              href={hrefFor(hotspot)}
              aria-label={`${hotspot.label}: ${hotspot.name}`}
              className="group absolute hidden -translate-x-1/2 -translate-y-1/2 sm:block"
              style={{ left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%` }}
            >
              <span
                aria-hidden="true"
                className="grid place-items-center rounded-full transition-transform duration-200 group-hover:scale-110"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: 'rgba(255,255,255,0.94)',
                  color: '#141412',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.28)',
                  fontSize: 21,
                  fontWeight: 400,
                  lineHeight: 1,
                  paddingBottom: 2,
                }}
              >
                +
              </span>

              {/* Reveals on hover and on keyboard focus; never a click target. */}
              <span
                className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
                style={{
                  [flip ? 'right' : 'left']: 44,
                  backgroundColor: '#141412',
                  color: '#FFFFFF',
                  padding: '9px 14px',
                  fontSize: 13,
                  lineHeight: 1.45,
                } as React.CSSProperties}
              >
                <span style={{ letterSpacing: '0.06em', opacity: 0.6 }}>{hotspot.label.toUpperCase()}</span>
                <br />
                <span style={{ fontWeight: 600 }}>{hotspot.name}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* The same products as text, which is how they are reached on a phone. */}
      {room.products.length > 0 && (
        <Container className="mt-10 lg:mt-12">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ borderTop: '1px solid #DEDCD7' }}>
            {room.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={hrefFor(product)}
                  className="flex h-full items-center gap-5 py-6 pr-6 transition-opacity hover:opacity-60"
                >
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt=""
                      width={120}
                      height={120}
                      className="h-[64px] w-[64px] shrink-0 object-contain"
                    />
                  )}
                  <span className="min-w-0">
                    {product.brand && (
                      <span className="block text-[11px]" style={{ color: '#86837C', letterSpacing: '0.12em', fontWeight: 600 }}>
                        {product.brand.toUpperCase()}
                      </span>
                    )}
                    <span className="mt-1 block text-[15px] leading-snug" style={{ color: '#141412', fontWeight: 600 }}>
                      {product.name}
                    </span>
                    {/* Omitted when the catalogue holds no price for this row. */}
                    {product.priceMin ? (
                      <span className="mt-1 block text-[14px]" style={{ color: '#4A4844' }}>
                        {money(product.priceMin)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}
    </div>
  );
}
