'use client';

import { CheckCircle2, CloudOff } from 'lucide-react';
import { REQUEST_TYPES, type ImplementationRequest } from '@/lib/implementation/types';

interface RequestSuccessProps {
  request: ImplementationRequest;
  onClose: () => void;
}

/**
 * Confirmation.
 *
 * It promises only what LivLab can actually do: the showroom will be in touch.
 * No arrival window, no technician name, no service price — none of which
 * exists yet, and any of which would be a commitment LivLab cannot keep.
 *
 * When the request could not reach the server it says so plainly instead of
 * showing a green tick over nothing. The customer still gets their reference,
 * because the request is stored either way.
 */
export default function RequestSuccess({ request, onClose }: RequestSuccessProps) {
  const meta = REQUEST_TYPES[request.package.requestType];
  const delivered = request.delivery === 'DELIVERED';

  return (
    <div className="py-2 text-center">
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
          delivered ? 'bg-[#E8F3EC]' : 'bg-[#FBF0DC]'
        }`}
      >
        {delivered ? (
          <CheckCircle2 className="h-6 w-6 text-[#2E7D52]" />
        ) : (
          <CloudOff className="h-6 w-6 text-[#8A6520]" />
        )}
      </div>

      <h3 className="text-[15px] font-bold text-[#0B1623]">
        {delivered ? 'LivLab đã ghi nhận yêu cầu của bạn.' : 'Yêu cầu của bạn đã được lưu.'}
      </h3>

      <p className="mx-auto mt-1.5 max-w-[320px] text-[12px] leading-relaxed text-[#627386]">
        {delivered
          ? meta.confirmation
          : 'Hiện chưa gửi được tới hệ thống LivLab. Yêu cầu vẫn được lưu trên thiết bị của bạn — vui lòng gửi lại khi có kết nối, hoặc liên hệ showroom kèm mã bên dưới.'}
      </p>

      <div className="mx-auto mt-4 inline-flex flex-col items-center rounded-2xl border border-[#D8E2EA] bg-[#FAFCFD] px-6 py-3">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#9AA9B6]">Mã yêu cầu</span>
        <span className="mt-0.5 text-[16px] font-bold tracking-wide text-[#0B1623]">
          {request.requestCode}
        </span>
      </div>

      <p className="mt-3 text-[11px] text-[#9AA9B6]">
        Không gian và sản phẩm bạn đã chọn được gửi kèm — bạn không cần mô tả lại.
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-xl bg-[#0B2239] px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#061827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
      >
        Tiếp tục dựng phòng
      </button>
    </div>
  );
}
