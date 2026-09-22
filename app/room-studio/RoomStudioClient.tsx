'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CheckCircle, Info } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import { useRoomStudio, type PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { Vec3 } from '@/lib/room-studio/placementRules';
import RoomDimensionForm from '@/components/room-studio/RoomDimensionForm';
import SurfaceMaterialPanel from '@/components/room-studio/SurfaceMaterialPanel';
import RoomContextPanel from '@/components/room-studio/RoomContextPanel';
import ProductLibraryPanel from '@/components/room-studio/ProductLibraryPanel';
import SelectedProductToolbar from '@/components/room-studio/SelectedProductToolbar';
import BudgetSummaryBar from '@/components/room-studio/BudgetSummaryBar';
import BudgetTargetCard from '@/components/room-studio/BudgetTargetCard';
import TechnicalAdvisorPanel from '@/components/room-studio/technical/TechnicalAdvisorPanel';
import UtilityPointsCard from '@/components/room-studio/technical/UtilityPointsCard';
import { useTechnicalAdvisor } from '@/lib/technical-advisor/useTechnicalAdvisor';
import { filterForInstance } from '@/lib/technical-advisor/engine';
import TechnicalFindingRow from '@/components/room-studio/technical/TechnicalFindingRow';
import LivLabExpertEntry from '@/components/room-studio/expert/LivLabExpertEntry';
import LivLabExpertPanel from '@/components/room-studio/expert/LivLabExpertPanel';
import ImplementationFlow from '@/components/room-studio/implementation/ImplementationFlow';
import type { ImplementationRequestType } from '@/lib/implementation/types';
import {
  isHandoffIntent,
  isNavigationIntent,
  type ExpertIntent,
  type ExpertNudgeContext,
} from '@/lib/room-studio/expertNudges';
import { DEFAULT_DIMENSIONS } from '@/lib/room-studio/roomGeometry';

/**
 * The 3D canvas is client-only and pulls in three.js, so it is loaded on demand
 * rather than shipped with the page shell. Everything else — dimensions, the
 * product library, the budget — stays interactive while it arrives.
 */
const RoomScene3D = dynamic(() => import('@/components/room-studio/RoomScene3D'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-[#D8E2EA] bg-[#F8FAFC] md:aspect-[16/10]">
      <p className="text-sm text-[#627386]">Đang khởi tạo không gian 3D…</p>
    </div>
  ),
});

export default function RoomStudioClient() {
  const studio = useRoomStudio();
  const { addItem, hasItem, items: quoteItems } = useQuote();
  const [showCeiling, setShowCeiling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isExpertOpen, setIsExpertOpen] = useState(false);
  // Carries the structured intent from a nudge CTA into the panel. The id makes
  // each tap a distinct request, so the same CTA can be used twice.
  const [expertRequest, setExpertRequest] = useState<{ intent: ExpertIntent; id: number } | null>(null);
  // The implementation flow. `type` is set when a contextual CTA already knows
  // which request the customer wants; null opens the chooser.
  // `id` increments on every open and is used as the flow's React key, so each
  // open mounts a clean flow with no leftover step, error or result.
  const [implementation, setImplementation] = useState<{
    open: boolean;
    type: ImplementationRequestType | null;
    id: number;
  }>({ open: false, type: null, id: 0 });
  // Bumped to make the Technical Advisor panel open and scroll into view.
  const [technicalFocus, setTechnicalFocus] = useState(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Deterministic technical validation. Runs entirely locally — no Gemini, no
  // network — so it keeps working when the Expert is unavailable.
  const technicalFindings = useTechnicalAdvisor({
    dimensions: studio.state.dimensions,
    placedViews: studio.placedViews,
    utilityPoints: studio.state.utilityPoints ?? [],
  });

  const selectedFindings = useMemo(
    () => (studio.selectedInstanceId ? filterForInstance(technicalFindings, studio.selectedInstanceId) : []),
    [technicalFindings, studio.selectedInstanceId]
  );

  /**
   * Everything the proactive nudge engine reads. Assembled from state Room
   * Studio already owns — there is no second source of truth here, and no
   * network call: the bubble is rendered entirely from these numbers.
   */
  const nudgeContext = useMemo<ExpertNudgeContext>(
    () => ({
      dimensions: studio.state.dimensions,
      hasCustomDimensions:
        studio.state.dimensions.length !== DEFAULT_DIMENSIONS.length ||
        studio.state.dimensions.width !== DEFAULT_DIMENSIONS.width ||
        studio.state.dimensions.height !== DEFAULT_DIMENSIONS.height,
      placedCount: studio.placedViews.length,
      selectedProductName: studio.selected?.product.name,
      budget: studio.budget,
      targetBudget: studio.state.targetBudget,
      findings: technicalFindings,
      quoteItemCount: quoteItems.length,
    }),
    [
      studio.state.dimensions,
      studio.state.targetBudget,
      studio.placedViews.length,
      studio.selected,
      studio.budget,
      technicalFindings,
      quoteItems.length,
    ]
  );

  const openImplementation = useCallback((type: ImplementationRequestType | null = null) => {
    setImplementation((prev) => ({ open: true, type, id: prev.id + 1 }));
  }, []);

  /**
   * One entry point for every Expert call to action.
   *
   * A handoff intent opens the request flow instead of the chat panel — the
   * Expert PROPOSES the next step, and the customer still fills in and submits
   * the form themselves. The Expert can never send a request on their behalf.
   */
  const handleOpenExpert = useCallback(
    (intent?: ExpertIntent) => {
      // "Xem chi tiết" shows the customer the findings themselves. It costs no
      // API call and asks nothing of them — they can decide what to do only
      // after reading what the problem actually is.
      if (intent && isNavigationIntent(intent)) {
        setTechnicalFocus((n) => n + 1);
        return;
      }
      if (intent && isHandoffIntent(intent)) {
        const byIntent: Record<string, ImplementationRequestType> = {
          REQUEST_QUOTATION: 'QUOTATION',
          REQUEST_SHOWROOM_CONSULTATION: 'SHOWROOM_CONSULTATION',
          REQUEST_TECHNICAL_CHECK: 'TECHNICAL_CHECK',
        };
        openImplementation(byIntent[intent] ?? null);
        return;
      }
      setExpertRequest(intent ? { intent, id: Date.now() } : null);
      setIsExpertOpen(true);
    },
    [openImplementation]
  );

  const placedProductIds = useMemo(
    () => new Set(studio.placedViews.map((v) => v.product.id)),
    [studio.placedViews]
  );

  const handleAddProduct = useCallback(
    (product: RoomStudioProduct) => {
      studio.addProduct(product);
      showToast(`Đã đưa ${product.name} vào phòng.`);
    },
    [studio, showToast]
  );

  /** Drop from the library onto a specific spot; placement rules then clamp it. */
  const handleDropProduct = useCallback(
    (productId: string, point: Vec3) => {
      const product = studio.products.find((p) => p.id === productId);
      if (!product) return;
      studio.addProduct(product, point);
      showToast(`Đã đưa ${product.name} vào phòng.`);
    },
    [studio, showToast]
  );

  const handleAddToQuote = useCallback(
    (view: PlacedProductView) => {
      // Reuses the existing quote basket wholesale — Room Studio adds no second
      // quote system, it just feeds the one LivLab already has.
      addItem(view.product.source);
      showToast('Đã thêm vào giỏ báo giá.');
    },
    [addItem, showToast]
  );

  const handleAddAllToQuote = useCallback(() => {
    const seen = new Set<string>();
    studio.placedViews.forEach(({ product }) => {
      if (seen.has(product.id)) return;
      seen.add(product.id);
      addItem(product.source);
    });
    showToast(`Đã lưu ${seen.size} sản phẩm vào giỏ báo giá.`);
  }, [studio.placedViews, addItem, showToast]);

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-16">
      <div className="bg-[#0B1623] px-6 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1600px]">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#C8A96A]">Room Studio 3D</p>
          <h1 className="mb-3 max-w-2xl text-3xl font-bold leading-tight text-white lg:text-5xl">
            Dựng thử phòng tắm đúng kích thước thật của bạn.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/60 lg:text-lg">
            Nhập kích thước phòng, chọn vật liệu sàn và tường, rồi đặt sản phẩm thật của LivLab vào đúng tỷ lệ trước khi
            gửi yêu cầu báo giá.
          </p>
          <Link
            href="/visual-studio"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Muốn ướm sản phẩm lên ảnh phòng thật? Mở Visual Studio 2D →
          </Link>
        </div>
      </div>

      {studio.loadError && (
        <div className="mx-auto mt-6 max-w-[1600px] px-4 md:px-6">
          <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600">{studio.loadError}</div>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          {/* LEFT: room setup */}
          <div className="flex w-full shrink-0 flex-col gap-5 xl:w-[300px]">
            <RoomDimensionForm dimensions={studio.state.dimensions} onDimensionsChange={studio.setDimensions} />
            <SurfaceMaterialPanel
              surfaceStyles={studio.state.surfaceStyles}
              onStyleChange={studio.setSurfaceStyle}
              showCeiling={showCeiling}
              onToggleCeiling={setShowCeiling}
            />
            <BudgetTargetCard
              targetBudget={studio.state.targetBudget}
              onChange={studio.setTargetBudget}
            />
            <TechnicalAdvisorPanel
              findings={technicalFindings}
              selectedInstanceId={studio.selectedInstanceId}
              selectedProductName={studio.selected?.product.name}
              hasProducts={studio.placedViews.length > 0}
              onRequestTechnicalCheck={() => openImplementation('TECHNICAL_CHECK')}
              focusSignal={technicalFocus}
            />
            <UtilityPointsCard
              dimensions={studio.state.dimensions}
              points={studio.state.utilityPoints ?? []}
              onAdd={studio.addUtilityPoint}
              onRemove={studio.removeUtilityPoint}
            />
            <RoomContextPanel
              contextImage={studio.state.roomContextImage}
              contextLabel={studio.state.roomContextLabel}
              onContextChange={studio.setRoomContextImage}
            />
          </div>

          {/* CENTER: the room */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <RoomScene3D
              dimensions={studio.state.dimensions}
              floorStyle={studio.state.surfaceStyles.floor}
              wallStyle={studio.state.surfaceStyles.walls}
              placedViews={studio.placedViews}
              selectedInstanceId={studio.selectedInstanceId}
              showCeiling={showCeiling}
              onSelect={studio.setSelectedInstanceId}
              onMove={studio.moveProduct}
              onDropProduct={handleDropProduct}
            />

            {studio.selected ? (
              <>
              <SelectedProductToolbar
                selection={studio.selected}
                isInQuote={hasItem(studio.selected.product.id)}
                onRotate={studio.rotateProduct}
                onDuplicate={studio.duplicateProduct}
                onRemove={studio.removeProduct}
                onAddToQuote={handleAddToQuote}
              />
              {selectedFindings.length > 0 && (
                <ul className="space-y-2">
                  {selectedFindings.map((finding) => (
                    <TechnicalFindingRow key={finding.id} finding={finding} />
                  ))}
                </ul>
              )}
              </>
            ) : (
              <div className="flex items-start gap-2.5 rounded-2xl border border-[#D8E2EA] bg-white p-4 text-xs leading-relaxed text-[#627386]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A96A]" />
                <span>
                  Chạm vào một sản phẩm trong phòng để xoay, nhân đôi, xoá hoặc thêm vào giỏ báo giá. Sản phẩm chưa có
                  model 3D được hiển thị bằng khối kích thước thật để bạn kiểm tra độ vừa vặn.
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: catalogue */}
          <div className="h-[520px] w-full shrink-0 xl:h-[calc(100vh-10rem)] xl:w-[340px] xl:sticky xl:top-24">
            <ProductLibraryPanel
              products={studio.products}
              isLoading={studio.isLoadingProducts}
              placedProductIds={placedProductIds}
              onAddProduct={handleAddProduct}
            />
          </div>
        </div>
      </div>

      <BudgetSummaryBar
        budget={studio.budget}
        onAddAllToQuote={handleAddAllToQuote}
        onClearRoom={studio.clearProducts}
        onContinue={() => openImplementation()}
      />

      <ImplementationFlow
        key={implementation.id}
        open={implementation.open}
        initialType={implementation.type}
        onClose={() => setImplementation((prev) => ({ ...prev, open: false, type: null }))}
        state={studio.state}
        placedViews={studio.placedViews}
        budget={studio.budget}
        findings={technicalFindings}
      />

      {/* One entry point only: the character replaced the old black pill, and
          reuses the same open/close state it drove. */}
      {!isExpertOpen && studio.isHydrated && (
        <LivLabExpertEntry context={nudgeContext} enabled={!isExpertOpen} onOpen={handleOpenExpert} />
      )}

      <LivLabExpertPanel
        open={isExpertOpen}
        request={expertRequest}
        onClose={() => setIsExpertOpen(false)}
        state={studio.state}
        placedViews={studio.placedViews}
        selected={studio.selected}
        budget={studio.budget}
        products={studio.products}
        quoteItems={quoteItems}
        onAddProductToRoom={studio.addProduct}
        onAddProductToQuote={(product) => addItem(product.source)}
      />

      {toast && (
        <div className="fixed right-4 top-24 z-50 flex items-center gap-2 rounded-xl bg-[#123C5A] px-5 py-3 text-white shadow-xl md:right-6">
          <CheckCircle className="h-4 w-4 text-[#DCEBF5]" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
