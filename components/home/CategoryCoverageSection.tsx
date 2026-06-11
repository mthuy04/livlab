'use client';

import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';

export default function CategoryCoverageSection() {
  const categories = [
    {
      title: 'THIẾT BỊ PHÒNG TẮM',
      items: ['Lavabo', 'Vòi lavabo', 'Gương', 'Bồn cầu', 'Sen tắm', 'Tủ lavabo'],
      active: true,
    },
    {
      title: 'BỀ MẶT',
      items: ['Gạch ốp', 'Gạch lát', 'Đá', 'Vật liệu tường', 'Màu hoàn thiện'],
      active: false,
    },
    {
      title: 'PHỤ KIỆN',
      items: ['Kệ', 'Móc treo', 'Hộp giấy', 'Thoát sàn', 'Đèn'],
      active: false,
    },
    {
      title: 'DỊCH VỤ',
      items: ['Tư vấn showroom', 'Báo giá combo', 'Lắp đặt', 'Cải tạo phòng tắm nhỏ'],
      active: false,
    },
  ];

  return (
    <section className="bg-[#F8FBFD] px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-16 text-center lg:text-left">
          <h2 className="mx-auto lg:mx-0 max-w-[800px] text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#061827] md:text-5xl">
            Bắt đầu từ phòng tắm. Mở rộng sang{' '}
            <span className="text-[#49677F]">Home & Living.</span>
          </h2>
          <p className="mx-auto lg:mx-0 mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-[#627386]">
            LivLab khởi đầu với thiết bị phòng tắm, sau đó có thể mở rộng sang bề mặt, phụ kiện, nội thất và dịch vụ lắp đặt.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] items-start">
          
          <div className="order-2 lg:order-1 rounded-3xl border border-[#D8E2EA] bg-white shadow-sm overflow-hidden">
            {categories.map((category, idx) => (
              <div key={idx} className={`p-6 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 ${idx !== categories.length - 1 ? 'border-b border-[#D8E2EA]' : ''}`}>
                <h3 className="shrink-0 w-36 text-[11px] font-bold tracking-widest text-[#061827] pt-2">
                  {category.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors border ${
                        category.active && i === 0
                          ? 'bg-[#0B2239] text-white border-[#0B2239]'
                          : 'bg-white text-[#49677F] border-[#D8E2EA] hover:bg-[#F4F8FB]'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2 rounded-[28px] overflow-hidden border border-[#D8E2EA] shadow-sm bg-white">
            <SafeImage 
              src={livlabImages.mainShowcase.surfacePortal} 
              alt="Mở rộng sang Home & Living" 
              className="w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] object-cover"
              fallbackLabel="Home & Living"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
