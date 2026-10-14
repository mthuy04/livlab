'use client';

import { Check, HelpCircle } from 'lucide-react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';

interface WorkspaceHeaderProps {
  dimensions: RoomDimensions;
  /** Whether the current room has been written to the browser's own storage. */
  saved: boolean;
  onOpenGuide: () => void;
}

/** 3 → "3,0". Vietnamese decimal comma, one place, matching the dimension inputs. */
export function formatMetres(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

/**
 * The workspace's own header, in place of the old 300px marketing hero.
 *
 * It says which room is open and what state it is in, which is what a header
 * on an editor is for. The storefront's header is still above this one and
 * still does the selling; repeating the pitch here cost the viewport a third
 * of its height and told the customer nothing they had not just read.
 */
export default function WorkspaceHeader({ dimensions, saved, onOpenGuide }: WorkspaceHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E1E8ED] bg-white px-4 py-2.5 md:px-6">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0B1623]">
          Room Studio
        </h1>
        <span aria-hidden className="hidden h-3 w-px bg-[#D8E2EA] sm:block" />
        <p className="truncate text-[13px] text-[#5B6B7A]">
          Phòng tắm · {formatMetres(dimensions.length)} × {formatMetres(dimensions.width)} m
        </p>
        {/* The room saves itself. This says so; it is not a button. */}
        {saved && (
          <span
            title="Thiết kế được lưu tự động trong trình duyệt này."
            className="hidden shrink-0 items-center gap-1 text-[12px] text-[#6F8A70] sm:flex"
          >
            <Check className="h-3.5 w-3.5" aria-hidden /> Đã lưu
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] text-[#5B6B7A] transition-colors hover:bg-[#F3F7FA] hover:text-[#0B1623]"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Hướng dẫn</span>
        </button>
      </div>
    </header>
  );
}
