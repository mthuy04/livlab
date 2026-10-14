'use client';

import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A model on a neutral bench.
 *
 * Deliberately plain: grey ground, two lights, no environment map, no tiles.
 * The job is to see what the file contains, and a flattering studio hides
 * exactly the faults QA is looking for — a blown-out white that has no
 * surface, a seat that turned to chrome, a normal facing the wrong way.
 *
 * Loaded with the SAME drei `useGLTF` the Room Studio runtime uses, so a file
 * that loads here loads there.
 */

interface AssetViewerProps {
  url: string;
  pivot: string;
  showBoundingBox: boolean;
  showAxes: boolean;
  showPivot: boolean;
  wireframe: boolean;
  resetSignal: number;
}

/** Keeps one bad asset from taking the page down with it. */
class ViewerBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[3d-qa] asset failed to load:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <p className="whitespace-nowrap rounded bg-[#C0392B] px-3 py-1.5 text-[12px] font-medium text-white">
            RUNTIME_ASSET_LOAD_FAILED — không tải được GLB
          </p>
        </Html>
      );
    }
    return this.props.children;
  }
}

function Model({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url);
  const instance = useMemo(() => scene.clone(true), [scene]);

  // Wireframe is applied to clones only, so toggling it never mutates the
  // cached original that Room Studio would later render.
  useEffect(() => {
    instance.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material && 'wireframe' in material) {
          (material as THREE.MeshStandardMaterial).wireframe = wireframe;
        }
      }
    });
  }, [instance, wireframe]);

  return <primitive object={instance} />;
}

/** Measures the loaded asset and draws the QA helpers around it. */
function Helpers({
  url,
  pivot,
  showBoundingBox,
  showAxes,
  showPivot,
}: {
  url: string;
  pivot: string;
  showBoundingBox: boolean;
  showAxes: boolean;
  showPivot: boolean;
}) {
  const { scene } = useGLTF(url);
  const box = useMemo(() => new THREE.Box3().setFromObject(scene.clone(true)), [scene]);
  const size = useMemo(() => box.getSize(new THREE.Vector3()), [box]);
  const centre = useMemo(() => box.getCenter(new THREE.Vector3()), [box]);

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)),
    [size]
  );

  const span = Math.max(size.x, size.y, size.z) || 1;

  return (
    <group>
      {showBoundingBox && (
        <group position={centre}>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#D14B3C" />
          </lineSegments>
          <Html position={[0, size.y / 2 + 0.06, 0]} center pointerEvents="none" zIndexRange={[18, 0]}>
            <span className="whitespace-nowrap rounded bg-[#D14B3C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {Math.round(size.x * 1000)} × {Math.round(size.z * 1000)} × {Math.round(size.y * 1000)} mm
            </span>
          </Html>
        </group>
      )}

      {/* The file's own origin, which is what `pivot` is a claim about. */}
      {showPivot && (
        <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[span * 0.04, span * 0.065, 24]} />
            <meshBasicMaterial color="#C8A96A" side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, span * 0.1, 0]} center pointerEvents="none" zIndexRange={[18, 0]}>
            <span className="whitespace-nowrap rounded bg-[#C8A96A] px-1.5 py-0.5 text-[10px] font-semibold text-[#13171A]">
              gốc file · {pivot}
            </span>
          </Html>
        </group>
      )}

      {showAxes && (
        <group>
          <Axis dir={[1, 0, 0]} colour="#C0392B" label="+X" length={span * 0.75} />
          <Axis dir={[0, 1, 0]} colour="#27865A" label="+Y lên" length={span * 0.85} />
          <Axis dir={[0, 0, 1]} colour="#1F6FB2" label="+Z mặt trước" length={span} />
        </group>
      )}
    </group>
  );
}

function Axis({
  dir,
  colour,
  label,
  length,
}: {
  dir: [number, number, number];
  colour: string;
  label: string;
  length: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir[0] * length, dir[1] * length, dir[2] * length),
      ]),
    [dir, length]
  );
  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={colour} />
      </line>
      <Html
        position={[dir[0] * length, dir[1] * length, dir[2] * length]}
        center
        pointerEvents="none"
        zIndexRange={[18, 0]}
      >
        <span
          className="whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: colour }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}

/** Frames the asset from its own size, so a 40mm part and a bath both fit. */
function Framing({ url, resetSignal }: { url: string; resetSignal: number }) {
  const { scene } = useGLTF(url);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;

  const { centre, span } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene.clone(true));
    const s = box.getSize(new THREE.Vector3());
    return { centre: box.getCenter(new THREE.Vector3()), span: Math.max(s.x, s.y, s.z) || 1 };
  }, [scene]);

  useEffect(() => {
    const distance = span * 2.4;
    camera.position.set(centre.x + distance * 0.62, centre.y + distance * 0.45, centre.z + distance * 0.78);
    camera.lookAt(centre);
    if (controls) {
      controls.target.copy(centre);
      controls.update();
    }
  }, [camera, controls, centre, span, resetSignal]);

  return null;
}

export default function AssetViewer({
  url,
  pivot,
  showBoundingBox,
  showAxes,
  showPivot,
  wireframe,
  resetSignal,
}: AssetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#1A1E22]">
      <Canvas
        camera={{ fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
        shadows
        className="h-full w-full"
      >
        {/* Neutral, even light. No environment map: a studio HDR makes every
            material look better than it is, which is the opposite of QA. */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={0.35} />

        <Grid
          args={[10, 10]}
          cellSize={0.1}
          cellColor="#2C333A"
          sectionSize={0.5}
          sectionColor="#3C454E"
          fadeDistance={9}
          infiniteGrid
          position={[0, 0, 0]}
        />

        <ViewerBoundary>
          <Suspense fallback={null}>
            <Model url={url} wireframe={wireframe} />
            <Helpers
              url={url}
              pivot={pivot}
              showBoundingBox={showBoundingBox}
              showAxes={showAxes}
              showPivot={showPivot}
            />
            <Framing url={url} resetSignal={resetSignal} />
          </Suspense>
        </ViewerBoundary>

        <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
      </Canvas>
    </div>
  );
}
