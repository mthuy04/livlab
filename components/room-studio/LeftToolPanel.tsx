'use client';

import type { ReactNode } from 'react';

export const TOOL_TABS = [
  { id: 'room', label: 'Phòng' },
  { id: 'material', label: 'Vật liệu' },
  { id: 'technical', label: 'Kỹ thuật' },
] as const;

export type ToolTabId = (typeof TOOL_TABS)[number]['id'];

interface LeftToolPanelProps {
  active: ToolTabId;
  onChange: (tab: ToolTabId) => void;
  /** A count badge per tab, shown only when there is something to count. */
  counts?: Partial<Record<ToolTabId, number>>;
  children: ReactNode;
}

/**
 * Exactly three modes, one visible at a time.
 *
 * The panel this replaces stacked six sections in a single column: dimensions,
 * materials, budget, the technical advisor, utility points and a reference
 * image — about 1,900px of controls, so finding the room height meant
 * scrolling past the colour swatches. Three tabs is the minimum that keeps
 * geometry, finish and services apart without burying anything two levels deep.
 *
 * Only the controls themselves are tabbed. Nothing in the 3D scene is mounted
 * here, so switching modes cannot disturb the room, the camera or a selection.
 */
export default function LeftToolPanel({ active, onChange, counts, children }: LeftToolPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div role="tablist" aria-label="Công cụ phòng" className="flex shrink-0 border-b border-[#E1E8ED]">
        {TOOL_TABS.map((tab) => {
          const isActive = tab.id === active;
          const count = counts?.[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`rs-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`rs-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => {
                // Arrow keys move between tabs, which is what a tablist is for
                // and what a row of plain buttons does not do.
                const index = TOOL_TABS.findIndex((t) => t.id === active);
                if (e.key === 'ArrowRight') onChange(TOOL_TABS[(index + 1) % TOOL_TABS.length].id);
                if (e.key === 'ArrowLeft') onChange(TOOL_TABS[(index - 1 + TOOL_TABS.length) % TOOL_TABS.length].id);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-1 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                isActive
                  ? 'border-b-2 border-[color:var(--tenant-ui-selected,#0B2239)] text-[#0B1623]'
                  : 'border-b-2 border-transparent text-[#8C9BAB] hover:text-[#3F4F5C]'
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="rounded bg-[#EEF4F7] px-1.5 text-[11px] font-semibold text-[#4A6275]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`rs-panel-${active}`}
        aria-labelledby={`rs-tab-${active}`}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {children}
      </div>
    </div>
  );
}
