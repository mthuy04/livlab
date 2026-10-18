/**
 * Rule 2 — are two products occupying the same space?
 *
 * The hard part is not detecting overlap, it is *not* reporting the overlaps
 * that are supposed to be there. A basin sits on a vanity; a faucet meets the
 * basin; a shower column touches its wall. A naive test fires on all of those
 * and the panel becomes noise the customer learns to ignore.
 *
 * Two guards keep false positives down:
 *   1. the interpenetration must exceed `collisionEpsilonM` on every axis, so
 *      touching and near-touching are both fine;
 *   2. the shared footprint must be a meaningful fraction of the smaller
 *      product, so a corner clip is not treated like a stacked pair.
 *
 * Bounding boxes only — no physics engine. At the handful of products a
 * bathroom holds, the pairwise scan is trivial.
 */

import { technicalRulesConfig } from '../config';
import { getOverlap, getWorldAabb, type Aabb } from '../geometry';
import { basinCounterExtent } from '@/lib/room-studio/environment';
import type { TechnicalProductEntry, TechnicalRule, TechnicalValidationResult } from '../types';

function boxFor(entry: TechnicalProductEntry, counterSupport: boolean): Aabb | null {
  const { metadata, placed } = entry;
  if (metadata.width === undefined || metadata.depth === undefined || metadata.height === undefined) {
    return null;
  }
  // A countertop basin over its drawn counter occupies the counter too: from
  // the cabinet's underside to the basin's rim, the counter's width and depth.
  if (counterSupport && placed.placementType === 'counter') {
    const c = basinCounterExtent({ width: metadata.width, depth: metadata.depth, height: metadata.height });
    const top = placed.position[1] + metadata.height / 2;
    const bottom = placed.position[1] - metadata.height / 2 - c.below;
    return getWorldAabb({
      position: [placed.position[0], (top + bottom) / 2, placed.position[2]],
      width: c.width,
      depth: c.depth,
      height: top - bottom,
      rotationY: placed.rotationY,
    });
  }
  return getWorldAabb({
    position: placed.position,
    width: metadata.width,
    depth: metadata.depth,
    height: metadata.height,
    rotationY: placed.rotationY,
  });
}

export const collisionRule: TechnicalRule = {
  id: 'collision',
  category: 'COLLISION',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const { collisionEpsilonM, collisionMinOverlapRatio } = technicalRulesConfig;

    const measured = context.entries
      .map((entry) => ({ entry, box: boxFor(entry, Boolean(context.counterSupport)) }))
      .filter((m): m is { entry: TechnicalProductEntry; box: Aabb } => m.box !== null);

    for (let i = 0; i < measured.length; i++) {
      for (let j = i + 1; j < measured.length; j++) {
        const a = measured[i];
        const b = measured[j];
        const overlap = getOverlap(a.box, b.box);

        if (overlap.x <= collisionEpsilonM || overlap.y <= collisionEpsilonM || overlap.z <= collisionEpsilonM) {
          continue;
        }

        // Compare the shared floor area against the smaller product's own
        // footprint, so "clipping a corner" and "sitting inside each other"
        // are not treated the same.
        const sharedArea = overlap.x * overlap.z;
        const areaA = (a.box.maxX - a.box.minX) * (a.box.maxZ - a.box.minZ);
        const areaB = (b.box.maxX - b.box.minX) * (b.box.maxZ - b.box.minZ);
        const smaller = Math.min(areaA, areaB);
        if (smaller <= 0 || sharedArea / smaller < collisionMinOverlapRatio) continue;

        results.push({
          id: `collision:${a.entry.placed.instanceId}:${b.entry.placed.instanceId}`,
          ruleId: 'collision',
          category: 'COLLISION',
          severity: 'VERIFY',
          placementIssue: 'COLLISION',
          title: 'Hai sản phẩm đang chồng lên nhau',
          message: `${a.entry.product.name} và ${b.entry.product.name} đang chiếm cùng một khoảng không gian. Bạn nên tách hai sản phẩm ra để kiểm tra lại bố trí.`,
          affectedInstanceIds: [a.entry.placed.instanceId, b.entry.placed.instanceId],
          dataSource: 'ROOM_GEOMETRY',
          confidence: 'HIGH',
          requiresHumanVerification: false,
          suggestedAction: 'Di chuyển một trong hai sản phẩm sang vị trí khác.',
        });
      }
    }

    // Only say "no overlaps" when there was actually something to compare.
    if (results.length === 0 && measured.length >= 2) {
      results.push({
        id: 'collision:none',
        ruleId: 'collision',
        category: 'COLLISION',
        severity: 'SUITABLE',
        title: 'Không có sản phẩm chồng nhau',
        message: 'Các sản phẩm trong phòng hiện không chiếm cùng một vị trí.',
        affectedInstanceIds: [],
        dataSource: 'ROOM_GEOMETRY',
        confidence: 'HIGH',
        requiresHumanVerification: false,
      });
    }

    const unmeasured = context.entries.length - measured.length;
    if (unmeasured > 0) {
      results.push({
        id: 'collision:unmeasured',
        ruleId: 'collision',
        category: 'COLLISION',
        severity: 'VERIFY',
        title: 'Chưa kiểm tra được va chạm cho một số sản phẩm',
        message: `${unmeasured} sản phẩm chưa có đủ kích thước trong dữ liệu LivLab, nên chưa thể kiểm tra chồng lấn với các sản phẩm khác.`,
        affectedInstanceIds: [],
        dataSource: 'UNKNOWN',
        confidence: 'LOW',
        requiresHumanVerification: true,
        reason: 'MISSING_DATA',
      });
    }

    return results;
  },
};
