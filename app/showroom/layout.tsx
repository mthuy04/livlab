'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Star,
  Layers,
  Users,
  BarChart,
  Settings,
  ExternalLink,
  AlertCircle,
  Download,
  Printer,
  RefreshCw
} from 'lucide-react';

const navItems = [
  { href: '/showroom', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/showroom/leads', label: 'Yêu cầu báo giá', icon: FileText, exact: false },
  { href: '/showroom/products', label: 'Sản phẩm quan tâm', icon: Star, exact: false },
  { href: '/showroom/concepts', label: 'Concepts', icon: Layers, exact: false },
  { href: '/showroom/customers', label: 'Khách hàng / Leads', icon: Users, exact: false },
  { href: '/showroom/reports', label: 'Báo cáo', icon: BarChart, exact: false },
  { href: '/showroom/settings', label: 'Cài đặt showroom', icon: Settings, exact: false },
];

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center">Đang tải...</div>;
  }

  if (!user || user.role !== 'SHOWROOM' && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Truy cập bị từ chối</h2>
          <p className="text-[#627386] text-sm mb-8 leading-relaxed">
            Bạn cần đăng nhập với tư cách Showroom Partner để xem trang này.
          </p>
          <div className="space-y-3">
            <Link href="/login" className="flex items-center justify-center w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors text-sm">
              Đăng nhập
            </Link>
            <Link href="/" className="flex items-center justify-center w-full py-3.5 bg-white text-[#0B1623] font-semibold rounded-2xl border border-[#D8E2EA] hover:border-[#0B1623] transition-colors text-sm">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7FA] text-[#0B1623] antialiased print-wrapper">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[#D8E2EA] flex items-center justify-between px-6 z-30 flex-shrink-0 print-hide">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[#123C5A]">Luxbath Showroom</span>
            <span className="text-[#D8E2EA]">|</span>
            <span className="text-sm text-[#627386] font-medium">Bảng điều khiển</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#627386] hover:bg-[#EEF4F7] hover:text-[#0B1623] transition-colors font-medium rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#627386] hover:bg-[#EEF4F7] hover:text-[#0B1623] transition-colors font-medium rounded-lg">
              <Printer className="w-3.5 h-3.5" />
              In báo cáo
            </button>
            <a href="/api/showroom/leads/export" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#123C5A] text-white text-xs font-medium rounded-lg hover:bg-[#0D2B42] transition-colors">
              <Download className="w-3.5 h-3.5" />
              Xuất CSV
            </a>
            <span className="text-[#D8E2EA] mx-1">|</span>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-[#627386] hover:text-[#123C5A] transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Về trang chính
            </Link>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-[#D8E2EA] flex flex-col flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 print-hide">
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#123C5A] text-white'
                        : 'text-[#627386] hover:bg-[#EEF4F7] hover:text-[#0B1623]'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#D8E2EA] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#123C5A] text-white flex items-center justify-center font-bold text-xs">
                LX
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B1623]">{user.name}</p>
                <p className="text-[10px] text-[#627386]">Showroom Partner</p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)] relative print-main">
            {children}
          </main>
        </div>
      </div>
  );
}
