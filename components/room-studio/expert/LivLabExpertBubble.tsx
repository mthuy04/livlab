'use client';

import { X } from 'lucide-react';
import type { ExpertNudge } from '@/lib/room-studio/expertNudges';

interface LivLabExpertBubbleProps {
  nudge: ExpertNudge;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * Level 1 of the Expert: one short contextual line, attached to the character.
 *
 * Deliberately NOT a chat. It carries a single sentence and at most one call to
 * action; anything the customer wants to discuss happens in the Expert panel
 * (Level 2). Keeping conversation out of the bubble is what stops the advisor
 * from feeling like a chatbot interrupting the room.
 *
 * The whole bubble is clickable, so the CTA is an affordance rather than the
 * only target. The dismiss control is a real button, stops propagation, and is
 * reachable by keyboard.
 */
export default function LivLabExpertBubble({ nudge, onOpen, onDismiss }: LivLabExpertBubbleProps) {
  const isWarning = nudge.type === 'TECHNICAL_WARNING' || nudge.type === 'BUDGET_WARNING';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${nudge.message} — mở LivLab Expert`}
      className="pointer-events-auto relative w-[220px] cursor-pointer rounded-2xl rounded-br-md border border-[#E2E9EF] bg-white/98 p-3 pr-7 text-left shadow-[0_8px_28px_rgba(11,22,35,0.14)] backdrop-blur transition-shadow duration-200 hover:shadow-[0_10px_32px_rgba(11,22,35,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A] sm:w-[248px] md:w-[268px]"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Ẩn gợi ý của LivLab Expert"
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-[#A7B4C0] transition-colors hover:bg-[#F3F7FA] hover:text-[#123C5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#0B1623]">LivLab Expert</span>
        <span
          className={`rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide ${
            isWarning ? 'bg-[#FBF0DC] text-[#8A6520]' : 'bg-[#EEF4F7] text-[#4A6274]'
          }`}
        >
          {nudge.mode}
        </span>
      </div>

      <p className="text-[11.5px] font-medium leading-[1.45] text-[#1A2C3D]">{nudge.message}</p>

      {nudge.cta && (
        <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0F3D5C] transition-colors group-hover:text-[#C8A96A]">
          {nudge.cta.label}
          <span aria-hidden="true">→</span>
        </span>
      )}

      {/* The tail follows the layout: it points DOWN at the character when the
          bubble sits above it on a phone, and RIGHT at the character when the
          two sit side by side from md up. A rotated square shows only the two
          borders that meet at the corner it points from, which is what makes it
          read as part of the bubble rather than a diamond stuck to it. */}
      <span
        aria-hidden="true"
        className="absolute -bottom-[6px] right-5 h-3 w-3 rotate-45 border-b border-r border-[#E2E9EF] bg-white/98 md:bottom-auto md:right-[-6px] md:top-1/2 md:-translate-y-1/2 md:border-b-0 md:border-r md:border-t"
      />
    </div>
  );
}
