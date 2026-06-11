'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { toggleSavedConcept, isConceptSaved } from '@/lib/storage';

interface SaveButtonProps {
  slug: string;
  size?: 'sm' | 'md';
}

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

export default function SaveButton({ slug, size = 'md' }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    setSaved(isConceptSaved(slug));
  }, [slug]);

  const showToast = useCallback((message: string) => {
    const id = ++toastId;
    setToast({ id, message });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const updated = toggleSavedConcept(slug);
      const isSaved = updated.includes(slug);
      setSaved(isSaved);
      showToast(isSaved ? 'Đã lưu concept' : 'Đã bỏ lưu');
    },
    [slug, showToast],
  );

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 rounded-full'
      : 'w-9 h-9 rounded-full';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        aria-label={saved ? 'Bỏ lưu concept' : 'Lưu concept'}
        className={`
          ${sizeClasses}
          flex items-center justify-center
          transition-all duration-200
          shadow-md
          ${saved
            ? 'bg-[#123C5A] hover:bg-[#0D2B42]'
            : 'bg-white/90 hover:bg-white'
          }
        `}
      >
        <Heart
          className={`${iconSize} transition-all duration-200 ${
            saved ? 'text-white fill-white' : 'text-[#627386] hover:text-[#C8A96A]'
          }`}
        />
      </button>

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
            whitespace-nowrap px-3 py-1.5 rounded-xl
            bg-[#0B1623] text-white text-[11px] font-medium
            shadow-lg pointer-events-none
            animate-fade-in-up
          "
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
