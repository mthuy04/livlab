import { useSyncExternalStore } from 'react';

/**
 * Whether the three-column workspace fits.
 *
 * Room Studio mounts its panels in ONE place and moves them, rather than
 * rendering a desktop copy and a mobile copy with `hidden`/`lg:block`. Two
 * copies means two scroll positions, two filter states, and the product list's
 * DOM built twice for a panel only one of which is ever visible.
 *
 * `useSyncExternalStore` and not state-in-an-effect: the media query IS
 * external state, so the first client render reads the real value instead of
 * rendering a desktop layout and then correcting it. Matches Tailwind's `lg`.
 */
const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;

/** Server render has no viewport; the desktop layout is the fuller one. */
const getServerSnapshot = () => true;

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
