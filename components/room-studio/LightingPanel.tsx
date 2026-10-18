'use client';

import { LIGHTING_PRESETS, type LightingPresetId } from '@/lib/room-studio/environment';

const ORDER: LightingPresetId[] = ['daylight', 'warm', 'studio'];

/**
 * The room's light, under the finishes it changes the look of. Three looks,
 * all physically plausible: a finish is judged in daylight, enjoyed in warm
 * light, and compared side by side under studio light.
 */
export default function LightingPanel({
  value,
  onChange,
}: {
  value: LightingPresetId;
  onChange: (id: LightingPresetId) => void;
}) {
  return (
    <section className="border-t border-[#EDF2F5] pt-4">
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">Ánh sáng</h3>
      <div role="radiogroup" aria-label="Ánh sáng" className="space-y-1.5">
        {ORDER.map((id) => {
          const preset = LIGHTING_PRESETS[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              className={`flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-[color:var(--tenant-ui-selected,#0F3D5C)] bg-[#F3F7FA]'
                  : 'border-[#E1E8ED] hover:border-[#C8D5DE]'
              }`}
            >
              <span
                aria-hidden
                className="h-6 w-6 shrink-0 rounded-full border border-black/5"
                style={{ background: `linear-gradient(135deg, ${preset.key.color}, ${preset.ground})` }}
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#0B1623]">{preset.name}</span>
                <span className="block text-[11.5px] text-[#8C9BAB]">{preset.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
