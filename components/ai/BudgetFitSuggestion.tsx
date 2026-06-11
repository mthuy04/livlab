'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCcw, ChevronRight, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BudgetFitCard from '@/components/budget/BudgetFitCard';

export default function BudgetFitSuggestion() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    budgetMin: 15000000,
    budgetMax: 25000000,
    area: '',
    style: 'Japandi',
    roomType: 'Phòng tắm căn hộ',
    needs: ['lavabo', 'mirror', 'shower', 'vanity', 'toilet', 'accessories'],
    additionalServices: ['tư vấn phối concept', 'lắp đặt thiết bị']
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });

  const styles = ['Japandi', 'Minimalist', 'Modern', 'Classic', 'Indochine'];
  const roomTypes = ['Phòng tắm căn hộ', 'Phòng tắm master', 'Phòng tắm nhỏ', 'Phòng tắm nhà phố'];
  const productNeedsOptions = [
    { id: 'lavabo', label: 'Lavabo' },
    { id: 'mirror', label: 'Gương' },
    { id: 'shower', label: 'Sen tắm' },
    { id: 'vanity', label: 'Tủ chậu' },
    { id: 'toilet', label: 'Bồn cầu' },
    { id: 'accessories', label: 'Phụ kiện' }
  ];
  const serviceOptions = [
    { id: 'tư vấn phối concept', label: 'Tư vấn phối concept' },
    { id: 'đo đạc thực tế', label: 'Đo đạc thực tế' },
    { id: 'lắp đặt thiết bị', label: 'Lắp đặt thiết bị' },
    { id: 'cải tạo / thi công phòng tắm', label: 'Cải tạo / thi công' },
    { id: 'cần kiến trúc sư / designer hỗ trợ', label: 'Cần Kiến trúc sư' }
  ];

  const handleToggle = (list: string[], item: string, setter: (l: string[]) => void) => {
    if (list.includes(item)) setter(list.filter(i => i !== item));
    else setter([...list, item]);
  };

  const submitToAI = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          area: parseFloat(formData.area) || undefined
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Đã có lỗi xảy ra khi gọi AI.');
    } finally {
      setLoading(false);
    }
  };

  const submitQuote = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Vui lòng nhập tên và số điện thoại để nhận báo giá.');
      return;
    }
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerInfo.name,
          phone: customerInfo.phone,
          roomType: formData.roomType,
          budgetRange: `${(formData.budgetMin/1000000)}M - ${(formData.budgetMax/1000000)}M`,
          conceptName: result.suggestion.recommendedConcept?.title || 'AI Suggestion',
          estimatedValue: result.suggestion.estimatedTotal,
          notes: `Style: ${formData.style}\nServices: ${formData.additionalServices.join(', ')}`,
          budgetMax: formData.budgetMax,
          aiSummary: result.suggestion.summary,
          aiFitScore: result.suggestion.fitScore,
          aiSource: result.source,
          items: result.suggestion.recommendedProducts,
          aiLog: {
            input: formData,
            output: result.suggestion
          }
        })
      });
      if (res.ok) {
        alert('Yêu cầu báo giá đã được gửi thành công!');
        router.push('/');
      } else {
        alert('Lỗi gửi báo giá.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi gửi báo giá.');
    }
  };

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      
      {!result && !loading && (
        <div className="bg-white rounded-3xl p-8 border border-[#D8E3EC] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#123C5A] to-[#C8A96A] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0B1623]">LivLab AI Suggestion</h2>
              <p className="text-[#627386] text-sm">Nhập nhu cầu của bạn để AI gợi ý combo thiết bị và concept tối ưu ngân sách nhất.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Ngân sách dự kiến</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={formData.budgetMin} onChange={e => setFormData({...formData, budgetMin: parseInt(e.target.value)})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm" placeholder="Tối thiểu" />
                  <span className="text-[#627386]">-</span>
                  <input type="number" value={formData.budgetMax} onChange={e => setFormData({...formData, budgetMax: parseInt(e.target.value)})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm" placeholder="Tối đa" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Diện tích (m2)</label>
                <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm" placeholder="VD: 4.5" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Loại phòng</label>
                <select value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm text-[#0B1623]">
                  {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Phong cách</label>
                <select value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm text-[#0B1623]">
                  {styles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Sản phẩm cần mua</label>
                <div className="flex flex-wrap gap-2">
                  {productNeedsOptions.map(p => (
                    <button key={p.id} onClick={() => handleToggle(formData.needs, p.id, v => setFormData({...formData, needs: v}))} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.needs.includes(p.id) ? 'bg-[#123C5A] text-white border-[#123C5A]' : 'bg-white text-[#627386] border-[#D8E2EA] hover:border-[#123C5A]'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B1623] mb-2">Dịch vụ bổ sung</label>
                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map(s => (
                    <button key={s.id} onClick={() => handleToggle(formData.additionalServices, s.id, v => setFormData({...formData, additionalServices: v}))} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.additionalServices.includes(s.id) ? 'bg-[#C8A96A] text-white border-[#C8A96A]' : 'bg-white text-[#627386] border-[#D8E2EA] hover:border-[#C8A96A]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="mt-10 flex justify-end border-t border-[#D8E2EA] pt-6">
            <button onClick={submitToAI} className="flex items-center gap-2 bg-gradient-to-r from-[#123C5A] to-[#0B1623] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-5 h-5" /> Tìm Combo Tối Ưu
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-16 h-16 border-4 border-[#EEF4F7] border-t-[#C8A96A] rounded-full animate-spin"></div>
          <p className="text-lg font-bold text-[#0B1623] animate-pulse">LivLab AI đang phân tích concept và sản phẩm phù hợp...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0B1623]">Kết quả gợi ý</h2>
            <div className="flex items-center gap-2 text-sm font-bold bg-[#EEF4F7] px-3 py-1.5 rounded-full text-[#123C5A]">
              <Sparkles className="w-4 h-4 text-[#C8A96A]" /> {result.source === 'GEMINI' ? 'Gemini AI' : 'Rule Fallback'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Summary & Concept */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#D8E3EC] shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${result.suggestion.budgetFit === 'OVER_BUDGET' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#0B1623]">{result.suggestion.fitScore}/100</h3>
                    <p className="text-[#627386] text-sm">Điểm tối ưu ngân sách</p>
                  </div>
                </div>
                <p className="text-[#0B1623] text-sm leading-relaxed">{result.suggestion.summary}</p>
              </div>

              {result.suggestion.recommendedConcept && (
                <div className="bg-white rounded-3xl border border-[#D8E3EC] overflow-hidden shadow-sm">
                  {result.suggestion.recommendedConcept.imageUrl ? (
                    <img src={result.suggestion.recommendedConcept.imageUrl} alt="Concept" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-[#EEF4F7] flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#D8E2EA]" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider mb-1">Concept phù hợp</p>
                    <h4 className="font-bold text-[#0B1623] mb-2">{result.suggestion.recommendedConcept.title}</h4>
                    <p className="text-xs text-[#627386]">{result.suggestion.styleReason}</p>
                  </div>
                </div>
              )}
              
              {result.suggestion.missingItems && result.suggestion.missingItems.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Thiếu sản phẩm</p>
                    <p className="text-xs text-amber-700 mt-1">Không tìm thấy sản phẩm phù hợp cho: {result.suggestion.missingItems.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Products */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#D8E3EC] shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#D8E2EA]">
                  <div>
                    <h3 className="font-bold text-[#0B1623] text-lg">Combo Sản phẩm</h3>
                    <p className="text-[#627386] text-sm">{result.suggestion.recommendedProducts.length} sản phẩm</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[#627386] tracking-wider mb-1">Tổng chi phí dự kiến</p>
                    <p className="text-2xl font-bold text-[#123C5A] mb-4">{fmtVnd(result.suggestion.estimatedTotal)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <BudgetFitCard 
                    total={result.suggestion.estimatedTotal} 
                    budgetMin={formData.budgetMin} 
                    budgetMax={formData.budgetMax} 
                  />
                </div>

                <div className="space-y-4">
                  {result.suggestion.recommendedProducts.map((p: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-[#EEF4F7] transition-colors group">
                      <div className="w-20 h-20 bg-white border border-[#D8E2EA] rounded-xl overflow-hidden flex-shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#EEF4F7]">
                            <LayoutGrid className="w-6 h-6 text-[#D8E2EA]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-[#0B1623] truncate text-sm">{p.name}</h4>
                          <p className="text-xs text-[#627386] uppercase tracking-wider mt-1">{p.category}</p>
                        </div>
                        <p className="text-xs text-[#627386] bg-white px-2 py-1 rounded-md border border-[#D8E2EA] inline-block mt-2 self-start">{p.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[#123C5A]">{fmtVnd(p.price)}</p>
                        <p className="text-xs text-[#627386] mt-1">SL: {p.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 border border-[#D8E3EC] shadow-sm">
                <h3 className="font-bold text-[#0B1623] mb-4 text-lg">Gửi yêu cầu báo giá</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="Họ và tên *" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm" />
                  <input type="tel" placeholder="Số điện thoại *" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-3 bg-[#EEF4F7] rounded-xl border-none focus:ring-2 focus:ring-[#123C5A] text-sm" />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setResult(null)} className="px-6 py-3.5 rounded-full font-bold text-[#627386] bg-[#EEF4F7] hover:bg-[#D8E2EA] transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Làm lại
                  </button>
                  <button onClick={submitQuote} className="flex-1 flex items-center justify-center gap-2 bg-[#123C5A] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[#0D2B42] hover:shadow-xl transition-all">
                    Gửi yêu cầu báo giá với combo này <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
