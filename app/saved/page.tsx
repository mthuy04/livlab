'use client';

import { getSavedSlugs, saveSavedSlugs } from '@/lib/storage';
import { concepts } from '@/lib/data';
import ConceptCard from '@/components/concepts/ConceptCard';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SavedConceptsPage() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  
  useEffect(() => {
    setSavedSlugs(getSavedSlugs());
  }, []);

  const savedConcepts = concepts.filter(c => savedSlugs.includes(c.slug));

  const handleClearAll = () => {
    saveSavedSlugs([]);
    setSavedSlugs([]);
  };

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-16">
      <div className="bg-[#EEF4F7] border-b border-[#D8E2EA] py-12 px-6">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-copper fill-copper" />
              <h1 className="text-3xl font-bold text-[#0B1623]">Concept đã lưu</h1>
            </div>
            <p className="text-[#627386]">Danh sách các không gian bạn đã yêu thích để tham khảo sau.</p>
          </div>
          {savedConcepts.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D8E2EA] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors self-start md:self-auto"
            >
              <Trash2 className="w-4 h-4" /> Xóa tất cả
            </button>
          )}
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 py-12">
        {savedConcepts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedConcepts.map(concept => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
            <p className="text-center text-[11px] text-[#A0ACA2] mt-10">Danh sách lưu được giữ cục bộ trên thiết bị của bạn.</p>
          </>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D8E2EA] max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-[#EEF4F7] rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-[#A0ACA2]" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1623] mb-2">Chưa có concept nào được lưu</h3>
            <p className="text-[#627386] text-sm mb-8">Hãy bấm vào biểu tượng trái tim trên các concept bạn thích để lưu lại và dễ dàng xem lại bất cứ lúc nào.</p>
            <Link href="/concepts" className="inline-flex items-center justify-center px-6 py-3 bg-[#123C5A] text-white rounded-full text-sm font-semibold hover:bg-[#123C5A] transition-colors">
              Khám phá concept ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
