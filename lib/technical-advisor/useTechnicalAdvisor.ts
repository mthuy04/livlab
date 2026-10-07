'use client';

/**
 * Runs the Technical Advisor over live Room Studio state.
 *
 * Validation is cheap — bounding boxes over a handful of products — but it does
 * not need to run on every pointer move during a drag, so the inputs are
 * debounced. The result is that findings settle a fraction of a second after
 * the customer stops moving something, which is exactly when they would look.
 *
 * `useDeferredValue` handles the debounce without a hand-rolled timer: React
 * keeps showing the previous findings while a new set is computed, so dragging
 * never stutters on validation.
 */

import { useDeferredValue, useMemo } from 'react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import { buildEntries, runTechnicalAdvisor } from './engine';
import type { TechnicalValidationResult, UtilityPoint } from './types';

export function useTechnicalAdvisor(params: {
  dimensions: RoomDimensions;
  placedViews: PlacedProductView[];
  utilityPoints: UtilityPoint[];
}): TechnicalValidationResult[] {
  const { dimensions, placedViews, utilityPoints } = params;

  // A compact signature of everything the rules actually read. Deferring this
  // rather than the arrays themselves means validation re-runs when a product
  // genuinely moves, not merely when React re-renders with new array identities.
  const signature = useMemo(
    () =>
      JSON.stringify({
        d: [dimensions.length, dimensions.width, dimensions.height],
        p: placedViews.map(({ placed }) => [
          placed.instanceId,
          placed.productId,
          placed.position.map((n) => Math.round(n * 1000)),
          Math.round(placed.rotationY * 1000),
          placed.placementType,
          placed.wall,
        ]),
        u: utilityPoints.map((point) => [point.id, point.type, point.position.map((n) => Math.round(n * 1000))]),
      }),
    [dimensions, placedViews, utilityPoints]
  );

  const deferredSignature = useDeferredValue(signature);

  return useMemo(
    () =>
      runTechnicalAdvisor({
        room: dimensions,
        entries: buildEntries(placedViews),
        utilityPoints,
      }),
    // Recompute only when the deferred signature changes. The other values are
    // read through the closure and are consistent with it by construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredSignature]
  );
}
