'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
/**
 * The stage's height is set by the viewport, not by the column's width.
 *
 * It used to be `aspect-ratio: 1 / 1`, which made the stage as tall as the
 * media column is wide: 776px at a 1536px viewport, so the product's own
 * photograph ran to y=959 of a 960px screen and the thumbnail rail beneath it
 * was never on screen at all. A customer had to scroll to finish looking at
 * the product before they could begin reading about it.
 *
 * Height is now viewport-aware and clamped at both ends, so a tall display
 * gets a larger stage while a 900px laptop keeps the whole overview — image,
 * price, facts and the quote button — in one view.
 */
const STAGE_HEIGHT = 'h-[clamp(340px,50vh,430px)] lg:h-[clamp(500px,58vh,590px)]';

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

  // Stable, so the lightbox's key handler is bound once rather than on every
  // render.
  const step = useCallback(
    (delta: number) => {
      if (items.length < 2) return;
      const at = items.findIndex((item) => item.url === activeUrl);
      const next = items[(((at < 0 ? 0 : at) + delta) % items.length + items.length) % items.length];
      setActiveUrl(next.url);
    },
    [items, activeUrl]
  );

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [zoomed, step]);

  const fail = (url: string) => setBroken((current) => (current.includes(url) ? current : [...current, url]));

  if (!media.presentable || !active) {
    return (
      <div className={STAGE_HEIGHT} style={{ border: `1px solid ${DIVIDER}` }}>
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
          className={`block w-full cursor-zoom-in overflow-hidden ${STAGE_HEIGHT}`}
          style={{ border: '1px solid #ECECE8', backgroundColor: '#FFFFFF' }}
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
                  className="relative shrink-0 overflow-hidden transition-colors duration-150"
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
                  {/* A dimensioned drawing is not another photograph of the
                      product, and at 76px it can easily be taken for one. */}
                  {item.kind === 'DRAWING' && (
                    <span
                      className="absolute inset-x-0 bottom-0 text-center"
                      style={{
                        fontSize: 8.5,
                        fontWeight: 600,
                        letterSpacing: '.10em',
                        color: '#FFFFFF',
                        backgroundColor: 'rgba(38,38,38,.72)',
                        paddingBlock: 2,
                      }}
                    >
                      BẢN VẼ
                    </span>
                  )}
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

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Ảnh trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-6 transition-opacity duration-150 hover:opacity-60"
                style={{ fontSize: 26, lineHeight: 1, color: '#FFFFFF' }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Ảnh tiếp theo"
                className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-6 transition-opacity duration-150 hover:opacity-60"
                style={{ fontSize: 26, lineHeight: 1, color: '#FFFFFF' }}
              >
                ›
              </button>
            </>
          )}
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
