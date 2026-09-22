'use client';

/**
 * Projects live Room Studio state into a serializable handoff snapshot.
 *
 * Pure, and deliberately conservative: it copies what LivLab actually knows and
 * says nothing about what it does not. A missing price stays missing rather
 * than becoming 0, because a showroom reading "0đ" would treat it as a quote.
 *
 * Mirrors the shape of expertContextBuilder — same source data, different
 * consumer. It is a separate projection because the two have different rules:
 * the Expert gets what a model needs to reason, a showroom gets what a person
 * needs to act, and neither should drift into the other.
 */

import { getFloorArea } from '@/lib/room-studio/roomGeometry';
import { describeSurfaceStyle } from '@/lib/room-studio/materials';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import type {
  BudgetSnapshot,
  CustomerContact,
  HumanHandoffPackage,
  ImplementationRequestType,
  ProductSnapshot,
  RoomSnapshot,
  TechnicalFindingSnapshot,
} from './types';

export interface HandoffInput {
  requestType: ImplementationRequestType;
  customerContact: CustomerContact;
  state: RoomState;
  placedViews: PlacedProductView[];
  budget: BudgetEstimate;
  findings: TechnicalValidationResult[];
}

function buildRoomSnapshot(state: RoomState): RoomSnapshot {
  const utilityPoints = state.utilityPoints ?? [];
  return {
    length: state.dimensions.length,
    width: state.dimensions.width,
    height: state.dimensions.height,
    floorAreaM2: Number(getFloorArea(state.dimensions).toFixed(2)),
    floorFinish: describeSurfaceStyle(state.surfaceStyles.floor),
    wallFinish: describeSurfaceStyle(state.surfaceStyles.walls),
    hasReferencePhoto: Boolean(state.roomContextImage),
    // Absent rather than 0: "chưa khai báo" and "khai báo là không có" are
    // different answers, and only the customer can give the second one.
    declaredUtilityPoints: utilityPoints.length > 0 ? utilityPoints.length : undefined,
  };
}

/**
 * Collapses placed instances into order lines. Two identical basins standing in
 * the room are one line with quantity 2 — which is how a showroom quotes them.
 */
function buildProductSnapshots(placedViews: PlacedProductView[]): ProductSnapshot[] {
  const byProduct = new Map<string, ProductSnapshot>();

  placedViews.forEach(({ product }) => {
    const existing = byProduct.get(product.id);
    if (existing) {
      existing.quantity += 1;
      return;
    }
    byProduct.set(product.id, {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.normalizedCategory,
      quantity: 1,
      referencePriceMin: product.priceMin,
      referencePriceMax: product.priceMax,
    });
  });

  return [...byProduct.values()];
}

function buildBudgetSnapshot(budget: BudgetEstimate, targetBudget?: number): BudgetSnapshot {
  return {
    targetBudget,
    estimatedProductTotalMin: budget.min,
    estimatedProductTotalMax: budget.max,
    itemCount: budget.itemCount,
    unpricedCount: budget.unpricedCount,
  };
}

/**
 * Reduces engine findings to what a human can act on.
 *
 * Only VERIFY and OPTIMIZE survive: a SUITABLE result is LivLab confirming
 * something is fine, which is noise in a request whose purpose is "please look
 * at this". Internal ids, rule names and confidence bands are dropped — they
 * are debugging data, not something to hand a technician.
 */
export function buildTechnicalSnapshots(
  findings: TechnicalValidationResult[],
  productNameByInstance: Map<string, string>
): TechnicalFindingSnapshot[] {
  return findings
    .filter((f) => f.severity === 'VERIFY' || f.severity === 'OPTIMIZE')
    .map((f) => ({
      severity: f.severity,
      title: f.title,
      message: f.message,
      affectedProduct: f.affectedInstanceIds
        .map((id) => productNameByInstance.get(id))
        .find((name): name is string => Boolean(name)),
      requiresHumanVerification: f.requiresHumanVerification,
    }));
}

export function buildHandoffPackage(input: HandoffInput): HumanHandoffPackage {
  const { requestType, customerContact, state, placedViews, budget, findings } = input;

  const productNameByInstance = new Map(
    placedViews.map(({ placed, product }) => [placed.instanceId, product.name])
  );

  const products = buildProductSnapshots(placedViews);

  return {
    requestType,
    customerContact,
    room: buildRoomSnapshot(state),
    products,
    // A budget block with no products would be a row of zeroes pretending to be
    // an estimate.
    budget: products.length > 0 ? buildBudgetSnapshot(budget, state.targetBudget) : undefined,
    // Findings travel with every request type, not just technical ones: a
    // showroom quoting a basin should see that its drain placement is unverified.
    technicalFindings: buildTechnicalSnapshots(findings, productNameByInstance),
    roomImageRef: state.roomContextImage ? 'AVAILABLE_ON_REQUEST' : undefined,
    createdAt: new Date().toISOString(),
  };
}
