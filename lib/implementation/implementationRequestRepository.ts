'use client';

/**
 * Storage for implementation requests.
 *
 * Optional on-device receipt cache. Requests are delivered to the real backend
 * by submitImplementationRequest and their full snapshot is persisted in
 * QuoteLead.contextJson. This cache is never used for public status lookup or
 * as proof that a submission reached LivLab.
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
