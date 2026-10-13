'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ChevronDown, Menu, Search, Bookmark, X } from 'lucide-react';
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
      {utility.length > 0 && (
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
                  className="h-9 w-auto lg:h-[40px]"
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
              <ul className="flex items-stretch gap-11">
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
                            borderRadius: 0,
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

              {tenant.features.quotations && (
                <button
                  onClick={toggleDrawer}
                  className="ml-2 hidden items-center gap-2 text-[12px] transition-opacity hover:opacity-80 lg:inline-flex"
                  style={{
                    height: 42,
                    paddingInline: 20,
                    backgroundColor: 'var(--tenant-accent)',
                    color: 'var(--tenant-accent-contrast)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '.10em',
                  }}
                >
                  YÊU CẦU BÁO GIÁ
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
              <span className="text-[19px] font-semibold tracking-tight">{tenant.brand.name}</span>
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
                  borderRadius: 2,
                }}
              >
                Yêu cầu báo giá{count > 0 ? ` (${count})` : ''}
              </button>
            )}
          </Container>
        </div>
      )}
    </>
  );
}
