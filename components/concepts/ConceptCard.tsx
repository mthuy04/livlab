'use client';

import Link from 'next/link';
import { Concept } from '@/lib/types';
import { ArrowUpRight, Layers, Image as ImageIcon } from 'lucide-react';
import SaveButton from '@/components/concepts/SaveButton';
import SafeImage from '@/components/ui/SafeImage';
import { useState } from 'react';
import { livlabImages } from '@/lib/livlabImages';

export function normalizeConceptImage(concept: Concept): string {
  if (concept.image && concept.image.startsWith('/images/')) {
    return concept.image;
  }
  
  const cTitle = (concept.title || '').toLowerCase();
  const cSlug = (concept.slug || '').toLowerCase();
  const cStyle = (concept.style || '').toLowerCase();
  const cDesc = (concept.description || '').toLowerCase();
  const cArea = (concept.areaSize || '').toLowerCase();
  const cBudget = (concept.budgetRange || '').toLowerCase();

  const allText = `${cTitle} ${cSlug} ${cStyle} ${cDesc} ${cArea} ${cBudget}`;

  if (allText.includes('compact') || allText.includes('căn hộ nhỏ') || allText.includes('dưới 4m')) {
    return livlabImages.concepts.compact;
  }
  if (allText.includes('japandi')) {
    return livlabImages.concepts.japandi;
  }
  if (allText.includes('hotel') || allText.includes('khách sạn') || allText.includes('gray') || allText.includes('xám')) {
    return livlabImages.concepts.hotelGray;
  }
  if (allText.includes('luxury') || allText.includes('cao cấp') || allText.includes('master')) {
    return livlabImages.concepts.luxuryMaster;
  }
  if (allText.includes('minimal') || allText.includes('tối giản') || allText.includes('white') || allText.includes('trắng')) {
    return livlabImages.concepts.minimalWhite;
  }
  if (allText.includes('rental') || allText.includes('budget') || allText.includes('nhà cho thuê') || allText.includes('tiết kiệm') || allText.includes('dưới 30')) {
    return livlabImages.concepts.rentalBudget;
  }
  
  return livlabImages.concepts.japandi;
}

interface ConceptCardProps {
  concept: Concept;
  priority?: boolean;
}

const styleColors: Record<string, string> = {
  Japandi:        'bg-[#EEF4F7] text-[#123C5A]',
  Modern:         'bg-[#EEF4F7] text-[#486581]',
  Minimal:        'bg-[#F3F7FA] text-[#627386]',
  Hotel:          'bg-[#0B1623] text-white',
  'Warm Neutral': 'bg-[#EEF4F7] text-[#C8A96A]',
  Industrial:     'bg-[#D8E2EA] text-[#0B1623]',
};

const roomTypeVi: Record<string, string> = {
  Bathroom:     'Phòng tắm',
  'Living Room':'Phòng khách',
  Kitchen:      'Bếp',
  Studio:       'Studio',
  Bedroom:      'Phòng ngủ',
  Dining:       'Phòng ăn',
};

const budgetVi: Record<string, string> = {
  'Under 30M': 'Dưới 30 triệu',
  '30M–60M':   '30–60 triệu',
  '60M+':      'Trên 60 triệu',
};

export default function ConceptCard({ concept, priority = false }: ConceptCardProps) {
  const [imgError, setImgError] = useState(false);

  const displayRoomType = roomTypeVi[concept.roomType] || concept.roomType;
  const displayBudget = budgetVi[concept.budgetRange] || concept.budgetRange;

  return (
    <div className="group block relative h-full">
      <article className="bg-white rounded-3xl overflow-hidden border border-[#D8E2EA] shadow-sm hover:shadow-[0_24px_60px_rgba(11,22,35,0.09)] hover:-translate-y-1.5 hover:border-[#123C5A]/30 transition-all duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7FA]">
          <SafeImage
            src={normalizeConceptImage(concept)}
            alt={concept.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackLabel={displayRoomType}
            loading={priority ? 'eager' : 'lazy'}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

          {/* Room type badge — bottom-left */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-[#123C5A] shadow-sm">
              {displayRoomType}
            </span>
          </div>

          {/* Save button — top-right */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <SaveButton slug={concept.slug} size="md" />
          </div>

          {/* Arrow hover indicator */}
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md">
            <ArrowUpRight className="w-4 h-4 text-[#0B1623]" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className="text-[10px] font-bold text-[#486581] uppercase tracking-wider"
            >
              {concept.style}
            </span>
            <span className="text-[10px] font-bold text-[#C8A96A] uppercase tracking-wider">
              • {budgetVi[concept.budgetRange] || concept.budgetRange}
            </span>
          </div>

          <h3 className="text-base font-semibold text-[#0B1623] mb-3 leading-snug group-hover:text-[#123C5A] transition-colors">
            <Link href={`/concepts/${concept.slug}`} className="before:absolute before:inset-0">
              {concept.title}
            </Link>
          </h3>

          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#627386]">
              Diện tích: <span className="font-semibold text-[#0B1623]">{concept.areaSize}</span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#627386]">
              <Layers className="w-3.5 h-3.5" />
              <span>{concept.productIds?.length || 0} sản phẩm</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-[#D8E2EA] flex items-center justify-between relative z-10">
            <Link href={`/concepts/${concept.slug}`} className="text-[11px] font-bold uppercase tracking-wider text-[#123C5A] hover:text-[#0D2B42] transition-colors flex items-center gap-1.5">
              Xem concept <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link href={`/quote?concept=${encodeURIComponent(concept.title)}`} className="text-[11px] font-bold uppercase tracking-wider text-[#627386] hover:text-[#123C5A] transition-colors">
              Báo giá
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
