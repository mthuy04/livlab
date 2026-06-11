'use client';

import { Product } from '@/lib/types';
import { StudioLayer, getStudioImage } from '@/lib/visualStudioHelpers';
import { getProductCutout } from "@/lib/livlabProductCutouts";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, ArrowUpToLine, ArrowDownToLine, X } from 'lucide-react';

interface ProductCanvasItemProps {
  layer: StudioLayer;
  product: Product;
  isSelected: boolean;
  isCurrentlyDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onUpdateLayer: (id: string, updates: Partial<StudioLayer>) => void;
  onRemoveLayer: (id: string) => void;
}

export default function ProductCanvasItem({
  layer,
  product,
  isSelected,
  isCurrentlyDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onUpdateLayer,
  onRemoveLayer
}: ProductCanvasItemProps) {
  const cutoutSrc = getProductCutout(product.id);
  const baseImage = product.image || getStudioImage(product);
  
  const clampScale = (scale: number) => Math.max(0.35, Math.min(1.6, scale));

  const safeCardStyle = {
    background: '#FFFFFF',
    borderRadius: '24px',
    border: isSelected ? '2px solid #0F3D5C' : '1px solid #E2E8F0',
    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as any,
  };

  return (
    <div
      className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform ease-out bg-transparent select-none touch-none ${isSelected ? 'z-50' : 'z-20'} ${isCurrentlyDragging ? 'duration-0 cursor-grabbing' : 'duration-75 cursor-grab'}`}
      style={{ 
        left: `${layer.x}%`, 
        top: `${layer.y}%`,
        transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
        zIndex: isSelected ? 100 : layer.zIndex,
        width: `${layer.width}px`,
        height: layer.height ? `${layer.height}px` : `${layer.width}px`,
        opacity: layer.opacity,
        touchAction: 'none'
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Control Toolbar */}
      {isSelected && (
        <div 
          className="absolute top-[-54px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50 whitespace-nowrap"
          style={{ transform: `translate(-50%, 0) scale(${1/layer.scale}) rotate(${-layer.rotation}deg)` }}
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 bg-white/95 shadow-lg rounded-full px-2 py-1.5 border border-[#D8E2EA]">
            <button onClick={() => onUpdateLayer(layer.id, { scale: clampScale(layer.scale - 0.1) })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Thu nhỏ"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => onUpdateLayer(layer.id, { scale: clampScale(layer.scale + 0.1) })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Phóng to"><ZoomIn className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-[#D8E2EA] mx-1"></div>
            <button onClick={() => onUpdateLayer(layer.id, { rotation: layer.rotation - 15 })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Xoay trái"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={() => onUpdateLayer(layer.id, { rotation: layer.rotation + 15 })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Xoay phải"><RotateCw className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-[#D8E2EA] mx-1"></div>
            <button onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Đưa lên trên"><ArrowUpToLine className="w-4 h-4" /></button>
            <button onClick={() => onUpdateLayer(layer.id, { zIndex: Math.max(0, layer.zIndex - 1) })} className="p-1 hover:bg-[#EEF4F7] rounded-full text-[#123C5A]" title="Đưa xuống dưới"><ArrowDownToLine className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-[#D8E2EA] mx-1"></div>
            <button onClick={() => onRemoveLayer(layer.id)} className="p-1 hover:bg-red-50 rounded-full text-red-500" title="Xóa"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div 
        className={`absolute select-none touch-none pointer-events-none overflow-hidden ${cutoutSrc ? '' : 'flex flex-col relative'}`}
        style={{
          width: '100%',
          height: '100%',
          ...(cutoutSrc ? {
             background: 'transparent',
             boxShadow: 'none',
             border: isSelected ? '1.5px solid rgba(13, 59, 91, 0.75)' : 'none',
             borderRadius: 12
          } : safeCardStyle)
        }}
      >
        <div className={`w-full relative transition-opacity duration-300 opacity-100 ${cutoutSrc ? 'h-full' : 'flex-1 min-h-0'}`}>
          <img 
            src={cutoutSrc || baseImage}
            alt={product.name}
            className="w-full h-full object-contain pointer-events-none select-none transition-all"
            style={{
              background: 'transparent',
              mixBlendMode: layer.blendMode || 'normal' as any,
              opacity: layer.opacity ?? 0.96,
              filter: cutoutSrc ? `
                contrast(1.04)
                saturate(0.96)
                drop-shadow(0 18px 24px rgba(0,0,0,.22))
              ` : 'none',
              clipPath: undefined,
              padding: '0'
            }}
            draggable={false}
          />
        </div>
        
        {/* Safe Card Footer Text */}
        {!cutoutSrc && (
          <div className="w-full flex flex-col items-center justify-end text-center mt-auto pointer-events-none gap-1 pb-1">
            <span className="text-[10px] font-bold text-[#0B1623] line-clamp-1 truncate w-full px-1">{product.name}</span>
            <span className="text-[#C8A96A] text-[9px] font-bold">{product.priceRange}</span>
          </div>
        )}
      </div>
      
      {/* Small Label when selected (only in cutout mode) */}
      {isSelected && cutoutSrc && (
        <div 
          className="absolute bg-[#0F3D5C]/90 backdrop-blur px-2.5 py-1.5 rounded-xl text-[12px] font-bold text-white shadow-lg pointer-events-none flex flex-col items-center text-center w-[max-content] max-w-[220px]"
          style={{ 
            top: 'calc(100% + 8px)',
            transform: `scale(${1/layer.scale}) rotate(${-layer.rotation}deg)` 
          }}
        >
          <span className="line-clamp-1 truncate w-full opacity-90">{product.name}</span>
          <span className="text-white opacity-100">{product.priceRange}</span>
        </div>
      )}
    </div>
  );
}
