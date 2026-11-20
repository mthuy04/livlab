'use client';

/**
 * The product page's 3D preview: one approved GLB, drawn as it is.
 *
 * Nothing is rescaled, re-axed or re-centred in the file — the camera fits the
 * model, never the other way round. The files carry no vertex normals, so
 * smooth-with-creases normals are computed once on load (no vertex moves),
 * exactly as Room Studio does. An LED mirror's glowing material is cloned for
 * this view and switched on or off. With no wall behind it here, the
 * diffuser's own glow is the whole effect; Room Studio adds the wall wash.
 */
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, Lightformer, OrbitControls, useBounds, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const CREASE_ANGLE = Math.PI / 6;

export interface Model3DViewerProps {
  url: string;
  poster: string;
  name: string;
  emissive: { materialName: string; colorTemperatureK: number } | null;
}

/** Switches this view's LED materials on or off. Three.js objects are mutable by design. */
function setLedLight(materials: THREE.MeshStandardMaterial[], on: boolean) {
  for (const m of materials) {
    m.emissiveIntensity = on ? m.userData.on : 0;
    m.needsUpdate = true;
  }
}

function Model({
  url,
  emissive,
  lightOn,
  onReady,
}: {
  url: string;
  emissive: Model3DViewerProps['emissive'];
  lightOn: boolean;
  onReady: () => void;
}) {
  const { scene } = useGLTF(url);

  const { object, led } = useMemo(() => {
    const copy = scene.clone(true);
    const led: THREE.MeshStandardMaterial[] = [];
    copy.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.geometry.attributes.normal) mesh.geometry = toCreasedNormals(mesh.geometry, CREASE_ANGLE);
      if (!emissive) return;
      const swap = (m: THREE.Material) => {
        if (m.name !== emissive.materialName) return m;
        const own = (m as THREE.MeshStandardMaterial).clone();
        own.userData.on = (m as THREE.MeshStandardMaterial).emissiveIntensity || 1;
        led.push(own);
        return own;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
    return { object: copy, led };
  }, [scene, emissive]);

  useEffect(() => () => led.forEach((m) => m.dispose()), [led]);
  useEffect(() => setLedLight(led, lightOn), [led, lightOn]);
  useEffect(onReady, [onReady]);

  return <primitive object={object} />;
}

function ResetView({ token }: { token: number }) {
  const bounds = useBounds();
  useEffect(() => {
    if (token > 0) bounds.refresh().clip().fit();
  }, [token, bounds]);
  return null;
}

class LoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const buttonClass =
  'rounded-full border border-[#D9D9D6] bg-white/90 px-3.5 py-1.5 text-[12px] font-medium text-[#1A1A1A] transition-colors hover:bg-white';

export default function Model3DViewer({ url, poster, name, emissive }: Model3DViewerProps) {
  const [lightOn, setLightOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [reset, setReset] = useState(0);
  const markReady = useMemo(() => () => setReady(true), []);

  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={`Ảnh dựng từ mô hình 3D của ${name}`} className="max-h-[70%] max-w-[80%] object-contain" />
      <p style={{ fontSize: 13, color: '#6B6B6B' }}>Không tải được mô hình 3D. Đang hiển thị ảnh dựng từ mô hình.</p>
    </div>
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '4 / 3', backgroundColor: '#F4F4F2' }}
      data-model3d-viewer
      data-ready={ready ? 'true' : 'false'}
    >
      <LoadBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0.9, 0.55, 1.6], fov: 32, near: 0.01, far: 50 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          aria-label={`Mô hình 3D ${name}. Kéo để xoay, cuộn để phóng to.`}
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[2, 3, 2.5]} intensity={1.1} />
          <directionalLight position={[-2.5, 1.5, 1]} intensity={0.35} />
          {/* A neutral studio for chrome and mirror glass to reflect: a soft
              grey surround with a broad light behind the camera, so a mirror
              reads as a mirror and not as a black hole. */}
          <Environment resolution={256}>
            <color attach="background" args={['#C9C7C2']} />
            <Lightformer form="rect" intensity={1.1} position={[0, 0.6, 4]} rotation-y={Math.PI} scale={[9, 4, 1]} color="#F1EFEA" />
            <Lightformer form="rect" intensity={2.2} position={[0, 2.5, 2]} scale={[4, 1.4, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[-3, 1, 0]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[3, 1, 0]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
            <Lightformer form="rect" intensity={0.6} position={[0, 0.5, -3]} scale={[5, 3, 1]} color="#E8E6E1" />
          </Environment>
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <Model url={url} emissive={emissive} lightOn={lightOn} onReady={markReady} />
              <ResetView token={reset} />
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enablePan={false} minDistance={0.05} maxDistance={8} />
        </Canvas>
      </LoadBoundary>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-live="polite">
          <span style={{ fontSize: 13, color: '#6B6B6B' }}>Đang tải mô hình 3D…</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-end gap-2 sm:justify-between">
        <span className="hidden sm:inline" style={{ fontSize: 11, color: '#777777' }}>
          Kéo để xoay · cuộn hoặc chụm để phóng to
        </span>
        <span className="flex gap-2">
          {emissive && (
            <button type="button" className={buttonClass} aria-pressed={lightOn} onClick={() => setLightOn((v) => !v)}>
              {lightOn ? 'Đèn LED: bật' : 'Đèn LED: tắt'}
            </button>
          )}
          <button type="button" className={buttonClass} onClick={() => setReset((n) => n + 1)}>
            Đặt lại góc nhìn
          </button>
        </span>
      </div>
    </div>
  );
}
