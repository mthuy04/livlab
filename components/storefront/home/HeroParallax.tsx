'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * A layer of the hero that drifts a few pixels with the scroll — the
 * photograph and its glass sink slightly while the page above them moves on,
 * and the categories section slides over their lower edge.
 *
 * Tied to the scroll position itself (motion values, no re-render per
 * frame), softened by a light spring. Off on phones and for reduced motion;
 * a smaller drift on tablets.
 */
const WIDE = '(min-width: 1024px)';
const TABLET = '(min-width: 768px)';

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export default function HeroParallax({
  className,
  children,
  /** Scroll distance, in px, over which the full drift happens. */
  range = 700,
}: {
  className?: string;
  children: ReactNode;
  range?: number;
}) {
  const reduce = useReducedMotion();
  const wide = useMedia(WIDE);
  const tablet = useMedia(TABLET);
  const shift = wide ? 20 : tablet ? 12 : 0;

  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, range], [0, shift], { clamp: true });
  const y = useSpring(drift, { stiffness: 160, damping: 32, mass: 0.4 });

  return (
    <motion.div className={className} style={shift && !reduce ? { y } : undefined}>
      {children}
    </motion.div>
  );
}
