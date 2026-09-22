'use client';

/**
 * A remembered UI preference for the studio's layout.
 *
 * Separate from RoomState on purpose: whether a panel is collapsed is chrome,
 * not part of the room being designed. Putting it in the room snapshot would
 * mean a saved room carried someone else's sidebar state, and would ship it to
 * a showroom inside the handoff package.
 *
 * Implemented with useSyncExternalStore rather than an effect that reads
 * storage into state. localStorage IS an external store, and this is the API
 * for one: the server snapshot is the fallback, so hydration cannot mismatch,
 * and the stored value takes over immediately afterwards.
 */

import { useCallback, useSyncExternalStore } from 'react';

/** Same-tab listeners. The `storage` event only fires in OTHER tabs. */
const listeners = new Set<() => void>();

function read(key: string): boolean | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : raw === '1';
  } catch {
    // Storage disabled (private window, blocked site data). The fallback is a
    // perfectly usable layout, so this is not worth surfacing.
    return null;
  }
}

export function useLayoutPreference(key: string, fallback: boolean) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    window.addEventListener('storage', onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  }, []);

  const value = useSyncExternalStore(
    subscribe,
    // Booleans compare by value, so returning a fresh read each time is safe —
    // React only re-renders when the value actually differs.
    () => read(key) ?? fallback,
    () => fallback
  );

  const update = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? '1' : '0');
      } catch {
        // Will not persist; the current session still reflects the change.
      }
      listeners.forEach((listener) => listener());
    },
    [key]
  );

  return [value, update] as const;
}
