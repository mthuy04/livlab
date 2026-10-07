'use client';

import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import {
  describeSurfaceStyle,
  getColorsForMaterial,
  getFinishesForMaterial,
  getMaterialsForSurface,
  resolveSurfaceMaterial,
  type MaterialOption,
  type SurfaceId,
  type SurfaceStyle,
} from '@/lib/room-studio/materials';

interface SurfaceMaterialPanelProps {
  surfaceStyles: Record<SurfaceId, SurfaceStyle>;
  /** Patches ONE axis at a time; the state layer re-normalises the rest. */
  onStyleChange: (surface: SurfaceId, patch: Partial<SurfaceStyle>) => void;
  showCeiling: boolean;
  onToggleCeiling: (value: boolean) => void;
}

const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: 'floor', label: 'Sàn' },
  { id: 'walls', label: 'Tường' },
];

/** Options shown before "Xem thêm" — the common choices, not the whole catalogue. */
const VISIBLE_MATERIALS = 4;
const VISIBLE_COLORS = 6;

/**
 * A CSS preview of a material's pattern, drawn in the currently selected
 * colour. It deliberately mirrors the procedural canvas in materials.ts so a
 * chip reads as the same finish the room is about to show — without asking the
 * panel to mount a WebGL context per swatch.
 */
function patternBackground(material: Pick<MaterialOption, 'pattern' | 'realWorldWidth'>, base: string, accent: string): string {
  const { pattern } = material;
  switch (pattern) {
    case 'tile': {
      // Grid spacing tracks the real tile size, so a 60cm porcelain chip reads
      // as coarser than a 30cm ceramic one instead of identical.
      const cell = Math.round(Math.min(18, Math.max(7, material.realWorldWidth * 22)));
      return [
        `repeating-linear-gradient(90deg, ${accent} 0 1px, transparent 1px ${cell}px)`,
        `repeating-linear-gradient(0deg, ${accent} 0 1px, transparent 1px ${cell}px)`,
        base,
      ].join(', ');
    }
    case 'large-slab':
      return [
        `linear-gradient(118deg, transparent 38%, ${accent} 40%, transparent 43%)`,
        `linear-gradient(104deg, transparent 62%, ${accent} 64%, transparent 68%)`,
        `linear-gradient(135deg, ${base} 0%, ${base} 60%, ${accent} 160%)`,
      ].join(', ');
    case 'terrazzo':
      return [
        `radial-gradient(circle at 20% 28%, ${accent} 0 2.2px, transparent 2.4px)`,
        `radial-gradient(circle at 68% 18%, #ffffff 0 2px, transparent 2.2px)`,
        `radial-gradient(circle at 42% 66%, ${accent} 0 2.6px, transparent 2.8px)`,
        `radial-gradient(circle at 82% 74%, ${accent} 0 1.8px, transparent 2px)`,
        `radial-gradient(circle at 12% 82%, #ffffff 0 2.2px, transparent 2.4px)`,
        base,
      ].join(', ');
    case 'wood-plank':
      return [
        `repeating-linear-gradient(0deg, ${accent}55 0 1px, transparent 1px 7px)`,
        `linear-gradient(135deg, ${base} 0%, ${base} 70%, ${accent} 140%)`,
      ].join(', ');
    case 'concrete':
      return [
        `radial-gradient(circle at 30% 30%, ${accent}66 0%, transparent 55%)`,
        `radial-gradient(circle at 75% 70%, ${accent}55 0%, transparent 50%)`,
        base,
      ].join(', ');
    case 'plain':
    default:
      return base;
  }
}

/**
 * Surface -> Material -> Colour -> Finish.
 *
 * The customer first says which surface they are finishing, then makes three
 * independent decisions in the order a showroom asks them: what the surface is
 * made of, what colour it is, and how it is finished. Those were previously one
 * mixed list ("Gạch be"), which conflated all three.
 */
export default function SurfaceMaterialPanel({
  surfaceStyles,
  onStyleChange,
  showCeiling,
  onToggleCeiling,
}: SurfaceMaterialPanelProps) {
  const [activeSurface, setActiveSurface] = useState<SurfaceId>('floor');
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const style = surfaceStyles[activeSurface];
  const resolved = resolveSurfaceMaterial(style);

  const materials = getMaterialsForSurface(activeSurface);
  const colors = getColorsForMaterial(style.material);
  const finishes = getFinishesForMaterial(style.material, activeSurface);

  const visibleMaterials = shortlist(materials, style.material, VISIBLE_MATERIALS, showAllMaterials);
  const visibleColors = shortlist(colors, style.color, VISIBLE_COLORS, showAllColors);

  const selectSurface = (surface: SurfaceId) => {
    setActiveSurface(surface);
    // Each surface has its own shortlist; collapsing avoids carrying "Xem thêm"
    // across a tab switch and showing the customer 7 materials unprompted.
    setShowAllMaterials(false);
    setShowAllColors(false);
  };

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-[#C8A96A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Bề mặt &amp; vật liệu</h3>
      </div>

      {/* 1 — Surface target */}
      <div className="flex gap-1 rounded-xl bg-[#F3F7FA] p-1">
        {SURFACES.map((surface) => (
          <button
            key={surface.id}
            type="button"
            onClick={() => selectSurface(surface.id)}
            aria-pressed={activeSurface === surface.id}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              activeSurface === surface.id ? 'bg-white text-[#0B1623] shadow-sm' : 'text-[#627386] hover:text-[#0B1623]'
            }`}
          >
            {surface.label}
          </button>
        ))}
      </div>

      {/* Display-only summary of the three choices below. */}
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[#E6EDF2] bg-[#FAFCFD] px-3 py-2.5">
        <span
          className="h-8 w-8 shrink-0 rounded-lg border border-[#D8E2EA]"
          style={{ background: patternBackground(resolved, resolved.baseColor, resolved.accentColor) }}
        />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-[#0B1623]">{describeSurfaceStyle(style)}</p>
          <p className="text-[9px] uppercase tracking-wider text-[#8C9BAB]">
            {activeSurface === 'floor' ? 'Bề mặt sàn' : 'Bề mặt tường'}
          </p>
        </div>
      </div>

      {/* 2 — Material */}
      <Section label="Chất liệu">
        <div className="grid grid-cols-2 gap-2">
          {visibleMaterials.map((material) => {
            const isActive = material.id === style.material;
            // Preview each material in the colour the customer already chose
            // when that colour exists for it, so the chips differ by MATERIAL.
            const previewColor = material.colors.includes(style.color) ? style.color : material.colors[0];
            const preview = resolveSurfaceMaterial({
              material: material.id,
              color: previewColor,
              finish: material.finishes[0],
            });
            return (
              <button
                key={material.id}
                type="button"
                onClick={() => onStyleChange(activeSurface, { material: material.id })}
                title={material.description}
                aria-pressed={isActive}
                className={`flex items-center gap-2 rounded-xl border-2 p-1.5 text-left transition-all ${
                  isActive
                    ? 'border-[#0F3D5C] bg-[#F3F7FA] shadow-sm'
                    : 'border-[#E6EDF2] bg-white hover:border-[#C8A96A]/70'
                }`}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-lg border border-black/10"
                  style={{ background: patternBackground(material, preview.baseColor, preview.accentColor) }}
                />
                <span
                  className={`line-clamp-2 text-[10px] font-semibold leading-tight ${
                    isActive ? 'text-[#0B1623]' : 'text-[#627386]'
                  }`}
                >
                  {material.name}
                </span>
              </button>
            );
          })}
        </div>
        {!showAllMaterials && materials.length > visibleMaterials.length && (
          <MoreButton onClick={() => setShowAllMaterials(true)}>
            Xem thêm chất liệu ({materials.length - visibleMaterials.length})
          </MoreButton>
        )}
      </Section>

      {/* 3 — Colour. Only colours this material is actually sold in. */}
      <Section label="Màu sắc" hint={resolved.colorName}>
        <div className="grid grid-cols-6 gap-2">
          {visibleColors.map((color) => {
            const isActive = color.id === style.color;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onStyleChange(activeSurface, { color: color.id })}
                title={color.name}
                aria-label={color.name}
                aria-pressed={isActive}
                className={`aspect-square rounded-full border-2 transition-all ${
                  isActive
                    ? 'border-[#0F3D5C] ring-2 ring-[#0F3D5C]/15 ring-offset-1'
                    : 'border-black/10 hover:border-[#C8A96A]'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
        {!showAllColors && colors.length > visibleColors.length && (
          <MoreButton onClick={() => setShowAllColors(true)}>Xem thêm màu ({colors.length - visibleColors.length})</MoreButton>
        )}
      </Section>

      {/* 4 — Finish. Ranked per surface: floors lead with mờ/nhám, walls mờ/bóng. */}
      <Section label="Hoàn thiện">
        <div className="flex flex-wrap gap-1.5">
          {finishes.map((finish) => {
            const isActive = finish.id === style.finish;
            const antiSlip = activeSurface === 'floor' && finish.antiSlip;
            return (
              <button
                key={finish.id}
                type="button"
                onClick={() => onStyleChange(activeSurface, { finish: finish.id })}
                aria-pressed={isActive}
                title={antiSlip ? 'Bề mặt nhám — tăng độ chống trơn cho sàn ướt' : finish.name}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'border-[#0F3D5C] bg-[#0F3D5C] text-white'
                    : 'border-[#E6EDF2] bg-white text-[#627386] hover:border-[#C8A96A]'
                }`}
              >
                {finish.name}
                {antiSlip && <span className="ml-1 font-normal opacity-80">· chống trơn</span>}
              </button>
            );
          })}
        </div>
      </Section>

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

/**
 * The first `limit` options, plus the current selection if it ranks below the
 * cut. Without the second half, a surface whose saved finish is a low-priority
 * material (or a restored snapshot) would show no selected chip at all.
 */
function shortlist<T extends { id: string }>(options: T[], selectedId: string, limit: number, expanded: boolean): T[] {
  if (expanded) return options;
  const head = options.slice(0, limit);
  if (head.some((o) => o.id === selectedId)) return head;
  const selected = options.find((o) => o.id === selectedId);
  return selected ? [...head, selected] : head;
}

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C9BAB]">{label}</span>
        {hint && <span className="truncate text-[10px] font-medium text-[#627386]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function MoreButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#0F3D5C] hover:text-[#C8A96A]"
    >
      <Plus className="h-3 w-3" />
      {children}
    </button>
  );
}
