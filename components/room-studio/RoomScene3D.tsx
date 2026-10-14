'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AlertCircle, Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { DEFAULT_CAMERA_FOV } from '@/lib/room-studio/roomGeometry';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { Vec3 } from '@/lib/room-studio/placementRules';
import RoomShell from './scene/RoomShell';
import type { SurfaceStyle } from '@/lib/room-studio/materials';
import PlacedProductNode, { type measureGlbForPlacement } from './scene/PlacedProductNode';

/** What `measureGlbForPlacement` returns; named so the dev prop can state it. */
type GlbMeasurement = ReturnType<typeof measureGlbForPlacement>;
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
  /** Chrome rendered over the canvas's top-left corner (the layout toggle). */
  overlayTopLeft?: ReactNode;
  floorStyle: SurfaceStyle;
  wallStyle: SurfaceStyle;
  placedViews: PlacedProductView[];
  selectedInstanceId: string | null;
  showCeiling: boolean;
  onToggleCeiling: (value: boolean) => void;
  onSelect: (instanceId: string | null) => void;
  onMove: (instanceId: string, position: Vec3) => void;
  /** Drop a product from the library onto a point on the floor. */
  onDropProduct: (productId: string, point: Vec3) => void;
  /** Jumps the product library to a category, from the empty-room prompt. */
  onPickCategory?: (normalizedCategory: string) => void;
  /**
   * Extra objects rendered INSIDE the Canvas. Used only by the dev pipeline
   * harness at /dev/room-studio-3d-test for bounding boxes, a pivot marker and
   * axes; the customer workspace never passes it, which is why the helpers
   * cannot appear there by accident. It exists so the harness can exercise the
   * real scene rather than a copy of it that could pass while this one is
   * broken.
   */
  devSceneOverlay?: ReactNode;
  /** Dev harness only: forwarded to the placed node so the QA panel can report
   *  what the renderer measured rather than measuring the file a second way. */
  onModelMeasured?: (measurement: GlbMeasurement) => void;
  /** Dev harness only: a GLB that failed to load. */
  onModelLoadError?: () => void;
}

export default function RoomScene3D({
  dimensions,
  overlayTopLeft,
  floorStyle,
  wallStyle,
  placedViews,
  selectedInstanceId,
  showCeiling,
  onToggleCeiling,
  onSelect,
  onMove,
  onDropProduct,
  onPickCategory,
  devSceneOverlay,
  onModelMeasured,
  onModelLoadError,
}: RoomScene3DProps) {
  const [resetSignal, setResetSignal] = useState(0);
  const [dragging, setDragging] = useState<{ instanceId: string; offset: Vec3 } | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      // Absolutely filling a positioned parent, NOT `h-full`.
      //
      // A percentage height needs a parent with a definite height, and every
      // ancestor here is a flex item sized by layout — so `h-full` measured as
      // zero on the first pass and the Canvas mounted at the HTML default
      // 300×150, showing an empty grey box for a second before react-three-
      // fiber's resize observer caught up. The workspace gives this component a
      // `relative` box; filling it is unambiguous at the first measurement.
      // `select-none`: a drag across the viewport is a gesture, not a text
      // selection. Without it the hint strip and the labels sitting over the
      // canvas highlight blue mid-drag, which reads as the drag having gone
      // wrong at exactly the moment it is going right.
      className={`absolute inset-0 select-none overflow-hidden bg-[#E9EEF1] transition-colors ${
        isDropTarget ? 'ring-2 ring-inset ring-[#C8A96A]' : ''
      }`}
    >
      {overlayTopLeft && <div className="absolute left-3 top-3 z-10 flex gap-2">{overlayTopLeft}</div>}

      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setResetSignal((n) => n + 1)}
          title="Đưa góc nhìn về mặc định"
          className="flex items-center gap-1.5 rounded border border-[#D8E2EA] bg-white/92 px-2.5 py-1.5 text-[12px] font-medium text-[#0B1623] shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Xem góc chuẩn</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleCeiling(!showCeiling)}
          aria-pressed={showCeiling}
          title={showCeiling ? 'Ẩn trần phòng' : 'Hiện trần phòng'}
          className="flex items-center gap-1.5 rounded border border-[#D8E2EA] bg-white/92 px-2.5 py-1.5 text-[12px] font-medium text-[#0B1623] shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          {showCeiling ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className="hidden lg:inline">Trần</span>
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded bg-white/85 px-2.5 py-1.5 text-[12px] text-[#5B6B7A] shadow-sm backdrop-blur sm:block">
        Kéo để xoay · Cuộn để phóng to · Kéo sản phẩm để đổi vị trí
      </div>

      <CanvasErrorBoundary>
        <Canvas
          // Position is set by RoomCameraControls on mount, where the canvas's
          // real aspect ratio is known. Framing the room from here would mean
          // guessing it.
          camera={{ fov: DEFAULT_CAMERA_FOV }}
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
              onMeasured={onModelMeasured}
              onLoadError={onModelLoadError}
            />
          ))}

          {devSceneOverlay}

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

      {/* An empty room is a valid state, not an error — the prompt suggests the
          three products a bathroom is actually planned around and gets out of
          the way of the space itself. */}
      {placedViews.length === 0 && (
        <div className="absolute inset-x-0 bottom-10 flex justify-center px-6">
          <div className="rounded border border-[#D8E2EA] bg-white/95 px-4 py-3 text-center shadow-sm backdrop-blur">
            <p className="text-[13px] font-medium text-[#0B1623]">Bắt đầu với một thiết bị chính.</p>
            {onPickCategory && (
              <div className="mt-2 flex justify-center gap-1.5">
                {[
                  { id: 'toilet', label: 'Bồn cầu' },
                  { id: 'lavabo', label: 'Lavabo' },
                  { id: 'shower', label: 'Sen tắm' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPickCategory(c.id)}
                    className="rounded border border-[#D8E2EA] px-2.5 py-1 text-[12px] font-medium text-[#3F4F5C] transition-colors hover:border-[#0B2239]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
