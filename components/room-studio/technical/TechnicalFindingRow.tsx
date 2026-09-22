'use client';

import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { TechnicalSeverity, TechnicalValidationResult } from '@/lib/technical-advisor/types';

const SEVERITY_STYLE: Record<
  TechnicalSeverity,
  { Icon: typeof CheckCircle2; iconClass: string; label: string }
> = {
  SUITABLE: { Icon: CheckCircle2, iconClass: 'text-emerald-600', label: 'Phù hợp' },
  OPTIMIZE: { Icon: Lightbulb, iconClass: 'text-amber-500', label: 'Có thể tối ưu' },
  VERIFY: { Icon: AlertTriangle, iconClass: 'text-[#C8873A]', label: 'Cần kiểm tra' },
};

/**
 * One finding.
 *
 * Consumer language only — the panel never shows "bounding box", "AABB",
 * "clearance envelope" or a rule id, even though the engine tracks all of them
 * internally. The technical provenance surfaces as a single plain sentence when
 * a human needs to confirm.
 */
export default function TechnicalFindingRow({ finding }: { finding: TechnicalValidationResult }) {
  const { Icon, iconClass, label } = SEVERITY_STYLE[finding.severity];

  return (
    <li className="flex gap-2.5 rounded-xl border border-[#D8E2EA] bg-white p-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold leading-snug text-[#0B1623]">
          <span className="sr-only">{label}: </span>
          {finding.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#627386]">{finding.message}</p>
        {finding.suggestedAction && (
          <p className="mt-1 text-[11px] font-medium text-[#123C5A]">→ {finding.suggestedAction}</p>
        )}
        {finding.requiresHumanVerification && (
          <p className="mt-1 text-[10px] italic text-[#9AA9B6]">
            Thông tin này cần showroom hoặc kỹ thuật viên xác nhận trước khi lắp đặt.
          </p>
        )}
      </div>
    </li>
  );
}
