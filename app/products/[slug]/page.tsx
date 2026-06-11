'use client';

import { notFound } from 'next/navigation';
import { getStoredProducts } from '@/lib/storage';
import { products as defaultProducts } from '@/lib/data';
import { generateSlug, getProductSlug, getValidProductImages, getRelatedProducts, getSimilarProducts, generateMockReviews } from '@/lib/productHelpers';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductDetailClient from './ProductDetailClient';
import ProductCard from '@/components/products/ProductCard';
import { use, useState, useEffect } from 'react';
import { Product } from '@/lib/types';

export default function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredProducts();
    setProducts((stored && stored.length > 0) ? stored : defaultProducts);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20"></div>;
  }

  const decodedSlug = decodeURIComponent(params.slug);
  const product = products.find(p => p.slug === decodedSlug || getProductSlug(p) === decodedSlug || p.id === decodedSlug);

  if (!product) {
    notFound();
  }

  const gallery = getValidProductImages(product);
  const relatedProducts = getRelatedProducts(product, products);
  const similarProducts = getSimilarProducts(product, products);
  const reviews = generateMockReviews(product);
  
  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#627386] mb-8 font-medium">
          <Link href="/" className="hover:text-[#0B1623]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[#0B1623]">Sản phẩm</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0B1623]">{product.name}</span>
        </div>

        <ProductDetailClient 
          product={product} 
          gallery={gallery} 
          reviews={reviews} 
        />

        {/* Gợi ý phối cùng */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[#0B1623] mb-8">Gợi ý phối cùng</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Sản phẩm tương tự */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-[#0B1623] mb-8">Sản phẩm tương tự</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="mt-20 bg-[#EEF4F7] rounded-3xl p-10 text-center max-w-4xl mx-auto border border-[#D8E2EA]">
          <h2 className="text-2xl font-bold text-[#0B1623] mb-4">Hoàn thiện concept phòng tắm của bạn</h2>
          <p className="text-[#627386] mb-8 max-w-lg mx-auto">Chọn thêm các sản phẩm khác để nhận được báo giá combo tốt nhất từ các showroom đối tác.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/concepts" className="px-8 py-3.5 rounded-full bg-white border border-[#D8E2EA] text-[#0B1623] font-semibold hover:border-[#0B1623] transition-colors">
              Xem concept phù hợp
            </Link>
            <Link href="/quote" className="px-8 py-3.5 rounded-full bg-[#123C5A] text-white font-semibold hover:bg-[#123C5A] transition-colors">
              Gửi yêu cầu báo giá
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
