'use client';

import { AlertTriangle, ChevronRight, FileText, Store, Wrench } from 'lucide-react';
import { REQUEST_TYPES, type ImplementationRequestType } from '@/lib/implementation/types';

interface RequestTypeChooserProps {
  /** Count of VERIFY findings; promotes the technical option when non-zero. */
  verifyCount: number;
  productCount: number;
  onChoose: (type: ImplementationRequestType) => void;
}

const ICONS = {
  QUOTATION: FileText,
  SHOWROOM_CONSULTATION: Store,
  TECHNICAL_CHECK: Wrench,
} as const;

/**
 * The three next steps, each explaining in one sentence what actually happens.
 *
 * Hierarchy is intentional and not equal-weight: quotation is the primary path,
 * consultation the quieter alternative, and the technical check is contextual —
 * it only becomes visually prominent when the Technical Advisor has actually
 * flagged something. A permanently loud "cần kỹ thuật viên" would either train
 * customers to ignore it or imply a problem where LivLab found none.
 */
export default function RequestTypeChooser({ verifyCount, productCount, onChoose }: RequestTypeChooserProps) {
  const technicalUrgent = verifyCount > 0;

  const order: ImplementationRequestType[] = technicalUrgent
    ? ['TECHNICAL_CHECK', 'QUOTATION', 'SHOWROOM_CONSULTATION']
    : ['QUOTATION', 'SHOWROOM_CONSULTATION', 'TECHNICAL_CHECK'];

  return (
    <div className="space-y-2.5">
      <p className="text-[12px] leading-relaxed text-[#627386]">
        {productCount > 0
          ? `LivLab sẽ chuyển kèm không gian và ${productCount} sản phẩm bạn đang chọn — bạn không cần nhập lại.`
          : 'LivLab sẽ chuyển kèm thông tin không gian bạn đang dựng — bạn không cần nhập lại.'}
      </p>

      {order.map((id, index) => {
        const meta = REQUEST_TYPES[id];
        const Icon = ICONS[id];
        // Primary is whichever option leads in this context.
        const isPrimary = index === 0;
        const isTechnicalAlert = id === 'TECHNICAL_CHECK' && technicalUrgent;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A] ${
              isPrimary
                ? 'border-[#0B2239] bg-[#0B2239] text-white'
                : 'border-[#D8E2EA] bg-white text-[#0B1623] hover:border-[#C8A96A]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isPrimary ? 'bg-white/10' : 'bg-[#F3F7FA]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isPrimary ? 'text-[#C8A96A]' : 'text-[#123C5A]'}`} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold">{meta.label}</span>
                {isTechnicalAlert && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A96A] px-1.5 py-px text-[9px] font-bold uppercase text-[#0B1623]">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {verifyCount} điểm
                  </span>
                )}
              </span>
              <span
                className={`mt-0.5 block text-[11px] leading-relaxed ${
                  isPrimary ? 'text-white/60' : 'text-[#627386]'
                }`}
              >
                {meta.outcome}
              </span>
            </span>

            <ChevronRight
              className={`mt-1 h-4 w-4 shrink-0 ${isPrimary ? 'text-white/40' : 'text-[#9AA9B6]'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
