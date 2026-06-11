'use client';

import Link from 'next/link';
import { Product, ProductReview } from '@/lib/types';
import { useState } from 'react';
import { useQuote } from '@/lib/context/QuoteContext';
import ProductImageFallback from '@/components/products/ProductImageFallback';
import { CheckCircle, MapPin, Tag, Palette, Box, Layers, ShieldCheck, ShieldAlert, Star, ExternalLink } from 'lucide-react';

export default function ProductDetailClient({ product, gallery, reviews }: { product: Product, gallery: string[], reviews: ProductReview[] }) {
  const { addItem, hasItem } = useQuote();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [imageError, setImageError] = useState(false);

  const availabilityVi: Record<string, string> = {
    'In Stock': 'Có sẵn',
    'Made to Order': 'Đặt trước',
    'Limited Stock': 'Sắp hết',
  };

  const availabilityColors: Record<string, string> = {
    'In Stock': 'bg-green-50 text-green-700 border-green-100',
    'Made to Order': 'bg-amber-50 text-amber-700 border-amber-100',
    'Limited Stock': 'bg-orange-50 text-orange-700 border-orange-100',
  };

  const currentImage = gallery[selectedImageIdx] || null;

  const renderSuitableTags = () => {
    const tags = [];
    if (product.suitableFor) tags.push(...(Array.isArray(product.suitableFor) ? product.suitableFor : [product.suitableFor]));
    if (product.compatibleStyles) tags.push(...(Array.isArray(product.compatibleStyles) ? product.compatibleStyles : [product.compatibleStyles]));
    if (product.budgetSegment) tags.push(product.budgetSegment);
    if (product.suitableRoomSize) tags.push(product.suitableRoomSize);
    if (product.installationType) tags.push(product.installationType);

    if (tags.length === 0) {
      if (product.category === 'Lavabo' || product.category === 'Faucet' || product.category === 'Toilet' || product.category === 'Shower') {
        tags.push('Phòng tắm căn hộ', 'Không gian nhỏ và vừa', 'Concept hiện đại');
      } else {
        tags.push('Nội thất căn hộ', 'Không gian nhỏ và vừa', 'Concept hiện đại');
      }
    }
    return tags;
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#EEF4F7] border border-[#D8E2EA]">
            {(!currentImage || imageError) ? (
              <ProductImageFallback category={product.category} />
            ) : (
              <img 
                src={currentImage} 
                alt={product.name} 
                onError={() => setImageError(true)} 
                className="w-full h-full object-cover absolute inset-0"
              />
            )}
            <div className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full border ${availabilityColors[product.availability] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
              {availabilityVi[product.availability] || product.availability}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedImageIdx(idx); setImageError(false); }}
                  className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIdx === idx ? 'border-[#123C5A] opacity-100' : 'border-transparent hover:border-[#D8E2EA] opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#627386]">{product.category}</span>
              <span className="text-xs text-[#627386] font-medium px-2 py-1 bg-[#F3F7FA] rounded-md">{product.sku}</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0B1623] mb-2 leading-tight">{product.name}</h1>
            <p className="text-sm text-[#627386] font-medium">Thương hiệu: <span className="text-[#0B1623]">{product.brand}</span></p>
          </div>

          {/* Pricing & CTA */}
          <div className="bg-[#EEF4F7] rounded-2xl p-6 mb-8 border border-[#D8E2EA]">
            <p className="text-sm font-medium text-[#627386] mb-1">Giá tham khảo</p>
            <p className="text-3xl font-bold text-[#0B1623] mb-2">
              {product.priceRange} {product.priceUnit ? `/ ${product.priceUnit}` : ''}
            </p>
            <p className="text-xs text-[#627386] italic mb-6 leading-relaxed">
              Giá cuối sẽ được {product.soldBy || 'LivLab'} / showroom xác nhận theo tồn kho, diện tích và phương án lắp đặt.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addItem(product)}
                disabled={hasItem(product.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all shadow-sm ${hasItem(product.id) ? 'bg-[#486581] text-white cursor-default' : 'bg-[#123C5A] text-white hover:bg-[#123C5A]'}`}
              >
                {hasItem(product.id) ? <><CheckCircle className="w-5 h-5" /> Đã có trong giỏ báo giá</> : 'Thêm vào giỏ báo giá'}
              </button>
              <Link
                href="/quote"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full border border-[#123C5A] text-[#123C5A] font-semibold hover:bg-[#123C5A] hover:text-white transition-all shadow-sm bg-white"
              >
                Yêu cầu báo giá
              </Link>
            </div>
          </div>

          {/* Suitable Tags */}
          <div className="bg-[#F3F7FA] rounded-2xl p-5 mb-8 border border-[#D8E2EA]">
            <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#627386]" /> Sản phẩm này phù hợp với
            </h3>
            <div className="flex flex-wrap gap-2">
              {renderSuitableTags().map((tag, i) => (
                <span key={i} className="inline-block px-3 py-1.5 bg-white border border-[#D8E2EA] rounded-lg text-xs font-medium text-[#0B1623]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="bg-[#F3F7FA] rounded-2xl p-5 mb-8 border border-[#D8E2EA]">
            <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#627386]" /> Đơn vị cung cấp
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-[#627386] mb-1 text-xs">Bán bởi</p>
                <p className="font-semibold text-[#0B1623]">{product.soldBy || 'LivLab'}</p>
              </div>
              <div>
                <p className="text-[#627386] mb-1 text-xs">Phân phối / Lắp đặt</p>
                <p className="font-semibold text-[#0B1623]">{product.fulfilledBy || product.showroomName}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#D8E2EA] text-xs text-[#627386] leading-relaxed">
              LivLab tiếp nhận yêu cầu báo giá; showroom đối tác xác nhận tồn kho, giá cuối và phương án lắp đặt.
            </div>
          </div>

          {/* Product Details Tabs / Sections */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-[#0B1623] mb-3">Mô tả sản phẩm</h3>
              <p className="text-sm text-[#627386] leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0B1623] mb-4">Thông tin chi tiết</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                {product.material && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Chất liệu</span>
                    <strong className="text-[#0B1623]">{product.material}</strong>
                  </div>
                )}
                {product.finish && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Hoàn thiện</span>
                    <strong className="text-[#0B1623]">{product.finish}</strong>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Kích thước</span>
                    <strong className="text-[#0B1623]">{product.dimensions}</strong>
                  </div>
                )}
                {product.size && !product.dimensions && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Kích thước</span>
                    <strong className="text-[#0B1623]">{product.size}</strong>
                  </div>
                )}
                {product.installationType && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs">Lắp đặt</span>
                    <strong className="text-[#0B1623]">{product.installationType}</strong>
                  </div>
                )}
                {product.warranty && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Bảo hành</span>
                    <strong className="text-[#0B1623]">{product.warranty}</strong>
                  </div>
                )}
                {product.origin && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs">Xuất xứ</span>
                    <strong className="text-[#0B1623]">{product.origin}</strong>
                  </div>
                )}
                {product.suitableRoomSize && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Diện tích phù hợp</span>
                    <strong className="text-[#0B1623]">{product.suitableRoomSize}</strong>
                  </div>
                )}
                {product.budgetSegment && (
                  <div className="flex flex-col gap-1 border-b border-[#D8E2EA] pb-2">
                    <span className="text-[#627386] text-xs">Phân khúc</span>
                    <strong className="text-[#0B1623]">{product.budgetSegment}</strong>
                  </div>
                )}
              </div>
            </div>

            {product.features && product.features.length > 0 && (
              <div className="bg-[#F3F7FA] p-5 rounded-xl border border-[#D8E2EA]">
                <h3 className="text-sm font-bold text-[#0B1623] mb-3">Đặc điểm nổi bật</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#627386]">
                  {product.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {product.technicalSpecs && product.technicalSpecs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#0B1623] mb-3">Thông số kỹ thuật chi tiết</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#627386]">
                  {product.technicalSpecs.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* Source Transparency */}
            {(product.priceSource || product.imageSourceUrl) && (
              <div className="text-xs text-[#627386] pt-6 border-t border-[#D8E2EA] flex flex-col gap-1.5">
                <p className="font-medium text-[#0B1623] mb-1">Nguồn tham khảo</p>
                <p className="italic mb-2">Giá có thể thay đổi theo thời điểm, tồn kho và phương án lắp đặt.</p>
                {product.priceSource && (
                  <div className="flex items-center gap-2">
                    <span>Nguồn giá: {product.priceSource}</span>
                    {product.sourceUrl && (
                      <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0B1623] underline underline-offset-2">
                        Xem chi tiết <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
                {product.imageSourceUrl && (
                  <div className="flex items-center gap-2">
                    <span>Nguồn ảnh:</span>
                    <a href={product.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0B1623] underline underline-offset-2">
                      Xem chi tiết <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Reviews (Full Width Below) */}
      {reviews.length > 0 && (
        <div className="w-full pt-10 border-t border-[#D8E2EA]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-[#0B1623] mb-2">Khách hàng nói gì</h3>
              <p className="text-sm text-[#627386]">Một số phản hồi từ khách hàng quan tâm đến giải pháp phòng tắm của LivLab.</p>
            </div>
            <div className="flex items-center gap-1 text-[#123C5A] font-bold text-xl">
              <Star className="w-6 h-6 fill-current" />
              <span>4.8</span>
              <span className="text-sm text-[#627386] font-normal ml-2">({reviews.length} đánh giá)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-[#F3F7FA] p-5 rounded-2xl border border-[#D8E2EA]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#0B1623]">{review.reviewerName}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-[#C97855] text-[#C8A96A]' : 'fill-transparent text-[#D8E2EA]'}`} />
                    ))}
                  </div>
                </div>
                {review.useCase && (
                  <span className="inline-block px-2 py-1 bg-white border border-[#D8E2EA] rounded text-[10px] text-[#627386] font-medium mb-3">
                    {review.useCase}
                  </span>
                )}
                <p className="text-sm text-[#0B1623] leading-relaxed italic">"{review.reviewText}"</p>
                <p className="text-xs text-[#627386] mt-4">{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
