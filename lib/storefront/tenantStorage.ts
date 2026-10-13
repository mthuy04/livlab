'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tenant-scoped client persistence for the storefront.
 *
 * Every key is built here. Before this module the catalogue wrote
 * `livlab_compare_items` from inside a page component, which meant a customer
 * who looked at Showroom A's storefront and then Showroom B's carried A's
 * comparison into B — one global key, two tenants.
 *
 * Keys are `livlab:{tenantId}:{name}:v1`. The version suffix is there so a
 * later shape change can be migrated rather than silently misread.
 */

const VERSION = 'v1';

export type StoreName = 'compare' | 'saved';

export function tenantKey(tenantId: string, name: StoreName): string {
  return `livlab:${tenantId}:${name}:${VERSION}`;
}

/**
 * The pre-tenant keys. They are read once per store and copied forward, then
 * left in place — a half-finished quote or a saved list is the customer's, and
 * deleting it to tidy up our own naming would be the wrong trade.
 */
const LEGACY_KEYS: Record<StoreName, string | null> = {
  compare: 'livlab_compare_items',
  saved: null,
};

/**
 * The quote cart stays on its global key for now.
 *
 * `livlab_quote_items` is read by QuoteContext, which Room Studio, the concept
 * pages and the header drawer all mount. Re-keying it belongs with that flow's
 * own migration, not with the catalogue — doing it here would empty a live
 * cart for anyone mid-session. It is named here so the string still lives in
 * one place.
 */
export const GLOBAL_QUOTE_KEY = 'livlab_quote_items';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode, or the quota is full. The page must still work.
  }
}

/** Reads a tenant store, adopting the legacy global value the first time. */
export function readIds(tenantId: string, name: StoreName): string[] {
  if (typeof window === 'undefined') return [];
  const key = tenantKey(tenantId, name);
  const existing = window.localStorage.getItem(key);
  if (existing !== null) return read<string[]>(key, []);

  const legacy = LEGACY_KEYS[name];
  if (legacy) {
    const migrated = read<string[]>(legacy, []);
    if (migrated.length > 0) {
      write(key, migrated);
      return migrated;
    }
  }
  return [];
}

export function writeIds(tenantId: string, name: StoreName, ids: string[]): void {
  write(tenantKey(tenantId, name), ids);
}

export const MAX_COMPARE = 3;

export type ToggleResult = { ids: string[]; error?: string };

/**
 * Adds or removes a product from the comparison.
 *
 * Two rules the catalogue needs and a plain id array cannot express on its
 * own: at most three products, and all of them from one category — comparing
 * a toilet against a shower column produces a table of blanks.
 */
export function toggleCompare(
  tenantId: string,
  id: string,
  category: string | null,
  categoryOf: (id: string) => string | null
): ToggleResult {
  const ids = readIds(tenantId, 'compare');

  if (ids.includes(id)) {
    const next = ids.filter((existing) => existing !== id);
    writeIds(tenantId, 'compare', next);
    return { ids: next };
  }

  if (ids.length >= MAX_COMPARE) {
    return { ids, error: `Bạn chỉ có thể so sánh tối đa ${MAX_COMPARE} sản phẩm.` };
  }

  const current = ids.map(categoryOf).find(Boolean) ?? null;
  if (current && category && current !== category) {
    return { ids, error: 'Chỉ có thể so sánh các sản phẩm cùng danh mục.' };
  }

  const next = [...ids, id];
  writeIds(tenantId, 'compare', next);
  return { ids: next };
}

export function toggleSaved(tenantId: string, id: string): string[] {
  const ids = readIds(tenantId, 'saved');
  const next = ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
  writeIds(tenantId, 'saved', next);
  return next;
}

export function clearStore(tenantId: string, name: StoreName): void {
  writeIds(tenantId, name, []);
}

/* ── Reading a store from React ──────────────────────────────────────────── */

/**
 * localStorage is an external store, so it is read through
 * `useSyncExternalStore` rather than copied into state inside an effect.
 *
 * The snapshot is memoised per key because the hook compares by reference:
 * parsing the JSON on every render would hand React a new array each time and
 * loop. Writes refresh the cache and notify, and a `storage` event does the
 * same for the same site open in another tab.
 */
const snapshots = new Map<string, string[]>();
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: string[] = [];

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key.startsWith('livlab:')) {
      snapshots.delete(event.key);
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTenantIds(
  tenantId: string,
  name: StoreName
): [string[], (ids: string[]) => void] {
  const key = tenantKey(tenantId, name);

  const getSnapshot = useCallback(() => {
    const cached = snapshots.get(key);
    if (cached) return cached;
    const value = readIds(tenantId, name);
    snapshots.set(key, value);
    return value;
  }, [key, tenantId, name]);

  const ids = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const set = useCallback(
    (next: string[]) => {
      writeIds(tenantId, name, next);
      snapshots.set(key, next);
      emit();
    },
    [key, tenantId, name]
  );

  return [ids, set];
}
