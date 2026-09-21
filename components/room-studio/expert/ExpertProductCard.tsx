'use client';

import Link from 'next/link';
import { ExternalLink, Plus, Wallet } from 'lucide-react';
import type { ExpertProductSuggestion } from '@/lib/ai/expert/expertContext';

interface ExpertProductCardProps {
  product: ExpertProductSuggestion;
  onAddToRoom: (productId: string) => void;
  onAddToQuote: (productId: string) => void;
}

function formatPrice(min?: number, max?: number): string {
  if (!min && !max) return 'Chưa có giá tham khảo';
  const fmt = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min || max)!);
}

/**
 * Product facts rendered as structured UI rather than parsed out of the model's
 * prose. Every value here came back from the catalogue server-side, so what the
 * customer reads on the card is LivLab data by construction.
 *
 * Dimensions show "chưa có dữ liệu" when the catalogue does not state them —
 * the card never fills a gap with an assumption.
 */
export default function ExpertProductCard({ product, onAddToRoom, onAddToQuote }: ExpertProductCardProps) {
  const dims = [product.widthMm, product.depthMm, product.heightMm];
  const hasDims = dims.some((d) => d !== undefined);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white p-3">
      <div className="flex gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D8E2EA]/60 bg-[#EEF4F7]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          ) : (
            <span className="px-1 text-center text-[8px] font-bold uppercase text-[#627386]">
              {product.category}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[#627386]">
            {product.brand || product.category}
          </span>
          <h4 className="line-clamp-2 text-xs font-bold leading-snug text-[#0B1623]">{product.name}</h4>
          <p className="mt-0.5 text-[11px] font-bold text-[#C8A96A]">{formatPrice(product.priceMin, product.priceMax)}</p>
          <p className="mt-0.5 text-[10px] text-[#9AA9B6]">
            {hasDims
              ? dims.map((d) => (d === undefined ? '—' : d)).join(' × ') + ' mm'
              : 'Kích thước: LivLab chưa có dữ liệu'}
          </p>
        </div>
      </div>

      {product.reason && (
        <p className="mt-2 rounded-lg bg-[#F3F7FA] px-2.5 py-1.5 text-[11px] leading-relaxed text-[#627386]">
          {product.reason}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAddToRoom(product.id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0B3A55] px-2 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#082B40]"
        >
          <Plus className="h-3 w-3" /> Đưa vào phòng
        </button>
        <button
          type="button"
          onClick={() => onAddToQuote(product.id)}
          className="flex items-center justify-center gap-1 rounded-lg border border-[#D8E2EA] px-2.5 py-2 text-[11px] font-bold text-[#0B3A55] transition-colors hover:bg-[#EEF4F7]"
        >
          <Wallet className="h-3 w-3" /> Giỏ
        </button>
        <Link
          href={`/products/${product.slug || product.id}`}
          target="_blank"
          title="Xem chi tiết sản phẩm"
          className="flex items-center justify-center rounded-lg border border-[#D8E2EA] px-2.5 py-2 text-[#0B3A55] transition-colors hover:bg-[#EEF4F7]"
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
