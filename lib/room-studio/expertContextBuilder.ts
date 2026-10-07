'use client';

/**
 * Projects live Room Studio state into the narrow contract LivLab Expert
 * consumes.
 *
 * Two rules govern what crosses this boundary:
 *
 *  1. Send only what a product advisor needs to answer. No auth data, no user
 *     id, no room photo bytes — just the fact that a photo exists.
 *  2. Unknown stays unknown. Dimensions are forwarded ONLY when the catalogue
 *     states them; the category fallback sizes the 3D scene uses to place an
 *     un-modelled product are never passed off as specifications.
 *
 * All numbers here are already computed deterministically elsewhere
 * (budgetCalculator, getBudgetFit). The Expert interprets them; it never
 * recalculates them.
 */

import type { QuoteItem } from '@/lib/types';
import { getBudgetFit } from '@/lib/budget/getBudgetFit';
import type { BudgetEstimate } from './budgetCalculator';
import { getFloorArea } from './roomGeometry';
import { describeSurfaceStyle } from './materials';
import type { RoomState } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import type { PlacedProductView } from './useRoomStudio';
import { buildEntries, runTechnicalAdvisor, topFindings } from '@/lib/technical-advisor/engine';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import type {
  ExpertPlacedProduct,
  ExpertProductRef,
  ExpertValidationResult,
  LivLabExpertContext,
} from '@/lib/ai/expert/expertContext';

const toMm = (m?: number) => (m === undefined ? undefined : Math.round(m * 1000));

function toProductRef(product: RoomStudioProduct): ExpertProductRef {
  const source = product.source;
  const specs: Record<string, string> = {};
  const put = (key: string, value?: string) => {
    if (value && value.trim()) specs[key] = value.trim();
  };
  put('Chất liệu', source?.material);
  put('Bề mặt', source?.finish);
  put('Màu', source?.color);
  put('Kích thước công bố', product.dimensionsLabel);
  put('Kiểu lắp đặt', source?.installationType);
  put('Bảo hành', source?.warranty);
  put('Xuất xứ', source?.origin);

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.normalizedCategory,
    priceMin: product.priceMin,
    priceMax: product.priceMax,
    // product.width/depth/height are undefined unless the catalogue stated them.
    widthMm: toMm(product.width),
    depthMm: toMm(product.depth),
    heightMm: toMm(product.height),
    knownSpecifications: Object.keys(specs).length > 0 ? specs : undefined,
    imageUrl: product.imageUrl,
    slug: product.slug,
  };
}

/**
 * Projects Technical Advisor findings into the Expert's context.
 *
 * This is where the deterministic layer meets the AI layer, and the direction
 * is one-way: findings flow in, and the Expert may explain them. No Three.js
 * object, no geometry and no raw room state crosses this boundary — only the
 * structured result the engine already produced.
 */
function toExpertValidationResults(
  results: TechnicalValidationResult[],
  nameByInstanceId: Map<string, string>
): ExpertValidationResult[] {
  return results.map((result) => ({
    category: result.category,
    severity: result.severity,
    title: result.title,
    message: result.message,
    productName: result.affectedInstanceIds
      .map((id) => nameByInstanceId.get(id))
      .filter((n): n is string => Boolean(n))[0],
    source: result.dataSource,
    requiresHumanVerification: result.requiresHumanVerification,
  }));
}

export function buildExpertContext(params: {
  state: RoomState;
  placedViews: PlacedProductView[];
  selected: PlacedProductView | null;
  budget: BudgetEstimate;
  quoteItems: QuoteItem[];
}): LivLabExpertContext {
  const { state, placedViews, selected, budget, quoteItems } = params;

  const placedProducts: ExpertPlacedProduct[] = placedViews.map(({ placed, product }) => ({
    ...toProductRef(product),
    instanceId: placed.instanceId,
    placementType: placed.placementType,
  }));

  const targetBudget = state.targetBudget;
  const fit = getBudgetFit({ total: budget.min, budgetMax: targetBudget ?? null });

  return {
    room: {
      length: state.dimensions.length,
      width: state.dimensions.width,
      height: state.dimensions.height,
      floorAreaM2: getFloorArea(state.dimensions),
      floorMaterial: describeSurfaceStyle(state.surfaceStyles.floor),
      wallMaterial: describeSurfaceStyle(state.surfaceStyles.walls),
      hasReferencePhoto: Boolean(state.roomContextImage),
    },
    selectedProduct: selected ? toProductRef(selected.product) : undefined,
    placedProducts,
    budget: {
      targetBudget,
      estimatedTotalMin: budget.min,
      estimatedTotalMax: budget.max,
      itemCount: budget.itemCount,
      unpricedCount: budget.unpricedCount,
      remainingBudget: targetBudget === undefined ? undefined : targetBudget - budget.min,
      amountOverBudget:
        targetBudget === undefined ? undefined : Math.max(0, budget.min - targetBudget),
      fitStatus: targetBudget === undefined ? undefined : fit.status,
      fitLabel: targetBudget === undefined ? undefined : fit.label,
    },
    stylePreferences: state.stylePreferences,
    quoteBasket: quoteItems.slice(0, 12).map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
    })),
    validationResults: toExpertValidationResults(
      // Capped: the Expert needs the actionable findings, not all of them.
      topFindings(
        runTechnicalAdvisor({
          room: state.dimensions,
          entries: buildEntries(placedViews),
          utilityPoints: state.utilityPoints ?? [],
        })
      ),
      new Map(placedViews.map(({ placed, product }) => [placed.instanceId, product.name]))
    ),
  };
}
