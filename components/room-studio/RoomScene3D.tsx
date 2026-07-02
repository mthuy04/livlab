'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { AlertCircle } from 'lucide-react';
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

const CATEGORY_RELATIVE_POSITION: Record<string, { xFrac: number; y: number; zFrac: number }> = {
  lavabo: { xFrac: -0.25, y: 0.45, zFrac: -0.35 },
  faucet: { xFrac: -0.15, y: 0.9, zFrac: -0.35 },
  toilet: { xFrac: 0.25, y: 0.45, zFrac: -0.25 },
  shower: { xFrac: 0.35, y: 1.1, zFrac: 0.1 },
  mirror: { xFrac: -0.25, y: 1.6, zFrac: -0.42 },
};

// getProductModel/normalizeProduct3DCategory only read id/slug/name/category,
// so a minimal stand-in is enough to reuse them without a real Product record.
function categoryToProduct(category: Product3DCategory): Product {
  return { id: category, slug: category, name: category, category } as unknown as Product;
}

interface RoomScene3DProps {
  length: number;
  width: number;
  height: number;
  tileColorHex: string;
}

export default function RoomScene3D({ length, width, height, tileColorHex }: RoomScene3DProps) {
  const wallColorHex = lightenHex(tileColorHex, 0.35);

  return (
    <div className="w-full aspect-[4/3] md:aspect-[16/9] relative bg-[#F8FAFC] rounded-3xl border border-[#D8E2EA] overflow-hidden shadow-inner">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          className="w-full h-full bg-[#E5E9EC]"
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <Environment preset="city" />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2 + 0.1}
            target={[0, height / 2, 0]}
          />

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[length, width]} />
            <meshStandardMaterial color={tileColorHex} />
          </mesh>

          {/* Back wall */}
          <mesh position={[0, height / 2, -width / 2]}>
            <planeGeometry args={[length, height]} />
            <meshStandardMaterial color={wallColorHex} />
          </mesh>

          {/* Left wall */}
          <mesh position={[-length / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial color={wallColorHex} />
          </mesh>

          {Object.entries(CATEGORY_RELATIVE_POSITION).map(([categoryKey, { xFrac, y, zFrac }]) => {
            const product = categoryToProduct(categoryKey as Product3DCategory);
            const category = normalizeProduct3DCategory(product);
            const modelUrl = getProductModel(product);
            const position: [number, number, number] = [xFrac * length, y, zFrac * width];

            if (modelUrl) {
              return (
                <ProductModel3D key={categoryKey} modelUrl={modelUrl} category={category} position={position} />
              );
            }

            const label = getProduct3DLabel(product);
            return (
              <React.Fragment key={categoryKey}>
                <mesh position={position}>
                  <boxGeometry args={[0.4, 0.4, 0.4]} />
                  <meshStandardMaterial color="#C8A96A" opacity={0.3} transparent />
                </mesh>
                <Html position={position} center>
                  <div className="px-2 py-1 rounded-md bg-white text-[#0B1623] text-[10px] font-medium shadow-sm whitespace-nowrap">
                    {label} — model đang cập nhật
                  </div>
                </Html>
              </React.Fragment>
            );
          })}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
