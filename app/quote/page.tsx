'use client';

import { useState, Suspense } from 'react';
import { useQuote } from '@/lib/context/QuoteContext';
import QuoteForm from '@/components/quote/QuoteForm';
import QuoteSummary from '@/components/quote/QuoteSummary';
import InquiryForm from '@/components/quote/InquiryForm';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Clipboard, Search, FileText } from 'lucide-react';

export default function QuotePage() {
  const { items, clearAll } = useQuote();
  const [successRequestCode, setSuccessRequestCode] = useState<string | null>(null);

  const handleSuccess = (requestCode: string) => {
    clearAll();
    setSuccessRequestCode(requestCode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (successRequestCode) {
    return (
      <div className="pt-16 bg-[#F3F7FA] min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center py-20">
          <div className="w-20 h-20 rounded-full bg-[#EEF4F7] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#123C5A]" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B1623] mb-3">Yêu cầu báo giá đã được gửi.</h1>
          <p className="text-[#627386] mb-8 text-base leading-relaxed">
            Showroom sẽ liên hệ lại theo số điện thoại bạn đã để lại để xác nhận phương án và báo giá.
          </p>

          <div className="bg-white rounded-2xl border border-[#D8E2EA] p-6 mb-8 shadow-sm">
            <p className="text-xs text-[#627386] uppercase tracking-widest font-medium mb-2 flex items-center justify-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5" /> Mã yêu cầu
            </p>
            <p className="text-3xl font-bold text-[#C8A96A]">{successRequestCode}</p>
            <p className="text-xs text-[#627386] mt-2">Lưu lại mã này để tra cứu trạng thái yêu cầu</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/track-quote`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A] transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Tra cứu trạng thái báo giá
            </Link>
            <Link
              href="/concepts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0B1623] font-semibold rounded-full border border-[#D8E2EA] hover:border-[#0B1623] transition-colors text-sm"
            >
              Tiếp tục khám phá concept
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Nothing in the basket is not a dead end: the customer can describe what
  // they need — a model code, a size, a set — and send that instead.
  if (items.length === 0) {
    return (
      <div className="pt-16 bg-[#F3F7FA] min-h-screen">
        <div className="home-container py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="bg-white border border-[#D8E2EA] p-6 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--tenant-accent-ink, #123C5A)' }}>
                Yêu cầu báo giá
              </p>
              <h1 className="mt-3 text-[28px] md:text-[36px] font-medium leading-tight text-[#0B1623]">
                Cho showroom biết bạn cần gì
              </h1>
              <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-[#4a5b64]">
                Gửi mã sản phẩm, số lượng hoặc kích thước cần làm. Chưa chọn được mẫu? Mô tả nhu cầu, showroom
                sẽ tư vấn phương án phù hợp.
              </p>
              <div className="mt-8">
                <Suspense fallback={null}>
                  <InquiryForm onSuccess={handleSuccess} />
                </Suspense>
              </div>
            </div>
            <aside className="self-start border border-[#D8E2EA] bg-white p-6">
              <FileText className="h-6 w-6 text-[#5d6d75]" aria-hidden="true" />
              <h2 className="mt-3 text-[16px] font-semibold text-[#0B1623]">Muốn báo giá theo mẫu cụ thể?</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#4a5b64]">
                Thêm sản phẩm vào giỏ báo giá từ danh mục hoặc từ các mẫu phối, rồi gửi cả danh sách một lần.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href="/products" className="inline-flex items-center justify-between border border-[#D8E2EA] px-4 py-3 text-[13px] font-semibold text-[#0B1623] hover:border-[#0B1623]">
                  Xem sản phẩm <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/concepts" className="inline-flex items-center justify-between border border-[#D8E2EA] px-4 py-3 text-[13px] font-semibold text-[#0B1623] hover:border-[#0B1623]">
                  Xem mẫu phối phòng tắm <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      <div className="bg-[#EEF4F7] border-b border-[#D8E2EA] py-14 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Yêu cầu báo giá</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1623] mb-3">Cho chúng tôi biết bạn cần gì.</h1>
          <p className="text-[#627386] max-w-xl text-base leading-relaxed">
            Chia sẻ thông tin về không gian của bạn. Showroom sẽ chuẩn bị báo giá và liên hệ lại theo thông tin bạn để lại.
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#D8E2EA] shadow-sm">
            <Suspense fallback={<div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-[#D8E2EA] rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-[#D8E2EA] rounded col-span-2"></div><div className="h-2 bg-[#D8E2EA] rounded col-span-1"></div></div><div className="h-2 bg-[#D8E2EA] rounded"></div></div></div></div>}>
              <QuoteForm quoteItems={items} onSuccess={handleSuccess} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <QuoteSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
