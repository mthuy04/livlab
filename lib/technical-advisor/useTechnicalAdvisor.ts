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

const EMPTY_POINTS: UtilityPoint[] = [];

export function useTechnicalAdvisor(params: {
  architecture?: import('./types').TechnicalContext['architecture'];
  elements?: import('./types').TechnicalContext['elements'];
  dimensions: RoomDimensions;
  placedViews: PlacedProductView[];
  utilityPoints?: UtilityPoint[];
  /** The room draws a counter under countertop products. */
  counterSupport?: boolean;
}): TechnicalValidationResult[] {
  const { dimensions, architecture, elements, placedViews, utilityPoints = EMPTY_POINTS, counterSupport = false } = params;
  const input = useMemo(() => ({ dimensions, architecture, elements, placedViews, utilityPoints, counterSupport }),
    [dimensions, architecture, elements, placedViews, utilityPoints, counterSupport]);
  const deferred = useDeferredValue(input);
  return useMemo(() => runTechnicalAdvisor({
    room: deferred.dimensions, architecture: deferred.architecture, elements: deferred.elements, entries: buildEntries(deferred.placedViews),
    utilityPoints: deferred.utilityPoints, counterSupport: deferred.counterSupport,
  }), [deferred]);
}
