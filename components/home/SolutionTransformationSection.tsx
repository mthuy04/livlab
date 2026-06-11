'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Layout, MousePointer, Package, WalletCards, FileText, ArrowRight } from 'lucide-react';

function Counter({ end, duration = 1000, suffix = '' }: { end: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function SolutionTransformationSection() {
  return (
    <section className="bg-[#F8FBFD] px-6 py-20 md:py-24 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        
        <div className="rounded-[32px] border border-[#D8E2EA] bg-white p-8 md:p-12 lg:p-16 shadow-[0_24px_70px_rgba(11,22,35,0.07)]">
          <div className="mb-16 text-center lg:text-left">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
              Giải pháp LivLab
            </p>
            <h2 className="mx-auto lg:mx-0 max-w-[760px] text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#0B1623] md:text-4xl lg:text-5xl">
              Biến ảnh cảm hứng thành báo giá có dữ liệu.
            </h2>
            <p className="mx-auto lg:mx-0 mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-[#627386]">
              Thay vì để khách tự tưởng tượng và showroom phải hỏi lại nhiều lần, LivLab biến concept, sản phẩm và ngân sách thành một yêu cầu báo giá rõ ràng.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 items-stretch">
            
            {/* COLUMN 1: BEFORE */}
            <div className="flex flex-col rounded-3xl bg-[#F8FBFD] border border-[#D8E2EA] p-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#486581] mb-6">Trước LivLab</h3>
              
              <div className="relative rounded-2xl bg-white p-5 border border-[#D8E2EA] shadow-sm mb-6">
                <div className="absolute -left-3 top-5 w-6 h-6 bg-[#EEF4F7] rounded-full border border-[#D8E2EA] flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-[#486581]" />
                </div>
                <p className="text-sm font-medium text-[#0B1623] italic">
                  "Em thích phòng này, làm khoảng bao nhiêu tiền ạ?"
                </p>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#627386]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8191A3]" />
                  Thiếu diện tích
                </div>
                <div className="flex items-center gap-3 text-sm text-[#627386]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8191A3]" />
                  Thiếu ngân sách
                </div>
                <div className="flex items-center gap-3 text-sm text-[#627386]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8191A3]" />
                  Chưa rõ sản phẩm
                </div>
                <div className="flex items-center gap-3 text-sm text-[#627386]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8191A3]" />
                  Showroom phải hỏi lại
                </div>
              </div>
            </div>

            {/* COLUMN 2: LIVLAB ENGINE */}
            <div className="flex flex-col rounded-3xl bg-[#EEF4F7] border border-[#D8E2EA] p-8 relative">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#123C5A] mb-6">LivLab xử lý</h3>
              
              <div className="flex-1 flex flex-col justify-center gap-2 relative z-10">
                {[
                  { icon: Layout, label: '1. Concept' },
                  { icon: MousePointer, label: '2. Hotspot' },
                  { icon: Package, label: '3. Sản phẩm', active: true },
                  { icon: WalletCards, label: '4. Ngân sách' },
                  { icon: FileText, label: '5. Báo giá' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`flex items-center w-full px-4 py-3 rounded-xl border transition-all ${
                      step.active 
                        ? 'bg-[#123C5A] border-[#123C5A] text-white shadow-md scale-[1.02]' 
                        : 'bg-white border-[#D8E2EA] text-[#486581]'
                    }`}>
                      <step.icon className={`w-4 h-4 mr-3 ${step.active ? 'text-[#C8A96A]' : 'text-[#486581]'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${step.active ? 'text-white' : 'text-[#0B1623]'}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connecting line behind steps */}
              <div className="absolute left-[3.25rem] top-24 bottom-16 w-px bg-[#D8E2EA] z-0 hidden lg:block" />
            </div>

            {/* COLUMN 3: AFTER */}
            <div className="flex flex-col rounded-3xl bg-[#123C5A] border border-[#0D2B42] p-8 text-white shadow-[0_20px_50px_rgba(11,22,35,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#DCEBF5] mb-6">Sau LivLab</h3>
              
              <div className="rounded-2xl bg-[#0B1623]/60 p-5 border border-white/10 mb-8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8A96A]">Lead Data</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md text-white">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Sẵn sàng gửi
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8191A3]">Concept</span>
                    <span className="font-bold text-white">Japandi sáng màu</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8191A3]">Diện tích</span>
                    <span className="font-bold text-white">4–6m²</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8191A3]">Ngân sách</span>
                    <span className="font-bold text-white">30–60 triệu</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8191A3]">Sản phẩm</span>
                    <span className="font-bold text-white">7 item</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-2xl font-extrabold text-white mb-1"><Counter end={7} /></div>
                  <div className="text-[10px] uppercase tracking-wider text-[#8191A3]">Concept</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-2xl font-extrabold text-white mb-1"><Counter end={10} suffix="+" /></div>
                  <div className="text-[10px] uppercase tracking-wider text-[#8191A3]">Sản phẩm</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-2xl font-extrabold text-white mb-1"><Counter end={5} /></div>
                  <div className="text-[10px] uppercase tracking-wider text-[#8191A3]">Bước xử lý</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-2xl font-extrabold text-white mb-1"><Counter end={0} /></div>
                  <div className="text-[10px] uppercase tracking-wider text-[#8191A3]">Hình dung</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
