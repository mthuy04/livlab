'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeProductImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  className?: string;
}

export default function SafeProductImage({ src, alt, category, className = '' }: SafeProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#F8FBFD] border border-[#D8E2EA] text-[#627386] ${className}`}>
        <Package className="w-6 h-6 mb-2 opacity-60" strokeWidth={1.5} />
        {category && <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{category}</span>}
        <span className="text-xs opacity-60 mt-1 px-4 text-center">Hình ảnh đang cập nhật</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
