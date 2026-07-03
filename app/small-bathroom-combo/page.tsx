'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { getStoredProducts } from '@/lib/storage';
import { combos, ComboPackage } from '@/lib/smallBathroomCombos';
import { useQuote } from '@/lib/context/QuoteContext';
import { getProductSlug } from '@/lib/productHelpers';
import { CheckCircle, AlertTriangle, Droplet, Zap, Star, Scan } from 'lucide-react';

// Shared with handleAddComboToQuote so the preview grid shows the same products a click would add.
function selectComboProducts(combo: ComboPackage, products: Product[]): Product[] {
  const isEconomy = combo.productSelectionRules.budgetSegment === 'Economy';
  const isPremium = combo.productSelectionRules.budgetSegment === 'Premium';

  const sortedProducts = [...products].sort((a, b) => {
    if (isEconomy) return a.priceMin - b.priceMin;
    if (isPremium) return b.priceMin - a.priceMin;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });

  const selectedProducts: Product[] = [];
  for (const cat of combo.productSelectionRules.categories) {
    const match = sortedProducts.find(p => p.category === cat && !selectedProducts.find(sp => sp.id === p.id));
    if (match) {
      selectedProducts.push(match);
    }
  }
  return selectedProducts;
}

export default function SmallBathroomComboPage() {
  const router = useRouter();
  const { addItem } = useQuote();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProducts(getStoredProducts() || []);
    setLoading(false);
  }, []);

  const handleAddComboToQuote = (combo: ComboPackage) => {
    const selectedProducts = selectComboProducts(combo, products);

    if (selectedProducts.length > 0) {
      // Don't clear quote, just add items.
      selectedProducts.forEach(p => addItem(p));
      alert(`Đã thêm ${selectedProducts.length} sản phẩm của combo ${combo.name} vào báo giá. Bạn có thể chỉnh sửa từng món trong giỏ trước khi gửi yêu cầu.`);
      router.push('/quote');
    } else {
      alert('Không tìm thấy sản phẩm phù hợp cho combo này. Vui lòng thử lại sau.');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20"></div>;

  const allCategories = Array.from(new Set(combos.flatMap((c) => c.includedCategories)));

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
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">Combo cải tạo phòng tắm nhỏ</h1>
            <p className="text-[#C8A96A] font-semibold text-lg mb-6">Không cần trả lời câu hỏi nào — chọn 1 gói, có ngay.</p>
            <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
              LivLab giúp bạn chọn nhanh concept, sản phẩm và ngân sách tham khảo cho phòng tắm căn hộ, nhà phố, homestay hoặc không gian cho thuê.
            </p>
            <div className="flex flex-wrap items-start gap-4 mb-10">
              <div>
                <a href="#packages" className="px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors inline-block">
                  Khám phá combo
                </a>
                <p className="text-xs text-white/50 mt-2 px-1">3 gói dựng sẵn, xem là quyết định được luôn.</p>
              </div>
              <Link href="/ai-suggestion" className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20">
                Nhận gợi ý AI cá nhân hoá
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
            {combos.map((combo) => {
              const previewProducts = selectComboProducts(combo, products).slice(0, 6);
              return (
              <div key={combo.id} className="bg-white rounded-3xl p-8 border border-[#D8E2EA] flex flex-col hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#486581] to-[#C97855]" />
                <h3 className="text-2xl font-bold text-[#0B1623] mb-2 mt-4">{combo.name}</h3>
                <p className="text-3xl font-bold text-[#123C5A] mb-4">{combo.budgetLabel}</p>
                <p className="text-sm italic text-[#627386] mb-3">
                  Chọn gói này nếu bạn đang cần: {combo.targetUsers.join(', ')}.
                </p>
                <p className="text-sm text-[#627386] mb-6 min-h-[60px]">{combo.description}</p>

                {previewProducts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase text-[#0B1623] tracking-wider mb-2">Sản phẩm tiêu biểu:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {previewProducts.map((p) => {
                        const thumb = (
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-[#EEF4F7] border border-[#D8E2EA]">
                            <img src={p.image} alt={p.imageAlt || p.name} className="w-full h-full object-cover" />
                            {p.usdzUrl && (
                              <span
                                title="Có thể xem AR"
                                aria-label="Có thể xem AR"
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0B1623]/80 flex items-center justify-center"
                              >
                                <Scan className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>
                        );
                        return (
                          <Link key={p.id} href={`/products/${getProductSlug(p)}`} className="block">
                            {thumb}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

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
              );
            })}
          </div>
        </div>
      </section>

      {/* C2. Quick Compare Section */}
      <section className="py-16 px-6 bg-[#EEF4F7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#C8A96A] uppercase tracking-widest text-xs font-bold mb-2 block">Compare</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623]">So sánh nhanh 3 gói</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#D8E2EA] bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F7FA]">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#0B1623]">Hạng mục</th>
                  {combos.map((combo) => (
                    <th key={combo.id} className="p-4 text-sm font-bold text-[#0B1623]">{combo.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCategories.map((cat) => (
                  <tr key={cat} className="border-t border-[#EEF4F7]">
                    <td className="p-4 text-sm font-medium text-[#627386]">{cat}</td>
                    {combos.map((combo) => (
                      <td key={combo.id} className="p-4 text-sm text-[#0B1623]">
                        {combo.includedCategories.includes(cat) ? cat : ''}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-[#D8E2EA] bg-[#F3F7FA]">
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-[#0B1623]">Ngân sách</td>
                  {combos.map((combo) => (
                    <td key={combo.id} className="p-4 text-sm font-bold text-[#123C5A]">{combo.budgetLabel}</td>
                  ))}
                </tr>
              </tbody>
            </table>
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

      {/* E. Final CTA */}
      <section className="py-24 px-6 bg-[#0B1623] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">Bạn muốn nhận báo giá cho phòng tắm của mình?</h2>
          <p className="text-white/60 mb-10 text-lg">
            LivLab gợi ý sản phẩm để hỗ trợ quá trình chọn mua. Tồn kho có thể thay đổi theo thời điểm.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/ai-suggestion" className="px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors">
              Nhận gợi ý AI cá nhân hoá
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
