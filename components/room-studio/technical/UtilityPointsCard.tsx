'use client';

import { useState } from 'react';
import { Droplets, Plus, X } from 'lucide-react';
import type { UtilityPoint, UtilityPointType } from '@/lib/technical-advisor/types';
import { getRoomBounds, type RoomDimensions } from '@/lib/room-studio/roomGeometry';

interface UtilityPointsCardProps {
  dimensions: RoomDimensions;
  points: UtilityPoint[];
  onAdd: (point: UtilityPoint) => void;
  onRemove: (id: string) => void;
}

const TYPE_OPTIONS: { value: UtilityPointType; label: string }[] = [
  { value: 'DRAIN', label: 'Thoát nước' },
  { value: 'TOILET_WASTE', label: 'Xả bồn cầu' },
  { value: 'COLD_WATER', label: 'Cấp nước lạnh' },
  { value: 'HOT_WATER', label: 'Cấp nước nóng' },
  { value: 'ELECTRICAL', label: 'Điểm điện' },
];

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.label])) as Record<
  UtilityPointType,
  string
>;

let counter = 0;

/**
 * Manual declaration of the room's existing water, drain and power points.
 *
 * Manual is the whole point. LivLab cannot see inside walls and will not guess
 * from a photograph, so until the customer says where these are, the plumbing
 * rule honestly reports "chưa có dữ liệu" instead of inventing a position.
 *
 * Coordinates are entered as distances from the back-left corner, which is how
 * someone standing in the room would actually measure — the room frame is
 * centre-origin internally, so this converts.
 */
export default function UtilityPointsCard({ dimensions, points, onAdd, onRemove }: UtilityPointsCardProps) {
  const [type, setType] = useState<UtilityPointType>('DRAIN');
  const [fromLeft, setFromLeft] = useState('');
  const [fromBack, setFromBack] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bounds = getRoomBounds(dimensions);

  const handleAdd = () => {
    const left = parseFloat(fromLeft.replace(',', '.'));
    const back = parseFloat(fromBack.replace(',', '.'));

    if (!Number.isFinite(left) || !Number.isFinite(back)) {
      setError('Vui lòng nhập khoảng cách theo mét.');
      return;
    }
    if (left < 0 || left > dimensions.length || back < 0 || back > dimensions.width) {
      setError(`Vị trí phải nằm trong phòng (tối đa ${dimensions.length}m × ${dimensions.width}m).`);
      return;
    }

    counter += 1;
    onAdd({
      id: `up_${Date.now().toString(36)}_${counter}`,
      type,
      // Corner-relative (how people measure) -> centre-origin (how the room frame works).
      position: [bounds.minX + left, 0, bounds.minZ + back],
      label: TYPE_LABEL[type],
    });
    setFromLeft('');
    setFromBack('');
    setError(null);
  };

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Droplets className="h-4 w-4 text-[#C8A96A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1623]">Điểm cấp &amp; thoát nước</h3>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-[#627386]">
        Không bắt buộc. Khai báo các điểm hiện có trong phòng để LivLab kiểm tra giúp bạn. Đo từ góc trong bên trái của
        phòng.
      </p>

      {points.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {points.map((point) => {
            const left = point.position[0] - bounds.minX;
            const back = point.position[2] - bounds.minZ;
            return (
              <li
                key={point.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#F3F7FA] px-3 py-2"
              >
                <span className="min-w-0 flex-1 text-[11px] text-[#0B1623]">
                  <strong>{TYPE_LABEL[point.type] ?? 'Điểm kỹ thuật'}</strong>
                  <span className="text-[#627386]">
                    {' '}
                    · cách trái {left.toFixed(2)}m, cách tường trong {back.toFixed(2)}m
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(point.id)}
                  aria-label={`Xoá ${TYPE_LABEL[point.type]}`}
                  className="shrink-0 rounded-lg p-1 text-[#9AA9B6] transition-colors hover:bg-white hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as UtilityPointType)}
          aria-label="Loại điểm kỹ thuật"
          className="w-full rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step={0.1}
            value={fromLeft}
            onChange={(e) => setFromLeft(e.target.value)}
            placeholder="Cách trái (m)"
            aria-label="Khoảng cách từ tường trái, mét"
            className="min-w-0 flex-1 rounded-xl border border-[#D8E2EA] px-3 py-2 text-xs text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
          />
          <input
            type="number"
            inputMode="decimal"
            step={0.1}
            value={fromBack}
            onChange={(e) => setFromBack(e.target.value)}
            placeholder="Cách tường trong (m)"
            aria-label="Khoảng cách từ tường trong, mét"
            className="min-w-0 flex-1 rounded-xl border border-[#D8E2EA] px-3 py-2 text-xs text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
          />
        </div>

        {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#EEF4F7] py-2.5 text-xs font-bold text-[#123C5A] transition-colors hover:bg-[#D8E2EA]"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm điểm kỹ thuật
        </button>
      </div>
    </div>
  );
}
