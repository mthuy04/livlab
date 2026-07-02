'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { AlertCircle, RotateCcw } from 'lucide-react';
import ProductModel3D from '@/components/visual-studio/ProductModel3D';
import { getProductModel, getProduct3DLabel, normalizeProduct3DCategory, Product3DCategory } from '@/lib/livlabProductModels';
import { Product } from '@/lib/types';

// Copied verbatim from components/visual-studio/ProductRoom3D.tsx.
class CanvasErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("Canvas crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#F8FAFC]">
           <div className="bg-white border border-[#D8E2EA] rounded-[20px] p-6 max-w-md w-full shadow-lg text-center text-red-500">
             <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
             <p className="font-bold text-lg text-[#0B1623]">Model 3D hiện quá nặng để tải</p>
             <p className="text-[#627386] text-sm mt-2">Trình duyệt đã quá tải bộ nhớ WebGL. Vui lòng dùng bản GLB đã nén/giảm polygon. Sản phẩm vẫn đã được thêm vào giỏ báo giá.</p>
           </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Blends each RGB channel toward 255 by `ratio` so the walls read as a
// lighter tint of the floor color without pulling in a color library.
function lightenHex(hex: string, ratio: number): string {
  const clean = hex.replace('#', '');
  const channel = (start: number) => {
    const value = parseInt(clean.substring(start, start + 2), 16);
    const blended = Math.round(value + (255 - value) * ratio);
    return blended.toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

// Draws one repeatable 0.3m tile cell (real-world grout spacing) with the
// selected color as the face and a light grout line traced on its border;
// RepeatWrapping + repeat then tiles it across each surface's real size.
// Canvas/document only exist client-side — <Canvas> children are only ever
// mounted inside a client-only effect, but this helper is also safe to call
// defensively since it's never invoked during SSR in practice.
function createTileTexture(hexColor: string, repeatX: number, repeatY: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#C7CDD2';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(Math.max(repeatX, 0.01), Math.max(repeatY, 0.01));
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Single source of truth for the "good angle" framing, shared by the Canvas's
// initial/reactive camera prop and the "Xem góc chuẩn" reset button.
function getDefaultCameraFraming(length: number, width: number, height: number) {
  return {
    position: [length * 0.55, height * 1.15, width * 1.9] as [number, number, number],
    target: [0, height * 0.45, 0] as [number, number, number],
  };
}

const CATEGORY_RELATIVE_POSITION: Record<string, { xFrac: number; y: number; zFrac: number }> = {
  lavabo: { xFrac: -0.2, y: 0.45, zFrac: -0.28 },
  faucet: { xFrac: -0.05, y: 0.9, zFrac: -0.28 },
  toilet: { xFrac: 0.25, y: 0.45, zFrac: -0.2 },
  shower: { xFrac: 0.32, y: 1.1, zFrac: 0.05 },
  mirror: { xFrac: -0.2, y: 1.6, zFrac: -0.28 },
};

// Real-world target size (meters, largest dimension) per category, used to
// rescale whatever raw size a .glb happens to ship at.
const TARGET_SIZE: Record<string, number> = {
  lavabo: 0.5,
  faucet: 0.3,
  toilet: 0.7,
  shower: 0.25,
  mirror: 0.6,
};

// getProductModel/normalizeProduct3DCategory only read id/slug/name/category,
// so a minimal stand-in is enough to reuse them without a real Product record.
function categoryToProduct(category: Product3DCategory): Product {
  return { id: category, slug: category, name: category, category } as unknown as Product;
}

// Measures the loaded model's real bounding box and derives a scale so its
// largest dimension matches TARGET_SIZE, instead of trusting the .glb's
// arbitrary native scale.
function ScaledProductModel({ modelUrl, category, position }: { modelUrl: string; category: Product3DCategory; position: [number, number, number] }) {
  const { scene } = useGLTF(modelUrl);
  const scale = useMemo(() => {
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const target = TARGET_SIZE[category] ?? 0.5;
    return maxDim > 0 && isFinite(maxDim) ? target / maxDim : 1;
  }, [scene, category]);

  return <ProductModel3D modelUrl={modelUrl} category={category} position={position} scale={scale} />;
}

interface RoomScene3DProps {
  length: number;
  width: number;
  height: number;
  tileColorHex: string;
  visibleCategories: Set<string>;
}

export default function RoomScene3D({ length, width, height, tileColorHex, visibleCategories }: RoomScene3DProps) {
  const wallColorHex = lightenHex(tileColorHex, 0.35);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { position: defaultPosition, target: defaultTarget } = getDefaultCameraFraming(length, width, height);

  const floorTexture = useMemo(() => createTileTexture(tileColorHex, length / 0.3, width / 0.3), [tileColorHex, length, width]);
  const backWallTexture = useMemo(() => createTileTexture(wallColorHex, length / 0.3, height / 0.3), [wallColorHex, length, height]);
  const leftWallTexture = useMemo(() => createTileTexture(wallColorHex, width / 0.3, height / 0.3), [wallColorHex, width, height]);

  const resetCamera = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { position, target } = getDefaultCameraFraming(length, width, height);
    controls.object.position.set(...position);
    controls.target.set(...target);
    controls.update();
  };

  return (
    <div className="w-full aspect-[4/3] md:aspect-[16/9] relative bg-[#F8FAFC] rounded-3xl border border-[#D8E2EA] overflow-hidden shadow-inner">
      <button
        type="button"
        onClick={resetCamera}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#0B1623] shadow-sm border border-white/50 hover:bg-white transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Xem góc chuẩn
      </button>

      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: defaultPosition, fov: 45 }}
          className="w-full h-full bg-[#E5E9EC]"
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <Environment preset="city" />

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2 + 0.1}
            target={defaultTarget}
          />

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[length, width]} />
            <meshStandardMaterial map={floorTexture ?? undefined} roughness={0.35} metalness={0.05} />
          </mesh>

          {/* Back wall */}
          <mesh position={[0, height / 2, -width / 2]}>
            <planeGeometry args={[length, height]} />
            <meshStandardMaterial map={backWallTexture ?? undefined} roughness={0.35} metalness={0.05} />
          </mesh>

          {/* Left wall */}
          <mesh position={[-length / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial map={leftWallTexture ?? undefined} roughness={0.35} metalness={0.05} />
          </mesh>

          {Object.entries(CATEGORY_RELATIVE_POSITION).map(([categoryKey, { xFrac, y, zFrac }]) => {
            if (!visibleCategories.has(categoryKey)) return null;

            const product = categoryToProduct(categoryKey as Product3DCategory);
            const category = normalizeProduct3DCategory(product);
            const modelUrl = getProductModel(product);
            const position: [number, number, number] = [xFrac * length, y, zFrac * width];

            if (modelUrl) {
              return (
                <Suspense fallback={null} key={categoryKey}>
                  <ScaledProductModel modelUrl={modelUrl} category={category} position={position} />
                </Suspense>
              );
            }

            const label = getProduct3DLabel(product);
            return (
              <React.Fragment key={categoryKey}>
                <mesh
                  position={position}
                  onPointerOver={(e) => { e.stopPropagation(); setHoveredKey(categoryKey); }}
                  onPointerOut={(e) => { e.stopPropagation(); setHoveredKey((prev) => (prev === categoryKey ? null : prev)); }}
                >
                  <boxGeometry args={[0.4, 0.4, 0.4]} />
                  <meshStandardMaterial color="#C8A96A" opacity={0.3} transparent />
                </mesh>
                {hoveredKey === categoryKey && (
                  <Html position={position} center pointerEvents="none">
                    <div className="px-2 py-1 rounded-md bg-white text-[#0B1623] text-[10px] font-medium shadow-sm whitespace-nowrap">
                      {label} — model đang cập nhật
                    </div>
                  </Html>
                )}
              </React.Fragment>
            );
          })}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
