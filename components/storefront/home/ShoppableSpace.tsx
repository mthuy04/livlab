'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { FeaturedRoom, RoomHotspot } from '@/lib/storefront/homepageData';
import { DIVIDER, TEXT, TEXT_MUTED } from './editorial';

/**
 * A room photograph with markers on it.
 *
 * Nothing but the room is shown until a marker is clicked; the product then
 * appears in a small panel floating beside it, which is the whole point —
 * you keep looking at the room. On a phone the panel becomes a bottom sheet,
 * because a 300px card over a 390px screen is a modal with extra steps.
 */
export default function ShoppableSpace({ room }: { room: FeaturedRoom }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = room.hotspots.find((h) => h.id === activeId) ?? null;

  return (
    <div className="relative">
      <div className="relative">
        <Image
          src={room.image}
          alt={room.title}
          width={1672}
          height={941}
          sizes="100vw"
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]"
        />

        {room.hotspots.map((hotspot) => {
          const isActive = hotspot.id === activeId;
          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => setActiveId(isActive ? null : hotspot.id)}
              aria-expanded={isActive}
              aria-label={`${hotspot.label}: ${hotspot.name}`}
              // 44px hit target, 32px visible marker.
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center transition-transform duration-200 hover:scale-105"
              style={{ left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%`, width: 44, height: 44 }}
            >
              <span
                aria-hidden="true"
                className="grid place-items-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: isActive ? '#FFFFFF' : 'var(--tenant-accent)',
                  color: isActive ? TEXT : 'var(--tenant-accent-contrast)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  fontSize: 19,
                  fontWeight: 400,
                  lineHeight: 1,
                  paddingBottom: 2,
                }}
              >
                {isActive ? '×' : '+'}
              </span>
            </button>
          );
        })}

        {active && (
          <div
            className="absolute z-10 hidden w-[278px] sm:block"
            style={{
              left: `clamp(16px, ${active.xPercent}% + 30px, calc(100% - 294px))`,
              // 300px is the panel's own height, so it never spills past the photo.
              top: `clamp(16px, ${active.yPercent}% - 60px, calc(100% - 300px))`,
            }}
          >
            <QuickView product={active} />
          </div>
        )}
      </div>

      {/* Bottom sheet on a phone, where there is no room beside the marker. */}
      {active && (
        <div className="sm:hidden">
          <QuickView product={active} />
        </div>
      )}
    </div>
  );
}

function QuickView({ product }: { product: RoomHotspot }) {
  const price =
    product.priceRange ??
    (product.priceMin ? `${product.priceMin.toLocaleString('vi-VN')}đ` : null);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${DIVIDER}`,
        borderRadius: 2,
        // The page's only shadow: this floats over a photograph.
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
      }}
    >
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt=""
          width={560}
          height={312}
          sizes="278px"
          className="w-full object-contain"
          style={{ height: 156, backgroundColor: '#F6F6F5' }}
        />
      )}
      <div className="px-4 pb-4 pt-3.5">
        {product.brand && (
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.1em', color: TEXT_MUTED }}>
            {product.brand.toUpperCase()}
          </p>
        )}
        <p className="mt-1.5" style={{ fontSize: 15, lineHeight: 1.4, fontWeight: 500, color: TEXT }}>
          {product.name}
        </p>
        {/* Omitted when the catalogue holds no price for this row. */}
        {price && (
          <p className="mt-2" style={{ fontSize: 14, color: TEXT }}>
            {price}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Link
            href={`/products/${product.slug ?? product.id}` as Route}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.06em', color: TEXT }}
          >
            XEM CHI TIẾT →
          </Link>
          <Link
            href={'/room-studio' as Route}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.06em', color: 'var(--tenant-accent)' }}
          >
            THÊM VÀO PHÒNG
          </Link>
        </div>
      </div>
    </div>
  );
}
