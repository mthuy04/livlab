'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, Html, RoundedBox } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import { getRealWorldSize, resolveModelScale } from '@/lib/room-studio/assetResolver';
import { STYLE_PACKS, type StylePackId } from '@/lib/room-studio/stylePacks';
import type { PlacementStatus } from '@/lib/room-studio/placementStatus';
import { PLACEMENT_STATUS_COLOR } from '@/lib/room-studio/placementStatus';
import { BASIN_COUNTER, basinCounterExtent } from '@/lib/room-studio/environment';
import { useMirrorReflections } from './mirrorReflections';

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
/** Switches an instance's own LED materials on or off. Three.js objects are mutable by design. */
function setLedLight(materials: THREE.MeshStandardMaterial[], on: boolean) {
  for (const m of materials) {
    m.emissiveIntensity = on ? m.userData.livlabEmissiveIntensity : 0;
    m.needsUpdate = true;
  }
}

/**
 * The light a perimeter LED throws on the wall around its mirror: a soft,
 * continuous glow that follows the mirror's outline and fades over about
 * ten centimetres. Drawn by the scene, not taken from photometric data — the
 * file carries only the glowing diffuser material. A glow rather than point
 * lights: it is even all the way round and costs no extra lighting.
 */
const LED_GLOW_MARGIN = 0.32;
function LedWallWash({ product, color }: { product: RoomStudioProduct; color: THREE.Color }) {
  const { width, height, depth } = getRealWorldSize(product);
  const round = Math.abs(width - height) < 1e-3;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'LivLabLedWallGlow',
        uniforms: {
          glowColor: { value: color },
          halfSize: { value: new THREE.Vector2(width / 2, height / 2) },
          corner: { value: round ? width / 2 : 0.02 },
          strength: { value: 0.6 },
          falloff: { value: 0.075 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() {
            vPos = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 glowColor;
          uniform vec2 halfSize;
          uniform float corner;
          uniform float strength;
          uniform float falloff;
          varying vec2 vPos;
          void main() {
            vec2 q = abs(vPos) - halfSize + corner;
            float outside = max(length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - corner, 0.0);
            gl_FragColor = vec4(glowColor * strength * exp(-outside / falloff), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      }),
    [color, width, height, round]
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh name="livlab-led-wall-glow" position={[0, 0, -depth / 2 - 0.0005]} material={material} renderOrder={1}>
      <planeGeometry args={[width + LED_GLOW_MARGIN * 2, height + LED_GLOW_MARGIN * 2]} />
    </mesh>
  );
}

/** Kelvin to an sRGB light colour (Tanner Helland's fit, 1000–40000 K). */
function kelvinToColor(kelvin: number): THREE.Color {
  const t = kelvin / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

function GlbProduct({
  product,
  selected,
  statusColor,
  lightOn = true,
  onMeasured,
}: {
  product: RoomStudioProduct;
  selected: boolean;
  statusColor?: string;
  /** For a product with its own light (an LED mirror): whether it is on. */
  lightOn?: boolean;
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

  // A product's own light (an LED mirror's diffuser) is a named material in
  // the file. It is cloned for this instance only, so switching one mirror
  // off never darkens another copy of the same SKU.
  const emissive = product.reconstruction?.emissive;
  const ledMaterials = useMemo(() => {
    if (!emissive) return [] as THREE.MeshStandardMaterial[];
    const found: THREE.MeshStandardMaterial[] = [];
    instance.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const swap = (m: THREE.Material) => {
        if (m.name !== emissive.materialName) return m;
        const own = (m as THREE.MeshStandardMaterial).clone();
        own.userData.livlabEmissiveIntensity = (m as THREE.MeshStandardMaterial).emissiveIntensity || 1;
        found.push(own);
        return own;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
    return found;
  }, [instance, emissive]);
  useEffect(() => () => ledMaterials.forEach((m) => m.dispose()), [ledMaterials]);
  useEffect(() => setLedLight(ledMaterials, lightOn), [ledMaterials, lightOn]);
  const lightColor = useMemo(() => (emissive ? kelvinToColor(emissive.colorTemperatureK) : null), [emissive]);

  const measurement = useMemo(() => measureGlbForPlacement(instance, product), [instance, product]);
  const { scale, offset: yOffset } = measurement;

  // A mirror's face reflects the room live. Built after measuring, and drawn
  // beside the instance rather than inside it, so placement still measures
  // exactly the file.
  const reflectors = useMirrorReflections(instance, product.reconstruction?.mirrorFace?.materialName);

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
        {reflectors.map((reflector) => (
          <primitive key={reflector.uuid} object={reflector} />
        ))}
      </group>
      {/* The halo a perimeter LED throws on its wall (see LedWallWash). */}
      {lightColor && lightOn && ledMaterials.length > 0 && <LedWallWash product={product} color={lightColor} />}
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
  useEffect(() => () => edges.dispose(), [edges]);
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
  useEffect(() => () => { edges.dispose(); geometry.dispose(); }, [edges, geometry]);
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
function BasinCounter({ product, pack }: { product: RoomStudioProduct; pack?:StylePackId }) {
  const size = getRealWorldSize(product);
  const c = basinCounterExtent(size);
  const bottomOfBasin = -size.height / 2;
  const midZ = (c.front + c.back) / 2;
  if(pack){
    const finish=STYLE_PACKS[pack], cabinet=c.cabinet;
    const h=BASIN_COUNTER.cabinet, y=bottomOfBasin-BASIN_COUNTER.top;
    return <group>
      <RoundedBox args={[c.width,BASIN_COUNTER.top,c.depth]} radius={.005} smoothness={2}
        position={[0,bottomOfBasin-BASIN_COUNTER.top/2,midZ]} castShadow receiveShadow>
        <meshStandardMaterial color={finish.floor.base} roughness={.31}/>
      </RoundedBox>
      <mesh position={[0,y-h/2,(cabinet.front+cabinet.back-.016)/2]} castShadow receiveShadow>
        <boxGeometry args={[cabinet.width,h,cabinet.front-cabinet.back-.016]}/>
        <meshStandardMaterial color={finish.cabinet} roughness={.47}/>
      </mesh>
      {[0,1].map(i=><RoundedBox key={i} args={[cabinet.width-.009,h/2-.008,.016]} radius={.003} smoothness={1}
        position={[0,y-h*(.25+i*.5),cabinet.front-.008]} receiveShadow>
        <meshStandardMaterial color={finish.cabinet} roughness={.42}/>
      </RoundedBox>)}
      <mesh position={[0,y-h/2,cabinet.front-.014]}><planeGeometry args={[cabinet.width-.012,.005]}/>
        <meshStandardMaterial color={finish.trim} roughness={.38} metalness={.62}/>
      </mesh>
    </group>;
  }
  return (
    <group>
      <mesh position={[0, bottomOfBasin - BASIN_COUNTER.top / 2, midZ]} castShadow receiveShadow>
        <boxGeometry args={[c.width, BASIN_COUNTER.top, c.depth]} />
        <meshStandardMaterial color="#E7E2D9" roughness={0.38} />
      </mesh>
      <mesh
        position={[0, bottomOfBasin - BASIN_COUNTER.top - BASIN_COUNTER.cabinet / 2, (c.cabinet.front + c.cabinet.back) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[c.cabinet.width, BASIN_COUNTER.cabinet, c.cabinet.front - c.cabinet.back]} />
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
    <Html position={[0, size.height / 2 + 0.06, 0]} wrapperClass="pointer-events-none" zIndexRange={[20, 0]}>
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
  interactive?: boolean;
  placed: PlacedProduct;
  product: RoomStudioProduct;
  selected: boolean;
  /** Where this placement stands against the room's rules; colours its outline. */
  status?: PlacementStatus;
  /** Draw the context counter under a countertop product. */
  showCounter?: boolean;
  stylePack?:StylePackId;
  onSelect: (instanceId: string) => void;
  onDragStart: (placed: PlacedProduct, event: ThreeEvent<PointerEvent>) => void;
  /** Dev harness only (see /dev/room-studio-3d-test). Undefined in the workspace. */
  onMeasured?: (measurement: ReturnType<typeof measureGlbForPlacement>) => void;
  /** Dev harness only. Reports a GLB that failed to load. */
  onLoadError?: () => void;
}

function PlacedProductNode({
  placed,
  product,
  selected,
  status,
  interactive = true, showCounter = false, stylePack,
  onSelect,
  onDragStart,
  onMeasured,
  onLoadError,
}: PlacedProductNodeProps) {
  const [hovered, setHovered] = useState(false);
  // `makeDefault` on OrbitControls publishes the instance here.
  const getScene = useThree((state) => state.get);
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
    const controls = getScene().controls as { enabled: boolean } | null;
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
    onDragStart(placed, e);
  };

  const showLabel = interactive && (hovered || selected);
  const statusColor = status ? PLACEMENT_STATUS_COLOR[status] : undefined;

  return (
    <group
      ref={groupRef}
      position={placed.position}
      rotation={[0, placed.rotationY, 0]}
      onPointerDown={interactive ? handlePointerDown : undefined}
      onPointerOver={(e) => {
        if (!interactive) return;
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
            <GlbProduct
              product={product}
              selected={selected}
              statusColor={statusColor}
              lightOn={placed.lightOn !== false}
              onMeasured={onMeasured}
            />
          </Suspense>
        </ModelBoundary>
      ) : (
        <ProductPlaceholder product={product} selected={selected} statusColor={statusColor} />
      )}

      {showCounter && placed.placementType === 'counter' && <BasinCounter pack={stylePack} product={product} />}

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

export default React.memo(PlacedProductNode);
