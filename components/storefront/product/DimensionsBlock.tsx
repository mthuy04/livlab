'use client';

import { useState } from 'react';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import type { ProductDimensions, ProductDocument, TechnicalDrawing } from '@/lib/storefront/productDetailTypes';

const ROW_BORDER = '#E9E9E6';

/**
 * Dimensions beside the drawing — or on their own.
 *
 * Whether the drawing exists is only half the question: the drawings are
 * hotlinked from supplier and dealer hosts and some have been taken down
 * (INAX AC-900VRN-2's answers 404 today). The server cannot know that without
 * fetching every drawing on every render, so the client finds out and the
 * layout reflows: the dimensions take the full width rather than sitting next
 * to a grey apology.
 */
export default function DimensionsBlock({
  drawing,
  dimensions,
  drawingDocument,
  productName,
  brand,
}: {
  drawing: TechnicalDrawing | null;
  dimensions: ProductDimensions | null;
  drawingDocument: ProductDocument | null;
  productName: string;
  brand: string;
}) {
  const [drawingFailed, setDrawingFailed] = useState(false);
  const showDrawing = Boolean(drawing) && !drawingFailed;

  return (
    <div className={`mt-8 grid gap-10 ${showDrawing ? 'lg:grid-cols-[1.38fr_1fr] lg:gap-14' : ''}`}>
      {drawing && !drawingFailed && (
        <figure>
          <a
            href={drawing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-zoom-in"
            style={{ border: `1px solid ${DIVIDER}`, backgroundColor: '#FFFFFF' }}
            aria-label={`Mở bản vẽ kỹ thuật ${productName} ở kích thước đầy đủ`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={drawing.url}
              alt={`Bản vẽ kỹ thuật ${productName}`}
              loading="lazy"
              decoding="async"
              onError={() => setDrawingFailed(true)}
              // Height is capped independently of width. A drawing rendered
              // at its natural size made this section taller than the screen
              // to show labels the original PDF shows better; the full-size
              // view and the source document are one click away.
              className="w-full object-contain"
              style={{ height: 'clamp(300px, 46vh, 520px)', padding: '1.5%' }}
            />
          </a>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>
              {drawing.attribution ? `Bản vẽ kỹ thuật: ${drawing.attribution}` : 'Bản vẽ do nguồn cung cấp'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: TEXT }}>
              XEM TOÀN BỘ BẢN VẼ →
            </span>
          </figcaption>
        </figure>
      )}

      {dimensions && (
        <div>
          <dl className={showDrawing ? 'grid grid-cols-2 gap-x-10' : 'grid grid-cols-2 gap-x-10 md:grid-cols-4'}>
            {dimensions.rows.map((row) => (
              <div key={row.label} className="py-5" style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
                <dt style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.11em', color: TEXT_MUTED }}>
                  {row.label}
                </dt>
                <dd className="mt-2 flex items-baseline gap-1.5">
                  <span style={{ fontSize: 29, fontWeight: 500, lineHeight: 1, color: TEXT }}>{row.value}</span>
                  <span style={{ fontSize: 13, color: TEXT_MUTED }}>{row.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* The raw string used to be printed here, which simply repeated
              the four numbers immediately above it. What is worth saying is
              where they come from. */}
          <p className="mt-5" style={{ fontSize: 12.5, lineHeight: 1.55, color: TEXT_MUTED }}>
            Thông số theo tài liệu kỹ thuật của {brand}.
          </p>

          {drawingDocument && (
            <p className="mt-6">
              <a
                href={drawingDocument.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity duration-150 hover:opacity-60"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}
              >
                {drawingDocument.action === 'DOWNLOAD' ? 'TẢI BẢN VẼ' : 'XEM BẢN VẼ GỐC'} ({drawingDocument.format}) →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
