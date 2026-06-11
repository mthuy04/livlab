'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  ExternalLink,
  AlertCircle,
  Users,
  Store,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package, exact: false },
  { href: '/admin/concepts', label: 'Concept', icon: Layers, exact: false },
  { href: '/admin/leads', label: 'Yêu cầu báo giá', icon: FileText, exact: false },
  { href: '/admin/users', label: 'Người dùng', icon: Users, exact: false },
  { href: '/admin/showrooms', label: 'Showroom', icon: Store, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Truy cập bị từ chối</h2>
          <p className="text-[#627386] text-sm mb-8 leading-relaxed">
            Bạn cần đăng nhập với tư cách Quản trị viên (Admin / Showroom) để xem trang này.
          </p>
          <div className="space-y-3">
            <Link href="/login" className="flex items-center justify-center w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors text-sm">
              Đăng nhập Admin
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
    <div className="min-h-screen flex flex-col bg-[#F3F7FA] text-[#0B1623] antialiased">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-[#D8E2EA] flex items-center justify-between px-4 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#123C5A]">LivLab Admin</span>
            <span className="text-[#D8E2EA]">|</span>
            <span className="text-xs text-[#627386] font-medium">Admin Dashboard</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#627386] hover:text-[#123C5A] transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Về trang chính
          </Link>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-56 bg-white border-r border-[#D8E2EA] flex flex-col flex-shrink-0 h-[calc(100vh-3rem)] sticky top-12">
            {/* Note */}
            <div className="mx-3 mt-3 mb-2 flex items-start gap-2 bg-[#EEF4F7] rounded-xl px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#486581] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-[#627386]">
                LivLab Commerce Platform
              </p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#123C5A] text-white'
                        : 'text-[#627386] hover:bg-[#EEF4F7] hover:text-[#0B1623]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#D8E2EA]">
              <p className="text-[10px] text-[#627386]">LivLab © 2026</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto h-[calc(100vh-3rem)] relative">
            {children}
          </main>
        </div>
      </div>
  );
}
