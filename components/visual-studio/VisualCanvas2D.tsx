'use client';

import { useState, useRef, useEffect } from 'react';
import { StudioLayer, getStudioImage } from '@/lib/visualStudioHelpers';
import { Product } from '@/lib/types';
import { Hand } from 'lucide-react';
import ProductCanvasItem from '@/components/visual-studio/ProductCanvasItem';

interface VisualCanvas2DProps {
  backgroundImageUrl: string | null;
  layers: StudioLayer[];
  productsData: Product[];
  onUpdateLayer: (id: string, updates: Partial<StudioLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onSelectLayer: (id: string | null) => void;
  selectedLayerId: string | null;
}

export default function VisualCanvas2D({
  backgroundImageUrl,
  layers,
  productsData,
  onUpdateLayer,
  onRemoveLayer,
  onSelectLayer,
  selectedLayerId
}: VisualCanvas2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    onSelectLayer(id);
    setDragTargetId(id);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragTargetId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp
    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));

    onUpdateLayer(dragTargetId, { x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragTargetId(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const clampScale = (scale: number) => Math.max(0.35, Math.min(1.6, scale));

  // Sort layers by zIndex
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/3] lg:aspect-[16/9] max-h-[640px] bg-[#D8E2EA] rounded-3xl overflow-hidden shadow-sm border border-[#D8E2EA] select-none group"
    >
      {/* Background */}
      {backgroundImageUrl ? (
        <img src={backgroundImageUrl} alt="Room canvas" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-0">
          <div className="bg-white/95 backdrop-blur px-6 py-5 rounded-2xl flex flex-col items-center gap-2 text-[#0B1623] shadow-2xl max-w-sm text-center">
            <Hand className="w-8 h-8 text-[#C8A96A] mb-1" />
            <span className="font-bold text-lg">Bắt đầu thiết kế</span>
            <span className="text-sm text-[#627386]">Tải ảnh chụp phòng tắm hoặc chọn một không gian mẫu bên dưới để bắt đầu.</span>
          </div>
        </div>
      )}
      
      {/* Background click to deselect */}
      <div 
        className="absolute inset-0 z-0" 
        onPointerDown={() => onSelectLayer(null)}
      />

      {/* Helper */}
      {backgroundImageUrl && layers.length > 0 && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B1623] shadow-sm max-w-[200px] border border-white">
            Kéo sản phẩm để thay đổi vị trí. Chọn sản phẩm để chỉnh kích thước hoặc góc xoay.
          </div>
        </div>
      )}

      {/* Placed Products */}
      {sortedLayers.map(layer => {
        const prodData = productsData.find(p => p.id === layer.productId);
        if (!prodData) return null;
        
        const isSelected = selectedLayerId === layer.id;
        const isCurrentlyDragging = isDragging && dragTargetId === layer.id;

        return (
          <ProductCanvasItem
            key={layer.id}
            layer={layer}
            product={prodData}
            isSelected={isSelected}
            isCurrentlyDragging={isCurrentlyDragging}
            onPointerDown={(e) => handlePointerDown(e, layer.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onUpdateLayer={onUpdateLayer}
            onRemoveLayer={onRemoveLayer}
          />
        );
      })}
    </div>
  );
}
