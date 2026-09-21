'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { getMaterialsForSurface, type SurfaceId } from '@/lib/room-studio/materials';

interface SurfaceMaterialPanelProps {
  selectedMaterials: Record<SurfaceId, string>;
  onMaterialChange: (surface: SurfaceId, materialId: string) => void;
  showCeiling: boolean;
  onToggleCeiling: (value: boolean) => void;
}

const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: 'floor', label: 'Sàn' },
  { id: 'walls', label: 'Tường' },
];

/**
 * Surface -> Material, not "tile picker". The customer first says which surface
 * they are finishing, then picks any finish family — tile, stone, terrazzo,
 * wood-look or paint — from one library.
 */
export default function SurfaceMaterialPanel({
  selectedMaterials,
  onMaterialChange,
  showCeiling,
  onToggleCeiling,
}: SurfaceMaterialPanelProps) {
  const [activeSurface, setActiveSurface] = useState<SurfaceId>('floor');
  const materials = getMaterialsForSurface(activeSurface);
  const activeMaterialId = selectedMaterials[activeSurface];

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-[#C8A96A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Bề mặt &amp; vật liệu</h3>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-[#F3F7FA] p-1">
        {SURFACES.map((surface) => (
          <button
            key={surface.id}
            type="button"
            onClick={() => setActiveSurface(surface.id)}
            aria-pressed={activeSurface === surface.id}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              activeSurface === surface.id ? 'bg-white text-[#0B1623] shadow-sm' : 'text-[#627386] hover:text-[#0B1623]'
            }`}
          >
            {surface.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {materials.map((material) => {
          const isActive = material.id === activeMaterialId;
          return (
            <button
              key={material.id}
              type="button"
              onClick={() => onMaterialChange(activeSurface, material.id)}
              title={`${material.name} · ${material.family}`}
              aria-label={material.name}
              aria-pressed={isActive}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`block h-11 w-full rounded-xl border-2 transition-all ${
                  isActive ? 'border-[#0F3D5C] shadow-md' : 'border-[#D8E2EA] group-hover:border-[#C8A96A]/70'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${material.baseColor} 0%, ${material.baseColor} 55%, ${material.accentColor} 100%)`,
                }}
              />
              <span className="line-clamp-1 text-[9px] font-medium text-[#627386]">{material.name}</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-[#F3F7FA] px-3 py-2.5">
        <span className="text-[11px] font-medium text-[#627386]">Hiện trần phòng</span>
        <input
          type="checkbox"
          checked={showCeiling}
          onChange={(e) => onToggleCeiling(e.target.checked)}
          className="h-4 w-4 accent-[#0F3D5C]"
        />
      </label>
    </div>
  );
}
