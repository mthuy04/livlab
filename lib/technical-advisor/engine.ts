/**
 * The Technical Advisor engine: run every registered rule, sort, summarise.
 *
 * No AI anywhere in this file or anything it imports. That is the property the
 * whole feature rests on — the engine produces the same findings whether or not
 * Gemini is reachable, and LivLab Expert consumes those findings rather than
 * producing them.
 *
 * Adding a rule means appending to TECHNICAL_RULES. A rule that throws is
 * isolated so one bad rule cannot take down the panel.
 */

import { technicalRulesConfig } from './config';
import { getProductTechnicalMetadata } from './productTechnicalMetadata';
import { clearanceRule } from './rules/clearanceRule';
import { collisionRule } from './rules/collisionRule';
import { placementSurfaceRule } from './rules/placementSurfaceRule';
import { plumbingPointRule } from './rules/plumbingPointRule';
import { roomBoundsRule } from './rules/roomBoundsRule';
import { technicalDataRule } from './rules/technicalDataRule';
import type {
  TechnicalContext,
  TechnicalProductEntry,
  TechnicalRule,
  TechnicalSeverity,
  TechnicalSummary,
  TechnicalValidationResult,
} from './types';

/** Registry. Order here is the order findings are produced, before sorting. */
export const TECHNICAL_RULES: TechnicalRule[] = [
  technicalDataRule,
  roomBoundsRule,
  placementSurfaceRule,
  collisionRule,
  clearanceRule,
  plumbingPointRule,
];

/** Most actionable first: problems, then suggestions, then confirmations. */
const SEVERITY_ORDER: Record<TechnicalSeverity, number> = {
  VERIFY: 0,
  OPTIMIZE: 1,
  SUITABLE: 2,
};

export function runTechnicalAdvisor(context: TechnicalContext): TechnicalValidationResult[] {
  const focused: TechnicalContext = context.focusInstanceId
    ? { ...context, entries: context.entries.filter((e) => e.placed.instanceId === context.focusInstanceId) }
    : context;

  const results: TechnicalValidationResult[] = [];

  for (const rule of TECHNICAL_RULES) {
    try {
      // Collision needs every product in the room to be meaningful, so it always
      // sees the full set even when the panel is focused on one product; the
      // caller filters its findings by affectedInstanceIds afterwards.
      results.push(...rule.run(rule.id === 'collision' ? context : focused));
    } catch (error) {
      console.error(`[Technical Advisor] rule "${rule.id}" failed`, error);
    }
  }

  return results.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Findings that mention a particular placed product. */
export function filterForInstance(
  results: TechnicalValidationResult[],
  instanceId: string
): TechnicalValidationResult[] {
  return results.filter((r) => r.affectedInstanceIds.includes(instanceId));
}

export function summarise(results: TechnicalValidationResult[]): TechnicalSummary {
  const summary: TechnicalSummary = { suitable: 0, optimize: 0, verify: 0, total: results.length };
  for (const result of results) {
    if (result.severity === 'SUITABLE') summary.suitable += 1;
    else if (result.severity === 'OPTIMIZE') summary.optimize += 1;
    else summary.verify += 1;
  }
  return summary;
}

/** Caps what the room panel shows, keeping the most actionable findings. */
export function topFindings(results: TechnicalValidationResult[]): TechnicalValidationResult[] {
  return results.slice(0, technicalRulesConfig.maxRoomFindings);
}

/** Builds the per-product entries the engine consumes. */
export function buildEntries(
  placedViews: { placed: TechnicalProductEntry['placed']; product: TechnicalProductEntry['product'] }[]
): TechnicalProductEntry[] {
  return placedViews.map(({ placed, product }) => ({
    placed,
    product,
    metadata: getProductTechnicalMetadata(product),
  }));
}
