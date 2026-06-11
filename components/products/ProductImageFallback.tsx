'use client';

import { 
  Package, 
  Droplet, 
  Image, 
  ShowerHead, 
  PaintBucket, 
  Bath, 
  Lightbulb, 
  Sofa, 
  Wrench,
  Grid
} from 'lucide-react';
import { normalizeCategory } from '@/lib/categoryHelper';

interface ProductImageFallbackProps {
  category: string;
}

export default function ProductImageFallback({ category }: ProductImageFallbackProps) {
  const normCategory = normalizeCategory(category);

  // Map category to icon
  let Icon = Package;
  if (normCategory === 'Lavabo') Icon = Bath;
  else if (normCategory === 'Vòi lavabo') Icon = Droplet;
  else if (normCategory === 'Gương') Icon = Image; // Reusing lucide icons, maybe not exact but works
  else if (normCategory === 'Sen tắm') Icon = ShowerHead;
  else if (normCategory === 'Bồn cầu') Icon = Bath;
  else if (normCategory === 'Gạch ốp') Icon = Grid;
  else if (normCategory === 'Tủ lavabo') Icon = Package;
  else if (normCategory === 'Đèn') Icon = Lightbulb;
  else if (normCategory === 'Phụ kiện') Icon = Wrench;
  else if (normCategory === 'Sofa') Icon = Sofa;
  else if (normCategory === 'Bàn') Icon = Package;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEF4F7] text-[#486581]">
      <Icon className="w-10 h-10 mb-2 opacity-50" />
      <span className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">{normCategory}</span>
      <span className="text-[10px] opacity-50">Ảnh minh hoạ</span>
    </div>
  );
}
