'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';

interface BudgetTargetCardProps {
  targetBudget?: number;
  onChange: (value?: number) => void;
}

/** Common bathroom budget brackets in the Vietnamese market, in VND. */
const PRESETS = [
  { label: '20 triệu', value: 20_000_000 },
  { label: '30 triệu', value: 30_000_000 },
  { label: '50 triệu', value: 50_000_000 },
  { label: '80 triệu', value: 80_000_000 },
];

/**
 * Optional target budget.
 *
 * Optional on purpose: without it LivLab Expert reports the running total but
 * will not claim a combo is over or under budget, because it has no target to
 * compare against and must not invent one.
 */
export default function BudgetTargetCard({ targetBudget, onChange }: BudgetTargetCardProps) {
  const [draft, setDraft] = useState(targetBudget ? String(targetBudget / 1_000_000) : '');

  const commit = (millions: string) => {
    setDraft(millions);
    const parsed = parseFloat(millions.replace(',', '.'));
    onChange(Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000_000 : undefined);
  };

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-[#C8A96A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Ngân sách dự kiến</h3>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-[#627386]">
        Không bắt buộc. Nhập để LivLab Expert đánh giá combo có vừa ngân sách hay không.
      </p>

      <div className="mb-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={draft}
          onChange={(e) => commit(e.target.value)}
          placeholder="0"
          aria-label="Ngân sách dự kiến, đơn vị triệu đồng"
          className="min-w-0 flex-1 rounded-xl border border-[#D8E2EA] px-3 py-2.5 text-sm text-[#0B1623] transition-colors focus:border-[#0F3D5C] focus:outline-none"
        />
        <span className="shrink-0 text-xs font-medium text-[#627386]">triệu đồng</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => commit(String(preset.value / 1_000_000))}
            aria-pressed={targetBudget === preset.value}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              targetBudget === preset.value
                ? 'border-[#123C5A] bg-[#123C5A] text-white'
                : 'border-[#D8E2EA] bg-white text-[#627386] hover:bg-[#EEF4F7]'
            }`}
          >
            {preset.label}
          </button>
        ))}
        {targetBudget !== undefined && (
          <button
            type="button"
            onClick={() => commit('')}
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#9AA9B6] transition-colors hover:text-[#627386]"
          >
            Xoá
          </button>
        )}
      </div>
    </div>
  );
}
