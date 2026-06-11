'use client';

import { useQuote } from '@/lib/context/QuoteContext';
import { getProductById } from '@/lib/data';
import { X, ShoppingBag, Trash2, ArrowRight, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function QuoteDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQty, clearAll, totalMin, totalMax } = useQuote();

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[390px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF4F7] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#123C5A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1623]">Giỏ báo giá của bạn</h3>
              <p className="text-[11px] text-[#627386]">{items.length} sản phẩm</p>
            </div>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center hover:bg-[#D8E2EA] transition-colors">
            <X className="w-4 h-4 text-[#0B1623]" />
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag className="w-12 h-12 text-[#D8E2EA] mb-4" />
              <p className="text-sm font-medium text-[#0B1623] mb-1">Chưa có sản phẩm nào</p>
              <p className="text-xs text-[#627386] mb-5">Bấm vào nút "Thêm vào giỏ báo giá"</p>
              <Link href="/products" onClick={closeDrawer} className="text-xs text-[#486581] font-semibold hover:text-[#123C5A] transition-colors">
                Xem danh mục sản phẩm →
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const isUnrelatedRoomImage = (url: string | null | undefined) => {
                if (!url) return true;
                if (url.includes('unsplash.com')) return true;
                if (url.includes('placeholder-sanitary.png')) return true;
                return false;
              };
              const hasImg = !isUnrelatedRoomImage(item.image);

              return (
                <div key={item.productId} className="bg-[#F3F7FA] rounded-2xl p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#EEF4F7] flex-shrink-0 relative">
                      {hasImg ? (
                        <img 
                          src={item.image ?? undefined} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.classList.add('fallback-active');
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#486581] opacity-60">
                           <ShoppingBag className="w-6 h-6 mb-1" />
                           <span className="text-[8px] font-bold uppercase tracking-widest">{item.category}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#627386] font-medium uppercase tracking-wide mb-0.5">{item.category}</p>
                      <p className="text-xs font-semibold text-[#0B1623] leading-snug">{item.name}</p>
                      <p className="text-xs font-bold text-[#C8A96A] mt-0.5">{item.priceRange}</p>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-red-50 transition-colors">
                      <X className="w-3 h-3 text-[#627386] hover:text-red-400" />
                    </button>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-[#627386] mr-auto">Số lượng:</p>
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-[#D8E2EA] flex items-center justify-center hover:bg-[#EEF4F7] transition-colors">
                    <Minus className="w-3 h-3 text-[#0B1623]" />
                  </button>
                  <span className="text-sm font-bold text-[#0B1623] w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-[#D8E2EA] flex items-center justify-center hover:bg-[#EEF4F7] transition-colors">
                    <Plus className="w-3 h-3 text-[#0B1623]" />
                  </button>
                </div>
                <p className="text-[10px] text-[#627386] mt-1">
                  Có sẵn tại: <span className="text-[#0B1623] font-medium">{item.showroomName}</span>
                </p>
              </div>
            );
          })
        )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#D8E2EA] px-5 py-5 space-y-3">
            <div className="bg-[#EEF4F7] rounded-2xl p-4">
              <p className="text-[11px] text-[#627386] uppercase tracking-wider mb-1">Tổng giá tham khảo</p>
              <p className="text-lg font-bold text-[#0B1623]">{fmtVnd(totalMin)} – {fmtVnd(totalMax)}</p>
              <p className="text-[10px] text-[#627386] mt-0.5">{items.length} sản phẩm</p>
            </div>
            <Link
              href="/quote"
              onClick={closeDrawer}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#123C5A] transition-colors duration-200"
            >
              Gửi yêu cầu báo giá <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={clearAll} className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-[#627386] hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </>
  );
}
