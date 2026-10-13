import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { FeaturedRoom as FeaturedRoomData } from '@/lib/storefront/homepageData';

/**
 * A room and the products that make it.
 *
 * This started as a GROHE-style shoppable image with markers pinned over the
 * photograph. The data does not support that: all thirty concepts share two
 * placeholder coordinate pairs (45,55 and 45,45), so a marker would sit in the
 * same arbitrary spot on every room and point at nothing in the picture.
 *
 * Listing the products beside the room says the same true thing — these items
 * are in this space, here is what they cost — without pretending to a
 * precision the data has not got. Pinned hotspots become correct the moment
 * someone authors real coordinates.
 */
export default function FeaturedRoom({ room }: { room: FeaturedRoomData }) {
  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
      <div className="overflow-hidden" style={{ borderRadius: 'var(--sf-radius)' }}>
        <Image
          src={room.image}
          alt={room.title}
          width={1672}
          height={941}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="aspect-[4/3] w-full object-cover lg:aspect-[16/11]"
        />
      </div>

      <div className="flex flex-col">
        <h3 className="sf-h3">{room.title}</h3>

        <ul className="mt-6 flex-1">
          {room.products.map((product) => (
            <li key={product.id} style={{ borderTop: '1px solid var(--sf-border)' }}>
              <Link
                href={(product.slug ? `/products/${product.slug}` : '/products') as Route}
                className="flex items-center gap-3 py-3 transition-opacity hover:opacity-70"
              >
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 object-contain"
                    style={{ backgroundColor: 'var(--sf-surface-muted)', borderRadius: 'var(--sf-radius-sm)' }}
                  />
                )}
                <span className="min-w-0 flex-1">
                  {product.brand && (
                    <span
                      className="sf-caption block uppercase"
                      style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.08em' }}
                    >
                      {product.brand}
                    </span>
                  )}
                  <span className="block text-[14px] leading-snug">{product.name}</span>
                </span>
                {/* Absent when the catalogue has no price for this row. */}
                {product.priceMin ? (
                  <span className="shrink-0 text-[14px] font-semibold">{money(product.priceMin)}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6" style={{ borderTop: '1px solid var(--sf-border)', paddingTop: '1rem' }}>
          {room.priceTo ? (
            <p className="sf-caption" style={{ color: 'var(--sf-text-muted)' }}>
              {room.products.length} sản phẩm · trọn bộ khoảng {money(room.priceTo)} theo giá tham khảo
            </p>
          ) : (
            <p className="sf-caption" style={{ color: 'var(--sf-text-muted)' }}>
              {room.products.length} sản phẩm
            </p>
          )}
          <Link href={`/concepts/${room.slug}` as Route} className="sf-link mt-3">
            Dùng không gian này làm điểm bắt đầu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
