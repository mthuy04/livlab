'use client';

import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';

export default function LivLabPortalMockup() {
  return (
    <section className="bg-[#F8FBFD] px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-16 text-center">
          <h2 className="mx-auto max-w-[800px] text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#061827] md:text-5xl">
            Ướm thử sản phẩm trong <span className="text-[#49677F]">không gian phòng tắm.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-[#627386]">
            Chọn concept, bấm vào điểm sản phẩm, thêm vào giỏ báo giá và xem ngân sách tham khảo trước khi gửi yêu cầu cho showroom.
          </p>
        </div>

        {/* Big Mockup Container */}
        <div className="relative mx-auto overflow-hidden rounded-[28px] border border-[#D8E2EA] bg-white shadow-sm lg:rounded-[32px]">
          <SafeImage 
            src={livlabImages.mainShowcase.visualStudio} 
            alt="Ướm thử sản phẩm" 
            className="w-full h-auto object-contain bg-[#EEF4F7]" 
            fallbackLabel="Visual Studio"
          />
        </div>

        {/* Compact Proof Row */}
        <div className="mx-auto mt-12 grid max-w-[1000px] gap-6 md:grid-cols-2 lg:grid-cols-4 text-left">
          <div className="border-l-2 border-[#0B2239] pl-4">
            <h3 className="text-sm font-extrabold text-[#061827]">Concept có sẵn</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#627386]">Chọn theo diện tích, phong cách và ngân sách.</p>
          </div>
          <div className="border-l-2 border-[#D8E2EA] pl-4">
            <h3 className="text-sm font-extrabold text-[#061827]">Hotspot sản phẩm</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#627386]">Bấm vào từng vị trí để xem thiết bị tương ứng.</p>
          </div>
          <div className="border-l-2 border-[#D8E2EA] pl-4">
            <h3 className="text-sm font-extrabold text-[#061827]">Giỏ báo giá</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#627386]">Lưu sản phẩm và xem ngân sách tham khảo.</p>
          </div>
          <div className="border-l-2 border-[#D8E2EA] pl-4">
            <h3 className="text-sm font-extrabold text-[#061827]">Gửi cho showroom</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#627386]">Showroom nhận đủ thông tin để tư vấn nhanh hơn.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
