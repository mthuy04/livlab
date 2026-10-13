'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface WorkspaceDialogProps {
  open: boolean;
  title: string;
  /** One line under the title. Optional; most dialogs here need none. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The one modal shell Room Studio uses.
 *
 * It exists because of a specific failure: a first-use dialog a customer cannot
 * get out of. So closing is guaranteed three ways — the button, Escape, and the
 * backdrop — focus moves in and is kept inside while it is open, and focus
 * returns to whatever opened it. Nothing here can refuse to close.
 */
export default function WorkspaceDialog({
  open,
  title,
  description,
  onClose,
  children,
}: WorkspaceDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[#0B1623]/45"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[88svh] w-full overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:max-w-lg sm:rounded"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EDF2F5] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0B1623]">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-[#8C9BAB]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 -mt-1 shrink-0 rounded p-1.5 text-[#8C9BAB] transition-colors hover:bg-[#F3F7FA] hover:text-[#0B1623]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
