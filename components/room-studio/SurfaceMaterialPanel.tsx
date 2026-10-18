'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
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
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { estimateSurfaceMaterial } from '@/lib/room-studio/materialEstimate';

interface SurfaceMaterialPanelProps {
  surfaceStyles: Record<SurfaceId, SurfaceStyle>;
  /** Patches ONE axis at a time; the state layer re-normalises the rest. */
  onStyleChange: (surface: SurfaceId, patch: Partial<SurfaceStyle>) => void;
  dimensions: RoomDimensions;
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
 * Rendered as the VẬT LIỆU tab's content, so it carries no card of its own.
 * The ceiling toggle moved to PHÒNG, where it belongs: it is a view setting for
 * the room, and it had been sitting between the colour swatches and the budget
 * field, belonging to neither.
 *
 * The customer first says which surface they are finishing, then makes three
 * independent decisions in the order a showroom asks them: what the surface is
 * made of, what colour it is, and how it is finished. Those were previously one
 * mixed list ("Gạch be"), which conflated all three.
 */
export default function SurfaceMaterialPanel({
  surfaceStyles,
  onStyleChange,
  dimensions,
}: SurfaceMaterialPanelProps) {
  const [activeSurface, setActiveSurface] = useState<SurfaceId>('floor');
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [wastage, setWastage] = useState(10);

  const style = surfaceStyles[activeSurface];
  const resolved = resolveSurfaceMaterial(style);
  const estimate = useMemo(
    () => estimateSurfaceMaterial(activeSurface, dimensions, wastage),
    [activeSurface, dimensions, wastage]
  );

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
    <div>
      {/* 1 — Surface target */}
      <div className="flex gap-1 rounded bg-[#F3F7FA] p-1">
        {SURFACES.map((surface) => (
          <button
            key={surface.id}
            type="button"
            onClick={() => selectSurface(surface.id)}
            aria-pressed={activeSurface === surface.id}
            className={`flex-1 rounded py-2 text-[13px] font-semibold transition-colors ${
              activeSurface === surface.id ? 'bg-white text-[#0B1623] shadow-sm' : 'text-[#627386] hover:text-[#0B1623]'
            }`}
          >
            {surface.label}
          </button>
        ))}
      </div>

      {/* Display-only summary of the three choices below. */}
      <div className="mt-3 flex items-center gap-2.5 rounded border border-[#E6EDF2] bg-[#FAFCFD] px-3 py-2.5">
        <span
          className="h-8 w-8 shrink-0 rounded-lg border border-[#D8E2EA]"
          style={{ background: patternBackground(resolved, resolved.baseColor, resolved.accentColor) }}
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#0B1623]">{describeSurfaceStyle(style)}</p>
          <p className="text-[12px] text-[#8C9BAB]">
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
                className={`flex items-center gap-2 rounded border p-2 text-left transition-colors ${
                  isActive
                    ? 'border-[color:var(--tenant-ui-selected,#0F3D5C)] bg-[#F3F7FA] shadow-sm'
                    : 'border-[#E6EDF2] bg-white hover:border-[#C8A96A]/70'
                }`}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-lg border border-black/10"
                  style={{ background: patternBackground(material, preview.baseColor, preview.accentColor) }}
                />
                <span
                  className={`line-clamp-2 text-[12px] font-medium leading-tight ${
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
                    ? 'border-[color:var(--tenant-ui-selected,#0F3D5C)] ring-2 ring-[#0F3D5C]/15 ring-offset-1'
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
                className={`rounded border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  isActive
                    ? 'border-[color:var(--tenant-ui-selected,#0F3D5C)] bg-[color:var(--tenant-ui-selected,#0F3D5C)] text-[color:var(--tenant-ui-selected-contrast,#FFFFFF)]'
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

      <Section label="Ước tính vật liệu sơ bộ">
        <div className="rounded border border-[#D8E4E7] bg-[#F7FAFA] p-3.5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            <dt className="text-[#75848B]">Diện tích bề mặt</dt><dd className="text-right font-semibold text-[#243746]">{estimate.surfaceAreaM2.toLocaleString('vi-VN')} m²</dd>
            <dt className="text-[#75848B]">Vật liệu dự kiến</dt><dd className="text-right font-semibold text-[#105F95]">{estimate.estimatedMaterialM2.toLocaleString('vi-VN')} m²</dd>
          </dl>
          <label className="mt-3 flex items-center justify-between gap-3 text-[12px] text-[#5E6A70]">
            Hao hụt dự kiến
            <span className="flex items-center gap-1"><input type="number" min="0" max="30" step="1" value={wastage} onChange={(event) => setWastage(Number(event.target.value) || 0)} className="h-8 w-16 border border-[#C9D6D9] bg-white px-2 text-right outline-none focus:border-[#105F95]" />%</span>
          </label>
          <p className="mt-3 text-[11px] leading-5 text-[#75848B]">
            {activeSurface === 'walls' ? 'Tường tính theo chu vi × chiều cao; V1 chưa trừ cửa hoặc ô mở.' : 'Sàn tính theo chiều dài × chiều rộng.'} Đây là ước tính quy hoạch, không phải BOQ thi công.
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#75848B]">Preset vật liệu là kiểu hiển thị, chưa phải SKU. Không tính số hộp hoặc giá khi chưa có quy cách đóng gói và giá có nguồn.</p>
        </div>
      </Section>

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
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">{label}</span>
        {hint && <span className="truncate text-[12px] text-[#5B6B7A]">{hint}</span>}
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
      className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[#0F3D5C] underline decoration-[#C8D5DE] underline-offset-4 transition-colors hover:decoration-[#0F3D5C]"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden />
      {children}
    </button>
  );
}
