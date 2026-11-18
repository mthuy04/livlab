import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';

/**
 * How a showroom handles a quotation request, in its own name.
 *
 * No response time is stated: none has been confirmed by the business, and a
 * promise the showroom has not made is worse than none.
 */
export default function ShowroomQuoteProcess({ tenant }: { tenant: TenantStorefrontConfig }) {
  const business = tenant.business!;
  const name = business.name.replace(/^Thiết bị vệ sinh /, '');
  const steps = [
    {
      title: 'Chọn sản phẩm hoặc mô tả nhu cầu',
      body: 'Thêm mẫu bạn quan tâm vào giỏ báo giá, hoặc ghi lại loại thiết bị, kiểu dáng bạn cần nếu chưa chọn được mẫu.',
    },
    {
      title: 'Gửi mã sản phẩm, số lượng hoặc kích thước',
      body: 'Càng cụ thể càng tốt: mã sản phẩm, số lượng, kích thước phòng hoặc vị trí lắp, và ngân sách nếu có.',
    },
    {
      title: `${name} kiểm tra thông tin và tư vấn`,
      body: 'Showroom liên hệ lại theo số điện thoại hoặc Zalo bạn để lại để làm rõ nhu cầu và gợi ý phương án phù hợp.',
    },
    {
      title: 'Showroom xác nhận báo giá và phương án cung ứng',
      body: 'Giá cuối, thời gian giao hàng và phương án lắp đặt do showroom xác nhận trực tiếp với bạn.',
    },
  ];

  return (
    <div className="home-container" style={{ paddingTop: 28, paddingBottom: 'clamp(56px, 6vw, 96px)' }}>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}>
          <li>
            <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: TEXT }}>QUY TRÌNH BÁO GIÁ</li>
        </ol>
      </nav>

      <div className="max-w-[760px]" style={{ marginTop: 22 }}>
        <h1 style={{ fontSize: 'clamp(28px, 1.3rem + 1vw, 38px)', fontWeight: 550, lineHeight: 1.15, color: TEXT }}>
          Quy trình báo giá
        </h1>
        <h2 className="mt-8" style={{ fontSize: 22, fontWeight: 550, lineHeight: 1.3, color: TEXT }}>
          {name} tiếp nhận yêu cầu báo giá như thế nào?
        </h2>

        <ol className="mt-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-5" style={{ borderTop: `1px solid ${DIVIDER}`, padding: '20px 0' }}>
              <span
                className="grid shrink-0 place-items-center"
                style={{
                  width: 34,
                  height: 34,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--tenant-ui-primary-contrast, #fff)',
                  background: 'var(--tenant-ui-primary, var(--tenant-accent))',
                  borderRadius: 999,
                }}
              >
                {index + 1}
              </span>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT }}>{step.title}</h3>
                <p className="mt-1.5" style={{ fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6" style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: TEXT }}>Về giá hiển thị trên website</h2>
          <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
            Giá trên từng sản phẩm ghi rõ nguồn: phần lớn là giá hãng đề xuất do TOTO, INAX công bố. Đó không phải
            giá bán của showroom; {name} xác nhận giá khi báo giá.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href={'/quote' as Route}
            className="inline-flex items-center gap-2"
            style={{ padding: '14px 22px', fontSize: 12, fontWeight: 650, letterSpacing: '.1em', background: 'var(--tenant-ui-primary, var(--tenant-accent))', color: 'var(--tenant-ui-primary-contrast, #fff)', borderRadius: 'var(--tenant-ui-radius, 4px)' }}
          >
            GỬI YÊU CẦU BÁO GIÁ <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a href={`tel:${business.telephone}`} className="inline-flex items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
            <Phone className="h-4 w-4" aria-hidden="true" /> {business.telephoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
