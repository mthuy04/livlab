'use client';

import { Product } from '@/lib/types';
import { getConceptsContainingProduct } from '@/lib/data';
import { useQuote } from '@/lib/context/QuoteContext';
import { X, CheckCircle, Tag, Palette, Box, Layers, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const availabilityVi: Record<string, string> = {
  'In Stock':      'Có sẵn tại showroom',
  'Made to Order': 'Đặt theo yêu cầu',
  'Limited Stock': 'Hàng sắp hết',
};

const availabilityColors: Record<string, string> = {
  'In Stock':      'text-green-700 bg-green-50',
  'Made to Order': 'text-amber-700 bg-amber-50',
  'Limited Stock': 'text-orange-700 bg-orange-50',
};

import { useState, useEffect } from 'react';
import ProductImageFallback from '@/components/products/ProductImageFallback';
import { generateSlug, getProductSlug, getValidProductImages } from '@/lib/productHelpers';

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem, hasItem } = useQuote();
  const [imageError, setImageError] = useState(false);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIdx(0);
    setImageError(false);
  }, [product?.id]);

  if (!product) return null;

  const relatedConcepts = getConceptsContainingProduct(product.id);
  const gallery = getValidProductImages(product);
  const currentImage = gallery[selectedImageIdx] || null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/2 flex flex-col">
            {/* Main Image */}
            <div className="relative h-64 sm:h-auto sm:flex-1 bg-[#EEF4F7] min-h-[240px]">
              {(!currentImage || imageError) ? (
                <ProductImageFallback category={product.category} />
              ) : (
                <img src={currentImage} alt={product.name} onError={() => setImageError(true)} className="w-full h-full object-cover absolute inset-0" />
              )}
              <span className={`absolute top-4 left-4 text-[10px] font-semibold px-2.5 py-1 rounded-full ${availabilityColors[product.availability] || 'text-gray-700 bg-gray-50'}`}>
                {availabilityVi[product.availability] || product.availability}
              </span>
            </div>
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex p-2 gap-2 bg-white border-t border-[#D8E2EA] overflow-x-auto">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedImageIdx(idx); setImageError(false); }}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIdx === idx ? 'border-[#123C5A]' : 'border-transparent hover:border-[#D8E2EA]'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

            {/* Info */}
            <div className="w-full sm:w-1/2 p-6 flex flex-col relative">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center hover:bg-[#D8E2EA] transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>

              <div className="pr-10 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#627386] mb-1">{product.category} · {product.brand}</p>
                <h2 className="text-lg font-bold text-[#0B1623] leading-snug">{product.name}</h2>
                <p className="text-xs text-[#627386] mt-1">{product.sku}</p>
              </div>

              {/* Price */}
              <div className="bg-[#EEF4F7] rounded-xl p-3 mb-4">
                <p className="text-xs text-[#627386] mb-0.5">Giá tham khảo</p>
                <p className="text-xl font-bold text-[#0B1623]">
                  {product.priceRange} {product.priceUnit ? `/ ${product.priceUnit}` : ''}
                </p>
                <p className="text-[10px] text-[#627386] mt-1 italic">Giá tham khảo có thể thay đổi theo tồn kho, thời điểm và chính sách showroom.</p>
                {product.priceSource && (
                  <p className="text-[10px] text-[#627386] mt-0.5">Nguồn: {product.priceSource}</p>
                )}
              </div>

              {/* Source Transparency */}
              {(!product.imageVerified && product.sourceNote) && (
                <div className="mb-4">
                  <div className="bg-orange-50 text-orange-800 text-[10px] px-3 py-2 rounded-lg font-medium border border-orange-100">
                    ⚠️ Dữ liệu mẫu minh họa. {product.sourceNote}
                  </div>
                </div>
              )}

              {/* Details Tab / Scrollable */}
              <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2 text-sm text-[#0B1623]">
                <p className="leading-relaxed text-[#627386]">{product.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {product.dimensions && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Kích thước</span>
                      <strong className="font-semibold">{product.dimensions}</strong>
                    </div>
                  )}
                  {product.size && !product.dimensions && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Kích thước</span>
                      <strong className="font-semibold">{product.size}</strong>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Chất liệu</span>
                      <strong className="font-semibold">{product.material}</strong>
                    </div>
                  )}
                  {product.finish && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Hoàn thiện</span>
                      <strong className="font-semibold">{product.finish}</strong>
                    </div>
                  )}
                  {product.installationType && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Lắp đặt</span>
                      <strong className="font-semibold">{product.installationType}</strong>
                    </div>
                  )}
                  {product.warranty && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#627386]">Bảo hành</span>
                      <strong className="font-semibold">{product.warranty}</strong>
                    </div>
                  )}
                </div>

                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-1.5">Đặc điểm nổi bật</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-[#627386]">
                      {product.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}

                {product.technicalSpecs && product.technicalSpecs.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-1.5">Thông số kỹ thuật</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-[#627386]">
                      {product.technicalSpecs.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Showroom info */}
              <div className="bg-[#F3F7FA] rounded-xl p-3 mb-4">
                <p className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-2">Thông tin phân phối</p>
                <div className="flex flex-col gap-1 text-xs text-[#0B1623]">
                  <p>Bán bởi: <strong>{product.soldBy || 'LivLab'}</strong></p>
                  <p>Fulfilled by: <strong>{product.fulfilledBy || product.showroomName}</strong></p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#D8E2EA] text-[10px] text-[#627386] leading-relaxed">
                  LivLab tiếp nhận yêu cầu báo giá; showroom đối tác xác nhận tồn kho, giá cuối và phương án lắp đặt.
                </div>
              </div>

              {/* Add to Quote & Details */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => { addItem(product); onClose(); }}
                  disabled={hasItem(product.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${hasItem(product.id) ? 'bg-[#486581] text-white cursor-default' : 'bg-[#123C5A] text-white hover:bg-[#123C5A]'}`}
                >
                  {hasItem(product.id) ? <><CheckCircle className="w-4 h-4" /> Đã thêm vào giỏ</> : 'Thêm vào giỏ báo giá'}
                </button>
                <Link
                  href={`/products/${getProductSlug(product)}`}
                  onClick={onClose}
                  className="px-6 py-3 rounded-full border border-[#D8E2EA] text-sm font-semibold text-[#0B1623] hover:border-[#0B1623] transition-colors whitespace-nowrap"
                >
                  Xem trang chi tiết
                </Link>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
