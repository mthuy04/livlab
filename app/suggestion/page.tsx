'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Concept, Product } from '@/lib/types';
import { getStoredConcepts, getStoredProducts } from '@/lib/storage';
import { combos, ComboPackage } from '@/lib/smallBathroomCombos';
import { useQuote } from '@/lib/context/QuoteContext';
import { CheckCircle, ArrowRight, Lightbulb, RotateCcw, AlertTriangle, LayoutGrid } from 'lucide-react';
import ConceptCard from '@/components/concepts/ConceptCard';

interface SuggestionForm {
  roomType: string;
  areaSize: string;
  budget: string;
  style: string[];
  need: string[];
}

interface Recommendation {
  label: string; // 'Phù hợp nhất', 'Tiết kiệm hơn', 'Nâng cấp hơn', 'Gọn nhẹ nhất', 'Cao cấp nhất'
  combo: ComboPackage;
  concept: Concept | null;
  products: Product[];
}

export default function SuggestionPage() {
  const router = useRouter();
  const { addItem, hasItem } = useQuote();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [form, setForm] = useState<SuggestionForm>({
    roomType: '',
    areaSize: '',
    budget: '',
    style: [],
    need: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setConcepts(getStoredConcepts() || []);
    setProducts(getStoredProducts() || []);
  }, []);

  const toggleMultiSelect = (field: 'style' | 'need', value: string) => {
    setForm(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const scoreConcept = (concept: Concept, answers: SuggestionForm): number => {
    let score = 0;
    const { roomType, areaSize, budget, style, need } = answers;

    // +4 if budgetRange matches
    if (concept.budgetRange === budget) score += 4;
    
    // +3 if style matches one of selected styles
    if (style.some(s => concept.style === s || concept.style.includes(s))) score += 3;
    
    // +3 if roomType is bathroom
    if (concept.roomType === 'Bathroom' || concept.roomType === 'Phòng tắm') score += 3;
    
    // +2 if areaSize overlaps (naive string check)
    if (concept.areaSize && (concept.areaSize === areaSize || areaSize.includes(concept.areaSize))) score += 2;
    
    // +2 for each selected need matched in text
    const searchString = `${concept.title} ${concept.shortDescription} ${concept.description} ${concept.tags?.join(' ')} ${concept.painPoints?.join(' ')} ${concept.keyBenefits?.join(' ')}`.toLowerCase();
    need.forEach(n => {
      // rough matching
      const kw = n.toLowerCase();
      if (searchString.includes(kw) || searchString.includes(kw.split(' ')[0])) {
        score += 2;
      }
    });

    // +1 keyword matching
    const rtLower = roomType.toLowerCase();
    if (rtLower.includes('căn hộ') && searchString.includes('căn hộ')) score += 1;
    if (rtLower.includes('cho thuê') && searchString.includes('thuê')) score += 1;
    if (rtLower.includes('homestay') && searchString.includes('homestay')) score += 1;
    if (rtLower.includes('master') && searchString.includes('master')) score += 1;

    return score;
  };

  const getBestConceptForCombo = (combo: ComboPackage) => {
    const bathroomConcepts = concepts.filter(c => c.roomType === 'Bathroom' || c.roomType === 'Phòng tắm');
    if (bathroomConcepts.length === 0) return null;

    let bestScore = -1;
    let bestConcept = bathroomConcepts[0];

    // Modify form's budget to match combo's budget to find the best concept for this specific combo tier
    const tempForm = { ...form, budget: combo.budgetLabel };

    bathroomConcepts.forEach(c => {
      const score = scoreConcept(c, tempForm);
      if (score > bestScore) {
        bestScore = score;
        bestConcept = c;
      }
    });

    return bestConcept;
  };

  const getProductsForCombo = (combo: ComboPackage) => {
    const isEconomy = combo.productSelectionRules.budgetSegment === 'Economy';
    const isPremium = combo.productSelectionRules.budgetSegment === 'Premium';
    
    const sortedProducts = [...products].sort((a, b) => {
      // Push Out of Stock/Discontinued to bottom if possible
      if (a.availability.includes('Limited') || a.availability.includes('Out')) return 1;
      if (b.availability.includes('Limited') || b.availability.includes('Out')) return -1;
      if (isEconomy) return a.priceMin - b.priceMin;
      if (isPremium) return b.priceMin - a.priceMin;
      return 0.5 - Math.random();
    });

    const selectedProducts: Product[] = [];
    for (const cat of combo.productSelectionRules.categories) {
      const match = sortedProducts.find(p => p.category === cat && !selectedProducts.find(sp => sp.id === p.id));
      if (match) selectedProducts.push(match);
    }
    return selectedProducts;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      let mainComboIdx = 0;
      if (form.budget === '30–60 triệu') mainComboIdx = 1;
      if (form.budget === 'Trên 60 triệu') mainComboIdx = 2;

      const recs: Recommendation[] = [];

      // Main
      recs.push({
        label: 'Phù hợp nhất',
        combo: combos[mainComboIdx],
        concept: getBestConceptForCombo(combos[mainComboIdx]),
        products: getProductsForCombo(combos[mainComboIdx])
      });

      // Cheaper
      if (mainComboIdx > 0) {
        recs.push({
          label: 'Tiết kiệm hơn',
          combo: combos[mainComboIdx - 1],
          concept: getBestConceptForCombo(combos[mainComboIdx - 1]),
          products: getProductsForCombo(combos[mainComboIdx - 1])
        });
      } else {
        // If already lowest, just show it as "Gọn nhẹ nhất" but it's redundant to show same combo.
        // We'll skip or we can show alternative products. For now, skip if no cheaper.
      }

      // Premium
      if (mainComboIdx < combos.length - 1) {
        recs.push({
          label: 'Nâng cấp hơn',
          combo: combos[mainComboIdx + 1],
          concept: getBestConceptForCombo(combos[mainComboIdx + 1]),
          products: getProductsForCombo(combos[mainComboIdx + 1])
        });
      } else {
        // Already highest. Skip.
      }

      // Always ensure we have 3 by adding the other remaining if possible
      if (recs.length < 3) {
        if (mainComboIdx === 0 && combos.length >= 3) {
          recs.push({
            label: 'Cao cấp nhất',
            combo: combos[2],
            concept: getBestConceptForCombo(combos[2]),
            products: getProductsForCombo(combos[2])
          });
        } else if (mainComboIdx === 2 && combos.length >= 3) {
          recs.push({
            label: 'Gọn nhẹ nhất',
            combo: combos[0],
            concept: getBestConceptForCombo(combos[0]),
            products: getProductsForCombo(combos[0])
          });
        }
      }

      setResults(recs);
      setActiveIndex(0); // Main is always 0
      setIsSubmitting(false);
    }, 1500);
  };

  const handleAddActiveToQuote = () => {
    if (!results) return;
    const activeRec = results[activeIndex];
    let addedCount = 0;
    activeRec.products.forEach(p => {
      if (!hasItem(p.id)) {
        addItem(p);
        addedCount++;
      }
    });
    setToastMsg(`Đã thêm ${addedCount} sản phẩm mới vào báo giá.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRequestQuote = () => {
    if (!results) return;
    const activeRec = results[activeIndex];
    activeRec.products.forEach(p => {
      if (!hasItem(p.id)) addItem(p);
    });
    router.push('/quote');
  };

  const resetForm = () => {
    setResults(null);
  };

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  const isFormValid = form.roomType && form.areaSize && form.budget && form.style.length > 0 && form.need.length > 0;

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-[#0B1623] text-white text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4 text-[#486581]" />
          {toastMsg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#D8E2EA] flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-[#123C5A]" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-3">Tìm concept phù hợp với phòng tắm của bạn</h1>
          <p className="text-[#627386] text-lg mb-6">Gợi ý thông minh theo ngân sách, diện tích và phong cách từ LivLab.</p>
          <Link href="/visual-studio" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#D8E2EA] text-[#0B1623] rounded-full font-bold hover:border-[#123C5A] transition-colors shadow-sm">
            <LayoutGrid className="w-5 h-5 text-[#C8A96A]" /> Trải nghiệm Visual Studio
          </Link>
        </div>

        {!results ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-[#D8E2EA] max-w-4xl mx-auto">
            <div className="space-y-10">
              {/* Field 1: Single */}
              <div>
                <label className="block text-sm font-bold text-[#0B1623] uppercase tracking-wider mb-3">1. Loại không gian <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {['Phòng tắm căn hộ', 'Phòng tắm nhà phố', 'Phòng tắm cho thuê', 'Phòng tắm homestay', 'Master bathroom'].map(opt => (
                    <label key={opt} className={`cursor-pointer border rounded-xl p-3 text-sm font-medium transition-colors ${form.roomType === opt ? 'border-[#123C5A] bg-[#EEF4F7] text-[#123C5A]' : 'border-[#D8E2EA] text-[#627386] hover:bg-gray-50'}`}>
                      <input type="radio" name="roomType" value={opt} className="hidden" onChange={e => setForm({...form, roomType: e.target.value})} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 2: Single */}
              <div>
                <label className="block text-sm font-bold text-[#0B1623] uppercase tracking-wider mb-3">2. Diện tích dự kiến <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['Dưới 4m²', '4–6m²', '6–10m²', 'Trên 10m²'].map(opt => (
                    <label key={opt} className={`cursor-pointer border rounded-xl p-3 text-center text-sm font-medium transition-colors ${form.areaSize === opt ? 'border-[#123C5A] bg-[#EEF4F7] text-[#123C5A]' : 'border-[#D8E2EA] text-[#627386] hover:bg-gray-50'}`}>
                      <input type="radio" name="areaSize" value={opt} className="hidden" onChange={e => setForm({...form, areaSize: e.target.value})} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 3: Single */}
              <div>
                <label className="block text-sm font-bold text-[#0B1623] uppercase tracking-wider mb-3">3. Ngân sách đầu tư (chỉ tính thiết bị) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Dưới 30 triệu', '30–60 triệu', 'Trên 60 triệu'].map(opt => (
                    <label key={opt} className={`cursor-pointer border rounded-xl p-4 text-center font-bold transition-colors ${form.budget === opt ? 'border-[#C8A96A] bg-[#FFF8F5] text-[#C8A96A]' : 'border-[#D8E2EA] text-[#627386] hover:bg-gray-50'}`}>
                      <input type="radio" name="budget" value={opt} className="hidden" onChange={e => setForm({...form, budget: e.target.value})} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 4: Multi */}
              <div>
                <label className="block text-sm font-bold text-[#0B1623] uppercase tracking-wider mb-3">4. Phong cách yêu thích <span className="text-[#627386] font-normal text-xs normal-case">(Có thể chọn nhiều)</span> <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['Minimal', 'Japandi', 'Modern', 'Hotel', 'Warm Neutral', 'Luxury', 'Budget'].map(opt => {
                    const isSelected = form.style.includes(opt);
                    return (
                      <button 
                        key={opt}
                        type="button"
                        onClick={() => toggleMultiSelect('style', opt)}
                        className={`text-left border rounded-xl p-3 text-sm font-medium transition-colors ${isSelected ? 'border-[#123C5A] bg-[#123C5A] text-white' : 'border-[#D8E2EA] text-[#627386] hover:bg-gray-50'}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 5: Multi */}
              <div>
                <label className="block text-sm font-bold text-[#0B1623] uppercase tracking-wider mb-3">5. Nhu cầu lớn nhất của bạn? <span className="text-[#627386] font-normal text-xs normal-case">(Có thể chọn nhiều)</span> <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {['Tiết kiệm chi phí', 'Dễ vệ sinh', 'Nhìn cao cấp hơn', 'Phù hợp căn hộ nhỏ', 'Cải tạo cho thuê/homestay', 'Cần combo đồng bộ nhanh'].map(opt => {
                    const isSelected = form.need.includes(opt);
                    return (
                      <button 
                        key={opt}
                        type="button"
                        onClick={() => toggleMultiSelect('need', opt)}
                        className={`text-left border rounded-xl p-3 text-sm font-medium transition-colors ${isSelected ? 'border-[#123C5A] bg-[#123C5A] text-white' : 'border-[#D8E2EA] text-[#627386] hover:bg-gray-50'}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#D8E2EA] flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || !isFormValid}
                className="px-10 py-4 bg-[#0B1623] text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 enabled:hover:bg-[#123C5A]"
              >
                {isSubmitting ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang phân tích...</>
                ) : (
                  'Xem gợi ý'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Bar */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA] shadow-sm mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#627386] mb-2">Dựa trên lựa chọn của bạn</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-[#F3F7FA] text-[#0B1623] px-2.5 py-1 rounded-md border border-[#D8E2EA]">{form.roomType}</span>
                  <span className="text-xs bg-[#F3F7FA] text-[#0B1623] px-2.5 py-1 rounded-md border border-[#D8E2EA]">{form.areaSize}</span>
                  <span className="text-xs bg-[#FFF8F5] text-[#C8A96A] font-semibold px-2.5 py-1 rounded-md border border-[#FADCCF]">{form.budget}</span>
                  {form.style.map(s => <span key={s} className="text-xs bg-[#EEF4F7] text-[#123C5A] px-2.5 py-1 rounded-md border border-[#DCEBF5]">{s}</span>)}
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="text-sm font-semibold text-[#627386] hover:text-[#0B1623] flex items-center gap-1 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Thay đổi lựa chọn
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Recommendations list */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xl font-bold text-[#0B1623] mb-2">Các phương án</h3>
                {results.map((rec, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div 
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${isActive ? 'bg-white border-[#C8A96A] shadow-md' : 'bg-white/60 border-[#D8E2EA] hover:bg-white hover:border-[#DCEBF5]'}`}
                    >
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${isActive ? 'bg-[#FFF8F5] text-[#C8A96A]' : 'bg-[#EEF4F7] text-[#627386]'}`}>
                        {rec.label}
                      </span>
                      <h4 className="text-lg font-bold text-[#0B1623] mb-1">{rec.combo.name}</h4>
                      <p className="text-sm font-bold text-[#123C5A] mb-2">{rec.combo.budgetLabel}</p>
                      <p className="text-xs text-[#627386] line-clamp-2">{rec.combo.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Active Recommendation Details */}
              <div className="lg:col-span-2">
                {results[activeIndex] && (
                  <div className="bg-white rounded-3xl border border-[#D8E2EA] shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
                    <div className="p-8 lg:p-10 border-b border-[#D8E2EA] bg-gradient-to-br from-white to-[#F3F7FA]">
                      <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-[#0B1623] text-white">
                        {results[activeIndex].label}
                      </span>
                      <h2 className="text-3xl font-bold text-[#0B1623] mb-2">{results[activeIndex].combo.name}</h2>
                      <p className="text-[#627386] mb-6">{results[activeIndex].combo.description}</p>
                      
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={handleAddActiveToQuote}
                          className="px-6 py-3.5 bg-[#EEF4F7] text-[#123C5A] font-bold rounded-xl hover:bg-[#DCEBF5] transition-colors flex items-center gap-2"
                        >
                          Thêm gợi ý vào giỏ báo giá
                        </button>
                        <button 
                          onClick={handleRequestQuote}
                          className="px-6 py-3.5 bg-[#123C5A] text-white font-bold rounded-xl hover:bg-[#123C5A]/90 transition-colors flex items-center gap-2"
                        >
                          Yêu cầu báo giá <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-8 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <h3 className="text-lg font-bold text-[#0B1623] mb-4">Concept đề xuất</h3>
                        {results[activeIndex].concept ? (
                          <ConceptCard concept={results[activeIndex].concept!} />
                        ) : (
                          <div className="bg-[#EEF4F7] rounded-2xl p-6 border border-[#DCEBF5] text-center h-full flex items-center justify-center">
                            <p className="text-[#627386] text-sm">Chưa tìm thấy concept hiển thị chính xác cho các lựa chọn này, nhưng bạn vẫn có thể xem danh sách sản phẩm bên cạnh.</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-[#0B1623]">Sản phẩm gợi ý ({results[activeIndex].products.length})</h3>
                        </div>
                        <div className="divide-y divide-[#D8E2EA]">
                          {results[activeIndex].products.map(product => (
                            <div key={product.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl bg-[#F3F7FA] overflow-hidden flex-shrink-0 border border-[#D8E2EA] p-1.5">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] uppercase tracking-widest font-bold text-[#627386] mb-0.5">{product.category}</p>
                                <p className="text-xs font-bold text-[#0B1623] truncate mb-0.5">{product.name}</p>
                                <p className="text-[11px] text-[#C8A96A] font-semibold">{product.priceRange}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-5 pt-5 border-t border-[#D8E2EA]">
                          <p className="text-[10px] text-[#627386] uppercase tracking-wider mb-1">Giá tham khảo dự kiến</p>
                          <p className="text-xl font-bold text-[#0B1623]">
                            {fmtVnd(results[activeIndex].products.reduce((acc, p) => acc + p.priceMin, 0))} – {fmtVnd(results[activeIndex].products.reduce((acc, p) => acc + p.priceMax, 0))}
                          </p>
                        </div>
                        <p className="text-[10px] text-[#627386] italic mt-3">
                          * Showroom xác nhận giá cuối, tồn kho và phương án lắp đặt.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
