'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import type { WalkInput } from '@/lib/room-studio/walkInput';
export default function WalkthroughOverlay({
  input,
  exit,
  obstruction,
}: {
  input: WalkInput;
  exit: () => void;
  obstruction: RefObject<HTMLParagraphElement | null>;
}) {
  const look = useRef<{ id: number; x: number; y: number } | null>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    exitButton.current?.focus({ preventScroll: true });
    function press(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        e.preventDefault();
        exit();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (input.press(e.code)) e.preventDefault();
    }
    function release(e: KeyboardEvent) {
      input.release(e.code);
    }
    function clear() {
      look.current = null;
      input.clear();
    }
    window.addEventListener('keydown', press);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      clear();
      window.removeEventListener('keydown', press);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [input, exit]);
  return (
    <div
      className="absolute inset-0 z-40 isolate touch-none"
      role="dialog"
      aria-modal="true"
      aria-label="Tham quan 3D"
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          const buttons = e.currentTarget.querySelectorAll('button');
          const i = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
          buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
          e.preventDefault();
        }
      }}
    >
      <div
        aria-label="Kéo để nhìn quanh"
        className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          if (look.current) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const p = look.current;
          if (p?.id !== e.pointerId) return;
          input.look(e.clientX - p.x, e.clientY - p.y);
          p.x = e.clientX;
          p.y = e.clientY;
        }}
        onLostPointerCapture={() => {
          look.current = null;
        }}
        onPointerCancel={() => {
          look.current = null;
        }}
      />
      <button
        ref={exitButton}
        onClick={exit}
        className="absolute right-3 top-3 flex min-h-11 items-center gap-2 rounded border bg-white px-4 text-sm font-semibold text-[#172733] shadow-sm"
      >
        <LogOut size={16} /> Thoát tham quan
      </button>
      <p
        ref={obstruction}
        role="status"
        hidden
        className="pointer-events-none absolute left-3 top-3 rounded bg-white/95 px-3 py-2 text-xs text-[#57472b]"
      >
        Lối đi bị chắn
      </p>
      <p className="pointer-events-none absolute bottom-3 right-3 max-w-[48%] rounded bg-white/90 px-2 py-1 text-xs text-[#42515a]">
        <span className="hidden md:inline">WASD / phím mũi tên · Esc để thoát · </span>Kéo để nhìn quanh
      </p>
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1" aria-label="Di chuyển">
        {(
          [
            ['up', 'Tiến', ArrowUp],
            ['left', 'Sang trái', ArrowLeft],
            ['down', 'Lùi', ArrowDown],
            ['right', 'Sang phải', ArrowRight],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            className={
              'grid size-11 touch-none place-items-center rounded border bg-white/90 text-[#172733] active:bg-[#e8dcc6] ' +
              (key === 'up' ? 'col-start-2' : '') +
              (key === 'left' ? ' col-start-1' : '')
            }
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              input.press(key);
            }}
            onPointerUp={() => input.release(key)}
            onPointerCancel={() => input.release(key)}
            onLostPointerCapture={() => input.release(key)}
          >
            <Icon size={19} />
          </button>
        ))}
      </div>
    </div>
  );
}
