'use client';

import { useCallback, useLayoutEffect, useState } from 'react';
import type { ExpertIntent, ExpertNudgeContext } from '@/lib/room-studio/expertNudges';
import { useExpertNudges } from './useExpertNudges';
import LivLabExpertCharacter from './LivLabExpertCharacter';
import LivLabExpertBubble from './LivLabExpertBubble';

interface LivLabExpertEntryProps {
  context: ExpertNudgeContext;
  /** False while the Expert panel is open — the advisor does not talk over itself. */
  enabled: boolean;
  /** `intent` is present when the customer acted on a bubble CTA. */
  onOpen: (intent?: ExpertIntent) => void;
}

/** Breathing room between the character's feet and the budget bar. */
const BAR_GAP_PX = 12;
/** Used until the bar has been measured, and if it is ever absent. */
const FALLBACK_OFFSET_PX = 104;

/**
 * Tracks the sticky budget bar's height so the Expert can sit exactly above it.
 *
 * The bar is NOT a constant height: its three CTAs wrap onto a second line at
 * tablet width and stack on a phone, so it ranges from ~92px to ~155px. A
 * per-breakpoint offset guessed at those numbers was wrong at 768px, where the
 * character landed 28px inside the bar. Measuring is both correct today and
 * immune to the bar's layout changing later.
 */
function useBudgetBarOffset(): number {
  const [offset, setOffset] = useState(FALLBACK_OFFSET_PX);

  const measure = useCallback(() => {
    const bar = document.querySelector('[data-budget-bar]');
    if (!bar) return;
    const next = Math.round(bar.getBoundingClientRect().height) + BAR_GAP_PX;
    // Guarded so re-measuring on every render cannot loop.
    setOffset((prev) => (prev === next ? prev : next));
  }, []);

  // A subscription, not a one-off read: the bar is not a fixed height and does
  // not settle at mount. Its three CTAs wrap onto a second line around tablet
  // width and stack on a phone, and the item count and unpriced-products note
  // both change its content after products load. ResizeObserver delivers its
  // first callback before paint, so this also supplies the initial value.
  useLayoutEffect(() => {
    const bar = document.querySelector('[data-budget-bar]');
    if (!bar) return;
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return offset;
}

/**
 * The LivLab Expert entry point: character + one proactive line.
 *
 * Positioning is the fiddly part. Room Studio's right column (the product
 * library) is `xl:sticky` inside a centred `max-w-[1600px]` container, so a
 * plain viewport-anchored `right-N` clears the library at 1280px and then
 * drifts straight over it at 1920px, where the container has 160px gutters.
 *
 * So instead of guessing an offset, the wrapper REPRODUCES that container:
 * fixed, full width, same max-width and centring. The character is then
 * positioned against the container's own right edge, and `xl:right-[380px]`
 * (340px library + 24px page padding + gap) tracks the layout at every width.
 *
 * The vertical offset is measured from the budget bar rather than hard-coded,
 * because that bar changes height as its CTAs wrap. See useBudgetBarOffset.
 *
 * The wrapper is `pointer-events-none` and only the character and bubble opt
 * back in, so the transparent parts of the PNG and the empty container around
 * it never intercept a drag meant for the 3D canvas.
 *
 * z-[45] sits above the budget bar (z-40) and below both the site-wide support
 * bubble (z-[100]) and the Expert panel itself (z-[110]).
 */
export default function LivLabExpertEntry({ context, enabled, onOpen }: LivLabExpertEntryProps) {
  const { nudge, dismiss } = useExpertNudges(context, { enabled });
  const bottomOffset = useBudgetBarOffset();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45]" aria-live="polite">
      {/* `relative` is load-bearing: it makes the offsets below resolve against
          THIS centred container rather than the viewport, which is what keeps
          xl:right-[380px] beside the library at 1920px as well as at 1280px. */}
      <div className="relative mx-auto h-0 max-w-[1600px]">
        <div
          style={{ bottom: bottomOffset }}
          className="absolute right-4 flex flex-col items-end gap-2 md:right-6 md:flex-row md:items-end md:gap-2.5 xl:right-[380px]"
        >
          {/* Stacked on a phone, where width is the scarce resource; beside the
              character from md up, where height is — a tall stack would reach
              the 3D canvas's own overlay controls. */}
          {nudge && (
            <div className="expert-bubble-enter md:mb-6">
              <LivLabExpertBubble
                nudge={nudge}
                onOpen={() => onOpen(nudge.cta?.intent)}
                onDismiss={dismiss}
              />
            </div>
          )}

          {/* Frame height is shorter than the image's natural aspect ratio, which
              is what crops the full-length figure down to a bust. */}
          <LivLabExpertCharacter
            onClick={() => onOpen()}
            className="expert-character-enter h-[84px] w-[80px] md:h-[124px] md:w-[118px] xl:h-[150px] xl:w-[142px]"
          />
        </div>
      </div>
    </div>
  );
}
