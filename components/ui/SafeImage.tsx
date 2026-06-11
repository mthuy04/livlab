'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
  fallbackClassName?: string;
}

export default function SafeImage({ 
  src, 
  alt, 
  className, 
  fallbackLabel = 'Hình ảnh đang cập nhật',
  fallbackClassName = '',
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#EEF4F7] text-[#627386] ${className} ${fallbackClassName}`}>
        <ImageOff className="mb-2 h-6 w-6 opacity-40" />
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
