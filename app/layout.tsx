import type { Metadata } from 'next';
import './globals.css';
import StorefrontShell from '@/components/storefront/StorefrontShell';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
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

  return (
    <html lang="vi" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#F3F7FA] text-[#0B1623] antialiased" suppressHydrationWarning>
        <AuthProvider>
          <QuoteProvider>
            <CatalogSync />
            <QuoteDrawer />
            <StorefrontShell tenant={tenant}>{children}</StorefrontShell>
            <FloatingSupportButton />
          </QuoteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
