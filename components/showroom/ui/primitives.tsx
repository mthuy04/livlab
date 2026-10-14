import type { ReactNode } from 'react';
import { CX } from './tokens';

export { money, moneyFull, price, count, percent, relativeTime, shortDate, uncontactedFor, dueIn } from './format';
export type { Urgency, AgeLabel } from './format';

/**
 * The showroom workspace's shared building blocks.
 *
 * One page frame, one table, one status vocabulary. The point is not reuse for
 * its own sake — it is that a status chip means the same thing on Leads as on
 * Quotes, and that seven pages do not each invent their own row height.
 *
 * Sizing assumes someone reading a worklist for a full day: 13px in tables,
 * 46px rows, numbers in tabular figures so money lines up when scanned.
 */

/* ------------------------------------------------------------------ status */

export type Tone = 'neutral' | 'info' | 'attention' | 'positive' | 'negative' | 'muted';

const TONE: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: 'bg-[#F0F4F7] text-[#45586B]', dot: 'bg-[#8095A8]' },
  info: { chip: 'bg-[#EAF1F8] text-[#1F5A86]', dot: 'bg-[#2B7CB8]' },
  attention: { chip: 'bg-[#FBF3E3] text-[#946200]', dot: 'bg-[#C98A12]' },
  positive: { chip: 'bg-[#E9F3ED] text-[#2E7D52]', dot: 'bg-[#2E7D52]' },
  negative: { chip: 'bg-[#FBEDEC] text-[#B4322A]', dot: 'bg-[#C7453B]' },
  muted: { chip: 'bg-[#F4F6F8] text-[#7E8D9B]', dot: 'bg-[#AFBCC7]' },
};

/**
 * A status. Dot plus label, never colour alone — the same chip has to work for
 * someone who cannot separate the amber from the green, and on a printed quote.
 */
export function Status({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[12px] font-medium ${TONE[tone].chip}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE[tone].dot}`} aria-hidden />
      {children}
    </span>
  );
}

/** Text-only variant for dense cells where a chip per row would be noise. */
export function StatusText({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#4F6070]">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE[tone].dot}`} aria-hidden />
      {children}
    </span>
  );
}

/** Kept as an alias: several pages still import the old name. */
export const StatusChip = Status;

/* -------------------------------------------------------------- page frame */

export type PageWidth = 'wide' | 'full' | 'narrow';

const WIDTH: Record<PageWidth, string> = {
  /** Dashboard and reports: structured, not edge to edge. */
  wide: 'max-w-[1400px]',
  /** Resource indexes. Tables want the room. */
  full: 'max-w-none',
  /** Settings. A form has no business being 1400px wide. */
  narrow: 'max-w-[840px]',
};

/**
 * The page header, shared by every route.
 *
 * Operational, not a hero: title, one line of context, and the actions for
 * this page. Nothing here grows to 300px.
 */
export function PageShell({
  title,
  description,
  context,
  actions,
  width = 'wide',
  children,
}: {
  title: string;
  description?: string;
  /** Quiet line above the title — date, tenant, period. */
  context?: ReactNode;
  actions?: ReactNode;
  width?: PageWidth;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full ${WIDTH[width]} px-6 py-6 lg:px-8`}>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {context && <div className="mb-1 text-[12px] text-[#7E8D9B]">{context}</div>}
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.01em] text-[#111A22]">{title}</h1>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-[#5A6977]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className = '',
  flush = false,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding — for a table that should meet the card's edges. */
  flush?: boolean;
}) {
  return (
    <section className={`${CX.card} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-[#EDF1F4] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold text-[#111A22]">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-[#7E8D9B]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {flush ? children : <div className="px-4 py-3.5">{children}</div>}
    </section>
  );
}

/* ----------------------------------------------------------------- metrics */

/**
 * One number. `emphasis` exists so a dashboard can have a lead metric instead
 * of five identical cards competing for the same attention.
 */
export function Metric({
  label,
  value,
  hint,
  tone = 'muted',
  href,
  emphasis = 'normal',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  href?: string;
  emphasis?: 'normal' | 'lead';
}) {
  const lead = emphasis === 'lead';
  const body = (
    <>
      <p className={CX.microLabel}>{label}</p>
      <p
        className={`mt-1.5 font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#111A22] ${
          lead ? 'text-[32px]' : 'text-[24px]'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[12px] text-[#7E8D9B]">{hint}</p>}
    </>
  );
  // `h-full` so a row of metrics keeps one baseline when one label wraps.
  const className =
    `block h-full ${CX.card} px-4 py-3.5 transition-colors` +
    (href ? ' hover:border-[#CFD9E1] hover:bg-[#FAFCFD]' : '');
  void tone;
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* ------------------------------------------------------------------ tables */

export function Table({ children, minWidth }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]" style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[#F7F9FA]">
      <tr className="border-b border-[#E3E9EE]">{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align = 'left',
  width,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7E8D9B] ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
      }`}
      style={width ? { width } : undefined}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[#EFF3F6]">{children}</tbody>;
}

export function TR({
  children,
  onClick,
  muted = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Dimmed, for rows kept visible but not part of normal work. */
  muted?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={`h-[46px] transition-colors ${onClick ? 'cursor-pointer' : ''} ${
        muted ? 'bg-[#FBFCFD] text-[#8795A3]' : 'hover:bg-[#FAFCFD]'
      }`}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  align = 'left',
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <td
      className={`px-4 ${align === 'right' ? CX.numeric : align === 'center' ? 'text-center' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

/* --------------------------------------------------------------- states */

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[14px] font-medium text-[#111A22]">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#7E8D9B]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[14px] font-medium text-[#111A22]">{title}</p>
      <p className="mt-1.5 text-[13px] text-[#7E8D9B]">Thử tải lại trang.</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`mt-4 ${CX.buttonSecondary}`}>
          Tải lại
        </button>
      )}
    </div>
  );
}

/**
 * Table skeleton. Holds the real column count and row height so the layout
 * does not jump when data lands — the thing a bare "Đang tải…" cannot do.
 */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <TBody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="h-[46px]">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4">
              <span
                className="block h-2.5 animate-pulse rounded bg-[#EFF3F6]"
                style={{ width: c === 0 ? '60%' : c === columns - 1 ? '40%' : '50%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </TBody>
  );
}

/* ------------------------------------------------------------- filter bar */

/**
 * The strip above a resource table: search, filters, then the result count.
 * One anatomy on every index page, so the controls are always where they were
 * on the last screen.
 */
export function FilterBar({
  search,
  filters,
  trailing,
  resultLabel,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  trailing?: ReactNode;
  resultLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#EDF1F4] px-4 py-2.5">
      {search}
      {filters}
      <div className="ml-auto flex items-center gap-3">
        {resultLabel && <span className="text-[12px] tabular-nums text-[#7E8D9B]">{resultLabel}</span>}
        {trailing}
      </div>
    </div>
  );
}

/** A segmented filter. Flat by default so a row of them is not a row of pills. */
export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5" role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] transition-colors ${
              active
                ? 'bg-[#EAF1F6] font-medium text-[#123C5A]'
                : 'text-[#5A6977] hover:bg-[#F4F7F9] hover:text-[#111A22]'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="tabular-nums text-[12px] text-[#8795A3]">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- notices */

export function MigrationNotice() {
  return (
    <div className="rounded-md border border-[#EBD9B4] bg-[#FBF3E3] px-4 py-3">
      <p className="text-[13px] font-semibold text-[#946200]">Cơ sở dữ liệu chưa chạy migration</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#946200]/85">
        Workspace cần các bảng Quote, QuoteLine, LeadActivity và ShowroomProductOffer. Chạy{' '}
        <code className="font-mono">db/migrations/20261007_showroom_workspace_v2.sql</code> trên database của môi
        trường này.
      </p>
    </div>
  );
}

/** A quiet explanatory line under a table. Not a card, not a callout. */
export function FootNote({ children }: { children: ReactNode }) {
  return <p className="mt-2.5 text-[12px] leading-relaxed text-[#7E8D9B]">{children}</p>;
}
