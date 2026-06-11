'use client';

import { useQuote } from '@/lib/context/QuoteContext';
import { Concept, Product } from '@/lib/types';
import { ArrowRight, PlusCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConceptActions({ concept, conceptProducts }: { concept: Concept, conceptProducts: Product[] }) {
  const { addItem, items } = useQuote();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAddAll = () => {
    conceptProducts.forEach(p => {
      if (!items.find(i => i.productId === p.id)) {
        addItem(p, concept.id);
      }
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const handleRequestQuote = () => {
    handleAddAll();
    router.push(`/quote?concept=${encodeURIComponent(concept.title)}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <button
        onClick={handleAddAll}
        className={`flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 border ${added ? 'border-[#486581] text-[#486581]' : 'border-white/20 text-white hover:bg-white/10'} text-sm font-semibold rounded-full transition-colors`}
      >
        {added ? <><CheckCircle className="w-4 h-4" /> Đã thêm toàn bộ</> : <><PlusCircle className="w-4 h-4" /> Thêm toàn bộ vào báo giá</>}
      </button>
      <button
        onClick={handleRequestQuote}
        className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors"
      >
        Yêu cầu báo giá cho concept này
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
