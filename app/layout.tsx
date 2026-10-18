import type { Metadata } from 'next';
import './globals.css';
import StorefrontShell from '@/components/storefront/StorefrontShell';
import { resolveTenant, tenantCssVars, tenantFontClass } from '@/lib/storefront/resolveTenant';
import { TenantProvider } from '@/components/storefront/TenantContext';
import QuoteDrawer from '@/components/quote/QuoteDrawer';
import { QuoteProvider } from '@/lib/context/QuoteContext';
import { AuthProvider } from '@/lib/context/AuthContext';
import FloatingSupportButton from '@/components/support/FloatingSupportButton';
import CatalogSync from '@/components/layout/CatalogSync';

/**
 * Metadata is tenant-aware: a showroom's storefront should not announce itself
 * as LivLab in the browser tab or in a shared link.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  return {
    title: tenant.seo.title,
    description: tenant.seo.description,
    openGraph: { title: tenant.seo.title, description: tenant.seo.description, type: 'website' },
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
