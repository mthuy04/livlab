'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageOff, Upload, X } from 'lucide-react';
import type { Concept } from '@/lib/types';
import SafeImage from '@/components/ui/SafeImage';

interface RoomContextPanelProps {
  contextImage?: string;
  contextLabel?: string;
  onContextChange: (image?: string, label?: string) => void;
}

/**
 * Optional photo of the customer's real room, kept from the original Visual
 * Studio flow.
 *
 * It is CONTEXT ONLY — a reference to look at while composing. LivLab does not
 * claim to reconstruct room geometry from a single photograph, and the panel
 * says so, because the 3D room is built strictly from the entered dimensions.
 */
export default function RoomContextPanel({ contextImage, contextLabel, onContextChange }: RoomContextPanelProps) {
  const [sampleRooms, setSampleRooms] = useState<Concept[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/importVerifiedConcepts')
      .then(({ importVerifiedConceptsFromCsv }) => importVerifiedConceptsFromCsv(true))
      .then((concepts) => {
        if (cancelled) return;
        const bathrooms = (concepts || []).filter(
          (c) => c.image && (c.roomType?.toLowerCase().includes('phòng tắm') || c.roomType?.toLowerCase().includes('bathroom'))
        );
        setSampleRooms(bathrooms.slice(0, 4));
      })
      .catch((err) => console.error('[Room Studio] sample rooms failed to load:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Revoke the previous object URL whenever it is replaced or the panel unmounts,
  // so uploaded photos do not pin blobs in memory for the session.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    onContextChange(url, file.name);
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onContextChange(undefined, undefined);
  };

  return (
    <div className="rounded-3xl border border-[#D8E2EA] bg-white p-5">
      <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#0B1623]">Ảnh phòng tham chiếu</h3>
      <p className="mb-4 text-[11px] leading-relaxed text-[#627386]">
        Không bắt buộc. Ảnh chỉ dùng để đối chiếu phong cách — không gian 3D luôn dựng theo kích thước bạn nhập.
      </p>

      {contextImage ? (
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-[#D8E2EA]">
          <SafeImage
            src={contextImage}
            alt={contextLabel || 'Ảnh phòng tham chiếu'}
            className="h-32 w-full object-cover"
            fallbackLabel="Ảnh không tải được"
            fallbackClassName="h-32"
          />
          <button
            type="button"
            onClick={handleClear}
            title="Bỏ ảnh tham chiếu"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0B1623]/80 text-white transition-colors hover:bg-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C8A96A]/50 bg-[#F3F7FA] p-4 transition-colors hover:bg-[#EEF4F7]">
          <Upload className="mb-1.5 h-4 w-4 text-[#C8A96A]" />
          <span className="text-xs font-bold text-[#0B1623]">Tải ảnh phòng tắm</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      )}

      {sampleRooms.length > 0 ? (
        <>
          <p className="mb-2 text-[11px] font-bold text-[#627386]">Hoặc chọn không gian mẫu:</p>
          <div className="grid grid-cols-4 gap-2">
            {sampleRooms.map((concept) => (
              <button
                key={concept.id}
                type="button"
                onClick={() => onContextChange(concept.image, concept.title)}
                title={concept.title}
                className={`aspect-square overflow-hidden rounded-xl border transition-colors ${
                  contextImage === concept.image ? 'border-[#0F3D5C] ring-2 ring-[#0F3D5C]/25' : 'border-[#D8E2EA] hover:border-[#C8A96A]'
                }`}
              >
                <SafeImage src={concept.image} alt={concept.title} className="h-full w-full object-cover" fallbackLabel="" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="flex items-center gap-1.5 text-[11px] text-[#9AA9B6]">
          <ImageOff className="h-3.5 w-3.5" /> Đang tải không gian mẫu…
        </p>
      )}
    </div>
  );
}
