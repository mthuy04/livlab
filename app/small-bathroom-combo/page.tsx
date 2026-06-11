'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Concept, Product } from '@/lib/types';
import { getStoredConcepts, getStoredProducts } from '@/lib/storage';
import { combos, ComboPackage } from '@/lib/smallBathroomCombos';
import { useQuote } from '@/lib/context/QuoteContext';
import { CheckCircle, AlertTriangle, ArrowRight, LayoutGrid, Droplet, Zap, Star } from 'lucide-react';
import ConceptCard from '@/components/concepts/ConceptCard';
import ProductCard from '@/components/products/ProductCard';

export default function SmallBathroomComboPage() {
  const router = useRouter();
  const { addItem } = useQuote();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setConcepts(getStoredConcepts() || []);
    setProducts(getStoredProducts() || []);
    setLoading(false);
  }, []);

  const handleAddComboToQuote = (combo: ComboPackage) => {
    // Basic logic: Find 1 product per category based on combo rules
    // First, filter products that fit the budget roughly
    const isEconomy = combo.productSelectionRules.budgetSegment === 'Economy';
    const isPremium = combo.productSelectionRules.budgetSegment === 'Premium';
    
    // Sort products logically to pick the best match
    // E.g. cheaper products for Economy, expensive for Premium
    const sortedProducts = [...products].sort((a, b) => {
      if (isEconomy) return a.priceMin - b.priceMin;
      if (isPremium) return b.priceMin - a.priceMin;
      // Mid-range: random sort or middle
      return 0.5 - Math.random();
    });

    const selectedProducts: Product[] = [];
    
    for (const cat of combo.productSelectionRules.categories) {
      const match = sortedProducts.find(p => p.category === cat && !selectedProducts.find(sp => sp.id === p.id));
      if (match) {
        selectedProducts.push(match);
      }
    }

    if (selectedProducts.length > 0) {
      // Don't clear quote, just add items.
      selectedProducts.forEach(p => addItem(p));
      alert(`Đã thêm ${selectedProducts.length} sản phẩm của combo ${combo.name} vào báo giá.`);
      router.push('/quote');
    } else {
      alert('Không tìm thấy sản phẩm phù hợp cho combo này. Vui lòng thử lại sau.');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20"></div>;

  // Filter concepts
  const featuredConcepts = concepts
    .filter(c => c.roomType === 'Bathroom' || c.roomType === 'Phòng tắm')
    .slice(0, 3);

  // Filter products by representative categories
  const featuredCats = ['Lavabo', 'Vòi chậu', 'Bồn cầu', 'Sen tắm'];
  const featuredProducts = products.filter(p => featuredCats.includes(p.category)).slice(0, 4);

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      {/* A. Hero Section */}
      <section className="bg-[#0B1623] py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <img src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1920&q=80" alt="Bathroom Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1623] via-[#0B1623]/80 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#C8A96A] uppercase tracking-widest text-xs font-bold mb-4 block">Small Bathroom Makeover</span>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">Combo cải tạo phòng tắm nhỏ</h1>
            <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
              LivLab giúp bạn chọn nhanh concept, sản phẩm và ngân sách tham khảo cho phòng tắm căn hộ, nhà phố, homestay hoặc không gian cho thuê.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <a href="#packages" className="px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors">
                Khám phá combo
              </a>
              <Link href="/suggestion" className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20">
                Nhận gợi ý
              </Link>
              <Link href="/visual-studio" className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" /> Visual Studio
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#486581]" /> Concept rõ ràng</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#486581]" /> Sản phẩm đồng bộ</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#486581]" /> Báo giá theo nhu cầu thực tế</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#486581]" /> Kết nối showroom phù hợp</div>
            </div>
          </div>
        </div>
      </section>

      {/* B. Problem Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-12">Vì sao chọn combo thay vì mua từng món?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="flex gap-4 p-6 bg-[#F3F7FA] rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1623] mb-2">Khó phối hợp đồng bộ</h3>
                <p className="text-[#627386] text-sm">Khó phối lavabo, vòi, gương, sen tắm, bồn cầu sao cho đồng bộ về màu sắc và phong cách.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-[#F3F7FA] rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1623] mb-2">Dễ vượt ngân sách</h3>
                <p className="text-[#627386] text-sm">Dễ vượt ngân sách khi mua từng món riêng lẻ mà không có bức tranh tổng thể về giá.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-[#F3F7FA] rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1623] mb-2">Diện tích không phù hợp</h3>
                <p className="text-[#627386] text-sm">Không biết sản phẩm nào phù hợp diện tích phòng tắm nhỏ, dẫn đến chật chội.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-[#F3F7FA] rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1623] mb-2">Mất thời gian</h3>
                <p className="text-[#627386] text-sm">Mất nhiều thời gian hỏi giá từng showroom và so sánh các thông số kỹ thuật.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. Combo Packages Section */}
      <section id="packages" className="py-24 px-6 bg-[#EEF4F7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C8A96A] uppercase tracking-widest text-xs font-bold mb-2 block">Packages</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#0B1623]">Chọn combo phù hợp</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {combos.map((combo) => (
              <div key={combo.id} className="bg-white rounded-3xl p-8 border border-[#D8E2EA] flex flex-col hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#486581] to-[#C97855]" />
                <h3 className="text-2xl font-bold text-[#0B1623] mb-2 mt-4">{combo.name}</h3>
                <p className="text-3xl font-bold text-[#123C5A] mb-4">{combo.budgetLabel}</p>
                <p className="text-sm text-[#627386] mb-6 min-h-[60px]">{combo.description}</p>
                
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase text-[#0B1623] tracking-wider mb-2">Phù hợp cho:</p>
                  <ul className="space-y-1.5 mb-6">
                    {combo.targetUsers.map((tu, i) => (
                      <li key={i} className="text-sm text-[#627386] flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#486581]" /> {tu}
                      </li>
                    ))}
                  </ul>
                  
                  <p className="text-xs font-bold uppercase text-[#0B1623] tracking-wider mb-2">Bao gồm:</p>
                  <ul className="space-y-1.5">
                    {combo.includedCategories.map((cat, i) => (
                      <li key={i} className="text-sm text-[#627386] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#123C5A]" /> {cat}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto space-y-3">
                  <button 
                    onClick={() => handleAddComboToQuote(combo)}
                    className="w-full py-4 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors flex items-center justify-center gap-2"
                  >
                    Thêm combo vào giỏ báo giá
                  </button>
                  <Link 
                    href="/concepts" 
                    className="w-full py-3.5 bg-white text-[#0B1623] font-semibold rounded-2xl border border-[#D8E2EA] hover:border-[#0B1623] transition-colors flex items-center justify-center"
                  >
                    Xem concept phù hợp
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D. How it works section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623]">4 bước đơn giản để chốt phương án</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-[#D8E2EA] -z-10" />
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0B1623] text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">1</div>
              <h3 className="font-bold text-[#0B1623] mb-2">Chọn nhu cầu</h3>
              <p className="text-[#627386] text-sm px-4">Chọn diện tích phòng tắm và khoảng ngân sách đầu tư.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0B1623] text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">2</div>
              <h3 className="font-bold text-[#0B1623] mb-2">LivLab gợi ý</h3>
              <p className="text-[#627386] text-sm px-4">Nhận gợi ý concept phong cách và danh sách sản phẩm phù hợp.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0B1623] text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">3</div>
              <h3 className="font-bold text-[#0B1623] mb-2">Thêm vào giỏ báo giá</h3>
              <p className="text-[#627386] text-sm px-4">Gom toàn bộ combo vào giỏ báo giá và gửi yêu cầu tư vấn.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0B1623] text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">4</div>
              <h3 className="font-bold text-[#0B1623] mb-2">Showroom xác nhận</h3>
              <p className="text-[#627386] text-sm px-4">Showroom đối tác tư vấn giá cuối, kiểm tra tồn kho và khảo sát lắp đặt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* E. Featured Concepts */}
      {featuredConcepts.length > 0 && (
        <section className="py-24 px-6 bg-[#F3F7FA]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0B1623] mb-2">Concept phòng tắm nổi bật</h2>
                <p className="text-[#627386]">Ý tưởng thiết kế thực tế cho không gian nhỏ.</p>
              </div>
              <Link href="/concepts" className="hidden sm:flex items-center gap-2 text-[#627386] hover:text-[#0B1623] font-medium">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredConcepts.map(c => <ConceptCard key={c.id} concept={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* F. Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0B1623] mb-2">Thiết bị bán chạy</h2>
                <p className="text-[#627386]">Sản phẩm được tối ưu cho phòng tắm căn hộ.</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-[#627386] hover:text-[#0B1623] font-medium">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* G. Final CTA */}
      <section className="py-24 px-6 bg-[#0B1623] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">Bạn muốn nhận báo giá cho phòng tắm của mình?</h2>
          <p className="text-white/60 mb-10 text-lg">
            LivLab gợi ý sản phẩm để hỗ trợ quá trình chọn mua. Tồn kho có thể thay đổi theo thời điểm.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/suggestion" className="px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors">
              Nhận gợi ý combo
            </Link>
            <Link href="/quote" className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20">
              Gửi yêu cầu báo giá
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
