'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { products } from '@/lib/data';
import SafeProductImage from '@/components/ui/SafeProductImage';
import { useQuote } from '@/lib/context/QuoteContext';
import { useObjectCoverHotspots } from '@/lib/hooks/useObjectCoverHotspots';
import { getStoredProducts } from '@/lib/storage';
import { Hotspot, Product } from '@/lib/types';
import homeHotspots from '@/lib/data/homeHotspots.json';

const hotspotImage = 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1920&q=90';

const hotspots = homeHotspots as Hotspot[];

export default function HomeHotspotSection() {
  const [activeSpot, setActiveSpot] = useState(hotspots[2]);
  const { addItem, hasItem } = useQuote();
  const { containerRef, imgRef, onImageLoad, toDisplayPercent } = useObjectCoverHotspots<HTMLDivElement>();

  // Load products once
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const stored = getStoredProducts();
    setAllProducts(stored && stored.length > 0 ? stored : products);
  }, []);

  const getBestProduct = (spot: typeof hotspots[0]): Product => {
    const list = allProducts.length > 0 ? allProducts : products;
    
    // 1. Exact match
    let p = list.find(x => x.id === spot.productId || x.slug === spot.productId || x.sku === spot.productId);
    
    // 2. Fallback by category
    if (!p || (!p.image && (!p.images || p.images.length === 0))) {
      const catMapping: Record<string, string[]> = {
        'Sen tắm': ['shower', 'sen tắm', 'sen'],
        'Gương': ['mirror', 'gương'],
        'Vòi lavabo': ['faucet', 'vòi lavabo', 'vòi'],
        'Lavabo': ['basin', 'lavabo', 'chậu'],
        'Bồn cầu': ['toilet', 'bồn cầu'],
      };
      const validCats = catMapping[spot.label] || [];
      const fallback = list.find(x => 
        validCats.some(c => x.category.toLowerCase().includes(c)) &&
        (x.image || (x.images && x.images.length > 0))
      );
      if (fallback) p = fallback;
    }
    
    return p || list[0];
  };

  const activeProduct = getBestProduct(activeSpot);
  const isAdded = hasItem(activeProduct?.id);

  // Use the best image
  const displayImage = activeProduct?.image || (activeProduct?.images?.[0]) || '';

  const handleAddToQuote = () => {
    if (!isAdded) {
      addItem(activeProduct, 'homepage');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
      <div ref={containerRef} className="relative overflow-hidden rounded-[2rem] border border-[#D8E2EA] bg-[#DCEBF5] shadow-[0_22px_55px_rgba(11,22,35,0.08)]">
        <img
          ref={imgRef}
          src={hotspotImage}
          alt="Không gian phòng tắm có hotspot sản phẩm"
          className="h-full min-h-[520px] w-full object-cover"
          onLoad={onImageLoad}
        />
        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#0B2239] shadow-sm backdrop-blur">
          Hotspot tương tác
        </div>

        {hotspots.map((spot) => {
          const isActive = activeSpot.id === spot.id;
          const { left, top } = toDisplayPercent(spot.xPercent, spot.yPercent);
          return (
            <button
              key={spot.id}
              onClick={() => setActiveSpot(spot)}
              className={`group absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-[0_12px_32px_rgba(11,22,35,0.18)] transition-all duration-300 hover:scale-110 ${
                isActive
                  ? 'border-[#C8A45D] bg-[#0B2239] text-white scale-110'
                  : 'border-white/50 bg-white/92 text-[#0B2239]'
              }`}
              style={{ left: `${left}%`, top: `${top}%` }}
              aria-label={`Xem ${spot.label}`}
            >
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[#C8A45D]' : 'bg-[#0B2239]'}`} />
              
              {/* Tooltip */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0B1623] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none">
                {spot.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col p-6 bg-white rounded-[2rem] border border-[#D8E2EA] shadow-[0_18px_45px_rgba(11,22,35,0.055)] transition-all duration-300">
        <div className="flex min-h-[200px] items-center justify-center rounded-[1.25rem] border border-[#D8E2EA] bg-[#F4F8FB] p-4 overflow-hidden relative">
          <SafeProductImage
            src={displayImage}
            alt={activeProduct?.name || ''}
            category={activeProduct?.category || ''}
            className="w-full h-full max-h-[160px] object-contain mix-blend-multiply"
          />
        </div>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#486581]">
              {activeProduct.category}
            </p>
            <h3 className="mt-2 text-xl font-extrabold leading-snug text-[#0B1623]">
              {activeProduct.name}
            </h3>
            <p className="mt-1 text-sm text-[#627386]">{activeProduct.brand} · {activeProduct.sku}</p>
          </div>

          <span className="rounded-full border border-[#D8E2EA] bg-white px-3 py-1 text-[11px] font-bold text-[#0B1623] whitespace-nowrap">
            {activeProduct.availability === 'In Stock' ? 'Có sẵn' : 'Đặt hàng'}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#EEF4F7] px-4 py-4">
          <span className="text-xs font-bold uppercase tracking-wide text-[#627386]">
            Giá tham khảo
          </span>
          <span className="text-lg font-extrabold text-[#0B1623]">
            {activeProduct.priceRange}
          </span>
        </div>

        <div className="mt-5 space-y-3 border-b border-[#D8E2EA] pb-5 text-sm text-[#627386]">
          {activeProduct.material && (
            <p>
              <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#123C5A]" />
              Chất liệu: <b className="text-[#0B1623]">{activeProduct.material}</b>
            </p>
          )}
          {activeProduct.finish && (
            <p>
              <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#123C5A]" />
              Bề mặt: <b className="text-[#0B1623]">{activeProduct.finish}</b>
            </p>
          )}
          {activeProduct.showroomName && (
            <p>
              <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#123C5A]" />
              Đại lý: <b className="text-[#0B1623]">{activeProduct.showroomName}</b>
            </p>
          )}
        </div>

        <div className="mt-auto flex gap-3 pt-6">
          <button
            onClick={handleAddToQuote}
            className={`flex-1 rounded-2xl px-5 py-3 text-center text-sm font-bold transition-all ${
              isAdded 
                ? 'bg-[#49677F] text-white cursor-default' 
                : 'bg-[#0B2239] text-white hover:bg-[#061827]'
            }`}
          >
            {isAdded ? 'Đã thêm báo giá' : 'Thêm báo giá'}
          </button>
          <Link
            href={`/products/${activeProduct.slug || activeProduct.id}`}
            className="rounded-2xl border border-[#D8E2EA] bg-white px-5 py-3 text-sm font-bold text-[#0B1623] transition hover:bg-[#EEF4F7]"
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
