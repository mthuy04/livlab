'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { FeaturedRoom, RoomHotspot } from '@/lib/storefront/homepageData';
import { TEXT } from './editorial';

/**
 * A room photograph with markers on it.
 *
 * Clicking a marker opens a small panel floating over the photo — you keep
 * looking at the room. On a phone it pins to the bottom of the image instead,
 * because a 280px card over a 390px screen is a modal with extra steps.
 */
export default function ShoppableSpace({ room }: { room: FeaturedRoom }) {
  const [activeId, setActiveId] = useState<string | null>(room.hotspots[0]?.id ?? null);
  const active = room.hotspots.find((h) => h.id === activeId) ?? null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[#EEEEEE] md:aspect-[16/8.5]">
      <Image
        src={room.image}
        alt={room.title}
        fill
        sizes="(max-width: 768px) 100vw, 1360px"
        className="object-cover"
      />

      {room.hotspots.map((spot) => (
        <button
          key={spot.id}
          type="button"
          aria-label={`Xem ${spot.name}`}
          aria-expanded={spot.id === activeId}
          onClick={() => setActiveId(activeId === spot.id ? null : spot.id)}
          className="absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[20px] font-light leading-none text-white transition-transform hover:scale-105"
          style={{
            left: `${spot.xPercent}%`,
            top: `${spot.yPercent}%`,
            backgroundColor: 'var(--tenant-accent)',
            border: '2px solid #FFFFFF',
          }}
        >
          {spot.id === activeId ? '×' : '+'}
        </button>
      ))}

      {active && <QuickView product={active} />}
    </div>
  );
}

function QuickView({ product }: { product: RoomHotspot }) {
  const price =
    product.priceRange ?? (product.priceMin ? `${product.priceMin.toLocaleString('vi-VN')}đ` : null);

  // Opens away from the nearer edge so it never clips off the photograph.
  const flip = product.xPercent > 55;

  return (
    <div
      className="absolute z-30 w-[280px] bg-white max-md:bottom-3 max-md:left-3 max-md:right-3 max-md:top-auto max-md:w-auto"
      style={{
        border: '1px solid #E2E2E2',
        // The page's only shadow: this floats over a photograph.
        boxShadow: '0 10px 30px rgba(0,0,0,.14)',
        left: flip ? undefined : `min(${product.xPercent + 3}%, calc(100% - 296px))`,
        right: flip ? `min(${100 - product.xPercent + 3}%, calc(100% - 296px))` : undefined,
        top: `clamp(12px, ${product.yPercent}% - 110px, calc(100% - 330px))`,
      }}
    >
      {product.imageUrl && (
        <div className="relative h-[145px]" style={{ backgroundColor: '#F8F8F6' }}>
          <Image src={product.imageUrl} alt="" fill sizes="280px" className="object-contain p-5" />
        </div>
      )}

      <div className="p-4">
        {product.brand && (
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.13em', color: '#666666' }}>
            {product.brand.toUpperCase()}
          </p>
        )}
        <p className="mt-2" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35, color: TEXT }}>
          {product.name}
        </p>
        {/* Omitted when the catalogue holds no price for this row. */}
        {price && (
          <p className="mt-2" style={{ fontSize: 13, color: '#555555' }}>
            {price}
          </p>
        )}

        <div
          className="mt-4 flex gap-5 pt-3"
          style={{ borderTop: '1px solid #E7E7E7', fontSize: 11, fontWeight: 600, letterSpacing: '.06em' }}
        >
          <Link
            href={`/products/${product.slug ?? product.id}` as Route}
            className="transition-opacity hover:opacity-60"
            style={{ color: TEXT }}
          >
            XEM CHI TIẾT →
          </Link>
          <Link
            href={'/room-studio' as Route}
            className="transition-opacity hover:opacity-60"
            style={{ color: 'var(--tenant-accent)' }}
          >
            THÊM VÀO PHÒNG
          </Link>
        </div>
      </div>
    </div>
  );
}
