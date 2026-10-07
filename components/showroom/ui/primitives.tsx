import type { ReactNode } from 'react';

/**
 * Shared building blocks for the showroom workspace.
 *
 * One status vocabulary and one page frame, so a chip means the same thing on
 * every screen and tables line up instead of each page inventing its own
 * padding. Typography is sized for people reading a worklist all day: 14px
 * body, not the 11px of the previous dashboard.
 */

export type Tone = 'neutral' | 'info' | 'attention' | 'positive' | 'negative' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-[#EEF2F6] text-[#45586B] ring-[#D8E2EA]',
  info: 'bg-[#EAF1F8] text-[#1F5A86] ring-[#C7DCEC]',
  attention: 'bg-[#FBF2E0] text-[#8A6520] ring-[#EBD9B4]',
  positive: 'bg-[#E8F3EC] text-[#2E7D52] ring-[#C6E3D2]',
  negative: 'bg-[#FBEDED] text-[#A33A3A] ring-[#EFCFCF]',
  muted: 'bg-[#F4F6F8] text-[#8A98A6] ring-[#E3E9EE]',
};

export function StatusChip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** Page frame. Uses the full working width — operational tables need it. */
export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#0B1623]">{title}</h1>
          {description && <p className="mt-1 text-[14px] text-[#5B6B7C]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-[#DCE4EC] bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#E8EDF2] px-5 py-3.5">
          {title && <h2 className="text-[16px] font-bold text-[#0B1623]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A metric. Deliberately plain: the previous dashboard led with decorative
 * charts, which look busy and tell a salesperson nothing they can act on.
 */
export function Metric({
  label,
  value,
  hint,
  tone = 'neutral',
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#7A8795]">{label}</p>
      <p className="mt-1.5 text-[28px] font-bold leading-none text-[#0B1623]">{value}</p>
      {hint && (
        <p className="mt-2">
          <StatusChip tone={tone}>{hint}</StatusChip>
        </p>
      )}
    </>
  );
  const className =
    'block rounded-xl border border-[#DCE4EC] bg-white px-5 py-4 transition-colors' +
    (href ? ' hover:border-[#B9C9D8]' : '');
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Empty state that says what will appear here, never "đang phát triển". */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-[#0B1623]">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#6B7A89]">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Shown when the workspace tables are not in this database yet.
 *
 * The V2 migration is applied by hand, so a Preview can legitimately run ahead
 * of its database. Saying so plainly beats a generic error that reads as a bug.
 */
export function MigrationNotice() {
  return (
    <div className="rounded-xl border border-[#EBD9B4] bg-[#FBF2E0] px-5 py-4">
      <p className="text-[14px] font-bold text-[#8A6520]">Cơ sở dữ liệu chưa chạy migration</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#8A6520]/85">
        Showroom Workspace V2 cần các bảng mới (Quote, QuoteLine, LeadActivity,
        ShowroomProductOffer). Chạy <code className="font-mono">db/migrations/20261007_showroom_workspace_v2.sql</code>{' '}
        trên database của môi trường này, xem <code className="font-mono">db/migrations/README.md</code>.
      </p>
    </div>
  );
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}tr`;
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}
