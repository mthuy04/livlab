'use client';

import Link from 'next/link';
import { Copy, ExternalLink, RotateCw, Trash2, Wallet } from 'lucide-react';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import { getRealWorldSize } from '@/lib/room-studio/assetResolver';

interface SelectedProductToolbarProps {
  selection: PlacedProductView;
  isInQuote: boolean;
  onRotate: (instanceId: string, deltaRadians: number) => void;
  onDuplicate: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onAddToQuote: (view: PlacedProductView) => void;
}

const QUARTER_TURN = Math.PI / 2;

/**
 * Contextual controls for the selected product.
 *
 * Deliberately six plain buttons rather than a transform gizmo: rotate in
 * quarter turns, duplicate, remove, open the product page, add to the quote.
 * Moving happens by dragging the product itself, which needs no control at all.
 */
export default function SelectedProductToolbar({
  selection,
  isInQuote,
  onRotate,
  onDuplicate,
  onRemove,
  onAddToQuote,
}: SelectedProductToolbarProps) {
  const { placed, product } = selection;
  const size = getRealWorldSize(product);

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-[#0B1623] p-4 text-white shadow-lg sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] font-bold uppercase text-white/50">{product.normalizedCategory}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#DCEBF5]">
            {product.brand || product.category}
          </span>
          <h4 className="line-clamp-1 text-sm font-bold">{product.name}</h4>
          <p className="mt-0.5 text-xs font-bold text-[#C8A96A]">{product.priceRange || 'Liên hệ'}</p>
          <p className="mt-0.5 text-[10px] text-white/45">
            {product.dimensionsLabel
              ? `Kích thước ${product.dimensionsLabel}`
              : `Kích thước tham chiếu ${(size.width * 1000).toFixed(0)} × ${(size.depth * 1000).toFixed(0)} × ${(size.height * 1000).toFixed(0)} mm`}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onRotate(placed.instanceId, QUARTER_TURN)}
          title="Xoay 90°"
          aria-label="Xoay sản phẩm 90 độ"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(placed.instanceId)}
          title="Nhân đôi"
          aria-label="Nhân đôi sản phẩm"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
        >
          <Copy className="h-4 w-4" />
        </button>
        <Link
          href={`/products/${product.slug || product.id}`}
          target="_blank"
          title="Xem thông tin sản phẩm"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(placed.instanceId)}
          title="Xoá khỏi phòng"
          aria-label="Xoá sản phẩm khỏi phòng"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-red-500/25 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onAddToQuote(selection)}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-[#123C5A] px-4 text-xs font-bold transition-colors hover:bg-[#0D2B42]"
        >
          <Wallet className="h-3.5 w-3.5" />
          {isInQuote ? 'Đã trong giỏ' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}
