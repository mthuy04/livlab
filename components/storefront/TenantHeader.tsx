'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ChevronDown, Menu, Search, Bookmark, X, Phone } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import { utilityLinks, type TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import { Container } from './primitives';

/**
 * The storefront header.
 *
 * Tenant-led: the name on the left is the showroom's, not LivLab's. There are
 * no AI badges, no feature chips and no showroom switcher — a customer on one
 * showroom's storefront should have no idea the others exist.
 *
 * Four navigation entries, down from ten. The old header carried "Gợi ý AI",
 * two separate studios for one job, and a LivLab sales link, which is how a
 * storefront ends up reading as a product tour instead of a shop.
 */
export default function TenantHeader({ tenant }: { tenant: TenantStorefrontConfig }) {
  const pathname = usePathname();
  /**
   * `retail` adds what a specialist retailer leads with — its own descriptor
   * and hotline on a dark bar, a quote lookup beside the quote action — and
   * otherwise shares every behaviour below: the same navigation data, the same
   * dropdowns, the same drawer. See `HeaderVariant`.
   */
  const retail = tenant.experience.variants.header === 'retail';
  const { copy } = tenant.experience;
  /**
   * The menu is open for a specific route. Navigating changes the pathname,
   * which closes it by derivation — no effect watching for route changes, and
   * no way for the drawer to survive a navigation and cover the new page.
   */
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  // A missing logo file should degrade to the brand name, not a broken image.
  const [logoFailed, setLogoFailed] = useState(false);
  const menuOpen = menuOpenAt === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenAt(open ? pathname : null);
  const { count, toggleDrawer } = useQuote();

  // The drawer covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const utility = utilityLinks(tenant.features);

  return (
    <>
      {/* Only real destinations; never an invented phone number or address. */}
      {retail ? (
        <RetailUtilityBar tenant={tenant} />
      ) : (
        utility.length > 0 && (
          <div className="hidden md:block" style={{ height: 30, backgroundColor: '#F4F4F2' }}>
            <div className="home-container flex h-[30px] items-center justify-end gap-8">
              {utility.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  className="transition-opacity hover:opacity-60"
                  style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.12em', color: '#555555' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )
      )}

      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E5' }}
      >
        <div className="home-container">
          <div className="flex h-16 items-center justify-between gap-6 lg:h-[74px]">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={tenant.brand.name}>
              {tenant.brand.logo && !logoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.brand.logo}
                  alt={tenant.brand.logoAlt ?? tenant.brand.name}
                  // A lockup with its descriptor set inside it needs the height
                  // to stay legible; a bare wordmark does not.
                  className={retail ? 'h-10 w-auto lg:h-[40px] xl:h-[50px]' : 'h-9 w-auto lg:h-[40px]'}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span
                  className="text-[19px] font-semibold tracking-tight lg:text-[21px]"
                  style={{ color: 'var(--sf-text)' }}
                >
                  {tenant.brand.name}
                </span>
              )}
            </Link>

            <nav aria-label="Điều hướng chính" className="hidden lg:block">
              <ul
                className={`flex items-stretch ${retail ? 'gap-5 xl:gap-10' : 'gap-11'}`}
                // The retail header carries more beside the nav; see globals.css.
                data-nav-density={retail ? 'compact' : undefined}
              >
                {tenant.navigation.map((item) => {
                  const active = isActive(item.href) || item.children?.some((c) => isActive(c.href));

                  if (!item.children?.length) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href as Route}
                          data-active={active || undefined}
                          className="home-nav inline-block outline-none"
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  }

                  const isOpen = openGroup === item.label;
                  return (
                    <li
                      key={item.label}
                      className="relative"
                      // Hover opens it for a mouse; the button below keeps it
                      // reachable by keyboard, which hover alone never is.
                      onMouseEnter={() => setOpenGroup(item.label)}
                      onMouseLeave={() => setOpenGroup(null)}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={() => setOpenGroup(isOpen ? null : item.label)}
                        data-active={active || isOpen || undefined}
                        className="home-nav flex items-center gap-1.5 outline-none"
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>

                      {isOpen && (
                        <div
                          className="absolute left-0 top-full z-50 min-w-[220px] py-2"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E5E5',
                            borderRadius: retail ? 'var(--tenant-radius)' : 0,
                          }}
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href as Route}
                              onClick={() => setOpenGroup(null)}
                              className="block px-5 py-3 transition-colors hover:bg-[color:var(--sf-surface-muted)]"
                              style={{ fontSize: 14, fontWeight: 400, color: isActive(child.href) ? '#262626' : '#555555' }}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-1">
              <Link href="/products" aria-label="Tìm sản phẩm" className="p-2.5 transition-opacity hover:opacity-60">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </Link>
              <Link href="/saved" aria-label="Đã lưu" className="hidden p-2.5 transition-opacity hover:opacity-60 sm:block">
                <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </Link>

              {retail && tenant.features.quotations && (
                <Link
                  href={'/track-quote' as Route}
                  className="ml-2 hidden whitespace-nowrap transition-colors hover:text-[color:var(--tenant-accent-ink)] xl:inline-block"
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--tenant-ink)' }}
                >
                  {copy.quote.trackLabel}
                </Link>
              )}

              {tenant.features.quotations && (
                <button
                  onClick={toggleDrawer}
                  className={`ml-2 hidden items-center gap-2 text-[12px] lg:inline-flex ${
                    retail
                      ? 'ml-3 px-4 bg-[color:var(--tenant-accent)] transition-colors hover:bg-[color:var(--tenant-accent-hover)] xl:ml-4 xl:px-5'
                      : 'bg-[color:var(--tenant-accent)] transition-opacity hover:opacity-80'
                  }`}
                  style={{
                    height: 42,
                    paddingInline: retail ? undefined : 20,
                    color: 'var(--tenant-accent-contrast)',
                    borderRadius: retail ? 'var(--tenant-radius)' : undefined,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '.10em',
                  }}
                >
                  {copy.quote.cta}
                  {count > 0 && <span className="opacity-75">({count})</span>}
                </button>
              )}

              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Mở menu"
                aria-expanded={menuOpen}
                className="p-2.5 lg:hidden"
              >
                <Menu className="h-[21px] w-[21px]" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{ backgroundColor: 'var(--sf-surface)' }}
        >
          <Container>
            <div className="flex h-16 items-center justify-between">
              {tenant.brand.logo && !logoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.brand.logo} alt={tenant.brand.logoAlt ?? tenant.brand.name} className="h-9 w-auto" />
              ) : (
                <span className="text-[19px] font-semibold tracking-tight">{tenant.brand.name}</span>
              )}
              <button onClick={() => setMenuOpen(false)} aria-label="Đóng menu" className="p-2.5" autoFocus>
                <X className="h-[21px] w-[21px]" strokeWidth={1.6} />
              </button>
            </div>

            {/* Large and calm, not a dense list of ten links. */}
            <nav aria-label="Điều hướng chính" className="mt-6">
              <ul>
                {tenant.navigation.map((item) => (
                  <li key={item.label} style={{ borderBottom: '1px solid var(--sf-border)' }}>
                    {item.children?.length ? (
                      <div className="py-4">
                        <p className="sf-caption uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
                          {item.label}
                        </p>
                        <ul className="mt-1">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link href={child.href as Route} className="block py-2.5 text-[19px] font-medium tracking-tight">
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Link href={item.href as Route} className="block py-5 text-[22px] font-medium tracking-tight">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
                <li style={{ borderBottom: '1px solid var(--sf-border)' }}>
                  <Link href="/saved" className="block py-5 text-[22px] font-medium tracking-tight">
                    Đã lưu
                  </Link>
                </li>
              </ul>
            </nav>

            {tenant.features.quotations && (
              <button
                onClick={() => { setMenuOpen(false); toggleDrawer(); }}
                className="mt-8 w-full py-4 text-[15px] font-medium"
                style={{
                  backgroundColor: 'var(--tenant-accent)',
                  color: 'var(--tenant-accent-contrast)',
                  borderRadius: retail ? 'var(--tenant-radius)' : 2,
                }}
              >
                Yêu cầu báo giá{count > 0 ? ` (${count})` : ''}
              </button>
            )}

            {retail && tenant.contact?.phone && (
              <a
                href={`tel:${tenant.contact.phone.replace(/\s/g, '')}`}
                className="mt-4 flex items-center justify-center gap-2 py-3 text-[15px] font-medium"
                style={{ color: 'var(--tenant-ink)' }}
              >
                <Phone className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                Hotline {tenant.contact.phone}
              </a>
            )}
          </Container>
        </div>
      )}
    </>
  );
}

/**
 * The retail utility bar: the showroom's own descriptor and hotline on its
 * charcoal, and the demo disclosure on the right.
 *
 * Every statement comes from configuration — the descriptor is the one in the
 * showroom's logo, the number is the one it publishes. The bar adds nothing
 * of its own: no "chính hãng", no delivery or installation promise.
 */
function RetailUtilityBar({ tenant }: { tenant: TenantStorefrontConfig }) {
  const { copy } = tenant.experience;
  const phone = tenant.contact?.phone;
  const items = copy.utility ?? [];
  if (items.length === 0 && !phone && !copy.demoNotice) return null;

  return (
    <div className="hidden md:block" style={{ backgroundColor: 'var(--tenant-ink)', color: 'var(--tenant-ink-contrast)' }}>
      <div className="home-container flex h-8 items-center justify-between gap-8" style={{ fontSize: 12 }}>
        <ul className="flex min-w-0 items-center gap-5">
          {items.map((item, index) => (
            <li key={item} className="flex items-center gap-5 whitespace-nowrap" style={{ opacity: 0.82 }}>
              {index > 0 && <span aria-hidden="true" className="h-3 w-px" style={{ backgroundColor: 'rgba(255,255,255,.28)' }} />}
              {item}
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-5">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80"
            >
              <span style={{ opacity: 0.82 }}>Hotline</span>
              <span style={{ fontWeight: 600, color: 'var(--tenant-accent)', letterSpacing: '.02em' }}>{phone}</span>
            </a>
          )}
          {copy.demoNotice && (
            <>
              <span aria-hidden="true" className="hidden h-3 w-px lg:block" style={{ backgroundColor: 'rgba(255,255,255,.28)' }} />
              <span className="hidden whitespace-nowrap lg:inline" style={{ opacity: 0.6, fontSize: 11.5 }}>
                {copy.demoNotice}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
