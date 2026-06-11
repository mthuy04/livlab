import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import QuoteDrawer from '@/components/quote/QuoteDrawer';
import { QuoteProvider } from '@/lib/context/QuoteContext';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'LivLab — Số hoá trải nghiệm chọn mua nội thất',
  description:
    'LivLab là nền tảng visual-commerce giúp showroom nội thất và thiết bị vệ sinh biến catalogue sản phẩm thành các concept không gian tương tác — giúp khách hàng dễ hình dung, chọn sản phẩm và gửi yêu cầu báo giá.',
  keywords: 'nội thất, showroom, visual commerce, concept phòng tắm, thiết bị vệ sinh, báo giá',
  openGraph: {
    title: 'LivLab — Số hoá trải nghiệm chọn mua nội thất',
    description: 'Concept phòng tương tác, hotspot sản phẩm và quy trình báo giá chuẩn cho showroom Việt.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#F3F7FA] text-[#0B1623] antialiased" suppressHydrationWarning>
        <AuthProvider>
          <QuoteProvider>
            <Navbar />
            <QuoteDrawer />
            <main className="flex-1">{children}</main>
            <Footer />
          </QuoteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
