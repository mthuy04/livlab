'use client';

import { useMemo } from 'react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import { STARTER_ROOMS, resolveSlot, type StarterRoomPreset } from '@/lib/room-studio/roomPresets';
import { LIGHTING_PRESETS } from '@/lib/room-studio/environment';
import { describeSurfaceStyle } from '@/lib/room-studio/materials';
import WorkspaceDialog from './WorkspaceDialog';
import { formatMetres } from './WorkspaceHeader';

interface RoomPresetDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (dimensions: RoomDimensions) => void;
  /** The active catalogue, so each starter room can say what it will place. */
  products: RoomStudioProduct[];
  onApplyStarter: (preset: StarterRoomPreset) => void;
}

/**
 * Three sizes that cover most Vietnamese bathrooms, all within the validated
 * ranges the form enforces. They are a shortcut, not a requirement: the
 * customer can close this and keep the default room, or type their own.
 */
const PRESETS: { label: string; note: string; dimensions: RoomDimensions }[] = [
  { label: 'Căn hộ nhỏ', note: 'Phòng tắm phụ, chỉ có sen và lavabo', dimensions: { length: 3, width: 2, height: 2.7 } },
  { label: 'Phòng tắm tiêu chuẩn', note: 'Đủ chỗ cho bồn cầu, lavabo và buồng tắm', dimensions: { length: 3.5, width: 2.5, height: 2.7 } },
  { label: 'Master bathroom', note: 'Có thể thêm bồn tắm hoặc tủ chậu đôi', dimensions: { length: 4.5, width: 3.5, height: 2.8 } },
];

/**
 * How a room starts: empty, or one of the styled starter rooms.
 *
 * Each starter room says, before it is applied, how many of its products the
 * showroom's catalogue actually carries — a Tùng Đăng room cannot place an
 * INAX basin Tùng Đăng does not list, and the card says so rather than
 * surprising the customer. Replacing a room that already has products asks
 * first; the replacement can then be undone once from the confirmation.
 */
export default function RoomPresetDialog({
  open,
  onClose,
  onApply,
  products,
  onApplyStarter,
}: RoomPresetDialogProps) {
  const coverage = useMemo(
    () =>
      Object.fromEntries(
        STARTER_ROOMS.map((preset) => {
          const filled = preset.slots.filter((slot) => resolveSlot(slot, products));
          return [preset.id, { filled: filled.length, total: preset.slots.length, roles: filled.map((s) => s.role) }];
        })
      ),
    [products]
  );

  return (
    <WorkspaceDialog
      open={open}
      title="Bắt đầu không gian"
      description="Một phòng mẫu đã có vật liệu, ánh sáng và sản phẩm, hoặc chỉ chọn kích thước."
      onClose={onClose}
    >
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">Phòng mẫu</h3>
      <div className="space-y-2">
        {STARTER_ROOMS.map((preset) => {
          const c = coverage[preset.id];
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => { onClose(); onApplyStarter(preset); }}
              className="flex w-full items-start justify-between gap-4 rounded border border-[#D8E2EA] px-4 py-3 text-left transition-colors hover:border-[color:var(--tenant-ui-selected,#0B2239)]"
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-[#0B1623]">{preset.name}</span>
                <span className="mt-0.5 block text-[12px] text-[#8C9BAB]">{preset.description}</span>
                {preset.surfaces && (
                  <span className="mt-1 block text-[11.5px] text-[#9AA9B6]">
                    {describeSurfaceStyle(preset.surfaces.floor)} · {LIGHTING_PRESETS[preset.lighting ?? 'daylight'].name}
                  </span>
                )}
                {c.total > 0 && (
                  <span className="mt-1 block text-[11.5px] font-medium text-[#5B6B7A]">
                    {c.filled === 0
                      ? 'Danh mục hiện tại không có sản phẩm cho phòng mẫu này'
                      : `${c.filled}/${c.total} sản phẩm có trong danh mục: ${c.roles.join(', ')}`}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#3F4F5C]">
                {preset.dimensions
                  ? `${formatMetres(preset.dimensions.length)} × ${formatMetres(preset.dimensions.width)} m`
                  : 'Giữ kích thước'}
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8C9BAB]">
        Chỉ đổi kích thước
      </h3>
      <div className="space-y-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onApply(preset.dimensions);
              onClose();
            }}
            className="flex w-full items-center justify-between gap-4 rounded border border-[#D8E2EA] px-4 py-3 text-left transition-colors hover:border-[#0B2239]"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-[#0B1623]">{preset.label}</span>
              <span className="mt-0.5 block text-[12px] text-[#8C9BAB]">{preset.note}</span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#3F4F5C]">
              {formatMetres(preset.dimensions.length)} × {formatMetres(preset.dimensions.width)} m
            </span>
          </button>
        ))}
      </div>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#EDF2F5]" />
        <span className="text-[12px] text-[#9AA9B6]">hoặc</span>
        <span className="h-px flex-1 bg-[#EDF2F5]" />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded bg-[#0B2239] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#061827]"
      >
        Nhập kích thước riêng
      </button>
    </WorkspaceDialog>
  );
}
