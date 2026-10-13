'use client';

import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import WorkspaceDialog from './WorkspaceDialog';
import { formatMetres } from './WorkspaceHeader';

interface RoomPresetDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (dimensions: RoomDimensions) => void;
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

export default function RoomPresetDialog({ open, onClose, onApply }: RoomPresetDialogProps) {
  return (
    <WorkspaceDialog
      open={open}
      title="Bắt đầu không gian"
      description="Chọn một kích thước gần đúng rồi chỉnh lại, hoặc đóng và tự nhập."
      onClose={onClose}
    >
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
