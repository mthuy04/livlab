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
import { starterRoomRequest, type StarterRoomPreset } from './roomPresets';
import { applyRoomOperations, anchoredPosition, rotatePlacement, type RoomOperation } from './roomOperations';
import { beginRoomDrag, commitRoom, createRoomHistory, endRoomDrag, redoRoom, undoRoom, updateRoomDrag } from './roomHistory';
import { applyRoomProposal, previewRoomProposal, type ProposalRequest, type RoomProposal } from './roomProposal';
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
  const [history, setHistory] = useState(() => createRoomHistory(ops.createInitialRoomState()));
  const state = history.current;
  const commit = useCallback((label: string, update: (base: RoomState) => RoomState) => {
    setHistory(h => commitRoom(h, label, update(h.current)));
  }, []);
  const linkQuote=useCallback(()=>{
    const id=crypto.randomUUID();
    commit('Liên kết báo giá',base=>base.quoteDesignId?base:{...base,quoteDesignId:id});
  },[commit]);
  const undo = useCallback(() => setHistory(h => undoRoom(h)), []);
  const redo = useCallback(() => setHistory(redoRoom), []);
  const undoStarterRoom = useCallback((snapshot: RoomState) => setHistory(h => undoRoom(h, snapshot)), []);
  const beginDrag = useCallback((id: string) => setHistory(h => beginRoomDrag(h, id)), []);
  const endDrag = useCallback((cancel = false) => setHistory(h => endRoomDrag(h, cancel)), []);
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
        if (!cancelled && saved) setHistory(h => createRoomHistory(saved, h.revision + 1));
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [catalog, roomStateRepository]);

  // Only committed snapshots reach the repository. Coalesce repeated nudges.
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

  const resolveProduct = useCallback((id: string, variant?: string) => {
    const product = productById.get(id);
    if (!product?.reconstruction || !variant || variant === product.reconstruction.variant) return product;
    const model = reconstructionFor(product);
    return model ? withReconstruction(product, model, variant) : product;
  }, [productById]);

  const run = useCallback((label: string, command: RoomOperation) => {
    commit(label, base => {
      const result = applyRoomOperations(base, [command], resolveProduct);
      return result.ok ? result.state : base;
    });
  }, [commit, resolveProduct]);

  const preview = useCallback((request: ProposalRequest) => {
    const proposal = previewRoomProposal(history, request, resolveProduct);
    setHistory(h => h.revision === proposal.sourceRevision ? { ...h, drag: null, proposal } : h);
  }, [history, resolveProduct]);
  const discard = useCallback(() => setHistory(h => ({ ...h, proposal: null })), []);
  const apply = useCallback((proposal: RoomProposal) => {
    setHistory(h => applyRoomProposal(h, proposal));
  }, []);

  const viewsFor = useCallback((placements: PlacedProduct[]) => placements.flatMap(placed => {
    const product = resolveProduct(placed.productId, placed.variant);
    return product ? [{ placed, product }] : [];
  }), [resolveProduct]);
  const placedViews = useMemo(() => viewsFor(state.placedProducts), [state.placedProducts, viewsFor]);
  const draft = history.drag?.draft;
  const dragViews = useMemo(() => draft ? viewsFor(draft.placedProducts) : placedViews, [draft, viewsFor, placedViews]);

  const previewState = history.proposal?.preview;
  const previewProducts = previewState?.placedProducts;
  const visualViews = useMemo(
    () => previewProducts && previewProducts !== state.placedProducts ? viewsFor(previewProducts) : dragViews,
    [previewProducts, state.placedProducts, viewsFor, dragViews]
  );

  const budget: BudgetEstimate = useMemo(
    () => {
      const estimate = calculateRoomBudget(placedViews.map(({ product }) => ({ product, quantity: 1 })));
      estimate.itemCount = state.placedProducts.length;
      estimate.unpricedCount += estimate.itemCount - placedViews.length;
      return estimate;
    },
    [placedViews, state.placedProducts.length]
  );

  const previousRoom=history.previous;
  const previousBudget=useMemo(()=>{
    if(!previousRoom)return budget;
    const known=viewsFor(previousRoom.placedProducts);
    const result=calculateRoomBudget(known.map(v=>({product:v.product,quantity:1})));
    result.itemCount=previousRoom.placedProducts.length;
    result.unpricedCount+=result.itemCount-known.length;
    return result;
  },[previousRoom,viewsFor,budget]);
  const selected = useMemo(
    () => placedViews.find((v) => v.placed.instanceId === selectedInstanceId) ?? null,
    [placedViews, selectedInstanceId]
  );

  // ─── Actions ───────────────────────────────────────────────────────────────

  const setDimensions = useCallback(
    (dimensions: RoomDimensions) => run('Đổi kích thước phòng', { op: 'dimensions', dimensions }),
    [run]
  );

  const setSurfaceStyle = useCallback((surface: SurfaceId, patch: Partial<SurfaceStyle>) => {
    run('Đổi vật liệu', { op: 'surface', surface, patch });
  }, [run]);

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
      if (!resolveProduct(product.id) || !isPlaceable(product.capability)) return null;
      if (!ops.canPlaceInRoom(state, product).fits) return null;
      const instanceId = ops.createInstanceId(product.id);
      run('Thêm ' + product.name, { op: 'add', productId: product.id, instanceId, atPoint });
      setSelectedInstanceId(instanceId);
      return instanceId;
    },
    [state, resolveProduct, run]
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
    run('Bỏ sản phẩm', { op: 'remove', instanceId });
    setSelectedInstanceId((prev) => (prev === instanceId ? null : prev));
  }, [run]);

  const duplicateProduct = useCallback((instanceId: string) => {
    const newInstanceId = ops.createInstanceId(instanceId);
    commit('Nhân đôi sản phẩm', (prev) => ops.duplicateProduct(prev, instanceId, newInstanceId));
    setSelectedInstanceId(newInstanceId);
  }, [commit]);

  const move = useCallback((base: RoomState, instanceId: string, point: Vec3) => {
    const placed = base.placedProducts.find(p => p.instanceId === instanceId);
    const product = placed && resolveProduct(placed.productId, placed.variant);
    if (!product || !placed) return base;
    return ops.updatePlacement(base, instanceId, { position: anchoredPosition(base, placed, product, point) });
  }, [resolveProduct]);
  const moveProduct = useCallback((id: string, point: Vec3) => {
    commit('Di chuyển sản phẩm', base => move(base, id, point));
  }, [commit, move]);
  const dragProduct = useCallback((id: string, point: Vec3) => {
    setHistory(h => updateRoomDrag(h, id, base => move(base, id, point)));
  }, [move]);

  const rotateProduct = useCallback((instanceId: string, delta: number) => {
    commit('Xoay sản phẩm', base => {
      const placed = base.placedProducts.find(p => p.instanceId === instanceId);
      const product = placed && resolveProduct(placed.productId, placed.variant);
      if (!placed || !product || !Number.isFinite(delta)) return base;
      // Manual rotation keeps the existing toolbar behaviour. Automated
      // changes to wall-mounted products name the new wall explicitly.
      return rotatePlacement(base, placed, product, placed.rotationY + delta);
    });
  }, [commit, resolveProduct]);

  /** Switches the model variant one placement draws, and re-anchors it. */
  const setPlacementVariant = useCallback(
    (instanceId: string, variant: string) => {
      commit('Đổi phiên bản sản phẩm', (prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        if (!placed) return prev;
        const next = { ...placed, variant };
        const product = resolveProduct(next.productId, next.variant);
        if (!product) return prev;
        const position = clampToRoom(placed.position, {
          ...placementContextFor(product, prev.dimensions, next),
          placementType: placed.placementType,
        });
        return ops.updatePlacement(prev, instanceId, { variant, position });
      });
    },
    [commit, resolveProduct]
  );

  /**
   * Sets the installation height a customer reasons in — a shower's mixer,
   * a basin's counter top — kept inside the product's own range and the room.
   */
  const setInstallationHeight = useCallback(
    (instanceId: string, height: number) => {
      commit('Đổi cao độ lắp đặt', (prev) => {
        const placed = prev.placedProducts.find((p) => p.instanceId === instanceId);
        const product = placed ? resolveProduct(placed.productId, placed.variant) : undefined;
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
    [commit, resolveProduct]
  );

  const setLighting = useCallback((preset: LightingPresetId) => {
    run('Đổi ánh sáng', { op: 'lighting', preset });
  }, [run]);

  const setArchitecture = useCallback((patch: Partial<ArchitectureSettings>) => {
    preview({ source: 'architecture', label: 'Chỉnh kiến trúc phòng', operations: [{ op: 'architecture', patch }] });
  }, [preview]);

  const previewStarterRoom = useCallback((preset: StarterRoomPreset) => {
    preview(starterRoomRequest(state, preset, products));
  }, [state, products, preview]);

  const clearProducts = useCallback(() => {
    commit('Bỏ tất cả sản phẩm', ops.clearProducts);
    setSelectedInstanceId(null);
  }, [commit]);

  // Upload URLs are session resources. Keep a photograph usable while any
  // reachable snapshot references it, even after its dialog closes.
  const imageUrls = useRef(new Set<string>());
  useEffect(() => {
    const retained = new Set([state.roomContextImage]);
    for (const tx of [...history.past, ...history.future]) {
      retained.add(tx.before.roomContextImage);
      retained.add(tx.after.roomContextImage);
    }
    for (const url of imageUrls.current) {
      if (retained.has(url)) continue;
      URL.revokeObjectURL(url);
      imageUrls.current.delete(url);
    }
  }, [state, history.past, history.future]);
  useEffect(() => {
    const allocated = imageUrls.current;
    return () => { for (const url of allocated) URL.revokeObjectURL(url); };
  }, []);

  const setRoomContextImage = useCallback((image?: string, label?: string) => {
    if (image?.startsWith('blob:')) imageUrls.current.add(image);
    commit('Đổi ảnh tham chiếu', (prev) => ops.setRoomContextImage(prev, image, label));
  }, [commit]);

  const setTargetBudget = useCallback((targetBudget?: number) => {
    commit('Đổi ngân sách', (prev) => ops.setTargetBudget(prev, targetBudget));
  }, [commit]);

  const setStylePreferences = useCallback((styles: string[]) => {
    commit('Đổi phong cách', (prev) => ops.setStylePreferences(prev, styles));
  }, [commit]);

  const addUtilityPoint = useCallback((point: UtilityPoint) => {
    commit('Thêm điểm kỹ thuật', (prev) => ops.addUtilityPoint(prev, point));
  }, [commit]);

  const removeUtilityPoint = useCallback((id: string) => {
    commit('Bỏ điểm kỹ thuật', (prev) => ops.removeUtilityPoint(prev, id));
  }, [commit]);

  const previewDemoRoom = useCallback((preset: RoomStudioDemoRoom) => {
    const operations: RoomOperation[] = [{ op: 'reset' }, { op: 'dimensions', dimensions: preset.dimensions }];
    if (preset.floor) operations.push({ op: 'surface', surface: 'floor', patch: preset.floor as SurfaceStyle });
    if (preset.walls) operations.push({ op: 'surface', surface: 'walls', patch: preset.walls as SurfaceStyle });
    let selectOnApply: string | undefined;
    for (const entry of preset.products) {
      const instanceId = ops.createInstanceId(entry.id);
      operations.push({ op: 'add', instanceId, productId: entry.id, atPoint: entry.at && [entry.at[0], 0, entry.at[1]] });
      if (!selectOnApply || entry.id === preset.selectProductId) selectOnApply = instanceId;
    }
    preview({ source: 'demo', label: 'Phòng trình diễn', operations, selectOnApply });
  }, [preview]);

  const resetRoom = useCallback(() => {
    run('Đặt lại phòng', { op: 'reset' });
    setSelectedInstanceId(null);
  }, [run]);

  return {
    state, linkQuote, resolveProduct, dragId:history.drag?.instanceId,
    unlinkedDesignId:state.quoteDesignId ? undefined : history.previous?.quoteDesignId,
    products,
    placedViews,
    selected,
    selectedInstanceId,
    budget, previousBudget,
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
    previewDemoRoom,
    resetRoom,
    explainPlacement,
    setPlacementVariant,
    setInstallationHeight,
    setLighting,
    setArchitecture,
    previewStarterRoom,
    undoStarterRoom,
    visualViews, dragViews, beginDrag, dragProduct, endDrag,
    undo, redo, undoLabel: history.past.at(-1)?.label, redoLabel: history.future[0]?.label,
    revision: history.revision, preview, proposal: history.proposal, apply, discard,
  };
}
