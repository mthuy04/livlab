'use client';

import { useState, useEffect, useRef } from 'react';

interface ProductCutoutImageProps {
  src: string;
  alt: string;
  className?: string;
  draggable?: boolean;
}

export default function ProductCutoutImage({ src, alt, className = '', draggable = false }: ProductCutoutImageProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (!isMounted) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);

          // Pure white or very near white
          if (r > 235 && g > 235 && b > 235) {
            data[i + 3] = 0; // Transparent
          } 
          // Light gray / slightly off-white
          else if (r > 225 && g > 225 && b > 225) {
            data[i + 3] = Math.floor(a * 0.25); // 25% opacity
          }
          // Neutral light gray
          else if (r > 220 && g > 220 && b > 220 && (max - min < 18)) {
            data[i + 3] = Math.floor(a * 0.5); // 50% opacity
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setProcessedSrc(dataUrl);
      } catch (e) {
        // CORS or other error
        console.warn('Canvas pixel processing failed, falling back to CSS blend mode', e);
        setUseFallback(true);
      }
    };

    img.onerror = () => {
      if (isMounted) setUseFallback(true);
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Fallback rendering
  if (useFallback) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} mix-blend-multiply drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)] bg-transparent`}
        draggable={draggable}
      />
    );
  }

  // Still processing, show invisible image to maintain dimensions if needed
  if (!processedSrc) {
    return <img src={src} alt={alt} className={`${className} opacity-0`} draggable={draggable} />;
  }

  // Processed image
  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img
        src={processedSrc}
        alt={alt}
        className={`${className} drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)] bg-transparent`}
        draggable={draggable}
      />
    </>
  );
}
