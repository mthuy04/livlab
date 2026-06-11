'use client';

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface BlogImageFallbackProps {
  src?: string;
  alt: string;
  category: string;
  title: string;
  className?: string;
}

export default function BlogImageFallback({ src, alt, category, title, className = '' }: BlogImageFallbackProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#EEF4F7] text-center p-6 w-full h-full ${className}`}>
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
          <ImageIcon className="w-6 h-6 text-[#486581]" />
        </div>
        <span className="inline-block px-3 py-1 bg-white text-[#123C5A] rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
          {category}
        </span>
        <h3 className="text-[#0B1623] font-bold text-sm max-w-[80%] line-clamp-2">{title}</h3>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`w-full h-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
