'use client';

import { useEffect, useState } from 'react';
import { Concept, Product } from '@/lib/types';
import { getStoredConcepts, getStoredProducts } from '@/lib/storage';
import { importVerifiedConceptsFromCsv } from '@/lib/importVerifiedConcepts';
import InteractiveRoomViewer from '@/components/concepts/InteractiveRoomViewer';
import ConceptCard from '@/components/concepts/ConceptCard';
import Link from 'next/link';
import { ChevronRight, ArrowRight, CheckCircle, MapPin, Layers, Wallet, LayoutGrid } from 'lucide-react';
import ConceptActions from '@/components/concepts/ConceptActions';

const roomTypeVi: Record<string, string> = {
  Bathroom: 'Phòng tắm', 'Living Room': 'Phòng khách', Kitchen: 'Bếp', Studio: 'Studio',
};

export default function ConceptDetailClient({ slug }: { slug: string }) {
  const [concept, setConcept] = useState<Concept | null>(null);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get products for mapping
    const storedProducts = getStoredProducts() || [];
    setProducts(storedProducts);

    // 2. Load concepts
    const loadConcepts = async () => {
      let loadedConcepts = getStoredConcepts();
      if (!loadedConcepts || loadedConcepts.length === 0 || loadedConcepts.some(c => c.image?.includes('placeholder'))) {
        loadedConcepts = await importVerifiedConceptsFromCsv(false);
      }
      setAllConcepts(loadedConcepts || []);
      
      const found = (loadedConcepts || []).find(c => c.slug === slug);
      setConcept(found || null);
      setLoading(false);
    };
    
    loadConcepts();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20"></div>;
  }

  if (!concept) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-[#F3F7FA] flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-[#EEF4F7] flex items-center justify-center mb-6">
          <LayoutGrid className="w-10 h-10 text-[#627386]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0B1623] mb-3">Không tìm thấy Concept</h1>
        <p className="text-[#627386] text-lg text-center max-w-md mb-8">
          Concept bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại. Vui lòng kiểm tra lại đường dẫn.
        </p>
        <Link 
          href="/concepts" 
          className="bg-[#0B1623] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#123C5A] transition-colors"
        >
          Trở về Thư viện Concept
        </Link>
      </div>
    );
  }

  const pIds = concept.productIds || [];
  const conceptProducts = pIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const minTotal = concept.estimatedBudgetMin || conceptProducts.reduce((s, p) => s + (p?.priceMin ?? 0), 0);
  const maxTotal = concept.estimatedBudgetMax || conceptProducts.reduce((s, p) => s + (p?.priceMax ?? 0), 0);
  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  const alternatives = allConcepts
    .filter((c) => c.slug !== slug && c.title !== concept.title && c.image !== concept.image)
    .sort((a, b) => {
      // Prioritize same roomType
      if (a.roomType === concept.roomType && b.roomType !== concept.roomType) return -1;
      if (b.roomType === concept.roomType && a.roomType !== concept.roomType) return 1;
      // If same roomType, prioritize different style or budget
      if (a.roomType === concept.roomType) {
        if (a.style !== concept.style || a.budgetRange !== concept.budgetRange) return -1;
      }
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#D8E2EA]">
        <div className="max-w-8xl mx-auto px-6 lg:px-10 py-4 flex items-center gap-2 text-sm text-[#627386] overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-[#0B1623] transition-colors">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link href="/concepts" className="hover:text-[#0B1623] transition-colors">Thư viện concept</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-[#0B1623] font-medium truncate">{concept.title}</span>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest bg-[#EEF4F7] text-[#123C5A] px-3 py-1 rounded-full">
              {concept.style}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest bg-[#EEF4F7] text-[#627386] px-3 py-1 rounded-full">
              {roomTypeVi[concept.roomType] || concept.roomType}
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-[#0B1623] mb-3">{concept.title}</h1>
          <p className="text-[#627386] text-lg max-w-2xl leading-relaxed">{concept.description}</p>

          <div className="flex flex-wrap gap-6 mt-5 text-sm text-[#627386]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Diện tích: <strong className="text-[#0B1623]">{concept.areaSize}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Sản phẩm: <strong className="text-[#0B1623]">{concept.productCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              <span>Ngân sách: <strong className="text-[#0B1623]">{concept.budgetRange}</strong></span>
            </div>
          </div>
        </div>

        {/* Interactive Room Viewer */}
        <div className="mb-12">
          <InteractiveRoomViewer concept={concept} showComboSummary />
        </div>

        {/* Combo Summary CTA */}
        <div className="bg-[#0B1623] rounded-3xl p-8 mb-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-2">Ngân sách tham khảo</p>
            <h3 className="text-2xl font-bold text-white mb-1">
              {fmtVnd(minTotal)} – {fmtVnd(maxTotal)}
            </h3>
            <p className="text-white/60 text-sm">
              Giá cuối phụ thuộc tồn kho, diện tích và phương án lắp đặt.
            </p>
          </div>
          <ConceptActions concept={concept} conceptProducts={conceptProducts} />
        </div>

        {/* Product List */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#0B1623] mb-6">Sản phẩm trong concept</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {conceptProducts.map((product) => product && (
              <div key={product.id} className="bg-white rounded-2xl border border-[#D8E2EA] overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="h-36 overflow-hidden bg-white border-b border-[#D8E2EA]">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'; }} />
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[#627386] font-semibold mb-1">{product.category}</p>
                  <p className="text-xs font-semibold text-[#0B1623] mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-xs font-bold text-[#C8A96A]">{product.priceRange}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why It Works & Concept Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div className="lg:col-span-2 bg-[#EEF4F7] rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-[#0B1623] mb-6">Lợi ích khi chọn concept này</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(concept.keyBenefits || concept.whyItWorks || []).map((reason, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#DCEBF5] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#123C5A]" />
                  </div>
                  <p className="text-sm text-[#0B1623] leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs italic text-[#627386]">* Hình ảnh concept mang tính tham khảo phong cách; danh sách sản phẩm được LivLab gợi ý để hỗ trợ yêu cầu báo giá.</p>
          </div>
          <div className="bg-white border border-[#D8E2EA] rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B1623] mb-5">Thông tin thêm</h2>
            
            {concept.suitableFor && concept.suitableFor.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-2">Phù hợp cho</p>
                <div className="flex flex-wrap gap-2">
                  {concept.suitableFor.map((item, i) => (
                    <span key={i} className="text-xs bg-[#F3F7FA] text-[#0B1623] px-2.5 py-1 rounded-md border border-[#D8E2EA]">{item}</span>
                  ))}
                </div>
              </div>
            )}
            
            {concept.painPoints && concept.painPoints.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-2">Vấn đề concept này giải quyết</p>
                <ul className="list-disc pl-4 text-xs text-[#0B1623] space-y-1">
                  {concept.painPoints.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
              </div>
            )}

            {concept.keyProducts && concept.keyProducts.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-2">Sản phẩm cốt lõi</p>
                <ul className="list-disc pl-4 text-xs text-[#0B1623] space-y-1">
                  {concept.keyProducts.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Alternatives */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0B1623]">Bạn có thể cũng thích</h2>
            <Link href="/concepts" className="text-sm text-[#627386] hover:text-[#0B1623] transition-colors flex items-center gap-1">
              Tất cả concept <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alternatives.map((alt) => (
              <ConceptCard key={alt.id} concept={alt} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
