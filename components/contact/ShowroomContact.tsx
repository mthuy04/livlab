import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import ContactInquiry from './ContactInquiry';

/**
 * A showroom's contact page, rendered on the server from the business facts
 * in its tenant config. Every line here is something the business publishes
 * itself; there is deliberately no contact form, because a form with nowhere
 * to deliver to is worse than a phone number. Written requests go through the
 * quote flow, which reaches the showroom's workspace.
 */
export default function ShowroomContact({ tenant }: { tenant: TenantStorefrontConfig }) {
  const business = tenant.business!;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.displayAddress}`
  )}`;
  const facebook = business.sameAs.find((url) => url.includes('facebook.com'));

  const row = { borderTop: `1px solid ${DIVIDER}`, padding: '22px 0' } as const;
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_MUTED } as const;
  const value = { marginTop: 8, fontSize: 18, lineHeight: 1.5, color: TEXT } as const;
  const link = { marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, letterSpacing: '.06em', color: 'var(--tenant-ui-link, var(--tenant-accent))' } as const;

  return (
    <div className="home-container" style={{ paddingTop: 28, paddingBottom: 'clamp(56px, 6vw, 96px)' }}>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}>
          <li>
            <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: TEXT }}>LIÊN HỆ</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]" style={{ marginTop: 22 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(28px, 1.3rem + 1vw, 38px)', fontWeight: 550, lineHeight: 1.15, color: TEXT }}>
            Liên hệ {business.name}
          </h1>
          <p className="max-w-[560px]" style={{ marginTop: 14, fontSize: 15, lineHeight: 1.7, color: TEXT_MUTED }}>
            Gọi hoặc nhắn Zalo để hỏi giá, chọn thiết bị và hẹn xem mẫu tại showroom.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: 26 }}>
            <Link
              href={'/quote' as Route}
              className="inline-flex items-center gap-2"
              style={{ padding: '13px 20px', fontSize: 12, fontWeight: 650, letterSpacing: '.1em', background: 'var(--tenant-ui-primary, var(--tenant-accent))', color: 'var(--tenant-ui-primary-contrast, #fff)', borderRadius: 'var(--tenant-ui-radius, 4px)' }}
            >
              GỬI YÊU CẦU BÁO GIÁ <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={'/products' as Route}
              className="inline-flex items-center gap-2"
              style={{ padding: '13px 20px', fontSize: 12, fontWeight: 650, letterSpacing: '.1em', border: `1px solid ${DIVIDER}`, color: TEXT, borderRadius: 'var(--tenant-ui-radius, 4px)' }}
            >
              XEM SẢN PHẨM
            </Link>
          </div>
        </div>

        <address style={{ fontStyle: 'normal' }}>
          <div style={row}>
            <p style={label}>SHOWROOM</p>
            <p style={value}>{business.displayAddress}</p>
            <a href={directions} target="_blank" rel="noreferrer" style={link}>
              <MapPin className="h-4 w-4" aria-hidden="true" /> CHỈ ĐƯỜNG TRÊN GOOGLE MAPS
            </a>
          </div>
          <div style={row}>
            <p style={label}>HOTLINE</p>
            <p style={value}>
              <a href={`tel:${business.telephone}`} style={{ color: TEXT }}>{business.telephoneDisplay}</a>
            </p>
            <a href={`tel:${business.telephone}`} style={link}>
              <Phone className="h-4 w-4" aria-hidden="true" /> GỌI NGAY
            </a>
          </div>
          {(business.zaloUrl || facebook) && (
            <div style={{ ...row, borderBottom: `1px solid ${DIVIDER}` }}>
              <p style={label}>NHẮN TIN</p>
              <div className="flex flex-wrap gap-x-6">
                {business.zaloUrl && (
                  <a href={business.zaloUrl} target="_blank" rel="noreferrer" style={link}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> ZALO {business.telephoneDisplay}
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank" rel="noreferrer" style={link}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> FACEBOOK {business.name.toUpperCase()}
                  </a>
                )}
              </div>
            </div>
          )}
        </address>
      </div>

      {/* A written request reaches the showroom's workspace through the same
          endpoint as the quote basket, so this form is real, not decorative. */}
      <section aria-labelledby="contact-form-title" className="max-w-[860px]" style={{ marginTop: 'clamp(40px, 5vw, 64px)', borderTop: `1px solid ${DIVIDER}`, paddingTop: 32 }}>
        <h2 id="contact-form-title" style={{ fontSize: 22, fontWeight: 550, color: TEXT }}>Gửi yêu cầu nhanh</h2>
        <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
          Ghi mã sản phẩm, số lượng hoặc kích thước cần làm; showroom sẽ gọi lại để tư vấn và báo giá.
        </p>
        <div className="mt-6">
          <ContactInquiry />
        </div>
      </section>
    </div>
  );
}
