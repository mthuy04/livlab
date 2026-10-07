'use client';

/**
 * Decides WHICH nudge is on screen and WHEN — the anti-spam layer.
 *
 * `evaluateExpertNudges` answers "what could the Expert usefully say right
 * now?" and is pure. This hook answers "should it say anything at all?", which
 * needs the things a pure function cannot see: what has already been said, what
 * the customer dismissed, and how long ago the last bubble appeared.
 *
 * The rules, in order of how often they matter:
 *
 *  1. A nudge is identified by its key, which encodes its data. The same key is
 *     never shown twice in a session, so dragging a product around cannot
 *     re-trigger "2 sản phẩm trong phòng".
 *  2. A cooldown spaces out ordinary nudges, so a burst of edits produces one
 *     bubble rather than five.
 *  3. Warnings bypass the cooldown. A new technical or budget problem is worth
 *     interrupting for; "bạn có 3 sản phẩm" is not.
 *  4. Dismissal is remembered by key for the session, and never hides the
 *     character itself.
 *
 * Everything is in-memory and resets on reload. Persisting it would mean an
 * account and a database, which this phase deliberately leaves alone.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  evaluateExpertNudges,
  type ExpertNudge,
  type ExpertNudgeContext,
} from '@/lib/room-studio/expertNudges';

/** Minimum gap between ordinary bubbles. */
const COOLDOWN_MS = 24_000;
/** Low-priority bubbles fold themselves away rather than sitting there. */
const AUTO_COLLAPSE_MS = 10_000;
/** At or above this, a nudge may interrupt: the warning band. */
const INTERRUPT_PRIORITY = 80;
/** Lets the studio settle before the first bubble, so it reads as a greeting
 *  rather than as something that fired during page load. */
const FIRST_NUDGE_DELAY_MS = 1_200;
/**
 * How long a bubble holds the floor against a REVISION of itself.
 *
 * Warnings carry their count in the key, so adding three products in a second
 * produces three different technical keys. Each is a true statement, but
 * swapping the bubble through "3 điểm… 6 điểm… 9 điểm" is the flicker the
 * cooldown exists to prevent — and the first two are obsolete before they can
 * be read. Deferring instead collapses the burst into one bubble carrying the
 * final number, because the pending timer is cancelled and rescheduled on
 * every change.
 */
const SAME_TYPE_DWELL_MS = 5_000;

export interface UseExpertNudgesResult {
  /** The bubble to render, or null when the Expert should stay quiet. */
  nudge: ExpertNudge | null;
  dismiss: () => void;
}

export function useExpertNudges(
  context: ExpertNudgeContext,
  options: { enabled: boolean }
): UseExpertNudgesResult {
  const { enabled } = options;

  const [active, setActive] = useState<ExpertNudge | null>(null);
  const shownKeys = useRef<Set<string>>(new Set());
  const dismissedKeys = useRef<Set<string>>(new Set());
  const lastShownAt = useRef(0);
  const lastShownType = useRef<ExpertNudge['type'] | null>(null);
  const mountedAt = useRef(0);

  const candidates = useMemo(() => evaluateExpertNudges(context), [context]);

  /**
   * Derived, not stored: a nudge whose reason has gone away is simply not
   * rendered. Warnings are persistent, so without this a customer who removed
   * the offending product would go on reading "Có 3 điểm cần kiểm tra" about a
   * room that no longer has any — the advisor contradicting the studio.
   */
  const visible = active && candidates.some((n) => n.key === active.key) ? active : null;

  // Declared before the scheduler below so it has already run on mount, and the
  // first-nudge delay is measured from a real timestamp.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const candidate =
      candidates.find(
        (n) =>
          !shownKeys.current.has(n.key) &&
          !dismissedKeys.current.has(n.key) &&
          // A generic greeting arriving after a specific suggestion reads as
          // the advisor losing its place.
          !(n.firstContactOnly && shownKeys.current.size > 0)
      ) ?? null;
    if (!candidate) return;

    // Never replace a bubble with something less important; let the current one
    // finish being read.
    if (visible && candidate.priority <= visible.priority) return;

    const now = Date.now();
    const sinceMount = now - mountedAt.current;
    const sinceLast = lastShownAt.current === 0 ? Infinity : now - lastShownAt.current;

    let waitFor = Math.max(0, FIRST_NUDGE_DELAY_MS - sinceMount);
    if (candidate.priority < INTERRUPT_PRIORITY && sinceLast < COOLDOWN_MS) {
      waitFor = Math.max(waitFor, COOLDOWN_MS - sinceLast);
    }
    // A warning may interrupt anything — except a fresher version of itself.
    if (lastShownType.current === candidate.type && sinceLast < SAME_TYPE_DWELL_MS) {
      waitFor = Math.max(waitFor, SAME_TYPE_DWELL_MS - sinceLast);
    }

    // Showing happens in the timer callback rather than in the effect body, so
    // a deferred nudge needs no separate re-evaluation trigger: the timer IS
    // the trigger. A cancelled timer (the room changed meanwhile) simply means
    // the effect re-runs and re-decides with fresher state.
    const timer = setTimeout(() => {
      shownKeys.current.add(candidate.key);
      lastShownAt.current = Date.now();
      lastShownType.current = candidate.type;
      setActive(candidate);
    }, waitFor);

    return () => clearTimeout(timer);
  }, [enabled, candidates, visible]);

  // Auto-collapse, but only for the conversational nudges. A technical or
  // budget warning stays until the customer deals with it or dismisses it.
  useEffect(() => {
    if (!visible || visible.persistent) return;
    const timer = setTimeout(() => setActive(null), AUTO_COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = useCallback(() => {
    setActive((current) => {
      if (current) dismissedKeys.current.add(current.key);
      return null;
    });
  }, []);

  // The entry is unmounted while the Expert panel is open, so `enabled` going
  // false is belt-and-braces: the advisor never talks over its own panel.
  return { nudge: enabled ? visible : null, dismiss };
}
