import { concepts } from '@/lib/data';
import ConceptCard from '@/components/concepts/ConceptCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FeaturedConcepts() {
  const featured = concepts.slice(0, 6);
  return (
    <section className="bg-[#F8FBFD] py-16 lg:py-24 border-t border-[#D8E2EA]">
      <div className="max-w-8xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#C8A96A] font-bold mb-3">Concept nổi bật</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-3">
              Không gian được tuyển chọn.
            </h2>
            <p className="text-[#627386] text-sm lg:text-base max-w-lg">
              Các concept phòng tắm được gợi ý theo diện tích, phong cách và ngân sách.
            </p>
          </div>
          <Link
            href="/concepts"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#627386] hover:text-[#0B1623] transition-colors flex-shrink-0 bg-white border border-[#D8E2EA] px-5 py-2.5 rounded-full hover:shadow-sm"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((concept, i) => (
            <ConceptCard key={concept.id} concept={concept} priority={i < 3} />
          ))}
        </div>
      </div>
    </section>
  );
}
