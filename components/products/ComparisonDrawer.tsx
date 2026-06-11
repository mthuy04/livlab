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
  { key: 'dimensions', label: 'Kích thước' },
  { key: 'installationType', label: 'Kiểu lắp đặt' },
  { key: 'material',   label: 'Chất liệu' },
  { key: 'finish',     label: 'Màu sắc/Finish' },
  { key: 'warranty',   label: 'Bảo hành' },
  { key: 'showroomName', label: 'Nhà cung cấp' },
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
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#0B1623]">
                So sánh sản phẩm đã chọn
              </span>
              {products.length < 3 && (
                <span className="text-xs text-[#627386] bg-[#EEF4F7] px-2.5 py-0.5 rounded-full font-medium">
                  {products.length === 1 ? 'Thêm ít nhất 1 sản phẩm nữa để so sánh rõ hơn.' : `Thêm ${3 - products.length} sản phẩm nữa`}
                </span>
              )}
            </div>
            <p className="text-xs text-[#627386] mt-0.5">
              Đối chiếu giá tham khảo, thương hiệu và thông số trước khi gửi yêu cầu báo giá.
            </p>
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-[#627386] hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Xóa tất cả
          </button>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {/* Label column */}
            <div className="w-32 flex-shrink-0 pt-2">
              <div className="h-28" /> {/* image & title placeholder */}
              {labels.map((l) => (
                <div key={l.key} className="h-10 flex items-center">
                  <p className="text-[11px] font-semibold text-[#627386] uppercase tracking-wider">{l.label}</p>
                </div>
              ))}
              <div className="h-12" />
            </div>

            {/* Product columns */}
            {products.map((product) => (
              <div key={product.id} className="w-56 flex-shrink-0 bg-white rounded-2xl p-3 border border-[#D8E2EA] shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-24 rounded-xl overflow-hidden bg-white border border-[#F3F7FA] mb-3">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
                  <button
                    onClick={() => onRemove(product.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3 text-[#627386]" />
                  </button>
                </div>
                <div className="h-10 flex items-start mb-2">
                  <p className="text-xs font-bold text-[#0B1623] leading-snug line-clamp-2">{product.name}</p>
                </div>

                {labels.map((l) => {
                  const val = product[l.key];
                  const display = l.key === 'availability'
                    ? availabilityVi[val as string] || (val as string || '—')
                    : Array.isArray(val) ? (val.length > 0 ? val.join(', ') : '—') : (val ? String(val) : '—');
                  return (
                    <div key={l.key} className="h-10 flex items-center border-t border-[#D8E2EA]/50">
                      <p className={`text-[11px] leading-snug line-clamp-2 ${l.key === 'priceRange' ? 'font-bold text-[#C8A96A] text-xs' : 'text-[#486581]'}`}>
                        {display}
                      </p>
                    </div>
                  );
                })}

                <div className="mt-3">
                  <button
                    onClick={() => addItem(product)}
                    disabled={hasItem(product.id)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                      hasItem(product.id)
                        ? 'bg-[#486581] text-white cursor-default'
                        : 'bg-[#123C5A] text-white hover:bg-[#123C5A]/90'
                    }`}
                  >
                    {hasItem(product.id)
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Đã thêm giỏ báo giá</>
                      : <><ShoppingBag className="w-3.5 h-3.5" /> Thêm vào giỏ báo giá</>
                    }
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slot placeholder */}
            {products.length < 3 && (
              <div className="w-56 flex-shrink-0 border-2 border-dashed border-[#D8E2EA] rounded-2xl flex flex-col items-center justify-center text-center p-5 bg-[#F8FAFC]">
                <p className="text-xs text-[#627386] leading-relaxed">Chọn tối đa 3 sản phẩm để so sánh nhanh về giá, thương hiệu và thông số.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
