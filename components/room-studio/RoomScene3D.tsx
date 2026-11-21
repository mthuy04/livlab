'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AlertCircle, Box, Eye, EyeOff, Focus, LayoutGrid, Footprints } from 'lucide-react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { DEFAULT_CAMERA_FOV } from '@/lib/room-studio/roomGeometry';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { Vec3 } from '@/lib/room-studio/placementRules';
import RoomShell from './scene/RoomShell';
import type { SurfaceStyle } from '@/lib/room-studio/materials';
import type { ArchitectureSettings, LightingPreset } from '@/lib/room-studio/environment';
import type { PlacementStatus } from '@/lib/room-studio/placementStatus';
import { getRealWorldSize } from '@/lib/room-studio/assetResolver';
import SceneLighting, { ReflectionStudio } from './scene/SceneLighting';
import StudioStage from './scene/StudioStage';
import { useRenderQuality } from './scene/useRenderQuality';
import PlacedProductNode, { type measureGlbForPlacement } from './scene/PlacedProductNode';

/** What `measureGlbForPlacement` returns; named so the dev prop can state it. */
type GlbMeasurement = ReturnType<typeof measureGlbForPlacement>;
import { trackPlaneDrag } from './scene/DragPlane';
import RoomCameraControls from './scene/RoomCameraControls';
import WalkthroughOverlay from './scene/WalkthroughOverlay';
import {WalkInput} from '@/lib/room-studio/walkInput';
import {affectedIds, subjectBounds, type CameraRequest} from '@/lib/room-studio/cameraDirector';
import {buildWalkWorld, walkSpawn, type WalkWorld} from '@/lib/room-studio/walkthrough';
import {buildEntries} from '@/lib/technical-advisor/engine';
import {elementsForFlags} from '@/lib/room-studio/architecture';
import type {RoomOperation} from '@/lib/room-studio/roomOperations';

/**
 * Keeps a ref on whichever camera is the default right now. The drop raycast
 * needs the camera the customer is looking through, and the plan view swaps it.
 */
function CameraTracker({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

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
 * The reflection environment is built on the GPU from light panels (see
 * SceneLighting) and needs no network, but a driver that cannot render the
 * cube map must still degrade to direct lighting rather than take the Canvas.
 */
class EnvironmentBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    console.warn('[Room Studio] environment unavailable, falling back to direct lighting.');
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

interface RoomScene3DProps {
  onTourChange?: (active:boolean)=>void;
  incompletePlacements?:boolean;
  proposalSubject?: {before:WalkWorld;operations:RoomOperation[]} | null;
  visualStyle?: import('@/lib/room-studio/stylePacks').VisualStyle;
  dimensions: RoomDimensions;
  /** Chrome rendered over the canvas's top-left corner (the layout toggle). */
  overlayTopLeft?: ReactNode;
  floorStyle: SurfaceStyle;
  wallStyle: SurfaceStyle;
  lighting: LightingPreset;
  architecture: ArchitectureSettings;
  elements?: import('@/lib/room-studio/architecture').ArchitecturalElement[];
  selectedElementId?: string | null;
  /** Per-instance placement state, colouring each outline. */
  placementStatus?: Record<string, PlacementStatus>;
  placedViews: PlacedProductView[];
  selectedInstanceId: string | null;
  showCeiling: boolean;
  onToggleCeiling: (value: boolean) => void;
  onSelect: (instanceId: string | null) => void;
  onMove: (instanceId: string, position: Vec3, tolerance?: number) => void;
  onBeginDrag?: (instanceId: string) => void;
  onEndDrag?: (cancelled: boolean) => void;
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
  spatialOverlay?: ReactNode;
  devSceneOverlay?: ReactNode;
  /** Dev harness only: forwarded to the placed node so the QA panel can report
   *  what the renderer measured rather than measuring the file a second way. */
  onModelMeasured?: (measurement: GlbMeasurement, instanceId: string) => void;
  /** Dev harness only: a GLB that failed to load. */
  onModelLoadError?: () => void;
}

export default function RoomScene3D({
  dimensions,
  overlayTopLeft, visualStyle, onTourChange, incompletePlacements, proposalSubject,
  floorStyle,
  wallStyle,
  lighting,
  architecture, elements, selectedElementId,
  placementStatus,
  placedViews,
  selectedInstanceId,
  showCeiling,
  onToggleCeiling,
  onSelect,
  onMove,
  onBeginDrag,
  onEndDrag,
  onDropProduct,
  onPickCategory,
  spatialOverlay, devSceneOverlay,
  onModelMeasured,
  onModelLoadError,
}: RoomScene3DProps) {
  const [request,setRequest]=useState<CameraRequest>({mode:'overview'});
  const [projection,setProjection]=useState<'orbit'|'plan'|'inside'>('orbit');
  const enterButton=useRef<HTMLButtonElement>(null);
  const walking=request.mode==='walkthrough';
  const previous=useRef<CameraRequest>({mode:'overview'});
  const obstruction=useRef<HTMLParagraphElement>(null);
  const curtain=useRef<HTMLDivElement>(null);
  const [input]=useState(()=>new WalkInput());
  const layout=useMemo(()=>elements??elementsForFlags(dimensions,[],architecture),[elements,dimensions,architecture]);
  const world=useMemo(()=>buildWalkWorld(dimensions,layout,buildEntries(placedViews),architecture.basinCounter),[dimensions,layout,placedViews,architecture.basinCounter]);
  const spawn=useMemo(()=>incompletePlacements?null:walkSpawn(world),[world,incompletePlacements]);
  const proposed=useMemo(()=>proposalSubject && subjectBounds(affectedIds(proposalSubject.operations),proposalSubject.before,world),[proposalSubject,world]);
  const exit=useCallback(()=>{setRequest(previous.current);onTourChange?.(false);requestAnimationFrame(()=>enterButton.current?.focus({preventScroll:true}));},[onTourChange]);
  useEffect(()=>()=>onTourChange?.(false),[onTourChange]);
  const [quality, setQualityTier] = useRenderQuality();
  /**
   * A lost WebGL context — the GPU reclaimed by the browser or the system —
   * leaves a blank canvas forever unless something rebuilds it. The renderer
   * is asked to restore first; if it has not within a moment, the Canvas is
   * remounted on the lighter tier. The room's state lives outside the Canvas,
   * so nothing the customer placed is lost either way.
   */
  const [canvasKey, setCanvasKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  useEffect(() => {
    if (!contextLost) return;
    const timer = setTimeout(() => {
      setQualityTier('low');
      setCanvasKey((k) => k + 1);
      setContextLost(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [contextLost, setQualityTier]);
  const selectedView = placedViews.find((v) => v.placed.instanceId === selectedInstanceId) ?? null;
  const focusSelected = () => {
    if (!selectedView) return;
    const id=selectedView.placed.instanceId;
    const bounds=subjectBounds(new Set([id]),world);
    if(bounds){setRequest({mode:'product',bounds});return;}
    // A visual placeholder is focusable even when its installation envelope is unknown.
    const size=getRealWorldSize(selectedView.product);
    const centre=new THREE.Vector3(...selectedView.placed.position);
    const radius=new THREE.Vector3(size.width,size.height,size.depth).length()/2;
    setRequest({mode:'product',bounds:{min:centre.clone().addScalar(-radius),max:centre.clone().addScalar(radius)}});
  };
  const [dragging, setDragging] = useState(false);
  const cancelDrag = useRef<(() => void) | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => cancelDrag.current?.(), []);

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

  const handleDragStart = useCallback<React.ComponentProps<typeof PlacedProductNode>['onDragStart']>((placed, e) => {
    const canvas = containerRef.current;
    if (!canvas || walking) return;
    cancelDrag.current?.();
    onBeginDrag?.(placed.instanceId);
    setDragging(true);
    cancelDrag.current = trackPlaneDrag(placed, e.point, e.camera, canvas, e.nativeEvent,
      (point,tolerance) => onMove(placed.instanceId, point,tolerance),
      cancelled => {
        cancelDrag.current = null;
        setDragging(false);
        onEndDrag?.(cancelled);
      });
  }, [walking,onBeginDrag, onEndDrag, onMove]);

  /** Projects a drop point from screen coordinates onto the floor plane. */
  const handleHtmlDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropTarget(false);
    if(walking)return;
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
        if(walking)return;
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
      data-camera-mode={request.mode}
      data-render-tier={quality.tier}
      className={`${walking ? 'fixed z-[100]' : 'absolute'} inset-0 touch-none select-none overflow-hidden bg-[#ECE9E4] bg-[radial-gradient(120%_95%_at_50%_36%,#FBFAF8_0%,#F0EDE8_50%,#E4E0DA_100%)] transition-colors ${
        isDropTarget ? 'ring-2 ring-inset ring-[#C8A96A]' : ''
      }`}
    >
      <div ref={curtain} aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[#eef1f2] opacity-0" />
      {walking && <WalkthroughOverlay obstruction={obstruction} input={input} exit={exit}/>}
      {!walking && overlayTopLeft && <div className="absolute bottom-12 left-3 z-10 flex gap-2">{overlayTopLeft}</div>}
      {!walking && <div className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-0.5 rounded-xl border border-[#D8E2EA] bg-white/95 p-1 shadow-[0_6px_20px_rgba(11,34,57,0.08)] backdrop-blur">
        {([
          {mode:'overview',label:'Toàn cảnh',title:'Đưa cả phòng vào khung nhìn',icon:Box,action:()=>setRequest({mode:'overview'})},
          {mode:'plan',label:'Mặt bằng',title:'Nhìn thẳng từ trên xuống như bản vẽ mặt bằng',icon:LayoutGrid,action:()=>setRequest({mode:'plan'})},
          ...(proposed?[{mode:'proposal',label:'Đề xuất',title:'Tập trung vào thay đổi đề xuất',icon:Focus,action:()=>setRequest({mode:'proposal',bounds:proposed})}]:[]),
          ...(selectedView?[{mode:'product',label:'Tập trung',title:'Phóng tới sản phẩm đang chọn',icon:Focus,action:focusSelected}]:[]),
        ]).map(({mode,label,title,icon:Icon,action})=><button key={mode} type="button" aria-label={label} aria-pressed={request.mode===mode}
          title={title} onClick={action}
          className={'flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] disabled:opacity-45 '+(request.mode===mode?'bg-[#0B2239] text-white shadow-sm':'text-[#253641] hover:bg-[#EEF3F7]')}>
          <Icon size={15}/><span className="hidden sm:inline">{label}</span></button>)}
        <button ref={enterButton} type="button" aria-label="Tham quan 3D" disabled={!spawn} onClick={()=>{
          if(!spawn)return;cancelDrag.current?.();previous.current=request;setRequest({mode:'walkthrough'});onTourChange?.(true);
        }} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#253641] transition-colors hover:bg-[#EEF3F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] disabled:opacity-45">
          <Footprints size={15}/>Tham quan 3D</button>
        <button
          type="button"
          onClick={() => onToggleCeiling(!showCeiling)}
          aria-pressed={showCeiling}
          title={showCeiling ? 'Ẩn trần phòng' : 'Hiện trần phòng'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#EEF3F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] ${showCeiling ? 'bg-[#EEF3F7] text-[#0B2239]' : 'text-[#253641]'}`}
        >
          {showCeiling ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className="hidden lg:inline">Trần</span>
        </button>
      </div>}
      {!walking && !spawn && <p role="status" className="absolute right-2 top-16 z-10 max-w-xs rounded bg-white/95 px-2 text-xs">{incompletePlacements || world.unknown.length ? 'Chưa đủ kích thước thiết bị để tham quan an toàn.' : 'Không có vị trí trống để bắt đầu tham quan.'}</p>}

      {/* The hint changes with the selection rather than listing everything at
          once: the arrow keys only do something while a product is selected,
          and a line that mentions them the rest of the time is noise. */}
      {!walking && <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded bg-white/85 px-2.5 py-1.5 text-[12px] text-[#5B6B7A] shadow-sm backdrop-blur sm:block">
        {selectedInstanceId
          ? 'Kéo sản phẩm để đổi vị trí · Phím mũi tên chỉnh từng centimét · Giữ Shift để bước 10cm'
          : request.mode === 'plan'
            ? 'Mặt bằng · Kéo để di chuyển khung nhìn · Cuộn để phóng to · Kéo sản phẩm để đổi vị trí'
            : 'Kéo để xoay · Cuộn để phóng to · Kéo sản phẩm để đổi vị trí'}
      </div>}

      <CanvasErrorBoundary>
        <Canvas
          key={canvasKey}
          // Position is set by RoomCameraControls on mount, where the canvas's
          // real aspect ratio is known. Framing the room from here would mean
          // guessing it.
          camera={{ fov: DEFAULT_CAMERA_FOV, near: 0.05, far: 80 }}
          onCreated={(state) => {
            cameraRef.current = state.camera;
            const canvas = state.gl.domElement;
            canvas.addEventListener('webglcontextlost', (event) => {
              // Without preventDefault the browser never offers it back.
              event.preventDefault();
              console.warn('[Room Studio] WebGL context lost; rebuilding the scene.');
              setContextLost(true);
            });
            canvas.addEventListener('webglcontextrestored', () => setContextLost(false));
          }}
          onPointerMissed={() => {if(!walking)onSelect(null);}}
          className="h-full w-full bg-transparent"
          frameloop="demand"
          dpr={quality.dpr}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows={{ type: THREE.PCFShadowMap }}
        >
          {/* Steps down to the lighter tier when the real frame rate drops;
              never back up within a session, so the room does not flicker
              between two looks. */}
          <PerformanceMonitor onDecline={() => setQualityTier('low')} />
          <CameraTracker cameraRef={cameraRef} />
          <SceneLighting
            windows={visualStyle && !visualStyle.overrides.includes('lighting') ? elements : undefined}
            dimensions={dimensions} lighting={lighting} quality={quality}
          />
          <StudioStage dimensions={dimensions} quality={quality.tier} />
          <EnvironmentBoundary>
            <Suspense fallback={null}>
              <ReflectionStudio resolution={quality.environmentResolution}
                tint={visualStyle && !visualStyle.overrides.includes('lighting') ? '#FFFFFF' : lighting.environmentTint} />
            </Suspense>
          </EnvironmentBoundary>

          <RoomCameraControls obstruction={obstruction} onProjection={setProjection} request={request} world={world} spawn={spawn} input={input} curtain={curtain} enabled={!dragging} />
          <RoomShell visualStyle={visualStyle}
            dimensions={dimensions}
            floorStyle={floorStyle}
            wallStyle={wallStyle}
            enclosed={projection==='inside'} showCeiling={projection==='inside' || showCeiling}
            architecture={architecture} elements={elements} selectedElementId={selectedElementId}
            lighting={lighting}
            textureResolution={quality.textureResolution}
            planView={projection==='plan'}
          />

          <ContactShadows frames={walking ? 8 : Infinity}
            position={[0, 0.002, 0]}
            scale={Math.max(dimensions.length, dimensions.width) * 1.5}
            opacity={0.42}
            smooth={quality.tier === 'high'}
            blur={2.0}
            far={1.2}
            resolution={quality.tier === 'high' ? 1024 : 512}
          />

          {placedViews.map(({ placed, product }) => (
            <PlacedProductNode
              key={placed.instanceId}
              placed={placed}
              product={product}
              interactive={!walking} selected={!walking && placed.instanceId === selectedInstanceId}
              status={placementStatus?.[placed.instanceId]}
              stylePack={placed.placementType==='counter' ? visualStyle?.id : undefined} showCounter={architecture.basinCounter}
              onSelect={onSelect}
              onDragStart={handleDragStart}
              onMeasured={onModelMeasured ? (m) => onModelMeasured(m, placed.instanceId) : undefined}
              onLoadError={onModelLoadError}
            />
          ))}

          {!walking && spatialOverlay}{devSceneOverlay}

        </Canvas>
      </CanvasErrorBoundary>

      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#E9EEF1]/80">
          <p className="rounded bg-white px-4 py-2 text-[13px] font-medium text-[#0B1623] shadow-sm">
            Đang khôi phục không gian 3D…
          </p>
        </div>
      )}

      {/* An empty room is a valid state, not an error — the prompt suggests the
          three products a bathroom is actually planned around and gets out of
          the way of the space itself. */}
      {!walking && placedViews.length === 0 && !elements?.length && (
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
