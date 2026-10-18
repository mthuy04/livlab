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
import { loadRoomStudioProducts, reconstructionFor, withReconstruction } from './productAdapter';
import { isPlaceable, NO_DIMENSIONS_REASON } from './productCapability';
import { roomStateRepositoryFor } from './roomStateRepository';
import { calculateRoomBudget, type BudgetEstimate } from './budgetCalculator';
import { clampToRoom, type Vec3 } from './placementRules';
import { centreYForInstallationHeight, installationHeightRange, placementContextFor } from './mounting';
import type { ArchitectureSettings, LightingPresetId } from './environment';
import { buildStarterRoom, type StarterRoomPreset, type StarterRoomResult } from './roomPresets';
import * as ops from './roomState';
import type { PlacedProduct, RoomState } from './roomState';
import type { UtilityPoint } from '@/lib/technical-advisor/types';
import type { RoomStudioCatalog, RoomStudioDemoRoom } from '@/lib/storefront/tenantExperience';

const SAVE_DEBOUNCE_MS = 400;

export interface PlacedProductView {
  placed: PlacedProduct;
  product: RoomStudioProduct;
}

/**
 * `catalog` picks the product library: LivLab's own, or the storefront's
 * catalogue. It is fixed for the life of the page — the tenant does not change
 * under an open workspace.
 */
export function useRoomStudio(catalog: RoomStudioCatalog = 'livlab', storageScope?: string) {
  const roomStateRepository = useMemo(() => roomStateRepositoryFor(storageScope), [storageScope]);
  const [state, setState] = useState<RoomState>(ops.createInitialRoomState);
  const [products, setProducts] = useState<RoomStudioProduct[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load catalogue + any saved room in parallel; neither blocks the other.
  useEffect(() => {
    let cancelled = false;

    loadRoomStudioProducts(catalog)
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
  }, [catalog, roomStateRepository]);

  // Persist through the repository, debounced so dragging a product does not
  // write to storage on every pointer move.
  //
  // `isSaved` is reported rather than a Save button offered: the room is
  // written on its own, so a button would either duplicate this or do nothing,
  // and a Save that does nothing is worse than no Save at all.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The snapshot that reached storage, so "saved" is a comparison rather than a
  // flag that something has to remember to clear on every edit.
  const [savedState, setSavedState] = useState<RoomState | null>(null);
  const isSaved = savedState === state;
  useEffect(() => {
    if (!isHydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void roomStateRepository.save(state).then(() => setSavedState(state));
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, isHydrated, roomStateRepository]);

  const productById = useMemo(() => {
    const map = new Map<string, RoomStudioProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const resolveProduct = useCallback((id: string) => productById.get(id), [productById]);

  /**
   * The product as THIS placement draws it. Identical to the catalogue record
   * unless the customer chose another model variant for this one instance —
   * the basin with its illustrative faucet — in which case the size, model
   * and wording follow the variant everywhere: scene, collisions, panel.
   */
  const productFor = useCallback(
    (placed: Pick<PlacedProduct, 'productId' | 'variant'>): RoomStudioProduct | undefined => {
      const product = productById.get(placed.productId);
      if (!product || !placed.variant || !product.reconstruction) return product;
      if (placed.variant === product.reconstruction.variant) return product;
      const model = reconstructionFor(product);
      return model ? withReconstruction(product, model, placed.variant) : product;
    },
    [productById]
  );

  /**
   * Placed instances whose product still exists in the catalogue. An instance
   * pointing at a removed SKU is skipped rather than rendered as a blank — the
   * snapshot keeps it so it can come back if the SKU returns.
   */
  const placedViews = useMemo<PlacedProductView[]>(() => {
    return state.placedProducts
      .map((placed) => {
        const product = productFor(placed);
        return product ? { placed, product } : null;
      })
      .filter((v): v is PlacedProductView => v !== null);
  }, [state.placedProducts, productFor]);

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
      setState((prev) =>
        ops.reflowPlacements(ops.setDimensions(prev, dimensions), (id) => {
          const placed = prev.placedProducts.find((p) => p.productId === id);
          return placed ? productFor(placed) : resolveProduct(id);
        })
      );
    },
    [resolveProduct, productFor]
  );

  /** Patch one axis (material / color / finish) of a surface's finish. */
  const setSurfaceStyle = useCallback((surface: SurfaceId, patch: Partial<SurfaceStyle>) => {
    setState((prev) => ops.setSurfaceStyle(prev, surface, patch));
  }, []);

  /** Adds a product and returns the id of the instance that was created. */
  /**
   * Places a product, or refuses to.
   *
   * The gate is here and not only in the library panel because three callers
   * reach this: the add button, a drop onto the canvas, and the Expert's
   * suggestions. A product without complete dimensions can only be drawn by
   * filling the missing axis from a category average, and a volume that is
   * partly measured and partly assumed looks exactly like one that is not.
   * Returning null is the honest outcome; the caller tells the customer why.
   */
  const addProduct = useCallback(
    (product: RoomStudioProduct, atPoint?: Vec3) => {
      if (!isPlaceable(product.capability)) return null;
      if (!ops.canPlaceInRoom(state, product).fits) return null;
      const instanceId = ops.createInstanceId(product.id);
      setState((prev) => ops.addProduct(prev, product, { instanceId, atPoint }));
      setSelectedInstanceId(instanceId);
      return instanceId;
    },
    [state]
  );

  /**
   * Why a product cannot be placed in the room as it is, in the customer's
   * words — or null when it can. Asked by every caller before it reports
   * the outcome of `addProduct`, so a refusal always comes with its reason.
   */
  const explainPlacement = useCallback(
    (product: RoomStudioProduct): string | null => {
      if (!isPlaceable(product.capability)) return `${product.name}: ${NO_DIMENSIONS_REASON.toLowerCase()} nên chưa đặt được vào phòng.`;
      const fit = ops.canPlaceInRoom(state, product);
      if (fit.fits) return null;
      return `${product.name} không vừa phòng hiện tại. ${fit.reason} Hãy tăng kích thước phòng hoặc chọn sản phẩm nhỏ hơn trong danh mục.`;
    },
    [state]
  );

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
        const product = placed ? productFor(placed) : undefined;
        if (!placed || !product) return prev;
        const clamped = clampToRoom(position, {
          ...placementContextFor(product, prev.dimensions, placed),
          placementType: placed.placementType,
        });
        return ops.updatePlacement(prev, instanceId, { position: clamped });
      });
    },
    [productFor]
  );

  /**
   * Turns a product, and keeps it in the room as turned. A 1.6m bath rotated
   * against a side wall would otherwise end with half of it inside the wall,
   * because its footprint along x and z just swapped.
   */
  const rotateProduct = useCallback(
    (instanceId: string, deltaRadians: number) => {
      setState((prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        const product = placed ? productFor(placed) : undefined;
        if (!placed) return prev;
        const rotationY = placed.rotationY + deltaRadians;
        if (!product) return ops.updatePlacement(prev, instanceId, { rotationY });
        const position = clampToRoom(placed.position, {
          ...placementContextFor(product, prev.dimensions, { ...placed, rotationY }),
          placementType: placed.placementType,
        });
        return ops.updatePlacement(prev, instanceId, { rotationY, position });
      });
    },
    [productFor]
  );

  /** Switches the model variant one placement draws, and re-anchors it. */
  const setPlacementVariant = useCallback(
    (instanceId: string, variant: string) => {
      setState((prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        if (!placed) return prev;
        const next = { ...placed, variant };
        const product = productFor(next);
        if (!product) return prev;
        const position = clampToRoom(placed.position, {
          ...placementContextFor(product, prev.dimensions, next),
          placementType: placed.placementType,
        });
        return ops.updatePlacement(prev, instanceId, { variant, position });
      });
    },
    [productFor]
  );

  /**
   * Sets the installation height a customer reasons in — a shower's mixer,
   * a basin's counter top — kept inside the product's own range and the room.
   */
  const setInstallationHeight = useCallback(
    (instanceId: string, height: number) => {
      setState((prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        const product = placed ? productFor(placed) : undefined;
        if (!placed || !product) return prev;
        const range = installationHeightRange(product);
        if (!range) return prev;
        // Whole millimetres: a stepper of 5cm must not drift into 0.8500000001.
        const h = Math.round(Math.min(range[1], Math.max(range[0], height)) * 1000) / 1000;
        const mountHeight = product.placementType === 'counter' ? h : placed.mountHeight;
        const target: Vec3 = [placed.position[0], centreYForInstallationHeight(product, h), placed.position[2]];
        const position = clampToRoom(target, {
          ...placementContextFor(product, prev.dimensions, { ...placed, mountHeight }),
          placementType: placed.placementType,
        });
        return ops.updatePlacement(prev, instanceId, { position, mountHeight });
      });
    },
    [productFor]
  );

  const setLighting = useCallback((lighting: LightingPresetId) => {
    setState((prev) => ops.setLighting(prev, lighting));
  }, []);

  const setArchitecture = useCallback((patch: Partial<ArchitectureSettings>) => {
    setState((prev) => ops.setArchitecture(prev, patch));
  }, []);

  /**
   * The room as it was just before the last starter room replaced it, so the
   * replacement can be undone once. Cleared by the next preset; a normal edit
   * after a preset keeps it, because "undo the preset" is the question the
   * customer is asking, not "undo my last nudge".
   */
  // Held in a ref as well as state: the undo is handed to a toast at the
  // moment of applying, and a callback closed over state would still see the
  // snapshot from before this one — clicking it would restore nothing.
  const beforePresetRef = useRef<RoomState | null>(null);
  const [canUndoStarterRoom, setCanUndoStarterRoom] = useState(false);

  const applyStarterRoom = useCallback(
    (preset: StarterRoomPreset): StarterRoomResult => {
      const result = buildStarterRoom(state, preset, products);
      beforePresetRef.current = state;
      setCanUndoStarterRoom(true);
      setState(result.state);
      setSelectedInstanceId(null);
      return result;
    },
    [state, products]
  );

  const undoStarterRoom = useCallback(() => {
    const previous = beforePresetRef.current;
    if (!previous) return;
    beforePresetRef.current = null;
    setCanUndoStarterRoom(false);
    setState(previous);
    setSelectedInstanceId(null);
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

  /**
   * Replaces the room with a demonstration room in one state update: size,
   * finishes, then each product placed by the ordinary placement rules — at
   * its `at` point as a drop would place it, or where "+ THÊM" would. A
   * product that is missing or cannot be placed is skipped. Returns how many
   * products were placed.
   */
  const loadPresetRoom = useCallback(
    (preset: RoomStudioDemoRoom): number => {
      const chosen = preset.products
        .map((entry) => ({ entry, product: productById.get(entry.id) }))
        .filter(
          (c): c is { entry: (typeof preset.products)[number]; product: RoomStudioProduct } =>
            Boolean(c.product) && isPlaceable(c.product!.capability)
        );

      let next = ops.clearProducts(ops.setDimensions(ops.createInitialRoomState(), preset.dimensions));
      if (preset.floor) next = ops.setSurfaceStyle(next, 'floor', preset.floor as Partial<SurfaceStyle>);
      if (preset.walls) next = ops.setSurfaceStyle(next, 'walls', preset.walls as Partial<SurfaceStyle>);

      let selectedId: string | null = null;
      for (const { entry, product } of chosen) {
        const instanceId = ops.createInstanceId(product.id);
        const atPoint: Vec3 | undefined = entry.at ? [entry.at[0], 0, entry.at[1]] : undefined;
        next = ops.addProduct(next, product, { instanceId, atPoint });
        if (product.id === preset.selectProductId || selectedId === null) selectedId = instanceId;
      }

      setState(next);
      setSelectedInstanceId(selectedId);
      return chosen.length;
    },
    [productById]
  );

  const resetRoom = useCallback(() => {
    setState(ops.createInitialRoomState());
    setSelectedInstanceId(null);
    void roomStateRepository.clear();
  }, [roomStateRepository]);

  return {
    state,
    products,
    placedViews,
    selected,
    selectedInstanceId,
    budget,
    isLoadingProducts,
    isHydrated,
    isSaved,
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
    loadPresetRoom,
    resetRoom,
    explainPlacement,
    setPlacementVariant,
    setInstallationHeight,
    setLighting,
    setArchitecture,
    applyStarterRoom,
    undoStarterRoom,
    canUndoStarterRoom,
  };
}
