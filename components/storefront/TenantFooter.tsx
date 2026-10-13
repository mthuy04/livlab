import Link from 'next/link';
import type { Route } from 'next';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { Container } from './primitives';

/**
 * The storefront footer.
 *
 * Every contact line is conditional. The old footer hardcoded
 * hello@livlab.vn and a Hanoi phone number, which on a showroom's own
 * storefront is simply wrong — it hands the customer someone else's details.
 * A field the showroom has not provided is omitted rather than filled with a
 * placeholder.
 */

/**
 * The footer lists every destination the header groups, flattened.
 *
 * A dropdown is fine for a mouse, but the footer is where people look when
 * they cannot find something — so nothing lives only behind a hover.
 */
function flattenNavigation(navigation: TenantStorefrontConfig['navigation']) {
  const seen = new Set<string>();
  const out: { href: string; label: string }[] = [];
  for (const item of navigation) {
    for (const entry of item.children?.length ? item.children : [item]) {
      if (seen.has(entry.href)) continue;
      seen.add(entry.href);
      out.push({ href: entry.href, label: entry.label });
    }
  }
  return out;
}

const LEGAL_LINKS: { href: string; label: string }[] = [
  { href: '/privacy', label: 'Chính sách bảo mật' },
  { href: '/terms', label: 'Điều khoản sử dụng' },
];

export default function TenantFooter({ tenant }: { tenant: TenantStorefrontConfig }) {
  const { brand, contact, navigation } = tenant;
  const hasContact = Boolean(contact?.phone || contact?.email || contact?.address);

  const allLinks = flattenNavigation(navigation);
  const half = Math.ceil(allLinks.length / 2);
  const [exploreLinks, supportLinks] = [allLinks.slice(0, half), allLinks.slice(half)];

  return (
    <footer style={{ borderTop: '1px solid var(--sf-border)', backgroundColor: 'var(--sf-surface)' }}>
      <Container>
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
          <div className="lg:col-span-1">
            <p className="text-[18px] font-semibold tracking-tight">{brand.name}</p>
            {brand.tagline && (
              <p className="sf-caption mt-3 max-w-xs leading-relaxed" style={{ color: 'var(--sf-text-secondary)' }}>
                {brand.tagline}
              </p>
            )}
          </div>

          <nav aria-label="Khám phá">
            <h2 className="sf-caption mb-4 uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
              Khám phá
            </h2>
            <ul className="space-y-2.5">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href as Route} className="text-[14px] transition-opacity hover:opacity-60" style={{ color: 'var(--sf-text-secondary)' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Hỗ trợ">
            <h2 className="sf-caption mb-4 uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
              Hỗ trợ
            </h2>
            <ul className="space-y-2.5">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href as Route} className="text-[14px] transition-opacity hover:opacity-60" style={{ color: 'var(--sf-text-secondary)' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Rendered only when the showroom actually has details on file. */}
          {hasContact && (
            <div>
              <h2 className="sf-caption mb-4 uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
                Liên hệ
              </h2>
              <ul className="space-y-2.5 text-[14px]" style={{ color: 'var(--sf-text-secondary)' }}>
                {contact?.phone && (
                  <li><a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-opacity hover:opacity-60">{contact.phone}</a></li>
                )}
                {contact?.email && (
                  <li><a href={`mailto:${contact.email}`} className="transition-opacity hover:opacity-60">{contact.email}</a></li>
                )}
                {contact?.address && <li className="leading-relaxed">{contact.address}</li>}
              </ul>
            </div>
          )}
        </div>

        <div
          className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid var(--sf-border)' }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="sf-caption" style={{ color: 'var(--sf-text-muted)' }}>
              © {new Date().getFullYear()} {brand.name}
            </p>
            {LEGAL_LINKS.map((item) => (
              <Link key={item.href} href={item.href as Route} className="sf-caption transition-opacity hover:opacity-60" style={{ color: 'var(--sf-text-muted)' }}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quiet by design, and off for the LivLab storefront itself. It is a
              credit line, never a claim that the showroom is a partner. */}
          {tenant.poweredByLivLab && (
            <p className="sf-caption" style={{ color: 'var(--sf-text-muted)' }}>
              Powered by LivLab
            </p>
          )}
        </div>
      </Container>
    </footer>
  );
}
