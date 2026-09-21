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
import { getMaterialById } from './materials';
import type { RoomState } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import type { PlacedProductView } from './useRoomStudio';
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
 * The basic deterministic checks Room Studio already performs today.
 *
 * This is the slot the future Technical Advisor plugs into: once
 * checkClearance / checkDoorCollision / checkPlumbingCompatibility /
 * checkInstallationSurface in placementRules.ts return real findings, map them
 * here and the Expert quotes them without any prompt or UI change.
 */
function buildValidationResults(
  state: RoomState,
  placedViews: PlacedProductView[]
): ExpertValidationResult[] {
  const results: ExpertValidationResult[] = [];

  const floorArea = getFloorArea(state.dimensions);
  if (placedViews.length > 0 && floorArea > 0) {
    // Purely geometric: sum of stated footprints against the floor. No plumbing
    // or clearance standards are implied.
    const footprint = placedViews.reduce((sum, { product }) => {
      if (product.width === undefined || product.depth === undefined) return sum;
      return sum + product.width * product.depth;
    }, 0);
    if (footprint > floorArea * 0.5) {
      results.push({
        type: 'floor-occupancy',
        severity: 'warning',
        message: `Tổng diện tích chiếm sàn của các sản phẩm đã chiếm hơn một nửa diện tích phòng (${floorArea.toFixed(1)} m²). Cần kiểm tra lại lối đi.`,
        source: 'roomGeometry',
      });
    }
  }

  const unpriced = placedViews.filter(({ product }) => !product.priceMin && !product.priceMax);
  if (unpriced.length > 0) {
    results.push({
      type: 'missing-price',
      severity: 'info',
      message: `${unpriced.length} sản phẩm trong phòng chưa có giá tham khảo trong dữ liệu LivLab.`,
      source: 'budgetCalculator',
    });
  }

  return results;
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
      floorMaterial: getMaterialById(state.selectedMaterials.floor).name,
      wallMaterial: getMaterialById(state.selectedMaterials.walls).name,
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
    validationResults: buildValidationResults(state, placedViews),
  };
}
