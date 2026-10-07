import type { LeadStage, LeadStatus } from '@prisma/client';

/**
 * Bridges the legacy LeadStatus enum and the richer LeadStage pipeline.
 *
 * Both exist on purpose. LeadStatus is what production has written for every
 * lead so far and what existing code still reads, so it is not renamed or
 * extended. LeadStage is the pipeline Showroom V2 works in, and it is nullable
 * precisely so no production row needs backfilling: a lead with no stage is
 * read through the deterministic mapping below.
 */

/** Legacy status → stage. QUOTED means a quote went out, hence QUOTE_SENT. */
const STAGE_FROM_STATUS: Record<LeadStatus, LeadStage> = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUOTED: 'QUOTE_SENT',
  WON: 'WON',
  LOST: 'LOST',
};

/**
 * The stage to display. Stored stage wins; otherwise derive from legacy status.
 */
export function resolveStage(lead: { stage: LeadStage | null; status: LeadStatus }): LeadStage {
  return lead.stage ?? STAGE_FROM_STATUS[lead.status] ?? 'NEW';
}

/**
 * The legacy status to write alongside a new stage — only where the meaning is
 * unambiguous.
 *
 * QUALIFIED, QUOTING and FOLLOW_UP have no faithful legacy equivalent: forcing
 * them into CONTACTED or QUOTED would tell older screens something untrue about
 * where the lead stands. For those, `status` is left exactly as it was and
 * `stage` alone carries the detail.
 */
export function legacyStatusForStage(stage: LeadStage): LeadStatus | null {
  switch (stage) {
    case 'NEW':
      return 'NEW';
    case 'CONTACTED':
      return 'CONTACTED';
    case 'QUOTE_SENT':
      return 'QUOTED';
    case 'WON':
      return 'WON';
    case 'LOST':
      return 'LOST';
    default:
      return null;
  }
}

export const STAGE_ORDER: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTING',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'WON',
  'LOST',
];

export const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  QUALIFIED: 'Đã xác định nhu cầu',
  QUOTING: 'Đang làm báo giá',
  QUOTE_SENT: 'Đã gửi báo giá',
  FOLLOW_UP: 'Đang theo dõi',
  WON: 'Đã chốt',
  LOST: 'Mất lead',
};

/** Stages a lead can still move forward from; used to split open vs closed. */
export function isOpenStage(stage: LeadStage): boolean {
  return stage !== 'WON' && stage !== 'LOST';
}
