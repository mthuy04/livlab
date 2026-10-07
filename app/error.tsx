'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Route-level error boundary.
 *
 * Without one, any failure while rendering or fetching a segment fell through
 * to Next's built-in fallback — a bare "This page couldn't load" with no way
 * back except a manual browser reload, and nothing explaining what happened.
 *
 * The failure that exposed this is a client-side navigation whose RSC request
 * does not come back as RSC. On a Vercel preview with Deployment Protection
 * turned on, those requests are answered by the SSO challenge instead of the
 * payload, so the first navigation after signing in dies and only a full
 * reload recovers. The same shape of failure happens for ordinary reasons too:
 * a dropped connection, or a deploy landing mid-navigation.
 *
 * So the recovery offered here is ordered by what actually works: retry the
 * segment first, and fall back to a full document load, which is what gets
 * past an intercepted RSC request.
 */
export default function RouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Digest is the only handle on the server-side log for this error, since
    // production deliberately withholds the real message from the client.
    console.error('[LivLab] Route error', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-[#C8A96A]" />
        </div>

        <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Không tải được trang</h2>
        <p className="text-[#627386] text-sm mb-8 leading-relaxed">
          Kết nối tới LivLab bị gián đoạn khi đang mở trang này. Dữ liệu của bạn
          không bị ảnh hưởng — vui lòng thử lại.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => unstable_retry()}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#0D2B42] transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center w-full py-3.5 bg-white text-[#0B1623] font-semibold rounded-2xl border border-[#D8E2EA] hover:border-[#0B1623] transition-colors text-sm"
          >
            Tải lại toàn bộ trang
          </button>
          <Link
            href="/"
            className="flex items-center justify-center w-full py-3.5 text-[#627386] font-semibold text-sm hover:text-[#0B1623] transition-colors"
          >
            Quay lại trang chủ
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[10px] text-[#9AA9B6]">Mã lỗi: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
