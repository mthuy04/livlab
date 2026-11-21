'use client';

/**
 * The Technical Advisor, presented for scanning: one summary, three groups,
 * short cards with one action each. The engine's findings and wording are
 * the source; long text moves behind "Chi tiết" instead of being cut.
 */
import { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Droplets,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { firstSentence, WHY_IT_MATTERS, type AdvisorGroups, type MissingTopic, type TopicAction } from './advisorGroups';

type Tone = 'amber' | 'blue' | 'green';

const TONE: Record<Tone, { chip: string; dot: string; icon: string; soft: string; border: string; text: string }> = {
  amber: {
    chip: 'border-[#F2D3A0] bg-[#FFF6E8] text-[#9A5B0B]',
    dot: 'bg-[#E0962B]',
    icon: 'bg-[#FFF1DB] text-[#C27A12]',
    soft: 'bg-[#FFFBF4]',
    border: 'border-[#F1E0C2]',
    text: 'text-[#9A5B0B]',
  },
  blue: {
    chip: 'border-[#CFE0EE] bg-[#F1F6FB] text-[#1D4F7A]',
    dot: 'bg-[#3E7DB3]',
    icon: 'bg-[#EAF2FA] text-[#2F6A9E]',
    soft: 'bg-[#F8FBFD]',
    border: 'border-[#DCE8F2]',
    text: 'text-[#1D4F7A]',
  },
  green: {
    chip: 'border-[#CBE8DA] bg-[#EEF8F3] text-[#1F7A55]',
    dot: 'bg-[#2F9A6C]',
    icon: 'bg-[#E6F5EE] text-[#24855C]',
    soft: 'bg-[#F7FCF9]',
    border: 'border-[#D9EEE3]',
    text: 'text-[#1F7A55]',
  },
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]';

/* ── Summary ───────────────────────────────────────────────────────────── */

export function AdvisorSummary({ groups, onJump }: { groups: AdvisorGroups; onJump: (section: Tone) => void }) {
  const actionCount = groups.action.length;
  const total = actionCount + groups.missingCount + groups.passed.length;
  const chips: [Tone, string, number][] = [
    ['amber', 'Cần xử lý', actionCount],
    ['blue', 'Thiếu dữ liệu', groups.missingCount],
    ['green', 'Đã ổn', groups.passed.length],
  ];
  return (
    <section aria-label="Tóm tắt kiểm tra kỹ thuật" className="rounded-xl border border-[#E1E8ED] bg-white p-3 shadow-[0_1px_3px_rgba(11,34,57,0.06)]">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${actionCount ? TONE.amber.icon : TONE.green.icon}`}
        >
          {actionCount ? <AlertTriangle className="h-[18px] w-[18px]" /> : <CheckCircle2 className="h-[18px] w-[18px]" />}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[#0B1623]">
            {actionCount ? `${actionCount} điểm cần xử lý` : 'Bố trí đang hợp lệ'}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-[#5B6B7A]">
            {total} điểm kiểm tra · {actionCount ? 'xử lý trước khi lắp đặt' : 'không có xung đột vị trí'}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {chips.map(([tone, label, n]) => (
          <button
            key={tone}
            type="button"
            onClick={() => onJump(tone)}
            aria-label={`${label}: ${n}`}
            className={`flex min-w-0 flex-col items-start rounded-lg border px-1.5 py-1.5 text-left transition-opacity hover:opacity-85 ${TONE[tone].chip} ${focusRing}`}
          >
            <span className="flex items-center gap-1 text-[16px] font-semibold leading-none tabular-nums">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TONE[tone].dot}`} />
              {n}
            </span>
            <span className="mt-1 min-h-[2.5em] text-[10.5px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Section ───────────────────────────────────────────────────────────── */

export function AdvisorSection({
  id,
  tone,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  id: string;
  tone: Tone;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  if (!count) return null;
  return (
    <section id={id} className="scroll-mt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg py-1.5 text-left ${focusRing}`}
      >
        <span aria-hidden className={`h-2 w-2 rounded-full ${TONE[tone].dot}`} />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3F4F5C]">{title}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${TONE[tone].chip}`}>{count}</span>
        <ChevronDown aria-hidden className={`h-4 w-4 text-[#8C9BAB] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-1.5 space-y-2">{children}</div>}
    </section>
  );
}

/* ── Cards ─────────────────────────────────────────────────────────────── */

function DetailsToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-[#5B6B7A] hover:text-[#0B2239] ${focusRing}`}
    >
      {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
      <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

/** An issue the customer can act on now. */
export function IssueCard({
  finding,
  product,
  onSmartFix,
}: {
  finding: TechnicalValidationResult;
  product?: string;
  onSmartFix?: (finding: TechnicalValidationResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const optimize = finding.severity === 'OPTIMIZE';
  return (
    <article className={`rounded-xl border border-l-[3px] ${TONE.amber.border} border-l-[#E0962B] bg-white p-3 shadow-[0_1px_2px_rgba(11,34,57,0.05)]`}>
      <div className="flex gap-2.5">
        <span aria-hidden className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE.amber.icon}`}>
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold leading-snug text-[#0B1623]">
            <span className="sr-only">{optimize ? 'Có thể tối ưu: ' : 'Cần xử lý: '}</span>
            {finding.title}
          </p>
          {product && <p className="mt-0.5 truncate text-[11px] font-medium text-[#8C9BAB]">{product}</p>}
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#5B6B7A]">{firstSentence(finding.message)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {finding.placementIssue && onSmartFix && (
              <button
                type="button"
                onClick={() => onSmartFix(finding)}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[#0B2239] px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-colors hover:bg-[#15324F] ${focusRing}`}
              >
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                Sửa bằng Smart Fix
              </button>
            )}
            <DetailsToggle open={open} onClick={() => setOpen((v) => !v)} />
          </div>
          {open && (
            <div className={`mt-2 space-y-1.5 rounded-lg ${TONE.amber.soft} p-2.5 text-[11.5px] leading-relaxed text-[#3F4F5C]`}>
              <p>
                <span className="font-semibold text-[#0B1623]">Vì sao quan trọng · </span>
                {WHY_IT_MATTERS[finding.category]}
              </p>
              <p>{finding.message}</p>
              {finding.suggestedAction && (
                <p>
                  <span className="font-semibold text-[#0B1623]">Gợi ý · </span>
                  {finding.suggestedAction}
                </p>
              )}
              {finding.requiresHumanVerification && (
                <p className="text-[#8C9BAB]">Cần showroom hoặc kỹ thuật viên xác nhận trước khi lắp đặt.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const TOPIC_ICON: Record<TopicAction, typeof Droplets> = { water: Droplets, data: FileText, confirm: ClipboardCheck };

/** Missing input, merged across products into one card with one action. */
export function TopicCard({
  topic,
  names,
  onAction,
}: {
  topic: MissingTopic;
  names: string[];
  onAction: (key: TopicAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = TOPIC_ICON[topic.key];
  const shown = names.slice(0, 3);
  return (
    <article className={`rounded-xl border ${TONE.blue.border} bg-white p-3 shadow-[0_1px_2px_rgba(11,34,57,0.04)]`}>
      <div className="flex gap-2.5">
        <span aria-hidden className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE.blue.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold leading-snug text-[#0B1623]">{topic.title}</p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#5B6B7A]">{topic.summary}</p>
          {shown.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {shown.map((name) => (
                <span key={name} className="rounded-md bg-[#F3F6F9] px-1.5 py-0.5 text-[10.5px] font-medium text-[#3F4F5C]">
                  {name}
                </span>
              ))}
              {names.length > shown.length && (
                <span className="rounded-md bg-[#F3F6F9] px-1.5 py-0.5 text-[10.5px] font-medium text-[#8C9BAB]">
                  +{names.length - shown.length}
                </span>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAction(topic.key)}
              className={`inline-flex items-center rounded-lg border border-[#2F6A9E] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#1D4F7A] transition-colors hover:bg-[#EAF2FA] ${focusRing}`}
            >
              {topic.cta}
            </button>
            <DetailsToggle open={open} onClick={() => setOpen((v) => !v)} />
          </div>
          {open && (
            <ul className={`mt-2 space-y-1.5 rounded-lg ${TONE.blue.soft} p-2.5 text-[11.5px] leading-relaxed text-[#3F4F5C]`}>
              {topic.findings.map((f) => (
                <li key={f.id}>
                  <span className="font-semibold text-[#0B1623]">{f.title} · </span>
                  {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

/** Checks that passed: one line each, quiet. */
export function PassedList({ findings, nameOf }: { findings: TechnicalValidationResult[]; nameOf: (f: TechnicalValidationResult) => string | undefined }) {
  return (
    <ul className={`divide-y divide-[#EEF3F0] rounded-xl border ${TONE.green.border} bg-white px-3`}>
      {findings.map((f) => (
        <li key={f.id} className="flex items-start gap-2 py-2">
          <CheckCircle2 aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2F9A6C]" />
          <div className="min-w-0">
            <p className="text-[12px] font-medium leading-snug text-[#0B1623]">{f.title}</p>
            {nameOf(f) && <p className="truncate text-[11px] text-[#8C9BAB]">{nameOf(f)}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdvisorNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-1.5 text-[11px] leading-relaxed text-[#8C9BAB]">
      <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
