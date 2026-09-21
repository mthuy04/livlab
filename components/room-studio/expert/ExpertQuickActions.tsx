'use client';

import type { ExpertQuickAction } from '@/lib/ai/expert/expertOpening';

interface ExpertQuickActionsProps {
  actions: ExpertQuickAction[];
  disabled: boolean;
  onSelect: (prompt: string) => void;
}

/**
 * Contextual shortcuts. The list is derived from Room Studio state, so an
 * action that cannot apply right now is simply not rendered — there is no
 * "tối ưu combo" for an empty room.
 */
export default function ExpertQuickActions({ actions, disabled, onSelect }: ExpertQuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-[#D8E2EA] bg-[#F8FAFC] px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9AA9B6]">Gợi ý nhanh</p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(action.prompt)}
            className="rounded-full border border-[#D8E2EA] bg-white px-3 py-1.5 text-[11px] font-medium text-[#123C5A] transition-colors hover:border-[#C8A96A] hover:bg-white disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
