'use client';

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Product } from '@/lib/types';
import { StudioLayer } from '@/lib/visualStudioHelpers';
import { getProductModel, getProduct3DLabel, normalizeProduct3DCategory, Product3DCategory } from '@/lib/livlabProductModels';
import ProductModel3D from './ProductModel3D';
import { CheckCircle, AlertCircle, Box } from 'lucide-react';

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

interface ProductRoom3DProps {
  placedProducts: StudioLayer[];
  productsData: Product[];
}

export default function ProductRoom3D({ placedProducts, productsData }: ProductRoom3DProps) {
  // Map layers to products
  const products = placedProducts
    .map(layer => productsData.find(p => p.id === layer.productId))
    .filter(Boolean) as Product[];

  // Keep track of loaded models to update UI status
  const [failedModels, setFailedModels] = useState<Set<string>>(new Set());
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());

  const handleModelError = (productId: string) => {
    setFailedModels(prev => new Set(prev).add(productId));
  };

  const handleModelSuccess = (productId: string) => {
    setLoadedModels(prev => new Set(prev).add(productId));
  };

  const getCategoryPosition = (category: Product3DCategory, index: number): [number, number, number] => {
    const offset = index > 0 ? index * 0.5 : 0; // slight offset for multiple items of same category
    switch (category) {
      case 'faucet': return [0.2 + offset, 0.9, 0];
      case 'lavabo': return [0 + offset, 0.45, 0];
      case 'mirror': return [0 + offset, 1.6, -0.25];
      case 'toilet': return [-1.2 + offset, 0.45, 0.1];
      case 'shower': return [1.2 + offset, 1.1, 0];
      default: return [0 + offset, 0.5, 0];
    }
  };

  const productModelData = useMemo(() => {
    return products.map(product => {
      const category = normalizeProduct3DCategory(product);
      const modelUrl = getProductModel(product);
      const label = getProduct3DLabel(product);
      return { product, category, modelUrl, label };
    });
  }, [products]);

  const uniqueModels = useMemo(() => {
    const map = new Map<Product3DCategory, { category: Product3DCategory, modelUrl: string, position: [number, number, number] }>();
    productModelData.forEach(d => {
      if (!map.has(d.category) && d.modelUrl) {
        map.set(d.category, {
          category: d.category,
          modelUrl: d.modelUrl,
          position: getCategoryPosition(d.category, 0)
        });
      }
    });
    return Array.from(map.values());
  }, [productModelData]);

  if (products.length === 0) {
    return (
      <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#F8FAFC] rounded-3xl border border-[#D8E2EA] flex flex-col items-center justify-center p-6 text-center shadow-inner">
        <Box className="w-12 h-12 text-[#C8A96A] mb-3" />
        <h3 className="text-lg font-bold text-[#0B1623]">Chọn sản phẩm từ thư viện để xem trong Studio 3D.</h3>
        <p className="text-[#627386] text-sm max-w-sm mt-1">
          Model 3D sẽ được hiển thị tại đây khi sản phẩm có file .glb tương ứng.
        </p>
      </div>
    );
  }

  const hasAnyValidModel = productModelData.some(d => d.modelUrl !== null);

  const missingCategories = Array.from(new Set(productModelData.filter(d => !d.modelUrl).map(d => d.category)));

  const getMissingFileText = (cat: string) => {
    switch (cat) {
      case 'lavabo': return 'Chậu lavabo → cần file lavabo.glb';
      case 'faucet': return 'Vòi lavabo → cần file faucet.glb';
      case 'toilet': return 'Bồn cầu → cần file toilet.glb';
      case 'shower': return 'Sen tắm → cần file shower.glb';
      case 'mirror': return 'Gương → cần file mirror.glb';
      default: return 'Sản phẩm khác → không có model 3D';
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] rounded-3xl border border-[#D8E2EA] overflow-hidden shadow-inner flex flex-col md:flex-row">
      
      {/* LEFT: 3D Canvas */}
      <div className="flex-1 relative aspect-[4/3] md:aspect-auto md:min-h-[500px]">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B1623] shadow-sm border border-white/50">
            Model 3D minh hoạ theo nhóm sản phẩm
          </div>
        </div>

        {hasAnyValidModel ? (
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
                target={[0, 0.8, 0]}
              />

              {/* Floor & Wall representation */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[15, 15]} />
                <meshStandardMaterial color="#f0f2f5" />
              </mesh>

              <mesh position={[0, 1.5, -0.5]}>
                <planeGeometry args={[15, 3]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>

              {/* Render Unique Models */}
              {uniqueModels.map(({ modelUrl, position, category }) => {
                if (!modelUrl || failedModels.has(category)) return null;
                return (
                  <ProductModel3D 
                    key={category}
                    modelUrl={modelUrl}
                    category={category}
                    position={position}
                    onError={() => handleModelError(category)}
                    onSuccess={() => handleModelSuccess(category)}
                  />
                );
              })}
            </Canvas>
          </CanvasErrorBoundary>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#F8FAFC]">
            <div className="bg-white border border-[#D8E2EA] rounded-[20px] p-6 max-w-md w-full shadow-lg flex flex-col items-center text-center">
              <Box className="w-12 h-12 text-[#C8A96A] mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[#0B1623] mb-2">Chưa có model 3D cho sản phẩm đã chọn</h3>
              <p className="text-[#627386] text-sm mb-6">
                Sản phẩm vẫn đã được thêm vào giỏ báo giá. Thêm file .glb vào <code className="bg-[#F3F7FA] px-1.5 py-0.5 rounded text-[#0B1623] text-xs">/public/models/bathroom/</code> để bật chế độ xem 3D.
              </p>
              
              <div className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-xl p-4 text-left">
                <p className="text-[11px] font-bold text-[#627386] uppercase mb-2">Danh sách model đang thiếu:</p>
                <ul className="space-y-1.5 text-sm text-[#0B1623] font-medium">
                  {missingCategories.filter(cat => cat !== 'unknown').map(cat => (
                    <li key={cat} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                      {getMissingFileText(cat)}
                    </li>
                  ))}
                  {missingCategories.includes('unknown') && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></div>
                      {getMissingFileText('unknown')}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Product List Status */}
      <div className="w-full md:w-[320px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-[#D8E2EA] flex flex-col h-[300px] md:h-auto overflow-hidden">
        <div className="p-4 bg-[#F3F7FA] border-b border-[#D8E2EA]">
          <h3 className="font-bold text-[#0B1623] text-sm">Trạng thái Model 3D</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {productModelData.map(({ product, category, label, modelUrl }) => {
            const hasModelUrl = !!modelUrl;
            const isFailed = failedModels.has(category);
            const isLoaded = loadedModels.has(category);
            
            let statusText = "Đang tải...";
            let statusColor = "text-blue-500";
            let StatusIcon = Box;

            if (!hasModelUrl) {
              statusText = `Chưa có model 3D cho ${label}`;
              statusColor = "text-[#627386]";
              StatusIcon = AlertCircle;
            } else if (isFailed) {
              statusText = "Lỗi tải model.";
              statusColor = "text-red-500";
              StatusIcon = AlertCircle;
            } else if (isLoaded) {
              statusText = "Có model 3D";
              statusColor = "text-green-600";
              StatusIcon = CheckCircle;
            }

            return (
              <div key={product.id} className="p-3 border border-[#D8E2EA] rounded-xl flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[#627386]">{label}</span>
                <p className="text-xs font-bold text-[#0B1623] line-clamp-1">{product.name}</p>
                <p className="text-[#C8A96A] text-xs font-bold">{product.priceRange}</p>
                
                <div className={`flex items-start gap-1.5 mt-1 text-[10px] font-bold ${statusColor}`}>
                  <StatusIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span>{statusText}</span>
                    {!hasModelUrl && (
                      <span className="font-normal italic">Sản phẩm vẫn đã được thêm vào giỏ báo giá.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
