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
  const { addItem, hasItem } = useQuote();
  const [showCeiling, setShowCeiling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  }, []);

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
              selectedMaterials={studio.state.selectedMaterials}
              onMaterialChange={studio.setMaterial}
              showCeiling={showCeiling}
              onToggleCeiling={setShowCeiling}
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
              floorMaterialId={studio.state.selectedMaterials.floor}
              wallMaterialId={studio.state.selectedMaterials.walls}
              placedViews={studio.placedViews}
              selectedInstanceId={studio.selectedInstanceId}
              showCeiling={showCeiling}
              onSelect={studio.setSelectedInstanceId}
              onMove={studio.moveProduct}
              onDropProduct={handleDropProduct}
            />

            {studio.selected ? (
              <SelectedProductToolbar
                selection={studio.selected}
                isInQuote={hasItem(studio.selected.product.id)}
                onRotate={studio.rotateProduct}
                onDuplicate={studio.duplicateProduct}
                onRemove={studio.removeProduct}
                onAddToQuote={handleAddToQuote}
              />
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
