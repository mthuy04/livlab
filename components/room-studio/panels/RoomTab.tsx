'use client';

import { useState } from 'react';
import {
  DIMENSION_LIMITS,
  clampDimension,
  getFloorArea,
  getVolume,
  validateDimension,
  type RoomDimensionKey,
  type RoomDimensions,
} from '@/lib/room-studio/roomGeometry';

interface RoomTabProps {
  dimensions: RoomDimensions;
  onDimensionsChange: (dimensions: RoomDimensions) => void;
  showCeiling: boolean;
  onToggleCeiling: (value: boolean) => void;
  onOpenReferenceImage: () => void;
  hasReferenceImage: boolean;
  onOpenPresets: () => void;
}

/**
 * Short customer labels, one style throughout. The validation layer calls these
 * "Chiều dài / Chiều rộng / Chiều cao"; the panel is narrow and the inputs sit
 * in a row, so they are "Dài / Rộng / Cao" here — and nowhere are both styles
 * mixed in one group. The long form stays in the error messages, where a
 * sentence needs it.
 */
const FIELDS: { key: RoomDimensionKey; short: string }[] = [
  { key: 'length', short: 'Dài' },
  { key: 'width', short: 'Rộng' },
  { key: 'height', short: 'Cao' },
];

/**
 * Room geometry. All three values visible together, which is the whole change:
 * they used to be stacked inside one of six accordion-length panels, so a
 * customer had to scroll to find out how tall their own room was.
 *
 * Draft text state is kept per field so a value can be cleared and retyped
 * without snapping back mid-edit — the behaviour from the previous form, and
 * the reason this is not a thin wrapper around three `<input>`s.
 */
export default function RoomTab({
  dimensions,
  onDimensionsChange,
  showCeiling,
  onToggleCeiling,
  onOpenReferenceImage,
  hasReferenceImage,
  onOpenPresets,
}: RoomTabProps) {
  const [drafts, setDrafts] = useState<Record<RoomDimensionKey, string>>({
    length: String(dimensions.length),
    width: String(dimensions.width),
    height: String(dimensions.height),
  });
  const [errors, setErrors] = useState<Partial<Record<RoomDimensionKey, string>>>({});

  // Re-sync when the room changes from elsewhere (a restored session, a preset,
  // a reset). Keyed on the committed values, and this form advances the key
  // itself, so typing "2." is never clobbered by the value it just produced.
  const dimensionKey = `${dimensions.length}|${dimensions.width}|${dimensions.height}`;
  const [syncedKey, setSyncedKey] = useState(dimensionKey);
  if (syncedKey !== dimensionKey) {
    setSyncedKey(dimensionKey);
    setDrafts({
      length: String(dimensions.length),
      width: String(dimensions.width),
      height: String(dimensions.height),
    });
    setErrors({});
  }

  const commit = (next: RoomDimensions) => {
    setSyncedKey(`${next.length}|${next.width}|${next.height}`);
    onDimensionsChange(next);
  };

  const handleChange = (key: RoomDimensionKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDrafts((prev) => ({ ...prev, [key]: text }));

    if (text.trim() === '') {
      setErrors((prev) => ({
        ...prev,
        [key]: `Vui lòng nhập ${DIMENSION_LIMITS[key].label.toLowerCase()} của phòng.`,
      }));
      return;
    }

    const value = parseFloat(text.replace(',', '.'));
    const message = validateDimension(key, value);
    setErrors((prev) => ({ ...prev, [key]: message }));
    if (!message) commit({ ...dimensions, [key]: value });
  };

  const handleBlur = (key: RoomDimensionKey) => () => {
    const safe = clampDimension(key, parseFloat(drafts[key].replace(',', '.')));
    setDrafts((prev) => ({ ...prev, [key]: String(safe) }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (safe !== dimensions[key]) commit({ ...dimensions, [key]: safe });
  };

  const firstError = FIELDS.map(({ key }) => errors[key]).find(Boolean);

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">
            Kích thước
          </h3>
          <button
            type="button"
            onClick={onOpenPresets}
            className="text-[13px] font-medium text-[color:var(--tenant-ui-link,#0F3D5C)] underline decoration-[#C8D5DE] underline-offset-4 transition-colors hover:decoration-current"
          >
            Kích thước mẫu
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {FIELDS.map(({ key, short }) => {
            const { min, max, label } = DIMENSION_LIMITS[key];
            const error = errors[key];
            return (
              <label key={key} className="flex flex-col gap-1.5">
                <span className="text-[12px] text-[#5B6B7A]">{short}</span>
                <span className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    min={min}
                    max={max}
                    value={drafts[key]}
                    onChange={handleChange(key)}
                    onBlur={handleBlur(key)}
                    aria-invalid={Boolean(error)}
                    aria-label={`${label}, mét (${min}–${max})`}
                    className={`w-full rounded border bg-white py-2 pl-2.5 pr-6 text-[14px] text-[#0B1623] transition-colors focus:outline-none ${
                      error ? 'border-red-400 focus:border-red-500' : 'border-[#D8E2EA] focus:border-[color:var(--tenant-ui-selected,#0F3D5C)]'
                    }`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-[#9AA9B6]"
                  >
                    m
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {firstError ? (
          <p role="alert" className="mt-2 text-[12px] font-medium text-red-500">
            {firstError}
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-[#9AA9B6]">
            Dài, rộng 1–8 m · cao 2–4 m
          </p>
        )}

        <dl className="mt-3 flex items-baseline gap-5 border-t border-[#EDF2F5] pt-3">
          <div>
            <dt className="text-[12px] text-[#8C9BAB]">Diện tích</dt>
            <dd className="text-[15px] font-semibold text-[#0B1623]">
              {getFloorArea(dimensions).toFixed(1)} m²
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#8C9BAB]">Thể tích</dt>
            <dd className="text-[15px] font-semibold text-[#0B1623]">
              {getVolume(dimensions).toFixed(1)} m³
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">
          Hiển thị
        </h3>
        {/* The ceiling toggle lives with the room, not adrift between the
            material swatches and the budget field where it used to sit. */}
        <label className="flex cursor-pointer items-center justify-between py-1.5">
          <span className="text-[13px] text-[#3F4F5C]">Hiện trần phòng</span>
          <input
            type="checkbox"
            checked={showCeiling}
            onChange={(e) => onToggleCeiling(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--tenant-ui-selected,#0F3D5C)]"
          />
        </label>
      </section>

      <section className="border-t border-[#EDF2F5] pt-4">
        <button
          type="button"
          onClick={onOpenReferenceImage}
          className="text-left text-[13px] font-medium text-[color:var(--tenant-ui-link,#0F3D5C)] underline decoration-[#C8D5DE] underline-offset-4 transition-colors hover:decoration-current"
        >
          {hasReferenceImage ? 'Ảnh tham chiếu đã chọn' : 'Ảnh tham chiếu phong cách'}
        </button>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#9AA9B6]">
          Ảnh chỉ dùng để tham khảo phong cách. Không gian 3D được dựng từ kích thước bạn nhập.
        </p>
      </section>
    </div>
  );
}
