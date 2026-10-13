'use client';

import { useEffect, useMemo, useState } from 'react';
import { StageImage, ProductImagePlaceholder } from '@/components/storefront/catalog/ProductImage';
import { DIVIDER, TEXT } from '@/components/storefront/home/editorial';
import type { ProductMedia, ProductMediaItem } from '@/lib/storefront/productDetailTypes';

/**
 * The product's media.
 *
 * One stage, and a thumbnail rail only when there is genuinely more than one
 * verified asset. The rail is not padded out with alternate angles the data
 * does not have — a gallery of one is honest, a gallery of five photographs
 * of other SKUs is not.
 *
 * Remote assets are the reason this is a client island rather than markup.
 * The technical drawings are hotlinked from supplier and dealer hosts and
 * some of them have gone: INAX AC-900VRN-2's drawing URL answers 404 today.
 * A broken image on a product page is worse than no drawing, so anything that
 * fails to load is dropped from the rail and from the stage.
 */
export default function ProductGallery({
  media,
  brand,
  sku,
  name,
}: {
  media: ProductMedia;
  brand: string;
  sku: string | null;
  name: string;
}) {
  const [broken, setBroken] = useState<string[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(media.gallery[0]?.url ?? null);
  const [zoomed, setZoomed] = useState(false);

  const items = useMemo(
    () => media.gallery.filter((item) => !broken.includes(item.url)),
    [media.gallery, broken]
  );

  // Derived, not synchronised: when the selected asset turns out to be dead
  // it drops out of `items` and the stage falls through to the next one on
  // the very same render.
  const active: ProductMediaItem | null =
    items.find((item) => item.url === activeUrl) ?? items[0] ?? null;

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [zoomed]);

  const fail = (url: string) => setBroken((current) => (current.includes(url) ? current : [...current, url]));

  if (!media.presentable || !active) {
    return (
      <div style={{ aspectRatio: '1 / 1', border: `1px solid ${DIVIDER}` }}>
        <ProductImagePlaceholder brand={brand} sku={sku} />
      </div>
    );
  }

  const isDrawing = active.kind === 'DRAWING';

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Phóng to ảnh ${name}`}
          className="block w-full cursor-zoom-in overflow-hidden"
          style={{ aspectRatio: '1 / 1', border: `1px solid ${DIVIDER}`, backgroundColor: '#FFFFFF' }}
        >
          <StageImage
            src={active.url}
            alt={active.alt}
            // A drawing is a document: it is read, not optically balanced
            // against other products, so it gets the frame rather than a
            // category occupancy meant for a photograph.
            occupancy={isDrawing ? 0.96 : media.occupancy}
            normalized={isDrawing ? false : media.normalized}
            eager
            sizes="(max-width: 1023px) 100vw, 58vw"
          />
        </button>

        {items.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto" role="group" aria-label="Ảnh sản phẩm">
            {items.map((item) => {
              const selected = item.url === active.url;
              return (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => setActiveUrl(item.url)}
                  aria-label={item.kind === 'DRAWING' ? `Xem bản vẽ kỹ thuật ${name}` : `Xem ảnh ${name}`}
                  aria-pressed={selected}
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: 76,
                    height: 76,
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${selected ? TEXT : DIVIDER}`,
                  }}
                >
                  <StageImage
                    src={item.url}
                    alt=""
                    occupancy={item.kind === 'DRAWING' ? 0.94 : media.occupancy * 0.9}
                    normalized={item.kind === 'DRAWING' ? false : media.normalized}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Loaded off-screen so a dead URL is removed before it is ever shown
            as the stage or as a thumbnail. */}
        <div aria-hidden="true" className="hidden">
          {media.gallery.map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.url} src={item.url} alt="" onError={() => fail(item.url)} />
          ))}
        </div>
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(20,20,19,.88)' }}
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Đóng"
            className="absolute right-5 top-5"
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.10em', color: '#FFFFFF' }}
            autoFocus
          >
            ĐÓNG ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.alt}
            className="max-h-[86vh] max-w-[86vw] object-contain"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(event) => event.stopPropagation()}
          />
          <p
            className="absolute bottom-6 left-0 right-0 text-center"
            style={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}
          >
            {isDrawing ? 'Bản vẽ kỹ thuật' : name}
          </p>
        </div>
      )}
    </>
  );
}
