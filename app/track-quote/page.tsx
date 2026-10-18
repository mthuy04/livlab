'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, CheckCircle2, FileText, Loader2, Package, Search } from 'lucide-react';

interface LookupResult {
  request: {
    code: string;
    customerName: string;
    roomType: string | null;
    budgetRange: string | null;
    conceptName: string | null;
    estimatedValue: number | null;
    stage: string;
    createdAt: string;
    items: { id: string; productName: string; quantity: number; priceMin: number | null; priceMax: number | null }[];
  };
  quote: null | {
    code: string;
    status: string;
    total: number;
    validUntil: string | null;
    sentAt: string | null;
    decidedAt: string | null;
    lines: {
      type: string; skuSnapshot: string | null; nameSnapshot: string;
      brandSnapshot: string | null; quantity: number; unitPrice: number;
      discountAmount: number; lineTotal: number;
    }[];
  };
}

const STAGE_LABEL: Record<string, string> = {
  NEW: 'Đã tiếp nhận', CONTACTED: 'Đang liên hệ', QUALIFIED: 'Đã xác nhận nhu cầu',
  QUOTING: 'Đang chuẩn bị báo giá', QUOTE_SENT: 'Đã gửi báo giá', FOLLOW_UP: 'Đang theo dõi',
  WON: 'Đã xác nhận', LOST: 'Đã khép lại',
};
const QUOTE_LABEL: Record<string, string> = {
  SENT: 'Đã gửi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', EXPIRED: 'Đã hết hạn',
};

const money = (value: number | null) => value === null
  ? 'Chờ showroom xác nhận'
  : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export default function TrackQuotePage() {
  const [requestCode, setRequestCode] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!requestCode.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/quote/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestCode, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không tìm thấy yêu cầu.');
      setResult(data as LookupResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa thể tra cứu lúc này.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--tenant-surface-muted,#F4F3F1)] px-5 pb-20 pt-24 text-[var(--tenant-ink,#2E2D2B)]">
      <div className="mx-auto max-w-4xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--tenant-accent-ink,#B45309)]">Tra cứu báo giá</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Theo dõi yêu cầu của bạn</h1>
          <p className="mt-3 text-sm leading-7 text-[#6F6E69]">Nhập mã YC được cấp sau khi gửi và số điện thoại đã đăng ký.</p>
        </header>

        <form onSubmit={handleSearch} className="mt-8 grid gap-4 rounded-2xl border border-[#E4E1DA] bg-white p-5 shadow-[0_12px_34px_rgba(46,45,43,.06)] sm:grid-cols-[1fr_1fr_auto] sm:p-6">
          <label className="text-xs font-semibold text-[#686762]">
            Mã yêu cầu
            <input
              value={requestCode}
              onChange={(event) => setRequestCode(event.target.value.toUpperCase())}
              placeholder="YC-2026-000001"
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-lg border border-[#DEDBD4] bg-[#FAF9F7] px-4 text-sm font-medium uppercase outline-none transition focus:border-[var(--tenant-accent,#EF9F00)] focus:ring-4 focus:ring-[#EF9F00]/15"
            />
          </label>
          <label className="text-xs font-semibold text-[#686762]">
            Số điện thoại
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Số điện thoại đã gửi"
              type="tel"
              autoComplete="tel"
              className="mt-2 h-12 w-full rounded-lg border border-[#DEDBD4] bg-[#FAF9F7] px-4 text-sm outline-none transition focus:border-[var(--tenant-accent,#EF9F00)] focus:ring-4 focus:ring-[#EF9F00]/15"
            />
          </label>
          <button type="submit" disabled={loading} className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--tenant-accent,#EF9F00)] px-5 text-sm font-bold text-[var(--tenant-accent-contrast,#2E2D2B)] transition hover:bg-[var(--tenant-accent-hover,#FCA359)] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Tra cứu
          </button>
        </form>

        {error && (
          <section className="mt-6 rounded-2xl border border-[#E8D8D4] bg-white p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-[#A74B3F]" />
            <h2 className="mt-3 font-bold">Không tìm thấy yêu cầu</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77746D]">{error} Vui lòng kiểm tra cả mã yêu cầu và số điện thoại.</p>
          </section>
        )}

        {result && <LookupDetails data={result} />}
      </div>
    </main>
  );
}

function LookupDetails({ data }: { data: LookupResult }) {
  const { request, quote } = data;
  const items = quote?.lines ?? request.items.map((item) => ({
    type: 'PRODUCT', skuSnapshot: null, nameSnapshot: item.productName, brandSnapshot: null,
    quantity: item.quantity, unitPrice: item.priceMin ?? 0, discountAmount: 0,
    lineTotal: (item.priceMin ?? 0) * item.quantity,
  }));

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl border border-[#E4E1DA] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EEECE7] pb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9A958B]">Mã yêu cầu</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{request.code}</h2>
            <p className="mt-1 text-sm text-[#77746D]">{request.customerName}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#FFF1D6] px-3 py-2 text-xs font-bold text-[#8D530B]">
            <CheckCircle2 className="h-4 w-4" /> {quote ? QUOTE_LABEL[quote.status] : STAGE_LABEL[request.stage]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Info icon={<CalendarDays />} label="Ngày gửi" value={new Date(request.createdAt).toLocaleDateString('vi-VN')} />
          <Info icon={<Package />} label="Không gian" value={request.conceptName || request.roomType || 'Chưa xác định'} />
          <Info icon={<FileText />} label={quote ? 'Giá trị báo giá' : 'Giá trị tham khảo'} value={money(quote?.total ?? request.estimatedValue)} />
        </dl>

        {quote && (
          <div className="mt-6 rounded-xl border border-[#F0E0BC] bg-[#FFF8E9] p-4 text-sm leading-6 text-[#72521C]">
            Báo giá <strong>{quote.code}</strong> đã được showroom phát hành
            {quote.sentAt ? ` ngày ${new Date(quote.sentAt).toLocaleDateString('vi-VN')}` : ''}.
            {quote.validUntil ? ` Hiệu lực đến ${new Date(quote.validUntil).toLocaleDateString('vi-VN')}.` : ''}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E4E1DA] bg-white">
        <div className="border-b border-[#EEECE7] px-6 py-5">
          <h3 className="font-bold">{quote ? 'Chi tiết báo giá' : 'Sản phẩm đã chọn'}</h3>
          {!quote && <p className="mt-1 text-xs text-[#8A877F]">Giá dưới đây là tham khảo; showroom chưa phát hành báo giá chính thức.</p>}
        </div>
        <div className="divide-y divide-[#F0EEE9]">
          {items.map((item, index) => (
            <div key={`${item.nameSnapshot}-${index}`} className="flex items-center gap-4 px-6 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FFF1D6] text-[#9A650E]"><Package className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.nameSnapshot}</p>
                <p className="mt-0.5 text-xs text-[#8A877F]">{[item.brandSnapshot, item.skuSnapshot].filter(Boolean).join(' · ') || (item.type === 'SERVICE' ? 'Dịch vụ' : 'Sản phẩm')} · SL {item.quantity}</p>
              </div>
              <strong className="shrink-0 text-sm text-[#8D530B]">{money(item.lineTotal)}</strong>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-[#88847C]">Cần hỗ trợ? <Link href="/contact" className="font-semibold text-[var(--tenant-accent-ink,#B45309)] hover:underline">Liên hệ showroom</Link></p>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F5F1] p-4">
      <span className="block h-4 w-4 text-[#A0742E] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <dt className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A958B]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
