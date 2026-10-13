import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { ArrowLink, H2_STYLE } from './editorial';

/**
 * The closing block: a real showroom scene beside a navy panel.
 *
 * The photograph is cropped low so the consultation table — samples, catalogue,
 * the two people — carries it, and the mocked-up laptop screen in the asset
 * stays out of frame rather than showing figures LivLab did not produce.
 */
export const CONSULTATION_IMAGE = '/images/showroom-assisted-sales.png';

export default function ShowroomConsultation({ quotations }: { quotations: boolean }) {
  return (
    <section className="grid lg:grid-cols-[55fr_45fr]" style={{ minHeight: 400 }}>
      <div className="relative min-h-[260px] lg:min-h-[420px]">
        <Image
          src={CONSULTATION_IMAGE}
          alt="Nhân viên showroom trao đổi với khách bên mẫu vật liệu"
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
          style={{ objectPosition: 'center 88%' }}
        />
      </div>

      <div
        className="flex items-center px-6 py-14 sm:px-10 lg:px-14 lg:py-16"
        style={{ backgroundColor: 'var(--tenant-accent)' }}
      >
        <div className="max-w-[460px]">
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.12em', color: 'rgba(255,255,255,0.66)' }}>
            TƯ VẤN SHOWROOM
          </p>
          <h2 className="mt-4" style={{ ...H2_STYLE, color: '#FFFFFF' }}>
            Tiếp tục với người hiểu sản phẩm.
          </h2>
          <p
            className="mt-5"
            style={{ fontSize: 'clamp(15px, 0.9rem + 0.2vw, 16px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.8)' }}
          >
            Gửi không gian, sản phẩm và ngân sách bạn đã chọn. Nhân viên showroom nhận đầy đủ bối cảnh
            để tư vấn tiếp và lập báo giá.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
            <Link
              href={'/contact' as Route}
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 48,
                padding: '0 26px',
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                color: 'var(--tenant-accent)',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '.08em',
              }}
            >
              NHỜ SHOWROOM TƯ VẤN
            </Link>
            {quotations && <ArrowLink href={'/quote' as Route} tone="light">YÊU CẦU BÁO GIÁ</ArrowLink>}
          </div>
        </div>
      </div>
    </section>
  );
}
