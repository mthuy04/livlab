import Link from 'next/link';
import type { Route } from 'next';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { TEXT, TEXT_MUTED } from './home/editorial';

/**
 * The storefront footer.
 *
 * Every contact line is conditional. The old footer hardcoded
 * hello@livlab.vn and a Hanoi phone number, which on a showroom's own
 * storefront is simply wrong — it hands the customer someone else's details.
 * A showroom with nothing on file gets the closing column instead of a
 * placeholder address.
 *
 * The link columns are written out rather than flattened from the navigation,
 * so the footer carries the destinations a customer actually looks for here.
 */

const EXPLORE: [string, string][] = [
  ['Không gian', '/concepts'],
  ['Bộ sưu tập', '/concepts'],
  ['Sản phẩm', '/products'],
  ['Room Studio', '/room-studio'],
];

const SUPPORT: [string, string][] = [
  ['Tư vấn showroom', '/contact'],
  ['Yêu cầu báo giá', '/quote'],
  ['Tra cứu báo giá', '/track-quote'],
  ['Cẩm nang', '/blog'],
];

const COLUMN_TITLE = { fontSize: 12, fontWeight: 600, letterSpacing: '.12em', color: TEXT } as const;
const BODY = { fontSize: 14, lineHeight: 1.75, color: TEXT_MUTED } as const;

function FooterColumn({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <p style={COLUMN_TITLE}>{title}</p>
      <div className="mt-6 flex flex-col gap-4">
        {items.map(([label, href]) => (
          <Link
            key={label}
            href={href as Route}
            className="transition-colors hover:text-black"
            style={{ fontSize: 14, color: TEXT_MUTED }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function TenantFooter({ tenant }: { tenant: TenantStorefrontConfig }) {
  const { brand, contact, features } = tenant;
  const hasContact = Boolean(contact?.phone || contact?.email || contact?.address);
  const support = features.quotations ? SUPPORT : SUPPORT.filter(([, href]) => !href.includes('quote'));

  return (
    <footer style={{ backgroundColor: '#F2F2F0' }}>
      <div className="home-container grid gap-12 py-16 md:grid-cols-4">
        <div>
          <p style={{ ...COLUMN_TITLE, fontSize: 13 }}>{brand.name.toUpperCase()}</p>
          <p className="mt-6 max-w-[270px]" style={BODY}>
            Khám phá, phối thử và lựa chọn thiết bị phòng tắm trước khi quyết định.
          </p>
        </div>

        <FooterColumn title="KHÁM PHÁ" items={EXPLORE} />
        <FooterColumn title="HỖ TRỢ" items={support} />

        {/* Rendered only when the showroom actually has details on file. */}
        {hasContact ? (
          <div>
            <p style={COLUMN_TITLE}>LIÊN HỆ</p>
            <div className="mt-6 flex flex-col gap-4" style={{ fontSize: 14, color: TEXT_MUTED }}>
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-black">
                  {contact.phone}
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-black">
                  {contact.email}
                </a>
              )}
              {contact?.address && <p style={{ lineHeight: 1.75 }}>{contact.address}</p>}
            </div>
          </div>
        ) : (
          <div>
            <p style={COLUMN_TITLE}>MỘT TRẢI NGHIỆM LIỀN MẠCH</p>
            <p className="mt-6 max-w-[280px]" style={BODY}>
              Từ cảm hứng, sản phẩm, Room Studio đến tư vấn và báo giá.
            </p>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #DDDDDA' }}>
        <div
          className="home-container flex min-h-[58px] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3"
          style={{ fontSize: 12, color: '#777777' }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© {new Date().getFullYear()} {brand.name}.</span>
            <Link href={'/privacy' as Route} className="transition-colors hover:text-black">Chính sách bảo mật</Link>
            <Link href={'/terms' as Route} className="transition-colors hover:text-black">Điều khoản sử dụng</Link>
          </div>

          {/* Quiet by design, and off for the LivLab storefront itself. It is a
              credit line, never a claim that the showroom is a partner. */}
          <span>{tenant.poweredByLivLab ? 'Powered by LivLab' : 'Visual commerce for showrooms'}</span>
        </div>
      </div>
    </footer>
  );
}
