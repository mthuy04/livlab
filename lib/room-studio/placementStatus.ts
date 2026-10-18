/**
 * One word for where a placement stands, read off the Technical Advisor.
 *
 * The advisor already measures every rule with rotation applied — bounds,
 * overlaps, mounting surface, front clearance. This reduces its findings for
 * one instance to the single state its outline shows while it is positioned,
 * worst first. Missing data never colours anything: "we could not check" is
 * not "it does not fit", and the panel says the former in words.
 */

import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';

export type PlacementStatus = 'VALID' | 'CLEARANCE_WARNING' | 'COLLISION' | 'OUTSIDE_ROOM' | 'UNSUPPORTED_SURFACE';

const RANK: Record<PlacementStatus, number> = {
  VALID: 0,
  CLEARANCE_WARNING: 1,
  UNSUPPORTED_SURFACE: 2,
  COLLISION: 3,
  OUTSIDE_ROOM: 4,
};

const FROM_ISSUE: Record<NonNullable<TechnicalValidationResult['placementIssue']>, PlacementStatus> = {
  OUTSIDE_ROOM: 'OUTSIDE_ROOM',
  COLLISION: 'COLLISION',
  UNSUPPORTED_SURFACE: 'UNSUPPORTED_SURFACE',
  CLEARANCE: 'CLEARANCE_WARNING',
};

export const PLACEMENT_STATUS_COLOR: Record<PlacementStatus, string> = {
  VALID: '#2F9E6B',
  CLEARANCE_WARNING: '#D99A1E',
  COLLISION: '#D2463C',
  OUTSIDE_ROOM: '#D2463C',
  UNSUPPORTED_SURFACE: '#D2463C',
};

export const PLACEMENT_STATUS_LABEL: Record<PlacementStatus, string> = {
  VALID: 'Đặt hợp lệ',
  CLEARANCE_WARNING: 'Đặt được, khoảng trống còn hẹp',
  COLLISION: 'Đang chồng lên sản phẩm khác',
  OUTSIDE_ROOM: 'Vượt ra ngoài phòng',
  UNSUPPORTED_SURFACE: 'Không nằm trên bề mặt lắp đặt',
};

export function placementStatusByInstance(
  findings: TechnicalValidationResult[],
  instanceIds: string[]
): Record<string, PlacementStatus> {
  const out: Record<string, PlacementStatus> = {};
  for (const id of instanceIds) out[id] = 'VALID';
  for (const finding of findings) {
    if (!finding.placementIssue) continue;
    const status = FROM_ISSUE[finding.placementIssue];
    for (const id of finding.affectedInstanceIds) {
      if (id in out && RANK[status] > RANK[out[id]]) out[id] = status;
    }
  }
  return out;
}
