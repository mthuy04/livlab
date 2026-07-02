'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { normalizeProduct3DCategory, Product3DCategory } from '@/lib/livlabProductModels';
import { X } from 'lucide-react';

const CATEGORY_OPTIONS: { key: Product3DCategory; label: string }[] = [
  { key: 'lavabo', label: 'Lavabo' },
  { key: 'faucet', label: 'Vòi lavabo' },
  { key: 'toilet', label: 'Bồn cầu' },
  { key: 'shower', label: 'Sen tắm' },
  { key: 'mirror', label: 'Gương' },
];

interface ProductPanelProps {
  visibleCategories: Set<string>;
  onHideCategory: (category: string) => void;
}

export default function ProductPanel({ visibleCategories, onHideCategory }: ProductPanelProps) {
  const [productsByCategory, setProductsByCategory] = useState<Partial<Record<Product3DCategory, Product>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { importVerifiedProductsFromCsv } = await import('@/lib/importVerifiedProducts');
        const products = await importVerifiedProductsFromCsv(true);
        const picked: Partial<Record<Product3DCategory, Product>> = {};
        for (const product of products || []) {
          const category = normalizeProduct3DCategory(product);
          if (category === 'unknown' || picked[category]) continue;
          picked[category] = product;
        }
        setProductsByCategory(picked);
      } catch (err) {
        console.error('ProductPanel data load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, category: string) => {
    e.dataTransfer.setData('category', category);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6">
      <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-1">Sản phẩm</h3>
      <p className="text-[11px] text-[#627386] mb-4">Kéo thẻ sản phẩm thả vào không gian 3D để đặt vị trí.</p>

      {isLoading ? (
        <p className="text-xs text-[#627386] py-4 text-center">Đang tải sản phẩm...</p>
      ) : (
        <div className="space-y-3">
          {CATEGORY_OPTIONS.map(({ key, label }) => {
            const product = productsByCategory[key];
            const isVisible = visibleCategories.has(key);
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => handleDragStart(e, key)}
                className="relative flex gap-3 border border-[#D8E2EA] rounded-2xl p-3 cursor-grab active:cursor-grabbing hover:border-[#C8A96A]/60 transition-colors bg-white"
              >
                {isVisible && (
                  <button
                    type="button"
                    onClick={() => onHideCategory(key)}
                    title="Ẩn khỏi không gian"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0B1623] text-white flex items-center justify-center shadow-sm hover:bg-red-500 transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="w-16 h-16 shrink-0 bg-[#EEF4F7] rounded-xl overflow-hidden border border-[#D8E2EA]/50 flex items-center justify-center">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      draggable={false}
                      className="w-full h-full object-contain p-1 pointer-events-none"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-[#627386] uppercase text-center px-1">{label}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-0.5">{label}</span>
                  <h4 className="font-bold text-[#0B1623] text-xs line-clamp-2 leading-snug" title={product?.name}>
                    {product?.name || 'Đang cập nhật'}
                  </h4>
                  {product?.priceRange && (
                    <p className="text-[#C8A96A] font-bold text-xs mt-0.5">{product.priceRange}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
