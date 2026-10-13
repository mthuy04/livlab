'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ChevronDown, Menu, Search, Bookmark, X } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
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
  const menuOpen = menuOpenAt === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenAt(open ? pathname : null);
  const { count, toggleDrawer } = useQuote();

  // Scroll position is an external store, so it is read as one. An effect that
  // seeded the value with setState would also be correct, but this gives the
  // right answer on the first render — including when the browser restores a
  // scroll position — with no extra pass.
  const subscribeScroll = useCallback((onChange: () => void) => {
    window.addEventListener('scroll', onChange, { passive: true });
    return () => window.removeEventListener('scroll', onChange);
  }, []);
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false
  );

  // The drawer covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-colors duration-200"
        style={{
          backgroundColor: 'var(--sf-surface)',
          borderBottom: `1px solid ${scrolled ? 'var(--sf-border)' : 'transparent'}`,
        }}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-6 lg:h-20">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={tenant.brand.name}>
              {tenant.brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.brand.logo} alt={tenant.brand.logoAlt ?? tenant.brand.name} className="h-7 w-auto lg:h-8" />
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
              <ul className="flex items-center gap-9">
                {tenant.navigation.map((item) => {
                  const active = isActive(item.href) || item.children?.some((c) => isActive(c.href));
                  const linkStyle = {
                    color: active ? 'var(--sf-text)' : 'var(--sf-text-secondary)',
                    fontWeight: active ? 500 : 400,
                  };

                  if (!item.children?.length) {
                    return (
                      <li key={item.label}>
                        <Link href={item.href as Route} className="text-[15px] transition-colors" style={linkStyle}>
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
                        className="flex items-center gap-1 py-2 text-[15px] transition-colors"
                        style={linkStyle}
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>

                      {isOpen && (
                        <div
                          className="absolute left-0 top-full z-50 min-w-[220px] py-2"
                          style={{
                            backgroundColor: 'var(--sf-surface)',
                            border: '1px solid var(--sf-border)',
                            borderRadius: 'var(--sf-radius)',
                            boxShadow: '0 8px 28px rgba(26,26,24,0.08)',
                          }}
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href as Route}
                              onClick={() => setOpenGroup(null)}
                              className="block px-4 py-2.5 text-[14px] transition-colors hover:bg-[color:var(--sf-surface-muted)]"
                              style={{ color: isActive(child.href) ? 'var(--sf-text)' : 'var(--sf-text-secondary)' }}
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
                  className="ml-1.5 hidden items-center gap-2 px-4 py-2.5 text-[14px] font-medium transition-colors lg:inline-flex"
                  style={{
                    backgroundColor: 'var(--tenant-accent)',
                    color: 'var(--tenant-accent-contrast)',
                    borderRadius: 'var(--sf-radius)',
                  }}
                >
                  Yêu cầu báo giá
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
        </Container>
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
                  borderRadius: 'var(--sf-radius)',
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
