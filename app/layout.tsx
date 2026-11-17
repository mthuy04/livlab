import type { Metadata } from 'next';
import './globals.css';
import StorefrontShell from '@/components/storefront/StorefrontShell';
import { resolveTenant, resolveTenantContext, tenantCssVars, tenantFontClass } from '@/lib/storefront/resolveTenant';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
import { TenantProvider } from '@/components/storefront/TenantContext';
import QuoteDrawer from '@/components/quote/QuoteDrawer';
import { QuoteProvider } from '@/lib/context/QuoteContext';
import { AuthProvider } from '@/lib/context/AuthContext';
import FloatingSupportButton from '@/components/support/FloatingSupportButton';
import CatalogSync from '@/components/layout/CatalogSync';

/**
 * Metadata is tenant-aware: a showroom's storefront should not announce itself
 * as LivLab in the browser tab or in a shared link.
 *
 * `metadataBase` is the tenant's own canonical origin, so every relative
 * canonical and Open Graph URL a page sets resolves onto the right site. No
 * canonical is set here: a layout's canonical is inherited by every page under
 * it, and each indexable page declares its own.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { tenant, origin, indexable } = await resolveTenantContext();
  const siteName = tenant.seo.siteName ?? tenant.brand.name;
  const shareImage = tenant.experience.home.landing?.hero.image.src ?? tenant.brand.logo;
  return {
    metadataBase: new URL(origin),
    title: tenant.seo.title,
    description: tenant.seo.description,
    applicationName: siteName,
    // Only a tenant on its own declared host is indexed. A preview, the
    // vercel.app alias or an unknown host is a duplicate of a real site.
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    // Per tenant. LivLab's own icon lives in /public rather than app/favicon.ico,
    // which Next would otherwise put ahead of every tenant's icon.
    icons: tenant.brand.icon
      ? { icon: tenant.brand.icon, apple: tenant.brand.icon }
      : { icon: '/favicon.ico' },
    openGraph: {
      title: tenant.seo.title,
      description: tenant.seo.description,
      type: 'website',
      siteName,
      locale: 'vi_VN',
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    verification: tenant.seo.googleSiteVerification
      ? { google: tenant.seo.googleSiteVerification }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolved on the server so the first paint already carries the tenant's
  // branding — a white-label storefront must never flash LivLab's identity
  // before the showroom's.
  const tenant = await resolveTenant();
  const cssVars = tenantCssVars(tenant);
  const fontClass = tenantFontClass(tenant);

  return (
    <html
      lang="vi"
      className={fontClass ? `h-full ${fontClass}` : 'h-full'}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* The tenant's tokens are also set on <body>: the quote drawer is a
          fixed overlay mounted outside the storefront shell and must still
          read the showroom's colours. Nothing outside the storefront uses
          them, so the showroom workspace and admin are unaffected. */}
      <body
        className="min-h-full flex flex-col bg-[#F3F7FA] text-[#0B1623] antialiased"
        style={cssVars as React.CSSProperties}
        suppressHydrationWarning
      >
        <TenantProvider tenant={tenant}>
          <AuthProvider>
            <QuoteProvider>
              <CatalogSync />
              <AnalyticsTracker />
              <QuoteDrawer />
              <StorefrontShell tenant={tenant} cssVars={cssVars}>
                {children}
              </StorefrontShell>
              <FloatingSupportButton />
            </QuoteProvider>
          </AuthProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
