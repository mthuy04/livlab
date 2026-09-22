'use client';

/**
 * Storage for implementation requests.
 *
 * TEMPORARY ADAPTER. Requests are delivered to the real backend by
 * submitImplementationRequest; what lives here is the customer's own copy —
 * the full structured snapshot, which the current QuoteLead table has no column
 * for. Keeping it behind this interface is the point: when a `contextJson`
 * column (or Supabase) arrives, only this file changes, and no component that
 * reads a request needs to know.
 *
 * This is also why no component calls localStorage directly for requests.
 */

import type { ImplementationRequest } from './types';

const STORAGE_KEY = 'livlab_implementation_requests_v1';
/** Newest-first cap. Local storage is a few MB total and shared with the room
 *  snapshot and the quote basket, so the history is bounded rather than grown
 *  until a write throws. */
const MAX_STORED = 20;

export interface ImplementationRequestRepository {
  createRequest(request: ImplementationRequest): Promise<ImplementationRequest>;
  getRequest(requestCode: string): Promise<ImplementationRequest | null>;
  listRequests(): Promise<ImplementationRequest[]>;
}

function readAll(): ImplementationRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImplementationRequest[]) : [];
  } catch {
    // Corrupt or unavailable storage must never break the request flow — the
    // customer's submission already reached the server by this point.
    return [];
  }
}

function writeAll(requests: ImplementationRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests.slice(0, MAX_STORED)));
  } catch {
    // Quota exceeded or storage disabled. Swallowed on purpose: losing the
    // local copy is not a reason to tell the customer their request failed.
  }
}

/**
 * The adapter in use today. Swap the implementation, keep the interface.
 */
export const implementationRequestRepository: ImplementationRequestRepository = {
  async createRequest(request) {
    writeAll([request, ...readAll().filter((r) => r.requestCode !== request.requestCode)]);
    return request;
  },

  async getRequest(requestCode) {
    return readAll().find((r) => r.requestCode === requestCode) ?? null;
  },

  async listRequests() {
    return readAll();
  },
};

/**
 * Next request code in the existing LLQ-YYYY-NNN series.
 *
 * Reuses the convention already used by generateLeadId and the quote tracking
 * UI rather than minting a second identifier scheme. The sequence is per
 * browser, so it is a customer-facing reference, not a global key — the
 * server's own lead id remains the system of record.
 */
export async function nextRequestCode(): Promise<string> {
  const prefix = `LLQ-${new Date().getFullYear()}-`;
  const highest = (await implementationRequestRepository.listRequests())
    .map((r) => r.requestCode)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number.parseInt(code.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);

  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}
