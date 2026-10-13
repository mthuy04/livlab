'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { TEXT, TEXT_FAINT, STAGE } from '@/components/storefront/home/editorial';

/**
 * The comparison tray.
 *
 * A toolbar, not a second catalogue: 72px tall, no box around each selection,
 * items separated by a hairline. It sits over the page, so it stays as short
 * as it can while still naming what is selected.
 */
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
      style={{ borderTop: '1px solid #DCDCD9', boxShadow: '0 -2px 10px rgba(0,0,0,.05)' }}
    >
      <div className="home-container flex items-center gap-x-6 overflow-x-auto py-3 no-scrollbar" style={{ minHeight: 72 }}>
        <p className="shrink-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent)' }}>
          SO SÁNH · {products.length}
        </p>

        <ul className="flex flex-1 items-center">
          {products.map((p, index) => (
            <li
              key={p.id}
              className="flex shrink-0 items-center gap-3 px-5"
              style={{ borderLeft: index > 0 ? '1px solid #ECECEA' : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                className="shrink-0 object-contain"
                style={{ width: 38, height: 38, backgroundColor: STAGE }}
              />
              <span className="truncate" style={{ maxWidth: 136, fontSize: 13, color: TEXT }}>
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label={`Bỏ ${p.name} khỏi so sánh`}
                className="transition-opacity hover:opacity-60"
                style={{ fontSize: 15, color: TEXT_FAINT }}
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
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: TEXT_FAINT }}
          >
            XÓA
          </button>
          <Link
            href={`/compare?ids=${products.map((p) => p.id).join(',')}` as Route}
            className="inline-flex items-center transition-opacity hover:opacity-85"
            style={{
              height: 40,
              paddingInline: 18,
              backgroundColor: 'var(--tenant-accent)',
              color: 'var(--tenant-accent-contrast)',
              fontSize: 11,
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
