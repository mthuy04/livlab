'use client';

import { useState, useMemo, useEffect } from 'react';
import { concepts as defaultConcepts } from '@/lib/data';
import ConceptCard from '@/components/concepts/ConceptCard';
import ConceptFilters from '@/components/concepts/ConceptFilters';
import { BudgetRange, RoomType, StyleType } from '@/lib/types';
import { LayoutGrid } from 'lucide-react';
import { getStoredConcepts, saveStoredConcepts } from '@/lib/storage';
import { Concept } from '@/lib/types';
import { importVerifiedConceptsFromCsv } from '@/lib/importVerifiedConcepts';

export default function ConceptsPage() {
  const [search, setSearch]     = useState('');
  const [roomType, setRoomType] = useState<RoomType | 'All'>('All');
  const [style, setStyle]       = useState<StyleType | 'All'>('All');
  const [budget, setBudget]     = useState<BudgetRange | 'All'>('All');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    importVerifiedConceptsFromCsv(false).then((loadedConcepts) => {
      setConcepts(loadedConcepts);
      setLoading(false);
      console.log(`[LivLab] Concepts loaded: ${loadedConcepts.length}`);
    });
  }, []);

  const filtered = useMemo(() => {
    return concepts.filter((c) => {
      const matchSearch  = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()) || c.style.toLowerCase().includes(search.toLowerCase());
      const matchRoom    = roomType === 'All' || c.roomType === roomType;
      const matchStyle   = style === 'All' || c.style === style;
      const matchBudget  = budget === 'All' || c.budgetRange === budget;
      return matchSearch && matchRoom && matchStyle && matchBudget;
    });
  }, [search, roomType, style, budget, concepts]);

  if (loading) {
    return <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-20"></div>;
  }

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      {/* Hero */}
      <div className="bg-[#0B1623] py-20 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">Thư viện Concept</p>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-2xl">
            Concept không gian sẵn sàng để khám phá và báo giá.
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed">
            Mỗi concept được tuyển chọn, định giá và gắn nhãn sản phẩm thật — sẵn sàng để bạn khám phá và gửi yêu cầu báo giá.
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ConceptFilters
                search={search} onSearchChange={setSearch}
                roomType={roomType} onRoomTypeChange={setRoomType}
                style={style} onStyleChange={setStyle}
                budget={budget} onBudgetChange={setBudget}
                total={concepts.length} filtered={filtered.length}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            {filtered.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <LayoutGrid className="w-4 h-4 text-[#627386]" />
                  <p className="text-sm text-[#627386]">
                    <span className="font-semibold text-[#0B1623]">{filtered.length}</span> concept
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((concept, i) => (
                    <ConceptCard key={concept.id} concept={concept} priority={i < 3} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-3xl bg-[#EEF4F7] flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-7 h-7 text-[#627386]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0B1623] mb-2">Không tìm thấy concept</h3>
                <p className="text-sm text-[#627386]">Hãy thử thay đổi bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
