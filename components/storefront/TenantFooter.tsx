import Link from 'next/link';
import type { Route } from 'next';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { Container } from './primitives';
import { DIVIDER, TEXT, TEXT_MUTED } from './home/editorial';

/**
 * The storefront footer.
 *
 * Every contact line is conditional. The old footer hardcoded
 * hello@livlab.vn and a Hanoi phone number, which on a showroom's own
 * storefront is simply wrong — it hands the customer someone else's details.
 * A field the showroom has not provided is omitted rather than filled with a
 * placeholder.
 *
 * The link columns are written out rather than flattened from the navigation,
 * so the footer carries the destinations a customer actually looks for here
 * and does not inherit whatever happens to be in the menu.
 */

const EXPLORE: { href: string; label: string }[] = [
  { href: '/concepts', label: 'Không gian' },
  { href: '/concepts', label: 'Bộ sưu tập' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/room-studio', label: 'Room Studio' },
];

const SUPPORT: { href: string; label: string }[] = [
  { href: '/contact', label: 'Tư vấn showroom' },
  { href: '/quote', label: 'Yêu cầu báo giá' },
  { href: '/track-quote', label: 'Tra cứu báo giá' },
  { href: '/blog', label: 'Cẩm nang' },
];

const LEGAL_LINKS: { href: string; label: string }[] = [
  { href: '/privacy', label: 'Chính sách bảo mật' },
  { href: '/terms', label: 'Điều khoản sử dụng' },
];

function ColumnTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-5" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.12em', color: TEXT }}>
      {children}
    </h2>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as Route}
      className="transition-opacity hover:opacity-60"
      style={{ fontSize: 14, color: TEXT_MUTED }}
    >
      {label}
    </Link>
  );
}

export default function TenantFooter({ tenant }: { tenant: TenantStorefrontConfig }) {
  const { brand, contact, features } = tenant;
  const hasContact = Boolean(contact?.phone || contact?.email || contact?.address);
  const support = features.quotations ? SUPPORT : SUPPORT.filter((l) => !l.href.includes('quote'));

  return (
    <footer style={{ backgroundColor: '#F3F3F3', borderTop: '1px solid #E1E1E1' }}>
      <Container>
        <div className="grid grid-cols-1 gap-10 pb-12 pt-16 sm:grid-cols-2 lg:grid-cols-4 lg:pb-[68px] lg:pt-[68px]">
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.12em', color: TEXT }}>
              {brand.name.toUpperCase()}
            </p>
            <p className="mt-5 max-w-[280px]" style={{ fontSize: 14, lineHeight: 1.65, color: TEXT_MUTED }}>
              Khám phá, phối thử và lựa chọn thiết bị phòng tắm trước khi quyết định.
            </p>
          </div>

          <nav aria-label="Khám phá">
            <ColumnTitle>KHÁM PHÁ</ColumnTitle>
            <ul className="space-y-3">
              {EXPLORE.map((item) => (
                <li key={item.label}>
                  <FooterLink {...item} />
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Hỗ trợ">
            <ColumnTitle>HỖ TRỢ</ColumnTitle>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item.label}>
                  <FooterLink {...item} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Rendered only when the showroom actually has details on file. */}
          {hasContact && (
            <div>
              <ColumnTitle>LIÊN HỆ</ColumnTitle>
              <ul className="space-y-3" style={{ fontSize: 14, color: TEXT_MUTED }}>
                {contact?.phone && (
                  <li>
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-opacity hover:opacity-60">
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact?.email && (
                  <li>
                    <a href={`mailto:${contact.email}`} className="transition-opacity hover:opacity-60">
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact?.address && <li style={{ lineHeight: 1.65 }}>{contact.address}</li>}
              </ul>
            </div>
          )}
        </div>

        <div
          className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: `1px solid ${DIVIDER}` }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p style={{ fontSize: 13, color: TEXT_MUTED }}>© {new Date().getFullYear()} {brand.name}.</p>
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className="transition-opacity hover:opacity-60"
                style={{ fontSize: 13, color: TEXT_MUTED }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quiet by design, and off for the LivLab storefront itself. It is a
              credit line, never a claim that the showroom is a partner. */}
          {tenant.poweredByLivLab && <p style={{ fontSize: 13, color: TEXT_MUTED }}>Powered by LivLab</p>}
        </div>
      </Container>
    </footer>
  );
}
