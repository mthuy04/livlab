'use client';

import { useState, useCallback, useEffect } from 'react';
import { Concept, Hotspot, Product } from '@/lib/types';
import { getStoredProducts } from '@/lib/storage';
import { useQuote } from '@/lib/context/QuoteContext';
import { useObjectCoverHotspots } from '@/lib/hooks/useObjectCoverHotspots';
import { CheckCircle, Tag, Palette, Box, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';

interface InteractiveRoomViewerProps {
  concept: Concept;
  showComboSummary?: boolean;
}

const availabilityColors: Record<string, string> = {
  'In Stock':      'bg-green-50 text-green-700 border-green-100',
  'Made to Order': 'bg-amber-50 text-amber-700 border-amber-100',
  'Limited Stock': 'bg-orange-50 text-orange-700 border-orange-100',
};

const availabilityVi: Record<string, string> = {
  'In Stock':      'Có sẵn tại showroom',
  'Made to Order': 'Đặt theo yêu cầu',
  'Limited Stock': 'Hàng sắp hết',
};

export default function InteractiveRoomViewer({ concept }: InteractiveRoomViewerProps) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem, hasItem } = useQuote();
  const { containerRef, imgRef, onImageLoad, toDisplayPercent } = useObjectCoverHotspots<HTMLDivElement>();

  useEffect(() => {
    setProducts(getStoredProducts() || []);
  }, []);

  const activeProduct: Product | undefined = activeHotspot
    ? products.find(p => p.id === activeHotspot.productId)
    : undefined;

  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    setActiveHotspot((prev) => (prev?.id === hotspot.id ? null : hotspot));
  }, []);

  const handleAddToQuote = useCallback(() => {
    if (!activeProduct) return;
    addItem(activeProduct, concept.id);
    setToast(`Đã thêm: ${activeProduct.name}`);
    setTimeout(() => setToast(null), 3000);
  }, [activeProduct, concept.id, addItem]);

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-[#0B1623] text-white text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#486581]" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Room Image + Hotspots */}
        <div ref={containerRef} className="lg:col-span-3 relative rounded-[32px] overflow-hidden bg-[#EEF4F7] aspect-[4/3] shadow-lg border border-[#D8E2EA]">
          <span className="absolute top-5 left-5 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full bg-white/90 text-[#123C5A] shadow-sm z-10 border border-white/50 backdrop-blur-md">Hotspot tương tác</span>
          {!imgError && concept.image ? (
            <img ref={imgRef} src={concept.image} alt={concept.title} className="w-full h-full object-cover" onLoad={onImageLoad} onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4F7] to-[#F3F7FA] text-[#123C5A]">
              <span className="text-[12px] bg-white/50 px-3 py-1 rounded-full opacity-60 border border-[#D8E2EA] mb-4">Ảnh concept minh hoạ</span>
              <p className="font-semibold text-lg tracking-wide opacity-80">{concept.roomType}</p>
              <p className="text-sm opacity-60 uppercase tracking-widest mt-1">{concept.style}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/5" />

          {concept.hotspots.map((hotspot) => {
            const { left: nx, top: ny } = toDisplayPercent(hotspot.xPercent, hotspot.yPercent);
            const isActive = activeHotspot?.id === hotspot.id;
            const isAdded  = hasItem(hotspot.productId);
            return (
              <button
                key={hotspot.id}
                onClick={() => handleHotspotClick(hotspot)}
                style={{ left: `${nx}%`, top: `${ny}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                aria-label={`Xem ${hotspot.label}`}
              >
                {!isActive && (
                  <span className="absolute inset-0 rounded-full bg-white/30 animate-ping scale-[1.8] opacity-50" />
                )}
                <span className={`relative flex items-center justify-center w-6 h-6 rounded-full shadow-lg transition-all duration-300 ${
                  isActive ? 'bg-[#123C5A] border border-[#C8A96A] scale-110' :
                  isAdded  ? 'bg-[#486581] border border-white/50' :
                             'bg-white border border-[#D8E2EA] hover:scale-105 hover:border-[#123C5A]'
                }`}>
                  {isAdded && !isActive
                    ? <CheckCircle className="w-3 h-3 text-white" />
                    : <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#C8A96A]' : 'bg-[#123C5A]'}`} />
                  }
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap text-[10px] font-semibold bg-[#0B1623] text-white px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {hotspot.label}
                </span>
              </button>
            );
          })}

          {!activeHotspot && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-black/50 backdrop-blur-sm text-white/90 text-xs px-4 py-2 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#123C5A] rounded-full flex-shrink-0 animate-pulse" />
              Bấm vào các điểm trên ảnh để xem sản phẩm trong không gian thực tế.
            </div>
          )}
        </div>

        {/* Product Panel */}
        <div className="lg:col-span-2">
          {activeProduct ? (
            <div className="premium-card p-6 h-full flex flex-col">
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-[#F8FBFD] border border-[#D8E2EA] mb-5">
                <img src={activeProduct.image} alt={activeProduct.name} className="w-full h-full object-contain p-2" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#627386]">{activeProduct.category}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${availabilityColors[activeProduct.availability]}`}>
                  {availabilityVi[activeProduct.availability] || activeProduct.availability}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0B1623] mb-1 leading-snug">{activeProduct.name}</h3>
              <p className="text-xs text-[#627386] mb-3">{activeProduct.brand} · {activeProduct.sku}</p>

              <div className="bg-[#EEF4F7] rounded-xl p-2.5 mb-3 flex items-center justify-between">
                <span className="text-[10px] text-[#627386] uppercase tracking-wider">Giá tham khảo</span>
                <span className="text-base font-bold text-[#0B1623]">{activeProduct.priceRange}</span>
              </div>

              <div className="space-y-1.5 mb-4 flex-1">
                {activeProduct.size && (
                  <div className="flex items-center gap-2 text-[11px] text-[#627386]">
                    <Box className="w-3 h-3 flex-shrink-0 text-[#486581]" />
                    <span>Kích thước: <span className="text-[#0B1623] font-medium">{activeProduct.size}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-[#627386]">
                  <Box className="w-3 h-3 flex-shrink-0 text-[#486581]" />
                  <span>Chất liệu: <span className="text-[#0B1623] font-medium">{activeProduct.material}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#627386]">
                  <Palette className="w-3 h-3 flex-shrink-0 text-[#486581]" />
                  <span>Bề mặt (Finish): <span className="text-[#0B1623] font-medium">{activeProduct.finish}</span></span>
                </div>
                {activeProduct.showroomName && (
                  <div className="flex items-center gap-2 text-[11px] text-[#627386] pt-2 mt-2 border-t border-[#D8E2EA]">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-[#C8A96A]" />
                    <span>Đại lý: <strong className="text-[#0B1623]">{activeProduct.showroomName}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={handleAddToQuote}
                  disabled={hasItem(activeProduct.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${hasItem(activeProduct.id) ? 'bg-[#486581] text-white cursor-default' : 'bg-[#123C5A] text-white hover:bg-[#123C5A]'}`}
                >
                  {hasItem(activeProduct.id) ? 'Đã thêm' : 'Thêm báo giá'}
                </button>
                <Link href={`/products/${activeProduct.slug || activeProduct.id}`} className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-[#0B1623] border border-[#D8E2EA] hover:bg-[#F3F7FA] transition-all duration-200">
                  Chi tiết
                </Link>
              </div>
            </div>
          ) : (
            <div className="premium-card p-8 h-full flex flex-col items-center justify-center text-center min-h-[350px]">
              <div className="premium-icon-box mb-5 border-none shadow-sm">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-[#0B1623] mb-2">Khám phá không gian</h4>
              <p className="text-sm text-[#627386] max-w-[200px] leading-relaxed">
                Bấm vào điểm hotspot bất kỳ để xem thông tin sản phẩm và thêm vào báo giá.
              </p>
              <p className="text-xs text-[#627386] mt-4 bg-white/60 px-3 py-1.5 rounded-full">
                {concept.hotspots.length} sản phẩm được gắn nhãn
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
