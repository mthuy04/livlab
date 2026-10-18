'use client';

import './showroom.css';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard, FileText, Inbox, Tags, Users, BarChart3, Settings,
  ExternalLink, AlertCircle, LogOut, ChevronDown, Menu, Search, Bell, X,
} from 'lucide-react';
import { CX } from '@/components/showroom/ui/tokens';

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof Inbox; exact?: boolean }[] }[] = [
  {
    label: 'Vận hành',
    items: [
      { href: '/showroom', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
      { href: '/showroom/leads', label: 'Yêu cầu khách hàng', icon: Inbox },
      { href: '/showroom/quotes', label: 'Báo giá', icon: FileText },
      { href: '/showroom/customers', label: 'Khách hàng', icon: Users },
    ],
  },
  {
    label: 'Kinh doanh',
    items: [
      { href: '/showroom/catalog', label: 'Sản phẩm & giá', icon: Tags },
      { href: '/showroom/reports', label: 'Báo cáo', icon: BarChart3 },
    ],
  },
  { label: 'Hệ thống', items: [{ href: '/showroom/settings', label: 'Cài đặt', icon: Settings }] },
];

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [showroomName, setShowroomName] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch('/api/showroom/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.showroom?.name && setShowroomName(data.showroom.name))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#F7F6F2]"><span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5D7B7] border-t-[#EF9F00]" /></div>;
  }
  if (user && user.role === 'SHOWROOM' && !user.showroomId) {
    return <Gate tone="warning" title="Tài khoản chưa được gán showroom" body={<>Tài khoản <strong>{user.email}</strong> chưa được gán vào workspace. Liên hệ LivLab để hoàn tất cấu hình.</>} onLogout={logout} />;
  }
  if (!user || (user.role !== 'SHOWROOM' && user.role !== 'ADMIN')) {
    return <Gate tone="danger" title="Truy cập bị từ chối" body="Bạn cần đăng nhập với tài khoản Showroom Partner." loginHref="/login" />;
  }

  const displayName = showroomName?.replace(' — Demo Workspace', '') || 'Showroom';
  const initials = (user.name || user.email || '?').slice(0, 2).toUpperCase();
  const active = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  const sidebar = (
    <>
      <div className="showroom-brand">
        <span className="showroom-brand-mark">TĐ</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold tracking-[0.01em] text-[#2E2D2B]">{displayName}</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#A2A099]">LivLab Showroom</p>
        </div>
      </div>
      <nav className="showroom-nav" aria-label="Điều hướng showroom">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="showroom-nav-caption">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const selected = active(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link href={item.href as Route} onClick={() => setMobileOpen(false)} aria-current={selected ? 'page' : undefined} className={`showroom-nav-link ${selected ? 'active' : ''}`}>
                      <Icon className="h-[18px] w-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-auto p-3.5">
        <div className="rounded-[14px] border border-[#F0E8D8] bg-[#F9F6EF] p-3.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#B0A38C]">Workspace</p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#2E2D2B] text-[11px] font-extrabold text-[#F9C365]">LL</span>
            <div className="min-w-0"><strong className="block truncate text-[12px]">Showroom Partner</strong><small className="text-[10px] text-[#989791]">Powered by LivLab</small></div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="showroom-v3 min-h-screen bg-[#F7F6F2] text-[#2E2D2B]">
      <aside className="showroom-sidebar print-hide">{sidebar}</aside>
      {mobileOpen && (
        <>
          <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-[#2E2D2B]/35 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="showroom-mobile-sidebar print-hide">
            <button type="button" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-[#74736E] hover:bg-[#F5F3ED]"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </>
      )}

      <div className="showroom-workspace">
        <header className="showroom-topbar print-hide">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Mở menu" className="showroom-icon-btn lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
            <span className="hidden text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#93948D] sm:inline">Showroom Workspace</span>
            <span className="hidden h-[18px] w-px bg-[#ECEAE4] sm:block" />
            <span className="truncate text-[12px] text-[#696D69]">{NAV_GROUPS.flatMap((g) => g.items).find((item) => active(item.href, item.exact))?.label || 'Tổng quan'}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={(event) => { event.preventDefault(); if (search.trim()) router.push(`/showroom/leads?q=${encodeURIComponent(search.trim())}`); }} className="showroom-global-search">
              <Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách hàng..." aria-label="Tìm khách hàng" />
            </form>
            <button type="button" aria-label="Thông báo" className="showroom-icon-btn"><Bell className="h-[19px] w-[19px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#EA9553] ring-1 ring-white" /></button>
            <div className="relative">
              <button type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-[#F5F3ED]">
                <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#FCE4C2] text-[11px] font-extrabold text-[#9B641D]">{initials}</span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-[#8B8B85] sm:block" />
              </button>
              {accountOpen && (
                <><button className="fixed inset-0 z-20" aria-label="Đóng menu tài khoản" onClick={() => setAccountOpen(false)} /><div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-[#E8E6DF] bg-white p-1.5 shadow-xl">
                  <div className="border-b border-[#F0EFEB] px-2.5 py-2"><p className="truncate text-xs font-bold">{user.name || user.email}</p><p className="mt-0.5 truncate text-[10px] text-[#99978F]">{user.email}</p></div>
                  <Link href="/" className="mt-1 flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs text-[#66645F] hover:bg-[#F8F6F1]"><ExternalLink className="h-3.5 w-3.5" /> Website khách hàng</Link>
                  <button type="button" onClick={logout} className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-[#66645F] hover:bg-[#F8F6F1]"><LogOut className="h-3.5 w-3.5" /> Đăng xuất</button>
                </div></>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 print-main">{children}</main>
      </div>
    </div>
  );
}

function Gate({ tone, title, body, loginHref, onLogout }: { tone: 'warning' | 'danger'; title: string; body: React.ReactNode; loginHref?: string; onLogout?: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F7F6F2] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E4DA] bg-white p-8 text-center shadow-sm">
        <span className={`mx-auto mb-5 grid h-11 w-11 place-items-center rounded-xl ${tone === 'danger' ? 'bg-[#FBEDEC]' : 'bg-[#FFF1D6]'}`}><AlertCircle className={`h-5 w-5 ${tone === 'danger' ? 'text-[#B4322A]' : 'text-[#9A650E]'}`} /></span>
        <h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#77746D]">{body}</p>
        <div className="mt-6 flex flex-col gap-2">{loginHref && <Link href={loginHref as Route} className={`${CX.buttonPrimary} justify-center`}>Đăng nhập</Link>}<Link href="/" className={`${CX.buttonSecondary} justify-center`}>Quay lại trang chủ</Link>{onLogout && <button type="button" onClick={onLogout} className={`${CX.buttonSecondary} justify-center`}>Đăng xuất</button>}</div>
      </div>
    </div>
  );
}
