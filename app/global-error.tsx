'use client';

import './globals.css';

/**
 * Last-resort boundary for failures in the root layout itself, which error.tsx
 * does not wrap. It replaces the whole document, so it declares its own html
 * and body and imports global styles rather than inheriting them.
 *
 * Kept dependency-free on purpose: anything imported here has to work in the
 * exact situation where the app shell has already failed.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
            <h2 className="text-2xl font-bold text-[#0B1623] mb-2">LivLab gặp sự cố</h2>
            <p className="text-[#627386] text-sm mb-8 leading-relaxed">
              Đã có lỗi khiến trang không khởi tạo được. Vui lòng thử lại.
            </p>
            <button
              onClick={() => unstable_retry()}
              className="w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#0D2B42] transition-colors text-sm"
            >
              Thử lại
            </button>
            {error.digest && (
              <p className="mt-6 text-[10px] text-[#9AA9B6]">Mã lỗi: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
