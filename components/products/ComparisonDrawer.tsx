'use client';

import { Product } from '@/lib/types';
import { useQuote } from '@/lib/context/QuoteContext';
import { X, CheckCircle, ShoppingBag } from 'lucide-react';

interface ComparisonDrawerProps {
  products: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const labels: { key: keyof Product; label: string }[] = [
  { key: 'category',   label: 'Danh mục' },
  { key: 'brand',      label: 'Thương hiệu' },
  { key: 'priceRange', label: 'Giá tham khảo' },
  { key: 'material',   label: 'Chất liệu' },
  { key: 'finish',     label: 'Màu sắc/Finish' },
  { key: 'availability', label: 'Tình trạng' },
];

const availabilityVi: Record<string, string> = {
  'In Stock':      'Có sẵn',
  'Made to Order': 'Đặt trước',
  'Limited Stock': 'Sắp hết',
};

export default function ComparisonDrawer({ products, onRemove, onClear }: ComparisonDrawerProps) {
  const { addItem, hasItem } = useQuote();

  if (products.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D8E2EA] shadow-2xl slide-in-right">
      <div className="max-w-8xl mx-auto px-4 lg:px-10 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#0B1623]">
              So sánh sản phẩm ({products.length}/3)
            </span>
            {products.length < 3 && (
              <span className="text-xs text-[#627386] bg-[#EEF4F7] px-2.5 py-1 rounded-full">
                Thêm {3 - products.length} sản phẩm nữa
              </span>
            )}
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-[#627386] hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Xóa tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {/* Label column */}
            <div className="w-32 flex-shrink-0">
              <div className="h-24" /> {/* image placeholder */}
              {labels.map((l) => (
                <div key={l.key} className="h-9 flex items-center">
                  <p className="text-[11px] font-semibold text-[#627386] uppercase tracking-wider">{l.label}</p>
                </div>
              ))}
              <div className="h-10" />
            </div>

            {/* Product columns */}
            {products.map((product) => (
              <div key={product.id} className="w-52 flex-shrink-0 bg-[#F3F7FA] rounded-2xl p-3 border border-[#D8E2EA]">
                <div className="relative h-24 rounded-xl overflow-hidden bg-[#EEF4F7] mb-2">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemove(product.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3 text-[#627386]" />
                  </button>
                </div>
                <p className="text-xs font-bold text-[#0B1623] leading-snug mb-1 line-clamp-2">{product.name}</p>

                {labels.map((l) => {
                  const val = product[l.key];
                  const display = l.key === 'availability'
                    ? availabilityVi[val as string] || (val as string)
                    : Array.isArray(val) ? val.join(', ') : String(val ?? '—');
                  return (
                    <div key={l.key} className="h-9 flex items-center border-t border-[#D8E2EA]/50">
                      <p className={`text-[11px] leading-snug ${l.key === 'priceRange' ? 'font-bold text-[#0B1623]' : 'text-[#627386]'}`}>
                        {display}
                      </p>
                    </div>
                  );
                })}

                <div className="mt-2">
                  <button
                    onClick={() => addItem(product)}
                    disabled={hasItem(product.id)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-all ${
                      hasItem(product.id)
                        ? 'bg-[#486581] text-white cursor-default'
                        : 'bg-[#123C5A] text-white hover:bg-[#123C5A]'
                    }`}
                  >
                    {hasItem(product.id)
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Đã thêm</>
                      : <><ShoppingBag className="w-3.5 h-3.5" /> Thêm vào báo giá</>
                    }
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slot placeholder */}
            {products.length < 3 && (
              <div className="w-52 flex-shrink-0 border-2 border-dashed border-[#D8E2EA] rounded-2xl flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-[#627386]">Bấm nút so sánh ở thẻ sản phẩm để thêm vào đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
