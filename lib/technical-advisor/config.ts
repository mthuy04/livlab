/**
 * Every tolerance and heuristic threshold the Technical Advisor uses, in one
 * place, each one documented with where the number came from.
 *
 * This file exists so that no component or rule ever holds a bare magic number,
 * and so a reviewer can audit in one screen exactly which figures are LivLab
 * heuristics rather than manufacturer or building-code values.
 *
 * NONE of these are building-code figures. LivLab does not claim code
 * compliance, and no rule may present these as standards.
 */

export const technicalRulesConfig = {
  /**
   * Slack before a product is reported as breaching the room boundary.
   * Placement already clamps products to the room using an axis-aligned box;
   * the bounds rule re-checks with rotation applied, which can legitimately
   * differ by a few millimetres. This absorbs that difference so a product the
   * customer never moved does not suddenly light up as a problem.
   */
  roomBoundsToleranceM: 0.02,

  /**
   * Minimum interpenetration before two products count as colliding.
   * Products routinely touch by design — a basin sits on a vanity, a faucet
   * meets the basin — so a zero-tolerance test would be noise. 4cm of genuine
   * overlap on every axis is well past incidental contact.
   */
  collisionEpsilonM: 0.04,

  /**
   * Overlap below this fraction of the smaller product's footprint is ignored,
   * for the same reason: adjacent items brushing each other are not a fault.
   */
  collisionMinOverlapRatio: 0.15,

  /**
   * How far a wall-mounted product may sit from its wall before LivLab says it
   * looks detached. Generous, because a product's declared depth and its model
   * bounds do not always agree.
   */
  wallAdherenceToleranceM: 0.12,

  /**
   * How far a floor product's base may sit above the floor before it reads as
   * floating.
   */
  floorAdherenceToleranceM: 0.05,

  /**
   * A declared utility point within this distance of a product that needs it
   * counts as usable without comment.
   */
  utilityPointNearM: 0.6,

  /**
   * Beyond `utilityPointNearM` but within this, LivLab flags it as worth
   * checking rather than fine. Past this it is still only "needs a technician",
   * never "impossible" — re-routing is normal work.
   */
  utilityPointFarM: 1.5,

  /**
   * Cap on findings surfaced at room level, so the panel stays readable.
   * Findings are sorted by severity before truncation.
   */
  maxRoomFindings: 8,

  /**
   * Debounce before re-running validation while a product is being dragged.
   * The engine is cheap (bounding boxes over a handful of items), but there is
   * no reason to recompute on every pointer move.
   */
  revalidateDebounceMs: 250,
} as const;

/** Shared disclaimer. Shown once, in the Technical Advisor panel footer. */
export const TECHNICAL_DISCLAIMER =
  'Gợi ý kỹ thuật của LivLab hỗ trợ lựa chọn sản phẩm và không thay thế khảo sát, lắp đặt thực tế của kỹ thuật viên.';
