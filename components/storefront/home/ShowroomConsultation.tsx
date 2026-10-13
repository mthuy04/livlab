import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLink, H2_STYLE } from './editorial';

/**
 * The closing block: a full-width navy panel.
 *
 * It had a photograph of a showroom consultation, but that asset is a
 * synthetic marketing render — its laptop shows an invented interface and a
 * USD figure LivLab never produced. There is no genuine showroom or advisor
 * photograph in the project, so the section runs without one rather than
 * presenting a generated scene as a real showroom.
 */
export default function ShowroomConsultation({ quotations }: { quotations: boolean }) {
  return (
    <section
      className="flex items-center"
      style={{ backgroundColor: 'var(--tenant-accent)', minHeight: 400 }}
    >
      <div
        className="mx-auto w-full py-16 lg:py-20"
        style={{ maxWidth: 'var(--sf-max-width)', paddingInline: 'var(--sf-gutter)' }}
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div className="max-w-[560px]">
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
          </div>

          <div className="flex flex-wrap items-center gap-x-9 gap-y-5">
            <Link
              href={'/contact' as Route}
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 46,
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
