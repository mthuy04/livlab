'use client';

import { useState } from 'react';
import { Ruler } from 'lucide-react';
import {
  DIMENSION_LIMITS,
  clampDimension,
  getFloorArea,
  getVolume,
  validateDimension,
  type RoomDimensionKey,
  type RoomDimensions,
} from '@/lib/room-studio/roomGeometry';

interface RoomDimensionFormProps {
  dimensions: RoomDimensions;
  onDimensionsChange: (dimensions: RoomDimensions) => void;
}

const FIELDS: RoomDimensionKey[] = ['length', 'width', 'height'];

/**
 * Room dimensions in metres — the single deterministic input the 3D room is
 * built from.
 *
 * The field keeps its own text state so a customer can clear it and retype
 * without the value snapping back mid-edit. Only valid values are committed to
 * the scene; invalid ones show a message and leave the room as it was.
 */
export default function RoomDimensionForm({ dimensions, onDimensionsChange }: RoomDimensionFormProps) {
  const [drafts, setDrafts] = useState<Record<RoomDimensionKey, string>>({
    length: String(dimensions.length),
    width: String(dimensions.width),
    height: String(dimensions.height),
  });
  const [errors, setErrors] = useState<Partial<Record<RoomDimensionKey, string>>>({});

  // Re-sync the inputs when the room changes from somewhere else — a restored
  // session, or a reset. `syncedKey` is also advanced by this form's own commits,
  // so typing "2." is never clobbered by the value it just produced.
  const dimensionKey = `${dimensions.length}|${dimensions.width}|${dimensions.height}`;
  const [syncedKey, setSyncedKey] = useState(dimensionKey);
  if (syncedKey !== dimensionKey) {
    setSyncedKey(dimensionKey);
    setDrafts({
      length: String(dimensions.length),
      width: String(dimensions.width),
      height: String(dimensions.height),
    });
  }

  const commit = (next: RoomDimensions) => {
    setSyncedKey(`${next.length}|${next.width}|${next.height}`);
    onDimensionsChange(next);
  };

  const handleChange = (key: RoomDimensionKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDrafts((prev) => ({ ...prev, [key]: text }));

    if (text.trim() === '') {
      setErrors((prev) => ({ ...prev, [key]: `Vui lòng nhập ${DIMENSION_LIMITS[key].label.toLowerCase()} của phòng.` }));
      return;
    }

    const value = parseFloat(text.replace(',', '.'));
    const message = validateDimension(key, value);
    setErrors((prev) => ({ ...prev, [key]: message }));
    if (!message) commit({ ...dimensions, [key]: value });
  };

  // On blur, snap an out-of-range value back into range so the form never sits
  // in a broken state after the customer moves on.
  const handleBlur = (key: RoomDimensionKey) => () => {
    const value = parseFloat(drafts[key].replace(',', '.'));
    const safe = clampDimension(key, value);
    setDrafts((prev) => ({ ...prev, [key]: String(safe) }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (safe !== dimensions[key]) commit({ ...dimensions, [key]: safe });
  };

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Ruler className="h-4 w-4 text-[#C8A96A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Kích thước phòng (mét)</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {FIELDS.map((key) => {
          const { min, max, label } = DIMENSION_LIMITS[key];
          const error = errors[key];
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[11px] text-[#627386]">
                {label} <span className="text-[#9AA9B6]">({min}–{max}m)</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                value={drafts[key]}
                onChange={handleChange(key)}
                onBlur={handleBlur(key)}
                aria-invalid={Boolean(error)}
                aria-label={`${label} (mét)`}
                className={`rounded-xl border px-3 py-2.5 text-sm text-[#0B1623] transition-colors focus:outline-none ${
                  error ? 'border-red-400 focus:border-red-500' : 'border-[#D8E2EA] focus:border-[#0F3D5C]'
                }`}
              />
              {error && <span className="text-[11px] font-medium text-red-500">{error}</span>}
            </label>
          );
        })}
      </div>

      <p className="mt-4 rounded-xl bg-[#F3F7FA] px-3 py-2 text-[11px] text-[#627386]">
        Diện tích sàn <strong className="text-[#0B1623]">{getFloorArea(dimensions).toFixed(1)} m²</strong> · Thể tích{' '}
        <strong className="text-[#0B1623]">{getVolume(dimensions).toFixed(1)} m³</strong>
      </p>
    </div>
  );
}
