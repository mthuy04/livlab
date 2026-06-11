'use client';

import { useQuote } from '@/lib/context/QuoteContext';
import { getProductById } from '@/lib/data';
import { Product } from '@/lib/types';
import { ShoppingBag, Trash2, X, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function QuoteSummary() {
  const { items, removeItem, clearAll, increase, decrease, totalMin, totalMax } = useQuote();

  const fmtVnd   = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6 sticky top-24 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-[#0B1623] flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#C8A96A]" />
          Giỏ báo giá của bạn
        </h3>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-xs text-[#627386] hover:text-red-500 transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => {
            const isUnrelatedRoomImage = (url: string | undefined) => {
              if (!url) return true;
              if (url.includes('unsplash.com')) return true;
              if (url.includes('placeholder-sanitary.png')) return true;
              return false;
            };
            const hasImg = !isUnrelatedRoomImage(item.image);
            return (
            <div key={item.productId} className="bg-[#F3F7FA] rounded-2xl p-3">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#EEF4F7] flex-shrink-0 relative">
                  {hasImg ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) parent.classList.add('fallback-active');
                      }}
                    />
                  ) : null}
                  {(!hasImg) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#486581] opacity-60">
                       <ShoppingBag className="w-5 h-5 mb-0.5" />
                       <span className="text-[7px] font-bold uppercase tracking-widest">{item.category}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#627386] font-medium uppercase tracking-wider">{item.category}</p>
                  <p className="text-xs font-semibold text-[#0B1623] truncate leading-snug">{item.name}</p>
                  <p className="text-xs font-bold text-[#C8A96A]">{item.priceRange}</p>
                </div>
                <button onClick={() => removeItem(item.productId)} className="hover:text-red-500 text-[#627386] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Qty */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[#627386]">Có sẵn tại: <span className="text-[#0B1623] font-medium">{item.showroomName}</span></p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => decrease(item.productId)} className="w-5 h-5 rounded-full bg-white border border-[#D8E2EA] flex items-center justify-center hover:bg-[#EEF4F7]">
                    <Minus className="w-2.5 h-2.5 text-[#0B1623]" />
                  </button>
                  <span className="text-xs font-bold text-[#0B1623] w-4 text-center">{item.quantity}</span>
                  <button onClick={() => increase(item.productId)} className="w-5 h-5 rounded-full bg-white border border-[#D8E2EA] flex items-center justify-center hover:bg-[#EEF4F7]">
                    <Plus className="w-2.5 h-2.5 text-[#0B1623]" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 mb-5">
          <ShoppingBag className="w-10 h-10 text-[#D8E2EA] mx-auto mb-3" />
          <p className="text-sm text-[#627386] mb-1">Chưa có sản phẩm nào</p>
          <p className="text-xs text-[#627386] mb-3">Thêm sản phẩm từ concept hoặc danh mục</p>
          <Link href="/products" className="text-xs text-[#486581] hover:text-[#123C5A] transition-colors font-semibold">
            Xem danh mục sản phẩm →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-[#EEF4F7] rounded-2xl p-4 mb-5">
          <p className="text-xs text-[#627386] mb-1">Tổng giá tham khảo</p>
          <p className="text-xl font-bold text-[#0B1623]">{fmtVnd(totalMin)} – {fmtVnd(totalMax)}</p>
          <p className="text-[11px] text-[#627386] mt-2 leading-relaxed">
            Đây là giá tham khảo. Báo giá cuối sẽ được LivLab/showroom xác nhận sau khi kiểm tra tồn kho, diện tích và phương án lắp đặt.
          </p>
        </div>
      )}

      <Link
        href="/concepts"
        className="block text-center text-xs text-[#627386] hover:text-[#0B1623] transition-colors py-2 border border-dashed border-[#D8E2EA] rounded-xl"
      >
        + Khám phá thêm concept
      </Link>
    </div>
  );
}
