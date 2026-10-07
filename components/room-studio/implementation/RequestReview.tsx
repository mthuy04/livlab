'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatVnd } from '@/lib/room-studio/budgetCalculator';
import { REQUEST_TYPES, type HumanHandoffPackage } from '@/lib/implementation/types';

interface RequestReviewProps {
  pkg: HumanHandoffPackage;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="w-[104px] shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#9AA9B6]">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-[#0B1623]">{children}</div>
    </div>
  );
}

/**
 * The confirmation step. Its job is to make an accidental submission
 * impossible, and to show the customer exactly what LivLab is about to hand a
 * human on their behalf — including their own phone number.
 */
export default function RequestReview({ pkg, submitting, error, onBack, onSubmit }: RequestReviewProps) {
  const meta = REQUEST_TYPES[pkg.requestType];
  const { room, budget, products, technicalFindings, customerContact } = pkg;
  const verify = technicalFindings.filter((f) => f.severity === 'VERIFY');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#D8E2EA] bg-[#FAFCFD] px-4 divide-y divide-[#E6EDF2]">
        <Row label="Yêu cầu">
          <span className="font-bold">{meta.label}</span>
        </Row>

        {room && (
          <Row label="Không gian">
            {room.length} × {room.width} × {room.height} m
            <span className="text-[#627386]"> · {room.floorAreaM2} m² sàn</span>
            {room.floorFinish && (
              <span className="mt-0.5 block text-[11px] text-[#627386]">
                Sàn {room.floorFinish} · Tường {room.wallFinish}
              </span>
            )}
          </Row>
        )}

        <Row label="Sản phẩm">
          {products.length === 0 ? (
            <span className="text-[#627386]">Chưa có sản phẩm nào trong phòng.</span>
          ) : (
            <>
              <span className="font-bold">{products.length} sản phẩm</span>
              <ul className="mt-1 space-y-0.5">
                {products.map((p) => (
                  <li key={p.productId} className="text-[11px] text-[#627386]">
                    {p.name}
                    {p.quantity > 1 && ` × ${p.quantity}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Row>

        {budget && (
          <Row label="Chi phí">
            <span className="font-bold">
              {formatVnd(budget.estimatedProductTotalMin)} – {formatVnd(budget.estimatedProductTotalMax)}
            </span>
            <span className="mt-0.5 block text-[11px] text-[#627386]">
              Giá tham khảo, chưa phải giá cuối.
              {budget.targetBudget ? ` Ngân sách bạn dự kiến: ${formatVnd(budget.targetBudget)}.` : ''}
            </span>
          </Row>
        )}

        {verify.length > 0 && (
          <Row label="Cần kiểm tra">
            <span className="font-bold text-[#8A6520]">{verify.length} điểm kỹ thuật</span>
            <ul className="mt-1 space-y-0.5">
              {verify.slice(0, 4).map((f, i) => (
                <li key={i} className="text-[11px] text-[#627386]">
                  {f.title}
                  {f.affectedProduct && ` — ${f.affectedProduct}`}
                </li>
              ))}
              {verify.length > 4 && (
                <li className="text-[11px] text-[#9AA9B6]">+{verify.length - 4} điểm khác</li>
              )}
            </ul>
          </Row>
        )}

        <Row label="Showroom">
          <span className="text-[#627386]">LivLab điều phối tới showroom phù hợp.</span>
        </Row>

        <Row label="Liên hệ">
          <span className="font-bold">{customerContact.fullName}</span>
          <span className="mt-0.5 block text-[11px] text-[#627386]">
            {customerContact.phone}
            {customerContact.email && ` · ${customerContact.email}`}
            {customerContact.serviceArea && ` · ${customerContact.serviceArea}`}
          </span>
        </Row>
      </div>

      <p className="text-[11px] leading-relaxed text-[#627386]">
        {pkg.requestType === 'TECHNICAL_CHECK'
          ? 'Kết quả kiểm tra trên LivLab hỗ trợ lựa chọn ban đầu. Điều kiện lắp đặt thực tế cần được xác nhận tại công trình. Chi phí dịch vụ sẽ được xác nhận trước khi triển khai.'
          : 'Giá hiển thị là giá tham khảo; showroom xác nhận giá cuối, khuyến mãi, tình trạng cung ứng và chi phí lắp đặt.'}
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl bg-[#F3F7FA] px-4 py-3 text-[12px] font-bold text-[#627386] transition-colors hover:bg-[#E4EDF2] disabled:opacity-40"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2239] px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#061827] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
        </button>
      </div>
    </div>
  );
}
