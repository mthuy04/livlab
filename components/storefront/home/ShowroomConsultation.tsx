import Image from 'next/image';
import { ArrowLink, SolidLink } from './editorial';

/**
 * The closing block: a showroom scene beside a navy panel.
 *
 * The asset is the consultation-table half of showroom-assisted-sales.png,
 * cropped at source. The full frame shows a laptop running an invented
 * interface with a USD figure on it, and no crop of the live element kept that
 * screen out of view — so the file itself stops above it, leaving the samples,
 * the catalogue and the two people.
 */
export const CONSULTATION_IMAGE = '/images/showroom-consultation.png';

export default function ShowroomConsultation({ quotations }: { quotations: boolean }) {
  return (
    <section className="grid min-h-[420px] md:grid-cols-[1.1fr_.9fr]">
      <div className="relative min-h-[330px] md:min-h-[420px]">
        <Image
          src={CONSULTATION_IMAGE}
          alt="Nhân viên showroom trao đổi với khách bên mẫu vật liệu"
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          className="object-cover object-center"
        />
      </div>

      <div
        className="flex items-center px-6 py-14 sm:px-12 md:px-[70px]"
        style={{ backgroundColor: 'var(--tenant-panel)', color: 'var(--tenant-panel-contrast)' }}
      >
        <div className="max-w-[510px]">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.15em', color: 'rgba(255,255,255,0.65)' }}>
            TƯ VẤN SHOWROOM
          </p>
          <h2
            className="mt-5 text-[30px] md:text-[38px]"
            style={{ fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.01em' }}
          >
            Tiếp tục với người
            <br />
            hiểu sản phẩm.
          </h2>
          <p className="mt-6" style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
            Gửi không gian, sản phẩm và ngân sách bạn đã chọn. Nhân viên showroom nhận đầy đủ bối cảnh
            để tư vấn tiếp và lập báo giá.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 max-sm:flex-col max-sm:items-start">
            <SolidLink href="/contact" tone="white">NHỜ SHOWROOM TƯ VẤN</SolidLink>
            {quotations && <ArrowLink href="/quote" tone="light">YÊU CẦU BÁO GIÁ</ArrowLink>}
          </div>
        </div>
      </div>
    </section>
  );
}
