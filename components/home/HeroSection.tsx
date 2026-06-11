'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background — luxury bathroom interior */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1920&q=90"
          alt="Phòng tắm nội thất cao cấp"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1623]/75 via-[#0B1623]/50 to-[#0B1623]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1623]/40 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-8xl mx-auto px-6 lg:px-10 w-full pt-24 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 text-white/80 text-xs font-medium transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles className="w-3 h-3 text-[#C8A96A]" />
            Nền tảng Visual-Commerce cho Showroom Nội thất
          </div>

          {/* Headline */}
          <h1 className={`text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Số hoá trải nghiệm
            <br />
            <span className="text-[#DCEBF5]">chọn mua</span>
            <br />
            <span className="text-[#C8A96A]">nội thất.</span>
          </h1>

          {/* Subheadline */}
          <p className={`text-lg lg:text-xl text-white/75 leading-relaxed max-w-xl mb-10 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            LivLab giúp khách hàng khám phá concept phòng, bấm vào từng sản phẩm thật, xem thông tin cơ bản và gửi yêu cầu báo giá cho showroom chỉ trong vài bước.
          </p>

          {/* CTAs */}
          <div className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#0B1623] text-sm font-semibold rounded-full hover:bg-[#DCEBF5] transition-all duration-200"
            >
              Khám phá concept
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/showroom"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30 hover:bg-white/20 transition-all duration-200"
            >
              Xem demo showroom
            </Link>
          </div>
        </div>

        {/* Floating card */}
        <div className={`absolute bottom-12 right-6 lg:right-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 w-60 transition-all duration-700 delay-500 hidden sm:block ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="space-y-3">
            {[
              { dot: 'bg-[#123C5A]', text: 'Concept tương tác' },
              { dot: 'bg-[#486581]', text: '8 điểm hotspot sản phẩm' },
              { dot: 'bg-[#DCEBF5]', text: 'Sẵn sàng gửi báo giá' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <span className="text-white/80 text-xs font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Phòng tắm Japandi</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent" />
        <span className="text-white/40 text-[10px] uppercase tracking-widest">Cuộn xuống</span>
      </div>
    </section>
  );
}
