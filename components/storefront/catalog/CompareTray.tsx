'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { TEXT, DIVIDER, STAGE } from '@/components/storefront/home/editorial';

/** The sticky tray that appears once something is selected for comparison. */
export default function CompareTray({
  products,
  onRemove,
  onClear,
}: {
  products: CatalogProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (products.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-white"
      style={{ borderTop: `1px solid ${DIVIDER}`, boxShadow: '0 -6px 24px rgba(0,0,0,.08)' }}
    >
      <div className="home-container flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5">
        <p className="shrink-0" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
          SO SÁNH SẢN PHẨM
        </p>

        <ul className="flex flex-1 flex-wrap items-center gap-3">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 pr-2" style={{ border: `1px solid ${DIVIDER}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                className="h-11 w-11 shrink-0 object-contain"
                style={{ backgroundColor: STAGE }}
              />
              <span className="max-w-[160px] truncate" style={{ fontSize: 13, color: TEXT }}>
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label={`Bỏ ${p.name} khỏi so sánh`}
                className="px-1 transition-opacity hover:opacity-60"
                style={{ fontSize: 15, color: '#777777' }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-5">
          <button
            type="button"
            onClick={onClear}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: '#777777' }}
          >
            XÓA
          </button>
          <Link
            href={`/compare?ids=${products.map((p) => p.id).join(',')}` as Route}
            className="inline-flex items-center transition-opacity hover:opacity-85"
            style={{
              height: 40,
              paddingInline: 20,
              backgroundColor: 'var(--tenant-accent)',
              color: 'var(--tenant-accent-contrast)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.08em',
            }}
          >
            SO SÁNH NGAY
          </Link>
        </div>
      </div>
    </div>
  );
}
