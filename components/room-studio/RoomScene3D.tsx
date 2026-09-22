'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AlertCircle, Maximize2, RotateCcw } from 'lucide-react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { getDefaultCameraFraming } from '@/lib/room-studio/roomGeometry';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { Vec3 } from '@/lib/room-studio/placementRules';
import RoomShell from './scene/RoomShell';
import type { SurfaceStyle } from '@/lib/room-studio/materials';
import PlacedProductNode from './scene/PlacedProductNode';
import DragPlane from './scene/DragPlane';
import RoomCameraControls from './scene/RoomCameraControls';

/** A WebGL context loss or an out-of-memory model must not blank the page. */
class CanvasErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[Room Studio] canvas crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8FAFC] p-6">
          <div className="w-full max-w-md rounded-[20px] border border-[#D8E2EA] bg-white p-6 text-center shadow-lg">
            <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
            <p className="text-lg font-bold text-[#0B1623]">Không hiển thị được không gian 3D</p>
            <p className="mt-2 text-sm text-[#627386]">
              Trình duyệt đã quá tải bộ nhớ đồ hoạ. Vui lòng tải lại trang hoặc bớt số sản phẩm trong phòng. Các sản
              phẩm bạn đã chọn vẫn được giữ nguyên.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * drei's `Environment` preset streams an HDR from an external CDN. A network
 * failure there must degrade to the plain directional lighting rather than
 * bringing down the Canvas, so it gets its own boundary and Suspense.
 */
class EnvironmentBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    console.warn('[Room Studio] environment map unavailable, falling back to direct lighting.');
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

interface RoomScene3DProps {
  dimensions: RoomDimensions;
  floorStyle: SurfaceStyle;
  wallStyle: SurfaceStyle;
  placedViews: PlacedProductView[];
  selectedInstanceId: string | null;
  showCeiling: boolean;
  onSelect: (instanceId: string | null) => void;
  onMove: (instanceId: string, position: Vec3) => void;
  /** Drop a product from the library onto a point on the floor. */
  onDropProduct: (productId: string, point: Vec3) => void;
}

export default function RoomScene3D({
  dimensions,
  floorStyle,
  wallStyle,
  placedViews,
  selectedInstanceId,
  showCeiling,
  onSelect,
  onMove,
  onDropProduct,
}: RoomScene3DProps) {
  const [resetSignal, setResetSignal] = useState(0);
  const [dragging, setDragging] = useState<{ instanceId: string; offset: Vec3 } | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialCamera = useMemo(() => getDefaultCameraFraming(dimensions), [dimensions]);

  const draggingView = useMemo(
    () => placedViews.find((v) => v.placed.instanceId === dragging?.instanceId) ?? null,
    [placedViews, dragging]
  );

  // A pointer released outside the Canvas must still end the drag, otherwise the
  // product would keep following the cursor after the button is up.
  useEffect(() => {
    if (!dragging) return;
    const end = () => setDragging(null);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging]);

  /**
   * Frees the GPU memory of GLBs no product in the room uses any more. drei's
   * useGLTF keeps a module-level cache, so without this the 17MB lavabo asset
   * would stay resident for the rest of the session after being removed.
   */
  const loadedUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const inUse = new Set(placedViews.map((v) => v.product.model3dUrl).filter((u): u is string => Boolean(u)));
    inUse.forEach((url) => loadedUrls.current.add(url));
    loadedUrls.current.forEach((url) => {
      if (!inUse.has(url)) {
        useGLTF.clear(url);
        loadedUrls.current.delete(url);
      }
    });
  }, [placedViews]);

  const handleDragStart = useCallback((instanceId: string, offset: Vec3) => {
    setDragging({ instanceId, offset });
  }, []);

  const handleDragMove = useCallback(
    (point: Vec3) => {
      if (!dragging) return;
      onMove(dragging.instanceId, [
        point[0] + dragging.offset[0],
        point[1] + dragging.offset[1],
        point[2] + dragging.offset[2],
      ]);
    },
    [dragging, onMove]
  );

  /** Projects a drop point from screen coordinates onto the floor plane. */
  const handleHtmlDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropTarget(false);
    const productId = e.dataTransfer.getData('application/livlab-product');
    const camera = cameraRef.current;
    const container = containerRef.current;
    if (!productId || !camera || !container) return;

    const rect = container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;

    onDropProduct(productId, [hit.x, hit.y, hit.z]);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleHtmlDrop}
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-[#F8FAFC] shadow-inner transition-colors md:aspect-[16/10] ${
        isDropTarget ? 'border-[#C8A96A] ring-2 ring-[#C8A96A]/40' : 'border-[#D8E2EA]'
      }`}
    >
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => setResetSignal((n) => n + 1)}
          className="flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#0B1623] shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Xem góc chuẩn</span>
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-lg bg-white/85 px-2.5 py-1.5 text-[10px] font-medium text-[#627386] shadow-sm backdrop-blur sm:block">
        Kéo để xoay · Cuộn để phóng to · Kéo sản phẩm để đổi vị trí
      </div>

      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: initialCamera.position, fov: 50 }}
          onCreated={(state) => {
            cameraRef.current = state.camera;
          }}
          onPointerMissed={() => onSelect(null)}
          className="h-full w-full bg-[#E9EEF1]"
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 6, 5]} intensity={0.85} castShadow />
          <directionalLight position={[-5, 4, -4]} intensity={0.25} />
          <EnvironmentBoundary>
            <Suspense fallback={null}>
              <Environment preset="apartment" />
            </Suspense>
          </EnvironmentBoundary>

          <RoomCameraControls dimensions={dimensions} enabled={!dragging} resetSignal={resetSignal} />

          <RoomShell
            dimensions={dimensions}
            floorStyle={floorStyle}
            wallStyle={wallStyle}
            showCeiling={showCeiling}
          />

          <ContactShadows
            position={[0, 0.002, 0]}
            scale={Math.max(dimensions.length, dimensions.width) * 1.5}
            opacity={0.35}
            blur={2.2}
            far={2}
            resolution={512}
          />

          {placedViews.map(({ placed, product }) => (
            <PlacedProductNode
              key={placed.instanceId}
              placed={placed}
              product={product}
              selected={placed.instanceId === selectedInstanceId}
              onSelect={onSelect}
              onDragStart={handleDragStart}
            />
          ))}

          {dragging && draggingView && (
            <DragPlane
              dimensions={dimensions}
              placementType={draggingView.placed.placementType}
              wall={draggingView.placed.wall}
              onMove={handleDragMove}
              onEnd={() => setDragging(null)}
            />
          )}
        </Canvas>
      </CanvasErrorBoundary>

      {placedViews.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-6">
          <div className="rounded-2xl border border-[#D8E2EA] bg-white/95 px-4 py-3 text-center shadow-sm backdrop-blur">
            <Maximize2 className="mx-auto mb-1.5 h-5 w-5 text-[#C8A96A]" />
            <p className="text-xs font-bold text-[#0B1623]">Phòng của bạn đã sẵn sàng</p>
            <p className="mt-0.5 text-[11px] text-[#627386]">Chọn sản phẩm từ thư viện bên dưới để đưa vào không gian.</p>
          </div>
        </div>
      )}
    </div>
  );
}
