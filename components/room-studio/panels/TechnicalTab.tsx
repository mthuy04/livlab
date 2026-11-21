'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import type { UtilityPoint, UtilityPointType, TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { TECHNICAL_DISCLAIMER } from '@/lib/technical-advisor/config';
import { getRoomBounds, type RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { groupFindings, type TopicAction } from '../technical/advisorGroups';
import { AdvisorNote, AdvisorSection, AdvisorSummary, IssueCard, PassedList, TopicCard } from '../technical/AdvisorPanel';

interface TechnicalTabProps {
  dimensions: RoomDimensions;
  points: UtilityPoint[];
  findings: TechnicalValidationResult[];
  onAdd: (point: UtilityPoint) => void;
  onRemove: (id: string) => void;
  /** The type currently being placed, lifted so the floor plan can show it. */
  pendingType: UtilityPointType | null;
  onPendingTypeChange: (type: UtilityPointType | null) => void;
  onRequestTechnicalCheck: () => void;
  /** The mini floor plan, rendered by the workspace and passed in. */
  floorPlan: React.ReactNode;
  /** Smart Fix, shown right under the summary when there is something to fix. */
  smartFix?: ReactNode;
  /** A short product name for an instance, for cards that name what they are about. */
  nameOf?: (instanceId: string) => string | undefined;
}

/**
 * Customer-facing names for the five point types the rule engine supports.
 * The engine's own identifiers are unchanged; only the labels are here.
 */
export const UTILITY_TYPE_LABEL: Record<UtilityPointType, string> = {
  DRAIN: 'Thoát sàn',
  TOILET_WASTE: 'Xả bồn cầu',
  COLD_WATER: 'Nước lạnh',
  HOT_WATER: 'Nước nóng',
  ELECTRICAL: 'Điểm điện',
  UNKNOWN: 'Điểm kỹ thuật',
};

const TYPE_OPTIONS: UtilityPointType[] = [
  'DRAIN',
  'TOILET_WASTE',
  'COLD_WATER',
  'HOT_WATER',
  'ELECTRICAL',
];

let counter = 0;

/** Corner-relative metres → the room's centre-origin frame. */
export function utilityPointFrom(
  type: UtilityPointType,
  dimensions: RoomDimensions,
  fromLeft: number,
  fromBack: number
): UtilityPoint {
  const bounds = getRoomBounds(dimensions);
  counter += 1;
  return {
    id: `up_${Date.now().toString(36)}_${counter}`,
    type,
    position: [bounds.minX + fromLeft, 0, bounds.minZ + fromBack],
    label: UTILITY_TYPE_LABEL[type],
  };
}

/**
 * Existing water, drain and power points — declared by the customer, never
 * inferred. LivLab cannot see inside a wall and will not guess from a photo, so
 * until these are stated the plumbing rules report "chưa có dữ liệu" rather
 * than validating against an invented position.
 *
 * The workflow is the change here. It used to open with two numeric fields, so
 * the first thing asked of a customer was the distance in metres from a corner
 * to their floor drain. Now they pick a type and tap the plan. The numbers are
 * still there, under "Điều chỉnh chính xác", for someone who has measured.
 */
export default function TechnicalTab({
  dimensions,
  points,
  findings,
  onAdd,
  onRemove,
  pendingType,
  onPendingTypeChange,
  onRequestTechnicalCheck,
  floorPlan,
  smartFix,
  nameOf = () => undefined,
}: TechnicalTabProps) {
  const [showNumeric, setShowNumeric] = useState(false);
  const [numericType, setNumericType] = useState<UtilityPointType>('DRAIN');
  const [fromLeft, setFromLeft] = useState('');
  const [fromBack, setFromBack] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bounds = getRoomBounds(dimensions);
  const groups = useMemo(() => groupFindings(findings), [findings]);
  const [open, setOpen] = useState({ amber: true, blue: true, green: false });
  const [highlightPoints, setHighlightPoints] = useState(false);
  const names = (list: TechnicalValidationResult[]) =>
    [...new Set(list.flatMap((f) => f.affectedInstanceIds.map((id) => nameOf(id)).filter((n): n is string => !!n)))];
  const firstName = (f: TechnicalValidationResult) => (f.affectedInstanceIds[0] ? nameOf(f.affectedInstanceIds[0]) : undefined);

  const jump = (tone: 'amber' | 'blue' | 'green') => {
    setOpen((o) => ({ ...o, [tone]: true }));
    requestAnimationFrame(() =>
      document.getElementById(`advisor-${tone}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };
  // A finding's "fix" button hands the issue to Smart Fix, which selects it and searches.
  const smartFixFor = (finding: TechnicalValidationResult) => {
    window.dispatchEvent(new CustomEvent('livlab:smart-fix', { detail: finding.id }));
    document.getElementById('smart-fix')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const topicAction = (key: TopicAction) => {
    if (key === 'water') {
      document.getElementById('advisor-points')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightPoints(true);
      window.setTimeout(() => setHighlightPoints(false), 1600);
    } else onRequestTechnicalCheck();
  };

  const handleNumericAdd = () => {
    const left = parseFloat(fromLeft.replace(',', '.'));
    const back = parseFloat(fromBack.replace(',', '.'));

    if (!Number.isFinite(left) || !Number.isFinite(back)) {
      setError('Vui lòng nhập khoảng cách theo mét.');
      return;
    }
    if (left < 0 || left > dimensions.length || back < 0 || back > dimensions.width) {
      setError(`Vị trí phải nằm trong phòng (tối đa ${dimensions.length}m × ${dimensions.width}m).`);
      return;
    }

    onAdd(utilityPointFrom(numericType, dimensions, left, back));
    setFromLeft('');
    setFromBack('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <AdvisorSummary groups={groups} onJump={jump} />

      {smartFix}

      <div className="space-y-3">
        <AdvisorSection
          id="advisor-amber"
          tone="amber"
          title="Cần xử lý ngay"
          count={groups.action.length}
          open={open.amber}
          onToggle={() => setOpen((o) => ({ ...o, amber: !o.amber }))}
        >
          {groups.action.map((f) => (
            <IssueCard key={f.id} finding={f} product={firstName(f)} onSmartFix={smartFixFor} />
          ))}
        </AdvisorSection>
        <AdvisorSection
          id="advisor-blue"
          tone="blue"
          title="Thiếu dữ liệu để kiểm tra"
          count={groups.missingCount}
          open={open.blue}
          onToggle={() => setOpen((o) => ({ ...o, blue: !o.blue }))}
        >
          {groups.missing.map((topic) => (
            <TopicCard key={topic.key} topic={topic} names={names(topic.findings)} onAction={topicAction} />
          ))}
        </AdvisorSection>
        <AdvisorSection
          id="advisor-green"
          tone="green"
          title="Đã đạt / hợp lệ"
          count={groups.passed.length}
          open={open.green}
          onToggle={() => setOpen((o) => ({ ...o, green: !o.green }))}
        >
          <PassedList findings={groups.passed} nameOf={firstName} />
        </AdvisorSection>
        {findings.length === 0 && (
          <AdvisorNote>Chưa có sản phẩm nào để kiểm tra. Thêm thiết bị vào phòng để LivLab đánh giá bố trí.</AdvisorNote>
        )}
      </div>

      <section className="border-t border-[#EDF2F5] pt-4">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8C9BAB]">Sơ đồ phòng</h3>
        {floorPlan}
      </section>

      <section
        id="advisor-points"
        className={`scroll-mt-4 rounded-xl border p-3 transition-colors duration-500 ${
          highlightPoints ? 'border-[#7FA7C9] bg-[#F1F6FB]' : 'border-transparent'
        } -mx-3`}
      >
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8C9BAB]">Điểm nước & điện</h3>
        <p className="mb-3 text-[12px] leading-relaxed text-[#8C9BAB]">Chọn loại điểm rồi chạm vào sơ đồ phòng.</p>

        {points.length > 0 && (
          <ul className="mb-3 space-y-1">
            {points.map((point) => {
              const left = point.position[0] - bounds.minX;
              const back = point.position[2] - bounds.minZ;
              return (
                <li key={point.id} className="flex items-center justify-between gap-2 py-1">
                  <span className="min-w-0 flex-1 text-[13px] text-[#3F4F5C]">
                    <strong className="font-medium text-[#0B1623]">
                      {UTILITY_TYPE_LABEL[point.type]}
                    </strong>
                    <span className="text-[#8C9BAB]">
                      {' '}
                      · {left.toFixed(2)}m × {back.toFixed(2)}m
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(point.id)}
                    aria-label={`Xoá ${UTILITY_TYPE_LABEL[point.type]}`}
                    className="shrink-0 rounded p-1 text-[#9AA9B6] transition-colors hover:bg-[#F3F7FA] hover:text-red-500"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {pendingType ? (
          <div className="rounded-lg border border-[#7FA7C9] bg-[#F1F6FB] p-3">
            <p className="text-[13px] font-medium text-[#0B1623]">
              {UTILITY_TYPE_LABEL[pendingType]}
            </p>
            <p className="mt-0.5 text-[12px] text-[#5B6B7A]">Chọn vị trí trong sơ đồ phòng ở trên.</p>
            <button
              type="button"
              onClick={() => onPendingTypeChange(null)}
              className="mt-2 text-[13px] font-medium text-[#5B6B7A] underline decoration-[#C8D5DE] underline-offset-4"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPendingTypeChange(type)}
                className="flex items-center gap-1 rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#3F4F5C] transition-colors hover:border-[#0F3D5C] hover:text-[#0B2239] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]"
              >
                <Plus className="h-3.5 w-3.5 text-[#8C9BAB]" aria-hidden />
                {UTILITY_TYPE_LABEL[type]}
              </button>
            ))}
          </div>
        )}

        {/* Still available, just no longer the first thing asked. */}
        <button
          type="button"
          onClick={() => setShowNumeric((v) => !v)}
          aria-expanded={showNumeric}
          className="mt-3 flex items-center gap-1 text-[13px] font-medium text-[#0F3D5C]"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showNumeric ? 'rotate-180' : ''}`}
            aria-hidden
          />
          Điều chỉnh chính xác
        </button>

        {showNumeric && (
          <div className="mt-2 space-y-2 rounded bg-[#F8FAFC] p-3">
            <p className="text-[12px] leading-relaxed text-[#8C9BAB]">
              Đo từ góc trong bên trái của phòng.
            </p>
            <select
              value={numericType}
              onChange={(e) => setNumericType(e.target.value as UtilityPointType)}
              aria-label="Loại điểm kỹ thuật"
              className="w-full rounded border border-[#D8E2EA] bg-white px-2.5 py-2 text-[13px] text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {UTILITY_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                value={fromLeft}
                onChange={(e) => setFromLeft(e.target.value)}
                placeholder="Cách trái (m)"
                aria-label="Khoảng cách từ tường trái, mét"
                className="min-w-0 flex-1 rounded border border-[#D8E2EA] bg-white px-2.5 py-2 text-[13px] text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
              />
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                value={fromBack}
                onChange={(e) => setFromBack(e.target.value)}
                placeholder="Cách tường trong (m)"
                aria-label="Khoảng cách từ tường trong, mét"
                className="min-w-0 flex-1 rounded border border-[#D8E2EA] bg-white px-2.5 py-2 text-[13px] text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
              />
            </div>
            {error && (
              <p role="alert" className="text-[12px] font-medium text-red-500">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleNumericAdd}
              className="w-full rounded bg-[#EEF4F7] py-2 text-[13px] font-medium text-[#123C5A] transition-colors hover:bg-[#D8E2EA]"
            >
              Thêm điểm
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3 border-t border-[#EDF2F5] pt-4">
        <button
          type="button"
          onClick={onRequestTechnicalCheck}
          className="w-full rounded-lg border border-[#0B2239] py-2.5 text-[13px] font-semibold text-[#0B2239] transition-colors hover:bg-[#0B2239] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]"
        >
          Yêu cầu kiểm tra kỹ thuật
        </button>
        <AdvisorNote>{TECHNICAL_DISCLAIMER}</AdvisorNote>
      </section>
    </div>
  );
}
