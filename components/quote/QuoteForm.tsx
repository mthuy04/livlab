'use client';

import { useState, FormEvent, useEffect } from 'react';
import { QuoteItem } from '@/lib/types';
import { clearQuotePrefill, calculateQuoteTotalRange, getQuotePrefill } from '@/lib/storage';
import { generateLeadId } from '@/lib/utils';
import BudgetFitCard from '@/components/budget/BudgetFitCard';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface QuoteFormProps {
  quoteItems: QuoteItem[];
  onSuccess: (requestCode: string) => void;
}

const roomTypes     = ['Phòng tắm', 'Phòng khách', 'Bếp', 'Studio', 'Phòng ngủ', 'Phòng ăn'];
const budgetRanges  = ['Dưới 30 triệu', '30–60 triệu', 'Trên 60 triệu'];
const styles        = ['Japandi', 'Modern', 'Minimal', 'Hotel', 'Warm Neutral', 'Industrial'];
const timelines     = ['Trong vòng 1 tháng', '1–2 tháng', '2–3 tháng', '3–6 tháng', 'Chưa xác định'];
const conceptOptions = [
  'Phòng tắm căn hộ nhỏ',
  'Phòng tắm Japandi cho căn hộ',
  'Phòng tắm phong cách khách sạn',
  'Phòng tắm tiết kiệm cho nhà cho thuê',
  'Phòng khách tối giản ấm',
  'Góc bếp căn hộ',
  'Studio cho thuê',
  'Không có concept cụ thể',
  'Small Bathroom Makeover Combo - Tiết kiệm',
  'Small Bathroom Makeover Combo - Cân bằng',
  'Small Bathroom Makeover Combo - Cao cấp'
];

interface FormData {
  customerName: string;
  phone: string;
  email: string;
  roomType: string;
  roomSize: string;
  budgetRange: string;
  style: string;
  selectedConcept: string;
  timeline: string;
  needsInstallation: boolean;
  consent: boolean;
  notes: string;
}

interface FormErrors {
  customerName?: string;
  phone?: string;
  roomType?: string;
  budgetRange?: string;
  consent?: string;
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-white border ${err ? 'border-red-400' : 'border-[#D8E2EA]'} rounded-xl text-sm text-[#0B1623] placeholder-[#627386]/60 focus:outline-none focus:border-[#123C5A] transition-colors`;
const labelCls = 'block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2';

export default function QuoteForm({ quoteItems, onSuccess }: QuoteFormProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const isCustomer = user?.role === 'CUSTOMER';

  const [form, setForm] = useState<FormData>({
    customerName: isCustomer ? (user?.name || '') : '', 
    phone: isCustomer ? (user?.phone || '') : '', 
    email: isCustomer ? (user?.email || '') : '', 
    roomType: '', 
    roomSize: '',
    budgetRange: '', 
    style: '', 
    selectedConcept: '', 
    timeline: '',
    needsInstallation: false, consent: false, notes: '',
  });

  useEffect(() => {
    const prefill = getQuotePrefill();
    const initBudget = searchParams?.get('budget') || prefill?.budgetRange || '';
    const initConcept = searchParams?.get('concept') || prefill?.selectedConcept || '';
    const initRoomType = searchParams?.get('roomType') || prefill?.roomType || '';

    setForm(prev => ({
      ...prev,
      roomType: initRoomType,
      budgetRange: initBudget,
      selectedConcept: initConcept
    }));
  }, [searchParams]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.customerName.trim()) errs.customerName = 'Vui lòng nhập họ và tên';
    if (!form.phone.trim())        errs.phone        = 'Vui lòng nhập số điện thoại';
    if (!form.roomType)            errs.roomType     = 'Vui lòng chọn loại phòng';
    if (!form.budgetRange)         errs.budgetRange  = 'Vui lòng chọn ngân sách';
    if (!form.consent)             errs.consent      = 'Vui lòng đồng ý với chính sách xử lý dữ liệu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    let parsedMin = null;
    let parsedMax = null;
    if (form.budgetRange === 'Dưới 30 triệu') {
      parsedMin = 0; parsedMax = 30000000;
    } else if (form.budgetRange === '30–60 triệu') {
      parsedMin = 30000000; parsedMax = 60000000;
    } else if (form.budgetRange === 'Trên 60 triệu') {
      parsedMin = 60000000; parsedMax = 1000000000;
    }

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          roomType: form.roomType,
          budgetRange: form.budgetRange,
          budgetMin: parsedMin,
          budgetMax: parsedMax,
          conceptName: form.selectedConcept,
          notes: form.notes + (form.timeline ? `\nTimeline: ${form.timeline}` : '') + (form.needsInstallation ? `\nNeeds Installation: Yes` : ''),
          items: quoteItems,
        })
      });

      if (!res.ok) throw new Error('Failed to submit quote');
      
      const data = await res.json();
      console.log(`[LivLab] Lead created via API:`, data.lead.id);
      
      clearQuotePrefill();
      onSuccess(data.lead.id);
    } catch (err) {
      console.error(err);
      alert('Đã có lỗi xảy ra khi gửi yêu cầu báo giá.');
    } finally {
      setLoading(false);
    }
  };

  const getBudgetRangeValues = (label: string) => {
    if (label === 'Dưới 30 triệu') return { min: 0, max: 30000000 };
    if (label === '30–60 triệu') return { min: 30000000, max: 60000000 };
    if (label === 'Trên 60 triệu') return { min: 60000000, max: 1000000000 };
    return { min: null, max: null };
  };

  const { min: currentBudgetMin, max: currentBudgetMax } = getBudgetRangeValues(form.budgetRange);
  const { min: quoteTotalMin } = calculateQuoteTotalRange(quoteItems);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-[#D8E2EA] shadow-sm space-y-8 animate-fade-in-up">
      {(user?.role === 'SHOWROOM' || user?.role === 'ADMIN') && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
          <p className="font-semibold">Bạn đang đăng nhập bằng tài khoản showroom.</p>
          <p>Yêu cầu báo giá nên được gửi ở vai trò khách hàng. Thông tin form đã được để trống.</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-[#0B1623]">Thông tin của bạn</h2>
      <div>
        <label className={labelCls}>Họ và tên *</label>
        <input type="text" placeholder="VD: Nguyễn Văn An" value={form.customerName} onChange={set('customerName')} className={inputCls(errors.customerName)} />
        {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Số điện thoại *</label>
          <input type="tel" placeholder="+84 912 345 678" value={form.phone} onChange={set('phone')} className={inputCls(errors.phone)} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className={labelCls}>Email (không bắt buộc)</label>
          <input type="email" placeholder="ban@email.com" value={form.email} onChange={set('email')} className={inputCls()} />
        </div>
      </div>

      <hr className="border-[#D8E2EA]" />
      <h3 className="text-base font-bold text-[#0B1623]">Yêu cầu không gian</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Loại phòng *</label>
          <select value={form.roomType} onChange={set('roomType')} className={inputCls(errors.roomType)}>
            <option value="">Chọn loại phòng</option>
            {roomTypes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.roomType && <p className="text-xs text-red-500 mt-1">{errors.roomType}</p>}
        </div>
        <div>
          <label className={labelCls}>Diện tích dự kiến</label>
          <input type="text" placeholder="VD: 5 m²" value={form.roomSize} onChange={set('roomSize')} className={inputCls()} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ngân sách *</label>
          <select value={form.budgetRange} onChange={set('budgetRange')} className={inputCls(errors.budgetRange)}>
            <option value="">Chọn ngân sách</option>
            {budgetRanges.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.budgetRange && <p className="text-xs text-red-500 mt-1">{errors.budgetRange}</p>}
        </div>
        <div>
          <label className={labelCls}>Phong cách mong muốn</label>
          <select value={form.style} onChange={set('style')} className={inputCls()}>
            <option value="">Chọn phong cách</option>
            {styles.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Concept đã chọn</label>
          <select value={form.selectedConcept} onChange={set('selectedConcept')} className={inputCls()}>
            <option value="">Chọn concept</option>
            {conceptOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Thời gian cần hoàn thiện</label>
          <select value={form.timeline} onChange={set('timeline')} className={inputCls()}>
            <option value="">Chọn thời gian</option>
            {timelines.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#EEF4F7] rounded-xl p-4">
        <input type="checkbox" id="installation" checked={form.needsInstallation} onChange={set('needsInstallation')} className="w-4 h-4 accent-copper" />
        <label htmlFor="installation" className="text-sm text-[#0B1623] font-medium cursor-pointer">
          Tôi cần dịch vụ lắp đặt kèm theo
        </label>
      </div>

      <div>
        <label className={labelCls}>Ghi chú thêm</label>
        <textarea rows={4} placeholder="Chia sẻ thêm yêu cầu cụ thể, sở thích hoặc câu hỏi của bạn..." value={form.notes} onChange={set('notes')} className={`${inputCls()} resize-none`} />
      </div>

      {/* Consent */}
      <div className={`rounded-xl p-4 border ${errors.consent ? 'border-red-300 bg-red-50' : 'border-[#D8E2EA] bg-[#F3F7FA]'}`}>
        <div className="flex items-start gap-3">
          <input type="checkbox" id="consent" checked={form.consent} onChange={set('consent')} className="w-4 h-4 accent-copper mt-0.5" />
          <label htmlFor="consent" className="text-xs text-[#0B1623] cursor-pointer leading-relaxed">
            Tôi đồng ý để LivLab liên hệ tư vấn và xử lý thông tin theo <a href="/privacy" className="underline hover:text-[#C8A96A]">Chính sách bảo mật</a>. LivLab không bán dữ liệu cá nhân cho bên thứ ba.
          </label>
        </div>
        {errors.consent && <p className="text-xs text-red-500 mt-2 ml-7">{errors.consent}</p>}
        <p className="text-[11px] text-[#627386] mt-2 ml-7">
          Thông tin của bạn chỉ được dùng cho mục đích tư vấn và xử lý yêu cầu báo giá.
        </p>
      </div>

      {/* Budget Fit Live Preview */}
      {quoteItems.length > 0 && form.budgetRange && (
        <div className="pt-4 border-t border-[#D8E2EA]">
          <h3 className="text-base font-bold text-[#0B1623] mb-4">Mức độ phù hợp ngân sách</h3>
          <BudgetFitCard 
            total={quoteTotalMin} 
            budgetMin={currentBudgetMin} 
            budgetMax={currentBudgetMax} 
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.consent}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi yêu cầu...</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Gửi yêu cầu báo giá</>
        )}
      </button>
    </form>
  );
}
