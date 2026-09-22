'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Lightbulb, ShieldCheck, Wrench } from 'lucide-react';
import { TECHNICAL_DISCLAIMER } from '@/lib/technical-advisor/config';
import { filterForInstance, summarise, topFindings } from '@/lib/technical-advisor/engine';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import TechnicalFindingRow from './TechnicalFindingRow';

interface TechnicalAdvisorPanelProps {
  findings: TechnicalValidationResult[];
  /** When a product is selected, its own findings are shown first. */
  selectedInstanceId: string | null;
  selectedProductName?: string;
  hasProducts: boolean;
  /** Opens the technical-check request with these findings attached. */
  onRequestTechnicalCheck: () => void;
}

/**
 * The Technical Advisor surface inside Room Studio.
 *
 * Two levels, because they answer different questions. The always-visible
 * summary answers "is there anything I should look at?"; expanding answers
 * "what exactly?". Collapsed by default so a room with six findings does not
 * greet the customer with a wall of warnings.
 *
 * When a product is selected its findings lead, because that is what the
 * customer is thinking about.
 */
export default function TechnicalAdvisorPanel({
  findings,
  selectedInstanceId,
  selectedProductName,
  hasProducts,
  onRequestTechnicalCheck,
}: TechnicalAdvisorPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const summary = useMemo(() => summarise(findings), [findings]);

  const selectedFindings = useMemo(
    () => (selectedInstanceId ? filterForInstance(findings, selectedInstanceId) : []),
    [findings, selectedInstanceId]
  );

  const otherFindings = useMemo(() => {
    const selectedIds = new Set(selectedFindings.map((f) => f.id));
    return topFindings(findings.filter((f) => !selectedIds.has(f.id)));
  }, [findings, selectedFindings]);

  if (!hasProducts) {
    return (
      <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#C8A96A]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Kiểm tra kỹ thuật</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-[#627386]">
          Thêm sản phẩm vào phòng để LivLab kiểm tra vị trí lắp đặt, khoảng trống và yêu cầu cấp thoát nước.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#D8E2EA] bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-[#F8FAFC]"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C8A96A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Kiểm tra kỹ thuật</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            {summary.suitable > 0 && (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> {summary.suitable} mục phù hợp
              </span>
            )}
            {summary.optimize > 0 && (
              <span className="flex items-center gap-1 font-medium text-amber-600">
                <Lightbulb className="h-3.5 w-3.5" /> {summary.optimize} gợi ý
              </span>
            )}
            {summary.verify > 0 && (
              <span className="flex items-center gap-1 font-medium text-[#C8873A]">
                <AlertTriangle className="h-3.5 w-3.5" /> {summary.verify} mục cần kiểm tra
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9AA9B6] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#D8E2EA] bg-[#F8FAFC] p-4">
          {selectedFindings.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9AA9B6]">
                {selectedProductName ?? 'Sản phẩm đang chọn'}
              </p>
              <ul className="space-y-2">
                {selectedFindings.map((finding) => (
                  <TechnicalFindingRow key={finding.id} finding={finding} />
                ))}
              </ul>
            </div>
          )}

          {otherFindings.length > 0 && (
            <div>
              {selectedFindings.length > 0 && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9AA9B6]">Toàn bộ phòng</p>
              )}
              <ul className="space-y-2">
                {otherFindings.map((finding) => (
                  <TechnicalFindingRow key={finding.id} finding={finding} />
                ))}
              </ul>
            </div>
          )}

          {/* Offered only when LivLab actually flagged something. A standing
              "nhờ kỹ thuật viên" on a clean room would manufacture a worry the
              Advisor did not find. Opens the request; never submits it. */}
          {summary.verify > 0 && (
            <button
              type="button"
              onClick={onRequestTechnicalCheck}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#C8A96A] bg-[#FDFBF6] px-3 py-2.5 text-[11px] font-bold text-[#8A6520] transition-colors hover:bg-[#FBF0DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
            >
              <Wrench className="h-3.5 w-3.5" />
              Nhờ kỹ thuật viên kiểm tra
            </button>
          )}

          <p className="mt-4 border-t border-[#D8E2EA] pt-3 text-[10px] leading-relaxed text-[#9AA9B6]">
            {TECHNICAL_DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  );
}
