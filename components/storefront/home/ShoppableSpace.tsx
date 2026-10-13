'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { FeaturedRoom } from '@/lib/storefront/homepageData';

/**
 * A room photograph with product markers, after the INAX S600 interaction.
 *
 * The popup floats beside the marker rather than taking over the screen —
 * the point of a shoppable room is that you keep seeing the room. On a phone
 * it becomes a sheet below the image instead, because a 300px card floating
 * over a 390px screen is a modal with extra steps.
 */
export default function ShoppableSpace({ room }: { room: FeaturedRoom }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = room.hotspots.find((h) => h.id === activeId) ?? null;

  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  return (
    <div className="relative">
      <div className="relative overflow-hidden">
        <Image
          src={room.image}
          alt={room.title}
          width={2000}
          height={1125}
          sizes="100vw"
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]"
        />

        {room.hotspots.map((hotspot) => {
          const isActive = hotspot.id === activeId;
          return (
            <button
              key={hotspot.id}
              onClick={() => setActiveId(isActive ? null : hotspot.id)}
              aria-label={`${hotspot.label}: ${hotspot.name}`}
              aria-expanded={isActive}
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform duration-200 hover:scale-105"
              style={{
                left: `${hotspot.xPercent}%`,
                top: `${hotspot.yPercent}%`,
                width: 32,
                height: 32,
                backgroundColor: 'var(--tenant-accent)',
                color: 'var(--tenant-accent-contrast)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                fontSize: 20,
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              <span aria-hidden="true" style={{ marginTop: -2 }}>
                {isActive ? '×' : '+'}
              </span>
            </button>
          );
        })}

        {active && (
          <div
            className="absolute z-10 hidden w-[300px] sm:block"
            style={{
              left: `clamp(16px, ${active.xPercent}% + 28px, calc(100% - 316px))`,
              top: `clamp(16px, ${active.yPercent}% - 36px, calc(100% - 210px))`,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E3E3',
              // The one shadow on the page: it floats over a photograph and
              // needs separating from it.
              boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
              borderRadius: 2,
            }}
          >
            <PopupBody product={active} money={money} />
          </div>
        )}
      </div>

      {active && (
        <div
          className="mt-px sm:hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: 2 }}
        >
          <PopupBody product={active} money={money} />
        </div>
      )}
    </div>
  );
}

function PopupBody({
  product,
  money,
}: {
  product: FeaturedRoom['hotspots'][number];
  money: (v: number) => string;
}) {
  return (
    <div className="p-4">
      <div className="flex gap-3">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 object-contain"
            style={{ backgroundColor: '#F6F6F5' }}
          />
        )}
        <div className="min-w-0">
          {product.brand && (
            <p className="text-[12px]" style={{ color: '#666666' }}>
              {product.brand}
            </p>
          )}
          <p className="text-[15px] leading-snug" style={{ color: '#252525' }}>
            {product.name}
          </p>
          {/* Omitted when the catalogue holds no price for this row. */}
          {product.priceMin ? (
            <p className="mt-1 text-[15px] font-medium" style={{ color: '#252525' }}>
              {money(product.priceMin)}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        href={(product.slug ? `/products/${product.slug}` : '/products') as Route}
        className="mt-3 inline-block text-[13px] transition-opacity hover:opacity-60"
        style={{ color: 'var(--tenant-accent)' }}
      >
        Xem chi tiết →
      </Link>
    </div>
  );
}
