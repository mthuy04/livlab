'use client';

import { Sparkles } from 'lucide-react';

interface LivLabExpertTriggerProps {
  onClick: () => void;
  /** Short contextual line, e.g. how many products are in the room. */
  hint?: string;
}

/**
 * The entry point into LivLab Expert.
 *
 * Positioned clear of two things that already own the bottom of the screen:
 * the sticky budget bar (z-40, and roughly 155px tall on a phone) and the
 * site-wide support bubble at bottom-right. Hence the explicit offset and a
 * z-index above the bar — at the default z-30 the bar swallowed the button and
 * taps fell through to the 3D canvas behind it.
 */
export default function LivLabExpertTrigger({ onClick, hint }: LivLabExpertTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[168px] right-4 z-[45] flex items-center gap-2.5 rounded-full border border-[#C8A96A]/40 bg-[#0B1623] py-3 pl-3.5 pr-4 text-white shadow-xl transition-transform hover:scale-[1.03] md:bottom-28 md:right-24"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C8A96A]/20">
        <Sparkles className="h-4 w-4 text-[#C8A96A]" />
      </span>
      <span className="text-left">
        <span className="block text-xs font-bold leading-tight">LivLab Expert</span>
        {hint && <span className="block text-[10px] leading-tight text-white/50">{hint}</span>}
      </span>
    </button>
  );
}
