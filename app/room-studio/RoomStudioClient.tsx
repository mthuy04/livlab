'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CheckCircle, Layers, Package, Wrench } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import { useTenant } from '@/components/storefront/TenantContext';
import { useRoomStudio, type PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import { useIsDesktop } from '@/lib/room-studio/useIsDesktop';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { Vec3 } from '@/lib/room-studio/placementRules';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { UtilityPointType } from '@/lib/technical-advisor/types';
import WorkspaceHeader from '@/components/room-studio/WorkspaceHeader';
import WorkspaceDialog from '@/components/room-studio/WorkspaceDialog';
import RoomPresetDialog from '@/components/room-studio/RoomPresetDialog';
import LeftToolPanel, { type ToolTabId } from '@/components/room-studio/LeftToolPanel';
import RoomTab from '@/components/room-studio/panels/RoomTab';
import TechnicalTab, { utilityPointFrom } from '@/components/room-studio/panels/TechnicalTab';
import SurfaceMaterialPanel from '@/components/room-studio/SurfaceMaterialPanel';
import MiniFloorPlan from '@/components/room-studio/MiniFloorPlan';
import ProductLibraryPanel from '@/components/room-studio/ProductLibraryPanel';
import SelectedProductToolbar from '@/components/room-studio/SelectedProductToolbar';
import CommandBar from '@/components/room-studio/CommandBar';
import RoomContextPanel from '@/components/room-studio/RoomContextPanel';
import BudgetTargetCard from '@/components/room-studio/BudgetTargetCard';
import LivLabExpertPanel from '@/components/room-studio/expert/LivLabExpertPanel';
import ImplementationFlow from '@/components/room-studio/implementation/ImplementationFlow';
import type { ImplementationRequestType } from '@/lib/implementation/types';
import { useTechnicalAdvisor } from '@/lib/technical-advisor/useTechnicalAdvisor';
import { summarise } from '@/lib/technical-advisor/engine';
import type { ExpertIntent } from '@/lib/room-studio/expertNudges';
import LightingPanel from '@/components/room-studio/LightingPanel';
import { LIGHTING_PRESETS, parseArchitecture, parseLighting } from '@/lib/room-studio/environment';
import { placementStatusByInstance } from '@/lib/room-studio/placementStatus';
import { getStarterRoom, type StarterRoomPreset } from '@/lib/room-studio/roomPresets';

/**
 * The 3D canvas is client-only and pulls in three.js, so it is loaded on demand
 * rather than shipped with the page shell. Everything else — the tool panel,
 * the product library, the command bar — stays interactive while it arrives.
 */
const RoomScene3D = dynamic(() => import('@/components/room-studio/RoomScene3D'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#E9EEF1]">
      <p className="text-[13px] text-[#5B6B7A]">Đang dựng không gian…</p>
    </div>
  ),
});

/** Which panel the mobile layout is showing under the viewport. */
type MobilePanel = 'none' | 'tools' | 'products';

/**
 * Room Studio as a workspace.
 *
 * What changed is the information architecture, not the engine. The page used
 * to open with a 300px marketing hero, then a column of six stacked
 * configuration panels, then the canvas, then the whole product catalogue —
 * about four screens of scrolling to get from "how big is my room" to "does
 * this fit". The scene, the placement rules and the room state below are the
 * same code; they are now arranged so the room is the thing you are looking at.
 *
 * One height is divided once: the storefront shell hands this route exactly the
 * viewport (see `StorefrontShell`), the header and command bar take what they
 * need, and the three columns share the rest. No child computes a viewport
 * fraction of its own.
 */
export default function RoomStudioClient() {
  const tenant = useTenant();
  const studio = useRoomStudio(tenant.experience.roomStudioCatalog, tenant.id);
  const { addItem, addCatalogItem, hasItem, items: quoteItems } = useQuote();

  /**
   * One door into the basket for every caller here. A storefront-catalogue
   * product goes in as the catalogue entry the product page would add, so the
   * showroom receives its tenant and price snapshot; a LivLab CSV product goes
   * in exactly as before.
   */
  const addToQuote = useCallback(
    (product: RoomStudioProduct) => {
      if (product.quoteEntry) addCatalogItem(product.quoteEntry);
      else addItem(product.source);
    },
    [addItem, addCatalogItem]
  );
  const isDesktop = useIsDesktop();

  const [showCeiling, setShowCeiling] = useState(false);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const [toolTab, setToolTab] = useState<ToolTabId>('room');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('none');
  const [pendingUtilityType, setPendingUtilityType] = useState<UtilityPointType | null>(null);
  const [categoryRequest, setCategoryRequest] = useState<{ id: string; nonce: number } | null>(null);

  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [expertRequest, setExpertRequest] = useState<{ intent: ExpertIntent; id: number } | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showReferenceImage, setShowReferenceImage] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // `type` is set when a contextual CTA already knows which request the
  // customer wants; null opens the chooser. `id` keys the flow so every open
  // mounts a clean one with no leftover step, error or result.
  const [implementation, setImplementation] = useState<{
    open: boolean;
    type: ImplementationRequestType | null;
    id: number;
  }>({ open: false, type: null, id: 0 });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ message, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    // An undo stays long enough to be reached for; a plain notice does not.
    toastTimer.current = setTimeout(() => setToast(null), undo ? 7000 : 2800);
  }, []);

  // Deterministic technical validation. Runs entirely locally — no Gemini, no
  // network — so it keeps working when the Expert is unavailable.
  const technicalFindings = useTechnicalAdvisor({
    dimensions: studio.state.dimensions,
    placedViews: studio.placedViews,
    utilityPoints: studio.state.utilityPoints ?? [],
    counterSupport: parseArchitecture(studio.state.architecture).basinCounter,
  });
  const technicalSummary = useMemo(() => summarise(technicalFindings), [technicalFindings]);

  // One word per placement for its outline colour: valid, clearance warning,
  // collision, outside the room, off its surface.
  const placementStatus = useMemo(
    () => placementStatusByInstance(technicalFindings, studio.placedViews.map((v) => v.placed.instanceId)),
    [technicalFindings, studio.placedViews]
  );
  const lighting = LIGHTING_PRESETS[parseLighting(studio.state.lighting)];
  const architecture = parseArchitecture(studio.state.architecture);

  const utilityPoints = studio.state.utilityPoints ?? [];

  const placedProductIds = useMemo(
    () => new Set(studio.placedViews.map((v) => v.product.id)),
    [studio.placedViews]
  );
  const uniquePlacedCount = placedProductIds.size;

  const openImplementation = useCallback((type: ImplementationRequestType | null = null) => {
    setImplementation((prev) => ({ open: true, type, id: prev.id + 1 }));
  }, []);

  const announcePlacement = useCallback(
    (product: RoomStudioProduct, instanceId: string | null, refusal: string | null) => {
      showToast(
        instanceId
          ? `Đã đưa ${product.name} vào phòng.`
          : refusal ?? `${product.name} chưa đặt được vào phòng.`
      );
    },
    [showToast]
  );

  const handleAddProduct = useCallback(
    (product: RoomStudioProduct) => {
      // The reason is read before the attempt: a refusal always says why —
      // no dimensions, or bigger than the room — and the product is never
      // shrunk to make it fit.
      const refusal = studio.explainPlacement(product);
      announcePlacement(product, studio.addProduct(product), refusal);
    },
    [studio, announcePlacement]
  );

  /** Drop from the library onto a specific spot; placement rules then clamp it. */
  const handleDropProduct = useCallback(
    (productId: string, point: Vec3) => {
      const product = studio.products.find((p) => p.id === productId);
      if (!product) return;
      const refusal = studio.explainPlacement(product);
      announcePlacement(product, studio.addProduct(product, point), refusal);
    },
    [studio, announcePlacement]
  );

  const handleAddToQuote = useCallback(
    (view: PlacedProductView) => {
      // Reuses the existing quote basket wholesale — Room Studio adds no second
      // quote system, it just feeds the one LivLab already has.
      addToQuote(view.product);
      showToast('Đã thêm vào giỏ báo giá.');
    },
    [addToQuote, showToast]
  );

  /**
   * "Lưu thiết kế" — the placed products into the quote basket.
   *
   * The room itself is already saved on its own (see `useRoomStudio`), so this
   * name had to mean the thing that is NOT automatic. The alternative was two
   * buttons, one of which did nothing.
   */
  const handleSaveDesign = useCallback(() => {
    const seen = new Set<string>();
    studio.placedViews.forEach(({ product }) => {
      if (seen.has(product.id)) return;
      seen.add(product.id);
      addToQuote(product);
    });
    showToast(`Đã lưu ${seen.size} sản phẩm vào giỏ báo giá.`);
  }, [studio.placedViews, addToQuote, showToast]);

  const handleOpenCombo = useCallback(() => {
    setExpertRequest({
      intent: studio.placedViews.length > 0 ? 'REVIEW_COMBO' : 'RECOMMEND_NEXT_PRODUCT',
      id: Date.now(),
    });
    setIsExpertOpen(true);
  }, [studio.placedViews.length]);

  const applyPreset = useCallback(
    (dimensions: RoomDimensions) => {
      studio.setDimensions(dimensions);
      setToolTab('room');
    },
    [studio]
  );

  const applyStarterRoom = useCallback(
    (preset: StarterRoomPreset) => {
      const result = studio.applyStarterRoom(preset);
      const placed = result.placed.length;
      const skipped = result.skipped.length;
      const message =
        preset.id === 'empty'
          ? 'Đã làm trống phòng.'
          : `Đã áp dụng “${preset.name}”: ${placed} sản phẩm${
              skipped ? `, ${skipped} vị trí bỏ trống vì danh mục không có sản phẩm phù hợp` : ''
            }.`;
      showToast(message, studio.undoStarterRoom);
      setToolTab('room');
    },
    [studio, showToast]
  );

  const handlePickUtilityPosition = useCallback(
    ({ fromLeft, fromBack }: { fromLeft: number; fromBack: number }) => {
      if (!pendingUtilityType) return;
      studio.addUtilityPoint(
        utilityPointFrom(pendingUtilityType, studio.state.dimensions, fromLeft, fromBack)
      );
      setPendingUtilityType(null);
    },
    [pendingUtilityType, studio]
  );

  const showTechnicalFindings = useCallback(() => {
    setToolTab('technical');
    if (!isDesktop) setMobilePanel('tools');
  }, [isDesktop]);

  /**
   * `/room-studio?demo=1` opens the tenant's demonstration room, once.
   *
   * Waits for both the catalogue and the saved room, so the preset is not
   * overwritten by a late hydrate and never references a product that has not
   * loaded. The parameter is then removed from the address, so a refresh, a
   * bookmark or the back button returns to the customer's own room behaviour.
   */
  const demoApplied = useRef(false);
  const demoRoom = tenant.experience.roomStudioDemo;
  useEffect(() => {
    if (demoApplied.current || !demoRoom || studio.isLoadingProducts || !studio.isHydrated) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('demo') !== '1') return;
    demoApplied.current = true;
    studio.loadPresetRoom(demoRoom);
    url.searchParams.delete('demo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [demoRoom, studio]);

  /**
   * `/room-studio?starter=warm-stone` opens a starter room by link — for a
   * demonstration, or a showroom's own "see it styled" button.
   *
   * Only into an empty room: a link must never replace a design the customer
   * already has. With products already placed the parameter is dropped and
   * the room is left exactly as it was saved.
   */
  const starterApplied = useRef(false);
  useEffect(() => {
    if (starterApplied.current || studio.isLoadingProducts || !studio.isHydrated) return;
    const url = new URL(window.location.href);
    const id = url.searchParams.get('starter');
    if (!id) return;
    starterApplied.current = true;
    const preset = getStarterRoom(id);
    // After this commit, not inside it: applying replaces the room state and
    // announces itself, and neither belongs in the render that read the URL.
    if (preset && studio.placedViews.length === 0) setTimeout(() => applyStarterRoom(preset), 0);
    url.searchParams.delete('starter');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [studio, applyStarterRoom]);

  /* ----------------------------------------------------------- the panels */

  const floorPlan = (
    <MiniFloorPlan
      dimensions={studio.state.dimensions}
      placedViews={studio.placedViews}
      utilityPoints={utilityPoints}
      selectedInstanceId={studio.selectedInstanceId}
      onSelect={studio.setSelectedInstanceId}
      pickingLabel={pendingUtilityType ? 'điểm kỹ thuật' : null}
      onPick={handlePickUtilityPosition}
    />
  );

  const toolPanel = (
    <LeftToolPanel
      active={toolTab}
      onChange={setToolTab}
      counts={{ technical: utilityPoints.length }}
    >
      {toolTab === 'room' && (
        <RoomTab
          dimensions={studio.state.dimensions}
          onDimensionsChange={studio.setDimensions}
          showCeiling={showCeiling}
          onToggleCeiling={setShowCeiling}
          onOpenReferenceImage={() => setShowReferenceImage(true)}
          hasReferenceImage={Boolean(studio.state.roomContextImage)}
          onOpenPresets={() => setShowPresets(true)}
          architecture={architecture}
          onArchitectureChange={studio.setArchitecture}
        />
      )}
      {toolTab === 'material' && (
        <div className="space-y-4">
          <SurfaceMaterialPanel
            surfaceStyles={studio.state.surfaceStyles}
            onStyleChange={studio.setSurfaceStyle}
            dimensions={studio.state.dimensions}
          />
          <LightingPanel value={lighting.id} onChange={studio.setLighting} />
        </div>
      )}
      {toolTab === 'technical' && (
        <TechnicalTab
          dimensions={studio.state.dimensions}
          points={utilityPoints}
          findings={technicalFindings}
          onAdd={studio.addUtilityPoint}
          onRemove={studio.removeUtilityPoint}
          pendingType={pendingUtilityType}
          onPendingTypeChange={setPendingUtilityType}
          onRequestTechnicalCheck={() => openImplementation('TECHNICAL_CHECK')}
          floorPlan={floorPlan}
        />
      )}
    </LeftToolPanel>
  );

  const libraryPanel = (
    <ProductLibraryPanel
      title={tenant.experience.copy.roomStudio.libraryTitle}
      products={studio.products}
      isLoading={studio.isLoadingProducts}
      placedProductIds={placedProductIds}
      onAddProduct={handleAddProduct}
      onSuggestCombo={handleOpenCombo}
      categoryRequest={categoryRequest}
    />
  );

  const viewport = (
    <RoomScene3D
      dimensions={studio.state.dimensions}
      floorStyle={studio.state.surfaceStyles.floor}
      wallStyle={studio.state.surfaceStyles.walls}
      lighting={lighting}
      architecture={architecture}
      placementStatus={placementStatus}
      placedViews={studio.placedViews}
      selectedInstanceId={studio.selectedInstanceId}
      showCeiling={showCeiling}
      onToggleCeiling={setShowCeiling}
      onSelect={studio.setSelectedInstanceId}
      onMove={studio.moveProduct}
      onDropProduct={handleDropProduct}
      onPickCategory={(normalizedCategory) => {
        setCategoryRequest({ id: normalizedCategory, nonce: Date.now() });
        if (!isDesktop) setMobilePanel('products');
      }}
    />
  );

  /**
   * Arrow keys nudge the selected product; Shift makes the step coarse.
   *
   * Dragging answers "roughly there" and a mouse cannot do better than the
   * camera angle allows — on the floor plane a vertical screen movement is
   * multiplied by 1/tan(elevation), so the last few centimetres of a placement
   * are a fight even after the angle was raised. A key press is the same
   * distance every time regardless of where the camera is, which is the only
   * way to land a basin exactly against a wall.
   *
   * Movement is in room axes, not camera axes: Left/Right run along the room's
   * length and Up/Down into its depth, which is what the arrows look like they
   * do from the default framing. `moveProduct` clamps, so holding a key walks
   * the product to the wall and stops.
   */
  useEffect(() => {
    const selected = studio.selected;
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Never steal the arrows from a field the customer is typing in.
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

      const step = event.shiftKey ? 0.1 : 0.01;
      const [x, y, z] = selected.placed.position;
      let next: Vec3 | null = null;
      if (event.key === 'ArrowLeft') next = [x - step, y, z];
      else if (event.key === 'ArrowRight') next = [x + step, y, z];
      else if (event.key === 'ArrowUp') next = [x, y, z - step];
      else if (event.key === 'ArrowDown') next = [x, y, z + step];
      if (!next) return;

      // Otherwise the page scrolls under the room while the product moves.
      event.preventDefault();
      studio.moveProduct(selected.placed.instanceId, next);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [studio]);

  const selectedToolbar = studio.selected && (
    <SelectedProductToolbar
      selection={studio.selected}
      isInQuote={hasItem(studio.selected.product.id)}
      onRotate={studio.rotateProduct}
      onDuplicate={studio.duplicateProduct}
      onRemove={studio.removeProduct}
      onAddToQuote={handleAddToQuote}
      onDeselect={() => studio.setSelectedInstanceId(null)}
      status={placementStatus[studio.selected.placed.instanceId]}
      findings={technicalFindings.filter((f) => f.affectedInstanceIds.includes(studio.selected!.placed.instanceId))}
      dimensions={studio.state.dimensions}
      onSetVariant={studio.setPlacementVariant}
      onSetInstallationHeight={studio.setInstallationHeight}
    />
  );

  /* ------------------------------------------------------------- the page */

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F3F7FA]">
      <WorkspaceHeader
        dimensions={studio.state.dimensions}
        saved={studio.isSaved}
        onOpenGuide={() => setShowGuide(true)}
      />

      {studio.loadError && (
        <div
          role="alert"
          className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700 md:px-6"
        >
          {studio.loadError}
        </div>
      )}

      {isDesktop ? (
        <div className="flex min-h-0 flex-1">
          {/* Panel widths are floors, not a share: the viewport takes whatever
              is left, which is ~56% at 1280 and ~60% at 1536. Below that the
              panels stop shrinking rather than becoming unusable — a 230px
              product card is not a product card. */}
          <aside className="w-[264px] shrink-0 overflow-hidden border-r border-[#E1E8ED] 2xl:w-[288px]">
            {toolPanel}
          </aside>

          {/* The viewport is the one element that gets whatever is left. */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* `relative` is load-bearing: the canvas fills this box absolutely
                rather than by percentage height. See RoomScene3D. */}
            <div className="relative min-h-0 flex-1">{viewport}</div>
            {selectedToolbar}
          </section>

          <aside className="w-[304px] shrink-0 overflow-hidden border-l border-[#E1E8ED] 2xl:w-[324px]">
            {libraryPanel}
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            {viewport}

            {/* A sheet over the room rather than a split below it. Splitting
                left the panel about 180px tall on a phone — its own header and
                nothing else — and resized the canvas on every toggle, which
                makes the scene rebuild its drawing buffer for a panel that is
                about to close again. The room keeps its height and stays
                visible above the sheet. */}
            {mobilePanel !== 'none' && (
              <div className="absolute inset-x-0 bottom-0 top-[28%] z-30 overflow-hidden border-t border-[#E1E8ED] bg-white shadow-[0_-8px_24px_rgba(11,22,35,0.12)]">
                {mobilePanel === 'tools' ? toolPanel : libraryPanel}
              </div>
            )}
          </div>

          {selectedToolbar}

          <nav
            aria-label="Khu vực làm việc"
            className="flex shrink-0 border-t border-[#E1E8ED] bg-white"
          >
            {([
              { id: 'tools', tab: 'room', label: 'Phòng', icon: Layers },
              { id: 'products', tab: null, label: 'Sản phẩm', icon: Package },
              { id: 'tools', tab: 'technical', label: 'Kỹ thuật', icon: Wrench },
            ] as const).map((item) => {
              const isActive =
                mobilePanel === item.id && (item.tab === null || toolTab === item.tab);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    if (item.tab) setToolTab(item.tab);
                    // Tapping the active entry closes the panel and gives the
                    // room back the screen.
                    setMobilePanel(isActive ? 'none' : item.id);
                  }}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[12px] font-medium transition-colors ${
                    isActive ? 'text-[#0B1623]' : 'text-[#8C9BAB]'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden style={{ width: 18, height: 18 }} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <CommandBar
        budget={studio.budget}
        uniqueCount={uniquePlacedCount}
        technical={technicalSummary}
        hasUtilityPoints={utilityPoints.length > 0}
        targetBudget={studio.state.targetBudget}
        onOpenBudget={() => setShowBudget(true)}
        onOpenTechnical={showTechnicalFindings}
        onSaveDesign={handleSaveDesign}
        onRequestQuote={() => openImplementation()}
        requestQuoteLabel={tenant.experience.copy.roomStudio.primaryCta}
        onResetRoom={studio.resetRoom}
      />

      <RoomPresetDialog
        open={showPresets}
        onClose={() => setShowPresets(false)}
        onApply={applyPreset}
        products={studio.products}
        placedCount={studio.placedViews.length}
        onApplyStarter={applyStarterRoom}
      />

      <WorkspaceDialog
        open={showBudget}
        title="Ngân sách dự kiến"
        description="Không bắt buộc. Có mốc này, LivLab mới nói được combo đang vượt hay còn dư."
        onClose={() => setShowBudget(false)}
      >
        <BudgetTargetCard targetBudget={studio.state.targetBudget} onChange={studio.setTargetBudget} />
      </WorkspaceDialog>

      <WorkspaceDialog
        open={showReferenceImage}
        title="Ảnh tham chiếu phong cách"
        description="Ảnh chỉ dùng để tham khảo phong cách. Không gian 3D được dựng từ kích thước bạn nhập."
        onClose={() => setShowReferenceImage(false)}
      >
        <RoomContextPanel
          contextImage={studio.state.roomContextImage}
          contextLabel={studio.state.roomContextLabel}
          onContextChange={studio.setRoomContextImage}
        />
      </WorkspaceDialog>

      <WorkspaceDialog open={showGuide} title="Hướng dẫn nhanh" onClose={() => setShowGuide(false)}>
        <ol className="space-y-3 text-[13px] leading-relaxed text-[#3F4F5C]">
          <li>
            <strong className="font-medium text-[#0B1623]">1. Nhập kích thước phòng.</strong> Ba ô
            Dài / Rộng / Cao trong thẻ PHÒNG. Phòng 3D dựng lại ngay theo số bạn nhập.
            <button
              type="button"
              onClick={() => {
                setShowGuide(false);
                setShowPresets(true);
              }}
              className="ml-1 font-medium text-[#0F3D5C] underline decoration-[#C8D5DE] underline-offset-4"
            >
              Chọn kích thước mẫu
            </button>
          </li>
          <li>
            <strong className="font-medium text-[#0B1623]">2. Chọn vật liệu sàn và tường.</strong> Thẻ
            VẬT LIỆU — chất liệu, màu và độ hoàn thiện, đổi là thấy ngay trong phòng.
          </li>
          <li>
            <strong className="font-medium text-[#0B1623]">3. Đưa sản phẩm vào phòng.</strong> Bấm
            <span className="font-semibold"> + THÊM</span> hoặc kéo thẳng từ danh sách vào phòng. Mỗi
            sản phẩm hiện đúng kích thước thật của nó.
          </li>
          <li>
            <strong className="font-medium text-[#0B1623]">4. Khai báo điểm kỹ thuật.</strong> Thẻ KỸ
            THUẬT — chọn loại điểm rồi chạm vào sơ đồ. LivLab chỉ kiểm tra được khi biết các điểm này
            ở đâu.
          </li>
          <li>
            <strong className="font-medium text-[#0B1623]">5. Gửi yêu cầu báo giá.</strong> Showroom
            xác nhận giá cuối, tồn kho và chi phí lắp đặt.
          </li>
        </ol>

        <p className="mt-4 border-t border-[#EDF2F5] pt-3 text-[12px] leading-relaxed text-[#8C9BAB]">
          Sản phẩm chưa có mô hình 3D được dựng bằng khối đúng kích thước thật — đủ để kiểm tra độ vừa
          vặn, nhưng không phải hình dạng sản phẩm.
        </p>

        <Link
          href="/visual-studio"
          className="mt-3 inline-block text-[13px] font-medium text-[#0F3D5C] underline decoration-[#C8D5DE] underline-offset-4"
        >
          Muốn thử sản phẩm trực tiếp trên ảnh phòng? Mở Visual Studio 2D →
        </Link>
      </WorkspaceDialog>

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

      {/* Opened only when asked for — from "Gợi ý combo" in the product panel.
          The card that used to float over the workspace is gone. */}
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
        onAddProductToQuote={addToQuote}
      />

      {/* Top-right, clear of both bars. At the bottom it landed on the
          selected-product toolbar, which is exactly where the customer is
          looking after adding something. */}
      {toast && (
        <div
          role="status"
          className="fixed right-4 top-28 z-[80] flex items-center gap-2 rounded bg-[color:var(--tenant-ui-ink,#123C5A)] px-4 py-2.5 text-white shadow-xl"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-[#DCEBF5]" aria-hidden />
          <span className="max-w-[420px] text-[13px] font-medium">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
              className="ml-1 shrink-0 rounded border border-white/40 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/10"
            >
              Hoàn tác
            </button>
          )}
        </div>
      )}
    </div>
  );
}
