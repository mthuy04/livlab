'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Tags,
  Users,
  BarChart,
  Settings,
  ExternalLink,
  AlertCircle,
  LogOut,
} from 'lucide-react';

/**
 * One workspace, one vocabulary.
 *
 * "Yêu cầu báo giá" and "Khách hàng / Leads" used to be separate entries that
 * showed overlapping data, so a salesperson had to guess which one held the
 * request they were looking for — Leads is now the single inbox.
 *
 * "Sản phẩm quan tâm" promised customer interest data that does not exist
 * anywhere; it was really a read-only catalogue, so it is named for what it is
 * and given the commercial controls that make it useful.
 *
 * Concepts is gone from the top level: it had no showroom data behind it.
 * Concept information still travels with a lead, where it has meaning.
 */
const navItems = [
  { href: '/showroom', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/showroom/leads', label: 'Leads', icon: Inbox, exact: false },
  { href: '/showroom/quotes', label: 'Báo giá', icon: FileText, exact: false },
  { href: '/showroom/catalog', label: 'Danh mục & Giá', icon: Tags, exact: false },
  { href: '/showroom/customers', label: 'Khách hàng', icon: Users, exact: false },
  { href: '/showroom/reports', label: 'Báo cáo', icon: BarChart, exact: false },
  { href: '/showroom/settings', label: 'Cài đặt', icon: Settings, exact: false },
];

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const currentPageLabel =
    [...navItems].reverse().find((item) => isActive(item.href, item.exact))?.label ?? 'Bảng điều khiển';
  const showroomName = 'Showroom';
  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center">Đang tải...</div>;
  }

  // Valid credentials, correct role, but no showroom assigned. Distinguished
  // from "access denied" on purpose: telling a legitimate partner they lack
  // permission would send them to re-login forever, when what they need is for
  // an admin to finish setting the account up. Before this, they simply saw an
  // empty dashboard and reported the login as broken.
  if (user && user.role === 'SHOWROOM' && !user.showroomId) {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[#C8A96A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Tài khoản chưa được gán showroom</h2>
          <p className="text-[#627386] text-sm mb-8 leading-relaxed">
            Bạn đã đăng nhập thành công với tư cách Showroom Partner, nhưng tài khoản
            <span className="font-semibold text-[#0B1623]"> {user.email} </span>
            chưa được gán vào showroom nào. Vui lòng liên hệ LivLab để được cấp quyền truy cập.
          </p>
          <div className="space-y-3">
            <Link href="/" className="flex items-center justify-center w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#0D2B42] transition-colors text-sm">
              Quay lại trang chủ
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center w-full py-3.5 bg-white text-[#0B1623] font-semibold rounded-2xl border border-[#D8E2EA] hover:border-[#0B1623] transition-colors text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
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
        {/* Top bar: identity and the current page, nothing else. "Xuất CSV"
            lived here and exported leads regardless of which page you were on,
            which is a Leads action, not a global one — it now sits on Leads. */}
        <header className="h-14 bg-white border-b border-[#DCE4EC] flex items-center justify-between px-6 z-30 flex-shrink-0 print-hide">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[15px] font-bold text-[#123C5A] truncate">{showroomName}</span>
            <span className="text-[#DCE4EC]">/</span>
            <span className="text-[14px] text-[#5B6B7C] font-medium truncate">{currentPageLabel}</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] text-[#5B6B7C] hover:text-[#123C5A] transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Về trang chính
          </Link>
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

            <div className="px-4 py-3 border-t border-[#E8EDF2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#123C5A] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#0B1623] truncate">{user.name || user.email}</p>
                  <p className="text-[11px] text-[#7A8795] truncate">
                    {user.role === 'ADMIN' ? 'Quản trị LivLab' : 'Showroom Partner'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DCE4EC] py-2 text-[12px] font-semibold text-[#5B6B7C] transition-colors hover:border-[#B9C9D8] hover:text-[#0B1623]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
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
