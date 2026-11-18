'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle } from 'lucide-react';
import InquiryForm from '@/components/quote/InquiryForm';

/** The contact page's short request form, with the request code shown in place once sent. */
export default function ContactInquiry() {
  const [code, setCode] = useState<string | null>(null);
  if (code) {
    return (
      <div className="border border-[#d8e2e6] bg-[#f5f8f9] p-6" role="status">
        <p className="flex items-center gap-2 text-[16px] font-semibold text-[#1f2b33]">
          <CheckCircle className="h-5 w-5" aria-hidden="true" /> Đã gửi yêu cầu. Mã của bạn: {code}
        </p>
        <p className="mt-2 text-[14px] text-[#4a5b64]">
          Showroom sẽ liên hệ lại theo số điện thoại bạn để lại. Lưu mã để{' '}
          <Link href={'/track-quote' as Route} className="underline underline-offset-2">tra cứu trạng thái</Link>.
        </p>
      </div>
    );
  }
  return (
    <Suspense fallback={null}>
      <InquiryForm onSuccess={setCode} />
    </Suspense>
  );
}
