'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';

export default function DemoPathsSection() {
  const paths = [
    {
      title: 'Xem concept phòng tắm',
      desc: 'Khách xem trước phong cách, bố cục và combo sản phẩm trong một không gian phòng tắm hoàn chỉnh.',
      ctaText: 'Xem Visual Studio',
      ctaLink: '/visual-studio',
      image: livlabImages.demoPaths.concept,
      imageLeft: false,
    },
    {
      title: 'Thử gạch và vật liệu',
      desc: 'Khách so sánh gạch ốp, gạch lát, vật liệu tường, tủ lavabo và màu hoàn thiện trong cùng một phối cảnh.',
      ctaText: 'Khám phá concept',
      ctaLink: '/concepts',
      image: livlabImages.demoPaths.material,
      imageLeft: true,
    },
    {
      title: 'Showroom tư vấn trực quan',
      desc: 'Nhân viên showroom dùng LivLab để chọn concept, lưu sản phẩm và gửi yêu cầu báo giá rõ ràng cho khách.',
      ctaText: 'Vào khu vực showroom',
      ctaLink: '/login',
      image: livlabImages.demoPaths.showroom,
      imageLeft: false,
    },
  ];

  return (
    <section className="bg-white px-6 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#C8A96A]">
            Tính năng nổi bật
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#061827] md:text-5xl">
            3 cách LivLab hỗ trợ{' '}
            <span className="text-[#49677F]">showroom tư vấn.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#627386] md:text-lg">
            Từ xem concept, thử vật liệu đến tư vấn tại showroom, LivLab giúp biến hình ảnh phòng tắm thành yêu cầu báo giá rõ ràng hơn.
          </p>
        </div>

        <div className="flex flex-col gap-[120px] md:gap-[160px]">
          {paths.map((path, index) => (
            <div
              key={index}
              className={`grid items-center gap-10 md:grid-cols-12 lg:gap-20`}
            >
              {/* Text Block */}
              <div
                className={`order-2 flex flex-col md:order-none ${
                  path.imageLeft ? 'md:col-span-5 md:col-start-8' : 'md:col-span-5'
                }`}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4F7] text-lg font-extrabold text-[#0B2239]">
                  0{index + 1}
                </div>
                <h3 className="mb-5 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#061827] lg:text-4xl">
                  {path.title}
                </h3>
                <p className="mb-8 text-lg leading-relaxed text-[#627386] lg:text-xl">
                  {path.desc}
                </p>
                <div>
                  <Link
                    href={path.ctaLink}
                    className="group inline-flex items-center gap-2 rounded-full border border-[#D8E2EA] px-6 py-3.5 text-sm font-bold text-[#0B2239] transition hover:border-[#0B2239] hover:bg-[#F4F8FB]"
                  >
                    {path.ctaText}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Image Block */}
              <div
                className={`order-1 overflow-hidden rounded-[2rem] border border-[#D8E2EA] bg-[#F4F8FB] shadow-sm md:order-none ${
                  path.imageLeft
                    ? 'md:col-span-7 md:col-start-1 md:row-start-1'
                    : 'md:col-span-7'
                }`}
              >
                <div className="relative aspect-[16/10] w-full">
                  <SafeImage
                    src={path.image}
                    alt={path.title}
                    className="h-full w-full object-contain p-2"
                    fallbackLabel={path.title}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
