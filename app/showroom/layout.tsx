'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard, FileText, Inbox, Tags, Users, BarChart3, Settings,
  ExternalLink, AlertCircle, LogOut, ChevronDown,
} from 'lucide-react';
import { CX } from '@/components/showroom/ui/tokens';

/**
 * One workspace, one vocabulary.
 *
 * "Yêu cầu báo giá" and "Khách hàng / Leads" used to be separate entries over
 * overlapping data, so a salesperson had to guess which one held the request
 * they wanted — Leads is the single inbox now. "Sản phẩm quan tâm" promised
 * interest data that does not exist and was really a read-only catalogue, so
 * it is named for what it is.
 *
 * Grouped into three because seven flat items gave equal weight to the four
 * screens used hourly and the three used occasionally. The labels are quiet
 * enough not to become a second level of navigation.
 */
const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof Inbox; exact?: boolean }[] }[] = [
  {
    label: 'Vận hành',
    items: [
      { href: '/showroom', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
      { href: '/showroom/leads', label: 'Leads', icon: Inbox },
      { href: '/showroom/quotes', label: 'Báo giá', icon: FileText },
      { href: '/showroom/customers', label: 'Khách hàng', icon: Users },
    ],
  },
  {
    label: 'Kinh doanh',
    items: [
      { href: '/showroom/catalog', label: 'Danh mục & Giá', icon: Tags },
      { href: '/showroom/reports', label: 'Báo cáo', icon: BarChart3 },
    ],
  },
  {
    label: 'Hệ thống',
    items: [{ href: '/showroom/settings', label: 'Cài đặt', icon: Settings }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [showroomName, setShowroomName] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/showroom/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.showroom?.name && setShowroomName(data.showroom.name))
      .catch(() => {
        /* The sidebar falls back to a generic label; not worth surfacing. */
      });
  }, [user]);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FA]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#CFD9E1] border-t-[#123C5A]" />
      </div>
    );
  }

  // Valid credentials and the right role, but no showroom assigned.
  // Distinguished from "access denied" deliberately: telling a legitimate
  // partner they lack permission sends them to re-login forever, when what
  // they need is for an admin to finish setting the account up.
  if (user && user.role === 'SHOWROOM' && !user.showroomId) {
    return (
      <Gate
        tone="warning"
        title="Tài khoản chưa được gán showroom"
        body={
          <>
            Bạn đã đăng nhập với tư cách Showroom Partner, nhưng tài khoản{' '}
            <span className="font-medium text-[#111A22]">{user.email}</span> chưa được gán vào showroom nào. Liên hệ
            LivLab để được cấp quyền.
          </>
        }
        onLogout={logout}
      />
    );
  }

  if (!user || (user.role !== 'SHOWROOM' && user.role !== 'ADMIN')) {
    return (
      <Gate
        tone="danger"
        title="Truy cập bị từ chối"
        body="Bạn cần đăng nhập với tư cách Showroom Partner để xem trang này."
        loginHref="/login"
      />
    );
  }

  const initials = (user.name || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#F7F9FA] text-[#111A22] antialiased print-wrapper">
      {/* The sidebar recedes: same background family as the canvas, one hairline
          border, no filled pills. Content is what should hold the eye. */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-[#E3E9EE] bg-[#FCFDFD] lg:flex print-hide">
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#EDF1F4] px-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#123C5A] text-[11px] font-semibold text-white">
            L
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-[#111A22]">
              {showroomName ?? 'Showroom'}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA7B4]">
                {group.label}
              </p>
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as Route}
                        aria-current={active ? 'page' : undefined}
                        className={`flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors ${
                          active
                            ? 'bg-[#EAF1F6] font-medium text-[#123C5A]'
                            : 'text-[#4F6070] hover:bg-[#F1F5F7] hover:text-[#111A22]'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#123C5A]' : 'text-[#8795A3]'}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#EDF1F4] p-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F1F5F7]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#123C5A] text-[11px] font-semibold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-tight text-[#111A22]">
                  {user.name || user.email}
                </span>
                <span className="block truncate text-[11px] text-[#8795A3]">
                  {user.role === 'ADMIN' ? 'Quản trị LivLab' : 'Showroom Partner'}
                </span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#8795A3] transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
            </button>

            {accountOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setAccountOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-1 w-full rounded-md border border-[#E3E9EE] bg-white p-1 shadow-lg">
                  <Link
                    href="/"
                    className="flex h-8 items-center gap-2 rounded px-2 text-[13px] text-[#4F6070] transition-colors hover:bg-[#F1F5F7] hover:text-[#111A22]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Về trang chính
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex h-8 w-full items-center gap-2 rounded px-2 text-[13px] text-[#4F6070] transition-colors hover:bg-[#F1F5F7] hover:text-[#111A22]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Narrow widths get the nav as a scrolling strip rather than a drawer:
          this is a desktop tool, and a hamburger would hide the only way
          between seven screens behind an extra tap. */}
      <nav className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-1 overflow-x-auto border-b border-[#E3E9EE] bg-white px-3 lg:hidden print-hide">
        {ALL_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                active ? 'bg-[#EAF1F6] font-medium text-[#123C5A]' : 'text-[#5A6977]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="min-w-0 flex-1 pt-12 lg:pt-0 print-main">{children}</main>
    </div>
  );
}

/** Full-page access notice. One component for both gates. */
function Gate({
  tone,
  title,
  body,
  loginHref,
  onLogout,
}: {
  tone: 'warning' | 'danger';
  title: string;
  body: React.ReactNode;
  loginHref?: string;
  onLogout?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FA] p-6">
      <div className="w-full max-w-md rounded-md border border-[#E3E9EE] bg-white p-7 text-center">
        <span
          className={`mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-md ${
            tone === 'danger' ? 'bg-[#FBEDEC]' : 'bg-[#FBF3E3]'
          }`}
        >
          <AlertCircle className={`h-5 w-5 ${tone === 'danger' ? 'text-[#B4322A]' : 'text-[#946200]'}`} />
        </span>
        <h2 className="text-[17px] font-semibold text-[#111A22]">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[#5A6977]">{body}</p>
        <div className="mt-6 flex flex-col gap-2">
          {loginHref && (
            <Link href={loginHref as Route} className={`${CX.buttonPrimary} justify-center`}>
              Đăng nhập
            </Link>
          )}
          <Link href="/" className={`${CX.buttonSecondary} justify-center`}>
            Quay lại trang chủ
          </Link>
          {onLogout && (
            <button type="button" onClick={onLogout} className={`${CX.buttonSecondary} justify-center`}>
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
