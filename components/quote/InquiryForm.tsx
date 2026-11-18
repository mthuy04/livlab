'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/components/storefront/TenantContext';
import { trackEvent, visitAttribution } from '@/lib/analytics/events';

/**
 * A quotation request with nothing in the basket: the customer describes what
 * they need — a model code, a size, "a 80 cm vanity" — instead of picking
 * catalogue products first.
 *
 * It goes through the same endpoint as the basket form, so it is validated on
 * the server, stamped with this storefront's tenant and lands in the same
 * showroom workspace. Nothing is sent until the customer presses the button.
 */

const BUDGETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Chưa xác định', min: null, max: null },
  { label: 'Dưới 10 triệu', min: 0, max: 10_000_000 },
  { label: '10–30 triệu', min: 10_000_000, max: 30_000_000 },
  { label: '30–60 triệu', min: 30_000_000, max: 60_000_000 },
  { label: 'Trên 60 triệu', min: 60_000_000, max: null },
];

const CONTACT_METHODS = ['Gọi điện', 'Nhắn Zalo'] as const;

type Field = 'customerName' | 'phone' | 'interest' | 'consent';

export default function InquiryForm({ onSuccess }: { onSuccess: (requestCode: string) => void }) {
  const tenant = useTenant();
  const params = useSearchParams();
  const seller = tenant.business?.name ?? tenant.brand.name;

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<(typeof CONTACT_METHODS)[number]>('Gọi điện');
  const [interest, setInterest] = useState(() => params?.get('interest')?.slice(0, 200) ?? '');
  const [dimensions, setDimensions] = useState('');
  const [budget, setBudget] = useState(BUDGETS[0].label);
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Stable across retries: a resubmission after a dropped response returns the same request.
  const submissionKey = useRef<string | null>(null);

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!customerName.trim()) next.customerName = 'Vui lòng nhập họ và tên';
    if (!/^[+\d][\d\s.-]{8,}$/.test(phone.trim())) next.phone = 'Vui lòng nhập số điện thoại hợp lệ';
    if (interest.trim().length < 3) next.interest = 'Vui lòng cho biết sản phẩm hoặc nhu cầu cần báo giá';
    if (!consent) next.consent = 'Vui lòng đồng ý để showroom liên hệ';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    const range = BUDGETS.find((b) => b.label === budget) ?? BUDGETS[0];
    const lines = [
      `Nhu cầu: ${interest.trim()}`,
      dimensions.trim() ? `Kích thước: ${dimensions.trim()}` : null,
      `Liên hệ qua: ${contactMethod}`,
      notes.trim() ? `Ghi chú: ${notes.trim()}` : null,
    ].filter(Boolean);
    try {
      submissionKey.current ??= crypto.randomUUID();
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': submissionKey.current },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          requestType: 'QUOTATION',
          budgetRange: range.min === null && range.max === null ? null : range.label,
          budgetMin: range.min,
          budgetMax: range.max,
          notes: lines.join('\n'),
          context: {
            version: 3,
            source: 'INQUIRY_FORM',
            inquiry: {
              interest: interest.trim(),
              dimensions: dimensions.trim() || null,
              contactMethod,
            },
            attribution: visitAttribution(),
          },
          items: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
      // Only after the server has stored the request and issued its code.
      trackEvent('generate_lead', {
        currency: 'VND',
        lead_source: visitAttribution()?.channel ?? 'unknown',
        form_name: 'inquiry_form',
      });
      onSuccess(data.requestCode);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const input = (bad?: string) =>
    `w-full border bg-white px-3.5 py-3 text-[15px] text-[#1f2b33] outline-none transition-colors focus:border-[color:var(--tenant-accent)] ${
      bad ? 'border-red-400' : 'border-[#cfd9de]'
    }`;
  const label = 'mb-1.5 block text-[13px] font-semibold text-[#1f2b33]';
  const error = (field: Field) =>
    errors[field] ? <p className="mt-1 text-[12px] text-red-600">{errors[field]}</p> : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-5" style={{ borderRadius: 'var(--tenant-radius, 4px)' }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-name" className={label}>Họ và tên *</label>
          <input id="inq-name" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={input(errors.customerName)} />
          {error('customerName')}
        </div>
        <div>
          <label htmlFor="inq-phone" className={label}>Số điện thoại / Zalo *</label>
          <input id="inq-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input(errors.phone)} />
          {error('phone')}
        </div>
      </div>

      <fieldset>
        <legend className={label}>Bạn muốn được liên hệ qua</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_METHODS.map((m) => (
            <label key={m} className="inline-flex cursor-pointer items-center gap-2 border px-3.5 py-2 text-[14px]" style={{ borderColor: contactMethod === m ? 'var(--tenant-accent)' : '#cfd9de' }}>
              <input type="radio" name="inq-contact" value={m} checked={contactMethod === m} onChange={() => setContactMethod(m)} className="accent-[color:var(--tenant-accent)]" />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="inq-interest" className={label}>Sản phẩm hoặc nhu cầu cần báo giá *</label>
        <textarea
          id="inq-interest"
          rows={3}
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder="Ví dụ: bồn cầu một khối INAX AC-912VN × 2; tủ chậu khoảng 80 cm kèm gương LED"
          className={`${input(errors.interest)} resize-y`}
        />
        {error('interest')}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-size" className={label}>Kích thước phòng hoặc vị trí lắp <span className="font-normal text-[#5d6d75]">(không bắt buộc)</span></label>
          <input id="inq-size" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Ví dụ: phòng 2,0 × 1,6 m" className={input()} />
        </div>
        <div>
          <label htmlFor="inq-budget" className={label}>Ngân sách dự kiến <span className="font-normal text-[#5d6d75]">(không bắt buộc)</span></label>
          <select id="inq-budget" value={budget} onChange={(e) => setBudget(e.target.value)} className={input()}>
            {BUDGETS.map((b) => (
              <option key={b.label}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="inq-notes" className={label}>Ghi chú thêm <span className="font-normal text-[#5d6d75]">(không bắt buộc)</span></label>
        <textarea id="inq-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input()} resize-y`} />
      </div>

      <div className={`border p-4 ${errors.consent ? 'border-red-300 bg-red-50' : 'border-[#d8e2e6] bg-[#f5f8f9]'}`}>
        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[#1f2b33]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[color:var(--tenant-accent)]" />
          <span>
            Tôi đồng ý để {seller} liên hệ tư vấn và báo giá. Yêu cầu được lưu trên nền tảng LivLab — đơn vị vận hành
            website — và chỉ chuyển đến {seller}, theo{' '}
            <Link href={'/privacy' as Route} className="underline underline-offset-2">Chính sách bảo mật</Link>.
          </span>
        </label>
        {error('consent')}
      </div>

      {serverError && (
        <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 py-4 text-[13px] font-semibold uppercase tracking-[.08em] disabled:opacity-60 sm:w-auto sm:px-10"
        style={{ background: 'var(--tenant-ui-primary, var(--tenant-accent))', color: 'var(--tenant-ui-primary-contrast, #fff)', borderRadius: 'var(--tenant-radius, 4px)' }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle className="h-4 w-4" aria-hidden="true" />}
        {loading ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}
      </button>
    </form>
  );
}
