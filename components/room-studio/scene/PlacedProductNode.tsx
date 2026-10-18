'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import { getRealWorldSize, resolveModelScale } from '@/lib/room-studio/assetResolver';
import type { PlacementStatus } from '@/lib/room-studio/placementStatus';
import { PLACEMENT_STATUS_COLOR } from '@/lib/room-studio/placementStatus';
import { BASIN_COUNTER, basinCounterExtent } from '@/lib/room-studio/environment';

/**
 * Largest disagreement, per axis, between the model the renderer loaded and
 * the envelope recorded for it before the scene will draw it as the product.
 * A replaced or re-exported file that drifted further than this is shown as
 * its true-size volume with "chưa khả dụng", never stretched to fit.
 */
const RECONSTRUCTION_TOLERANCE = 0.01;

/**
 * Edges sharper than this keep a hard normal; everything gentler is smoothed.
 * Thirty degrees keeps a cistern lid's edge crisp and a bowl's curve round.
 */
const CREASE_ANGLE = Math.PI / 6;

/**
 * Normals for primitives exported without them, once per loaded file.
 *
 * glTF lets a file omit NORMAL, and three's loader then draws it flat-shaded:
 * a glazed bowl becomes a faceted polyhedron, which reads as a cheap model of
 * the product rather than the product. Four of the six INAX reconstruction
 * files omit them. Creased normals are derived from the positions — no vertex
 * moves, no size changes, the measured envelope is identical — and the result
 * is shared by every placed copy through the loader's cache.
 */
function prepareLoadedScene(scene: THREE.Object3D) {
  if (scene.userData.livlabPrepared) return;
  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || mesh.geometry.attributes.normal) return;
    mesh.geometry = toCreasedNormals(mesh.geometry, CREASE_ANGLE);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const std = material as THREE.MeshStandardMaterial;
      if (std.flatShading) {
        std.flatShading = false;
        std.needsUpdate = true;
      }
    }
  });
  scene.userData.livlabPrepared = true;
}

/** Category tints for the footprint volume, matched to the LivLab palette. */
const CATEGORY_TINT: Record<string, string> = {
  lavabo: '#7FA8C4',
  faucet: '#C8A96A',
  toilet: '#8FB0A0',
  bathtub: '#A9C0CF',
  shower: '#9AA7C4',
  mirror: '#B9C6CE',
  vanity: '#C0A88C',
  lighting: '#E2C98B',
};

function tintFor(category: string): string {
  return CATEGORY_TINT[category] ?? '#9FB0BD';
}

/**
 * What the renderer does to a loaded GLB before drawing it.
 *
 * Exported because the dev pipeline harness reports these numbers, and a
 * harness that measures the asset its own way can pass while the renderer is
 * wrong. `rawSize` is the file as authored, `scale` normalises its largest
 * dimension to the product's largest real-world dimension — so a .glb authored
 * in millimetres and one authored in metres both come out correct — and
 * `offset` re-centres it on its own bounding box, which is why the stored
 * position always means "centre of the product" whatever pivot the asset was
 * authored with.
 */
export function measureGlbForPlacement(
  instance: THREE.Object3D,
  product: RoomStudioProduct
): { rawSize: THREE.Vector3; scale: number; renderedSize: THREE.Vector3; offset: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(instance);
  const rawSize = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = resolveModelScale(product, { x: rawSize.x, y: rawSize.y, z: rawSize.z });
  return {
    rawSize,
    scale,
    renderedSize: rawSize.clone().multiplyScalar(scale),
    offset: center.clone().multiplyScalar(-scale),
  };
}

/**
 * A GLB rendered at true real-world scale.
 *
 * The scale factor itself is computed by assetResolver; nothing here hardcodes
 * a number.
 */
function GlbProduct({
  product,
  selected,
  statusColor,
  onMeasured,
}: {
  product: RoomStudioProduct;
  selected: boolean;
  statusColor?: string;
  /** Dev harness only. Undefined in the customer workspace. */
  onMeasured?: (measurement: ReturnType<typeof measureGlbForPlacement>) => void;
}) {
  const { scene } = useGLTF(product.model3dUrl!);

  // One clone per instance so two copies of the same SKU can be placed and moved
  // independently. Geometries and materials stay shared with drei's cache on
  // purpose — disposing them here would blank out every other instance.
  const instance = useMemo(() => {
    prepareLoadedScene(scene);
    const copy = scene.clone(true);
    copy.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      // The product is lit by the room: it casts onto the floor and walls and
      // receives the room's shadows. Its materials are the file's own.
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return copy;
  }, [scene]);

  const measurement = useMemo(() => measureGlbForPlacement(instance, product), [instance, product]);
  const { scale, offset: yOffset } = measurement;

  // A reconstruction is drawn at scale 1, as authored and as measured. If what
  // loaded is not the envelope on record, the file is not the one that passed
  // QA: refuse it here so the boundary shows the true-size volume instead.
  if (product.reconstruction) {
    const b = product.reconstruction.boundsM;
    const expected = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    const got = [measurement.rawSize.x, measurement.rawSize.y, measurement.rawSize.z];
    const worst = Math.max(...expected.map((e, i) => Math.abs(got[i] - e) / e));
    if (!(worst <= RECONSTRUCTION_TOLERANCE)) {
      throw new Error(
        `[Room Studio] ${product.sku}: loaded model measures ${got.map((v) => v.toFixed(3)).join(' × ')} m, ` +
          `expected ${expected.map((v) => v.toFixed(3)).join(' × ')} m`
      );
    }
  }

  useEffect(() => {
    onMeasured?.(measurement);
  }, [measurement, onMeasured]);

  return (
    <group>
      <group position={[yOffset.x, yOffset.y, yOffset.z]} scale={scale}>
        <primitive object={instance} />
      </group>
      {selected && <SelectionFrame product={product} color={statusColor} />}
    </group>
  );
}

/**
 * The product's true envelope as an outline — the selection affordance, in
 * the colour of its placement status: green fits, amber is a clearance
 * warning, red is a collision, outside the room or off its mounting surface.
 */
function SelectionFrame({ product, color = '#C8A96A' }: { product: RoomStudioProduct; color?: string }) {
  const size = getRealWorldSize(product);
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(size.width, size.height, size.depth)),
    [size.width, size.height, size.depth]
  );
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={color} transparent opacity={0.95} />
    </lineSegments>
  );
}

/**
 * The footprint on the floor, drawn while a floor or counter product is
 * selected: the area it really takes, so a customer judging a gap is judging
 * the product and not its shadow.
 */
function FloorFootprint({ product, centreY, color }: { product: RoomStudioProduct; centreY: number; color: string }) {
  const size = getRealWorldSize(product);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size.width, size.depth);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [size.width, size.depth]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <group position={[0, -centreY + 0.004, 0]}>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={2}>
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
}

/**
 * The counter a countertop basin rests on, when nothing else in the room is
 * under it: a stone top with a slim floating cabinet. Context, not product —
 * it is never quoted, and the room's architecture settings switch it off.
 */
function BasinCounter({ product }: { product: RoomStudioProduct }) {
  const size = getRealWorldSize(product);
  const c = basinCounterExtent(size);
  const bottomOfBasin = -size.height / 2;
  const midZ = (c.front + c.back) / 2;
  return (
    <group>
      <mesh position={[0, bottomOfBasin - BASIN_COUNTER.top / 2, midZ]} castShadow receiveShadow>
        <boxGeometry args={[c.width, BASIN_COUNTER.top, c.depth]} />
        <meshStandardMaterial color="#E7E2D9" roughness={0.38} />
      </mesh>
      <mesh
        position={[0, bottomOfBasin - BASIN_COUNTER.top - BASIN_COUNTER.cabinet / 2, midZ - 0.02]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[c.width - 0.02, BASIN_COUNTER.cabinet, c.depth - 0.04]} />
        <meshStandardMaterial color="#8C6C4F" roughness={0.62} />
      </mesh>
    </group>
  );
}

function ProductPlaceholder({
  product,
  selected,
  statusColor,
}: {
  product: RoomStudioProduct;
  selected: boolean;
  statusColor?: string;
}) {
  const size = getRealWorldSize(product);
  const color = tintFor(product.normalizedCategory);

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial color={color} transparent opacity={selected ? 0.55 : 0.4} roughness={0.5} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size.width, size.height, size.depth)]} />
        <lineBasicMaterial color={selected ? statusColor ?? '#C8A96A' : color} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

/**
 * The in-scene label.
 *
 * Hovering gives the name. Selecting also gives the brand, the SKU and the
 * measured size, and — where there is no runtime model — says in words that the
 * volume is a size and not a shape. That sentence is the whole reason the label
 * grew: a grey cuboid standing where a toilet should be is read as the product
 * unless something says otherwise, and the scene is where the customer is
 * looking, not the panel.
 */
function ProductLabel({
  product,
  detailed,
  loadFailed = false,
}: {
  product: RoomStudioProduct;
  detailed: boolean;
  loadFailed?: boolean;
}) {
  const size = getRealWorldSize(product);
  const mm = (metres: number) => Math.round(metres * 1000);
  const isPlaceholder = !product.model3dUrl;

  return (
    // No `distanceFactor`: the label is chrome, not geometry, so it keeps one
    // readable size instead of growing as the camera pulls back. With a scale
    // factor it reached half the height of the room when the viewport became
    // the dominant column, which is the opposite of a subtle annotation.
    //
    // Anchored by its bottom edge rather than `center`, because a label the
    // size of a basin, centred on a point just above a basin, covers the basin.
    <Html position={[0, size.height / 2 + 0.06, 0]} pointerEvents="none" zIndexRange={[20, 0]}>
      <div
        style={{ transform: 'translate(-50%, -100%)' }}
        className="pointer-events-none w-max max-w-[200px] rounded bg-[#0B1623]/92 px-2 py-1 text-center text-white shadow-md"
      >
        {detailed && (product.brand || product.sku) && (
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">
            {[product.brand, product.sku].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-[11px] font-medium leading-snug">
          {product.name.length > 34 ? `${product.name.slice(0, 34)}…` : product.name}
        </p>
        {detailed && (
          <p className="mt-0.5 text-[10px] tabular-nums text-white/70">
            {mm(size.width)} × {mm(size.depth)} × {mm(size.height)} mm
          </p>
        )}
        {/* Three different situations, three different sentences. A model that
            failed to load is not a model that does not exist yet, and telling
            the customer it is "đang cập nhật" would hide a bug behind a
            roadmap. */}
        {detailed && loadFailed && (
          <p className="mt-0.5 text-[10px] text-[#E8A33D]">Mô hình 3D hiện chưa khả dụng.</p>
        )}
        {detailed && !loadFailed && isPlaceholder && (
          <p className="mt-0.5 text-[10px] text-[#E2C98B]">Mô hình 3D đang cập nhật</p>
        )}
        {/* A reconstruction is real geometry, and says it is LivLab's. */}
        {detailed && !loadFailed && product.reconstruction && (
          <p className="mt-0.5 text-[10px] text-[#B9D3C4]">Mô hình 3D tái tạo · không phải file hãng</p>
        )}
        {detailed && !loadFailed && product.reconstruction?.illustrativeParts && (
          <p className="mt-0.5 text-[10px] text-[#E2C98B]">Vòi chỉ để minh hoạ</p>
        )}
      </div>
    </Html>
  );
}

/** Shown while a GLB downloads, at the size the product will end up occupying. */
function LoadingVolume({ product }: { product: RoomStudioProduct }) {
  const size = getRealWorldSize(product);
  return (
    <mesh>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshStandardMaterial color="#C8D5DE" transparent opacity={0.35} />
    </mesh>
  );
}

/**
 * Keeps one failed asset from taking the whole Canvas down with it.
 *
 * It reports the failure upward as well as swallowing it: the product still
 * draws as its true-size volume, which is the right fallback, but the label has
 * to be able to say that the model failed rather than that it does not exist.
 */
class ModelBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[Room Studio] model failed to load:', error);
    this.props.onError();
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface PlacedProductNodeProps {
  placed: PlacedProduct;
  product: RoomStudioProduct;
  selected: boolean;
  /** Where this placement stands against the room's rules; colours its outline. */
  status?: PlacementStatus;
  /** Draw the context counter under a countertop product. */
  showCounter?: boolean;
  onSelect: (instanceId: string) => void;
  onDragStart: (instanceId: string, grabOffset: [number, number, number]) => void;
  /** Dev harness only (see /dev/room-studio-3d-test). Undefined in the workspace. */
  onMeasured?: (measurement: ReturnType<typeof measureGlbForPlacement>) => void;
  /** Dev harness only. Reports a GLB that failed to load. */
  onLoadError?: () => void;
}

export default function PlacedProductNode({
  placed,
  product,
  selected,
  status,
  showCounter = false,
  onSelect,
  onDragStart,
  onMeasured,
  onLoadError,
}: PlacedProductNodeProps) {
  const [hovered, setHovered] = useState(false);
  // `makeDefault` on OrbitControls publishes the instance here.
  const controls = useThree((state) => state.controls) as { enabled: boolean } | null;
  /**
   * WHICH url failed, not whether one did.
   *
   * An error boundary latches: once `getDerivedStateFromError` fires it renders
   * its fallback forever, so a product whose model failed once stayed broken
   * even after the url changed to one that works. Recording the url makes the
   * failure derived — it stops applying the moment the product points at a
   * different asset — and keying the boundary on the url gives it a fresh
   * instance to go with it.
   */
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const modelUrl = product.model3dUrl;
  const modelFailed = failedUrl !== null && failedUrl === modelUrl;
  const groupRef = useRef<THREE.Group>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    /**
     * Stop the camera in this event, not in the next render.
     *
     * `RoomCameraControls` takes `enabled={!dragging}`, and `dragging` is React
     * state: by the time that prop reaches OrbitControls the browser has
     * already delivered this same pointerdown to OrbitControls' own listener on
     * the canvas, and it has begun an orbit. r3f's `stopPropagation` does not
     * help — it stops the raycast chain, not a DOM listener on a sibling.
     *
     * The result was the thing that made the product feel stuck: the first
     * gesture rotated the room, and because damping is on it kept rotating
     * afterwards. Setting `enabled` on the instance here runs inside the same
     * event, before OrbitControls reads it, so one gesture does one thing. The
     * `enabled` prop then re-asserts the same value on the next render, and
     * restores it when the drag ends.
     */
    if (controls) controls.enabled = false;

    // Keep receiving moves even when the pointer leaves the product — or the
    // canvas — so a quick drag cannot outrun its own hit target.
    const target = e.nativeEvent.target as Element | null;
    if (target && 'setPointerCapture' in target) {
      try {
        target.setPointerCapture(e.nativeEvent.pointerId);
      } catch {
        // Safari throws when the pointer is already released. Nothing to do:
        // the window-level pointerup in RoomScene3D still ends the drag.
      }
    }

    onSelect(placed.instanceId);
    // Remember where inside the product the customer grabbed it, so it does not
    // snap its centre to the cursor the moment the drag begins.
    onDragStart(placed.instanceId, [
      placed.position[0] - e.point.x,
      placed.position[1] - e.point.y,
      placed.position[2] - e.point.z,
    ]);
  };

  const showLabel = hovered || selected;
  const statusColor = status ? PLACEMENT_STATUS_COLOR[status] : undefined;

  return (
    <group
      ref={groupRef}
      position={placed.position}
      rotation={[0, placed.rotationY, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {modelUrl ? (
        <ModelBoundary
          key={modelUrl}
          fallback={<ProductPlaceholder product={product} selected={selected} statusColor={statusColor} />}
          onError={() => {
            setFailedUrl(modelUrl);
            onLoadError?.();
          }}
        >
          <Suspense fallback={<LoadingVolume product={product} />}>
            <GlbProduct product={product} selected={selected} statusColor={statusColor} onMeasured={onMeasured} />
          </Suspense>
        </ModelBoundary>
      ) : (
        <ProductPlaceholder product={product} selected={selected} statusColor={statusColor} />
      )}

      {showCounter && placed.placementType === 'counter' && <BasinCounter product={product} />}

      {selected && placed.placementType !== 'wall' && (
        <FloorFootprint product={product} centreY={placed.position[1]} color={statusColor ?? '#C8A96A'} />
      )}

      <GrabVolume product={product} />

      {showLabel && <ProductLabel product={product} detailed={selected} loadFailed={modelFailed} />}
    </group>
  );
}

/**
 * The thing the pointer actually has to hit.
 *
 * Without it the grab target is the mesh itself, and a basin is 125mm tall in a
 * five-metre room — a few pixels of silhouette, with gaps you can see straight
 * through. Missing it did not do nothing, which is the real problem: the click
 * fell through to the room and became an orbit, so trying to move a product
 * spun the space instead.
 *
 * So every product carries an invisible box at its real size, never smaller
 * than 18cm on a side, which is about a fingertip at normal zoom. It is only a
 * pointer target: transparent, no depth write, and behind the model in render
 * order, so it changes what you can grab and nothing about what you see.
 */
function GrabVolume({ product }: { product: RoomStudioProduct }) {
  const size = getRealWorldSize(product);
  const MIN = 0.18;
  return (
    <mesh renderOrder={-1}>
      <boxGeometry
        args={[
          Math.max(size.width, MIN),
          Math.max(size.height, MIN),
          Math.max(size.depth, MIN),
        ]}
      />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
