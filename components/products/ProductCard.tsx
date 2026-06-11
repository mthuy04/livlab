'use client';

import { Product } from '@/lib/types';
import { useQuote } from '@/lib/context/QuoteContext';
import { CheckCircle, Eye, GitCompare, MapPin, Loader2, Wand2 } from 'lucide-react';
import ProductImageFallback from '@/components/products/ProductImageFallback';
import Link from 'next/link';
import { generateSlug, getProductSlug, getValidProductImages } from '@/lib/productHelpers';
import { useState } from 'react';
import { getProductCutout } from '@/lib/livlabProductCutouts';

const availabilityColors: Record<string, string> = {
  'In Stock':      'bg-green-50 text-green-700 border-green-100',
  'Made to Order': 'bg-amber-50 text-amber-700 border-amber-100',
  'Limited Stock': 'bg-orange-50 text-orange-700 border-orange-100',
};

const availabilityVi: Record<string, string> = {
  'In Stock':      'Có sẵn',
  'Made to Order': 'Đặt trước',
  'Limited Stock': 'Sắp hết',
};

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  isComparing?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView, isComparing, onToggleCompare }: ProductCardProps) {
  const { addItem, hasItem } = useQuote();
  const [imageErrorIdx, setImageErrorIdx] = useState(0);
  const cutoutImage = getProductCutout(product.id);
  const gallery = getValidProductImages(product);
  const currentImage = cutoutImage || gallery[imageErrorIdx] || null;
  const hasFailedAll = (!cutoutImage && imageErrorIdx >= gallery.length) || !currentImage;

  const productUrl = `/products/${getProductSlug(product)}`;

  return (
    <article className="bg-white rounded-3xl overflow-hidden border border-[#D8E2EA] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-white border-b border-[#D8E2EA]">
        {hasFailedAll ? (
          <ProductImageFallback category={product.category} />
        ) : (
          <img
            src={currentImage!}
            alt={product.name}
            onError={() => !cutoutImage && setImageErrorIdx(prev => prev + 1)}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${availabilityColors[product.availability] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
          {availabilityVi[product.availability] || product.availability}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onQuickView && (
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(product); }}
              className="bg-white text-[#0B1623] text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg hover:bg-[#EEF4F7] transition-all duration-200 hover:scale-105"
            >
              <Eye className="w-3.5 h-3.5" /> Xem nhanh
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#627386]">{product.category}</span>
          <span className="text-[10px] text-[#627386] font-medium">{product.brand}</span>
        </div>
        <Link href={productUrl} className="group-hover:text-[#123C5A] transition-colors">
          <h3 className="text-sm font-semibold text-[#0B1623] mb-1 leading-snug line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-[11px] text-[#627386] mb-1">{product.material} · {product.finish}</p>

        {/* Showroom / Fulfillment */}
        <div className="flex items-center gap-1 text-[10px] text-[#627386] mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{product.fulfilledBy || product.showroomName}</span>
        </div>

        <div className="mt-auto">
          <p className="text-sm font-bold text-[#0B1623] mb-4">
            {product.priceRange} {product.priceUnit ? `/ ${product.priceUnit}` : ''}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => { e.preventDefault(); addItem(product); }}
              disabled={hasItem(product.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${hasItem(product.id) ? 'bg-[#486581] text-white cursor-default' : 'bg-[#123C5A] text-white hover:bg-[#123C5A]'}`}
            >
              {hasItem(product.id) ? <><CheckCircle className="w-3.5 h-3.5" /> Đã thêm</> : 'Thêm vào giỏ báo giá'}
            </button>
            {onToggleCompare && (
              <button
                onClick={(e) => { e.preventDefault(); onToggleCompare(product); }}
                title={isComparing ? 'Bỏ so sánh' : 'So sánh'}
                className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isComparing ? 'bg-[#123C5A] border-[#123C5A] text-white' : 'bg-white border-[#D8E2EA] text-[#627386] hover:border-[#123C5A] hover:text-[#0B1623]'}`}
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link href={productUrl} className="block w-full text-center py-2 text-xs font-medium text-[#627386] border border-[#D8E2EA] rounded-full hover:border-[#0B1623] hover:text-[#0B1623] transition-colors">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
