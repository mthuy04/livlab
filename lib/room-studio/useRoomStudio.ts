'use client';

/**
 * The one stateful entry point for Room Studio.
 *
 * Deliberately built on React state + the pure operations in roomState.ts
 * rather than introducing Zustand/Redux: the studio is a single page with one
 * owner, so another state library would be dependency weight for no benefit.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomDimensions } from './roomGeometry';
import type { SurfaceId, SurfaceStyle } from './materials';
import type { RoomStudioProduct } from './productAdapter';
import { loadRoomStudioProducts } from './productAdapter';
import { roomStateRepository } from './roomStateRepository';
import { calculateRoomBudget, type BudgetEstimate } from './budgetCalculator';
import { getRealWorldSize } from './assetResolver';
import { clampToRoom, type Vec3 } from './placementRules';
import * as ops from './roomState';
import type { PlacedProduct, RoomState } from './roomState';
import type { UtilityPoint } from '@/lib/technical-advisor/types';

const SAVE_DEBOUNCE_MS = 400;

export interface PlacedProductView {
  placed: PlacedProduct;
  product: RoomStudioProduct;
}

export function useRoomStudio() {
  const [state, setState] = useState<RoomState>(ops.createInitialRoomState);
  const [products, setProducts] = useState<RoomStudioProduct[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load catalogue + any saved room in parallel; neither blocks the other.
  useEffect(() => {
    let cancelled = false;

    loadRoomStudioProducts()
      .then((loaded) => {
        if (!cancelled) setProducts(loaded);
      })
      .catch((err) => {
        console.error('[Room Studio] product load failed:', err);
        if (!cancelled) setLoadError('Không tải được dữ liệu sản phẩm. Vui lòng tải lại trang.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });

    roomStateRepository
      .load()
      .then((saved) => {
        if (!cancelled && saved) setState(saved);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist through the repository, debounced so dragging a product does not
  // write to storage on every pointer move.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void roomStateRepository.save(state);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, isHydrated]);

  const productById = useMemo(() => {
    const map = new Map<string, RoomStudioProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const resolveProduct = useCallback((id: string) => productById.get(id), [productById]);

  /**
   * Placed instances whose product still exists in the catalogue. An instance
   * pointing at a removed SKU is skipped rather than rendered as a blank — the
   * snapshot keeps it so it can come back if the SKU returns.
   */
  const placedViews = useMemo<PlacedProductView[]>(() => {
    return state.placedProducts
      .map((placed) => {
        const product = productById.get(placed.productId);
        return product ? { placed, product } : null;
      })
      .filter((v): v is PlacedProductView => v !== null);
  }, [state.placedProducts, productById]);

  const budget: BudgetEstimate = useMemo(
    () => calculateRoomBudget(placedViews.map(({ product }) => ({ product, quantity: 1 }))),
    [placedViews]
  );

  const selected = useMemo(
    () => placedViews.find((v) => v.placed.instanceId === selectedInstanceId) ?? null,
    [placedViews, selectedInstanceId]
  );

  // ─── Actions ───────────────────────────────────────────────────────────────

  const setDimensions = useCallback(
    (dimensions: RoomDimensions) => {
      setState((prev) => ops.reflowPlacements(ops.setDimensions(prev, dimensions), resolveProduct));
    },
    [resolveProduct]
  );

  /** Patch one axis (material / color / finish) of a surface's finish. */
  const setSurfaceStyle = useCallback((surface: SurfaceId, patch: Partial<SurfaceStyle>) => {
    setState((prev) => ops.setSurfaceStyle(prev, surface, patch));
  }, []);

  /** Adds a product and returns the id of the instance that was created. */
  const addProduct = useCallback((product: RoomStudioProduct, atPoint?: Vec3) => {
    const instanceId = ops.createInstanceId(product.id);
    setState((prev) => ops.addProduct(prev, product, { instanceId, atPoint }));
    setSelectedInstanceId(instanceId);
    return instanceId;
  }, []);

  const removeProduct = useCallback((instanceId: string) => {
    setState((prev) => ops.removeProduct(prev, instanceId));
    setSelectedInstanceId((prev) => (prev === instanceId ? null : prev));
  }, []);

  const duplicateProduct = useCallback((instanceId: string) => {
    const newInstanceId = ops.createInstanceId(instanceId);
    setState((prev) => ops.duplicateProduct(prev, instanceId, newInstanceId));
    setSelectedInstanceId(newInstanceId);
  }, []);

  /** Moves an instance, clamped to the room so it can never leave the space. */
  const moveProduct = useCallback(
    (instanceId: string, position: Vec3) => {
      setState((prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        const product = placed ? resolveProduct(placed.productId) : undefined;
        if (!placed || !product) return prev;
        const clamped = clampToRoom(position, {
          dimensions: prev.dimensions,
          size: getRealWorldSize(product),
          placementType: placed.placementType,
          wall: placed.wall,
        });
        return ops.updatePlacement(prev, instanceId, { position: clamped });
      });
    },
    [resolveProduct]
  );

  const rotateProduct = useCallback((instanceId: string, deltaRadians: number) => {
    setState((prev) => {
      const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
      if (!placed) return prev;
      return ops.updatePlacement(prev, instanceId, { rotationY: placed.rotationY + deltaRadians });
    });
  }, []);

  const clearProducts = useCallback(() => {
    setState(ops.clearProducts);
    setSelectedInstanceId(null);
  }, []);

  const setRoomContextImage = useCallback((image?: string, label?: string) => {
    setState((prev) => ops.setRoomContextImage(prev, image, label));
  }, []);

  const setTargetBudget = useCallback((targetBudget?: number) => {
    setState((prev) => ops.setTargetBudget(prev, targetBudget));
  }, []);

  const setStylePreferences = useCallback((styles: string[]) => {
    setState((prev) => ops.setStylePreferences(prev, styles));
  }, []);

  const addUtilityPoint = useCallback((point: UtilityPoint) => {
    setState((prev) => ops.addUtilityPoint(prev, point));
  }, []);

  const removeUtilityPoint = useCallback((id: string) => {
    setState((prev) => ops.removeUtilityPoint(prev, id));
  }, []);

  const resetRoom = useCallback(() => {
    setState(ops.createInitialRoomState());
    setSelectedInstanceId(null);
    void roomStateRepository.clear();
  }, []);

  return {
    state,
    products,
    placedViews,
    selected,
    selectedInstanceId,
    budget,
    isLoadingProducts,
    isHydrated,
    loadError,
    setSelectedInstanceId,
    setDimensions,
    setSurfaceStyle,
    addProduct,
    removeProduct,
    duplicateProduct,
    moveProduct,
    rotateProduct,
    clearProducts,
    setRoomContextImage,
    setTargetBudget,
    setStylePreferences,
    addUtilityPoint,
    removeUtilityPoint,
    resetRoom,
  };
}
