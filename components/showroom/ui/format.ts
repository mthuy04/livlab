/**
 * How the showroom workspace writes numbers, money and time.
 *
 * Centralised because the audit found the same quantity written three ways:
 * a price of zero rendered as "0đ" when it means nobody has set one, and a
 * lead untouched since June rendered as "Chưa liên hệ 2989h" — technically a
 * number of hours, operationally unreadable.
 */

/* --------------------------------------------------------------- money */

const VN = new Intl.NumberFormat('vi-VN');

/**
 * Money for a table cell. Compact above a million, because a column of
 * "8.730.000đ" is harder to compare at a glance than "8,7tr".
 *
 * `null`/`undefined` is "not recorded" and renders as an em dash. Zero is
 * handled by `price()` instead — in this catalogue zero never means free.
 */
export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '0đ';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const text = millions >= 100 ? Math.round(millions).toString() : millions.toFixed(1).replace('.', ',');
    return `${text.replace(/,0$/, '')}tr`;
  }
  return `${VN.format(value)}đ`;
}

/** Money in full, for detail views where the exact figure matters. */
export function moneyFull(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${VN.format(Math.round(value))}đ`;
}

/**
 * A product price, where zero means nobody has entered one.
 *
 * No product in this catalogue is genuinely free, so a stored 0 is missing
 * data wearing a number's clothes. Rendering it as "0đ" told a salesperson the
 * showroom sells a mirror for nothing — see the catalogue audit.
 */
export function price(value: number | null | undefined): { text: string; isSet: boolean } {
  if (value === null || value === undefined || value === 0) {
    return { text: 'Chưa cập nhật', isSet: false };
  }
  return { text: money(value), isSet: true };
}

export function count(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return VN.format(value);
}

export function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${value}%`;
}

/* ---------------------------------------------------------------- time */

const DAY = 86_400_000;
const HOUR = 3_600_000;

function asDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

export function shortDate(input: Date | string): string {
  return asDate(input).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * How long ago, in words a person uses.
 *
 * Relative while it is still operationally interesting, absolute once it is
 * history: "3 tuần trước" tells a salesperson nothing they can act on, whereas
 * a date can at least be matched against a conversation.
 */
export function relativeTime(input: Date | string): string {
  const d = asDate(input);
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(ms)) return '—';
  if (ms < 60_000) return 'vừa xong';
  if (ms < HOUR) return `${Math.round(ms / 60_000)} phút trước`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} giờ trước`;

  const days = Math.round(ms / DAY);
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return shortDate(d);
}

export type Urgency = 'calm' | 'due' | 'overdue';

export interface AgeLabel {
  text: string;
  urgency: Urgency;
  /** Full sentence for a tooltip, where the exact figure is still useful. */
  title: string;
}

/**
 * How long a lead has gone untouched.
 *
 * The workspace used to print the raw hour count, so a lead from June read
 * "Chưa liên hệ 2989h". Nobody converts that to four months in their head, and
 * the number is so large it stops registering as urgent at all — which is the
 * opposite of what an overdue marker is for.
 *
 * Past a week it switches to the date: at that point the lead is not late, it
 * is abandoned, and what a salesperson needs is when it came in.
 */
export function uncontactedFor(hours: number | null | undefined, createdAt?: Date | string): AgeLabel {
  if (hours === null || hours === undefined) {
    return { text: '—', urgency: 'calm', title: 'Chưa có dữ liệu liên hệ.' };
  }
  const title = `Chưa liên hệ trong ${Math.round(hours)} giờ.`;

  if (hours < 1) return { text: 'Vừa tạo', urgency: 'calm', title };
  if (hours < 24) return { text: `Chưa liên hệ · ${Math.round(hours)} giờ`, urgency: 'due', title };

  const days = Math.floor(hours / 24);
  if (days === 1) return { text: 'Chưa liên hệ · 1 ngày', urgency: 'overdue', title };
  if (days < 7) return { text: `Chưa liên hệ · ${days} ngày`, urgency: 'overdue', title };

  return {
    text: createdAt ? `Tồn từ ${shortDate(createdAt)}` : `Tồn ${Math.floor(days / 7)} tuần`,
    urgency: 'overdue',
    title,
  };
}

/**
 * A scheduled next action, relative to now.
 *
 * Same principle: hours while that is the unit a person would use, days after.
 */
export function dueIn(at: Date | string | null | undefined): AgeLabel {
  if (!at) return { text: '—', urgency: 'calm', title: 'Chưa lên lịch việc tiếp theo.' };
  const d = asDate(at);
  const ms = d.getTime() - Date.now();
  const title = `Hạn ${shortDate(d)}.`;

  if (ms >= 0) {
    if (ms < HOUR) return { text: 'Đến hạn', urgency: 'due', title };
    if (ms < DAY) return { text: `Còn ${Math.round(ms / HOUR)} giờ`, urgency: 'due', title };
    const days = Math.round(ms / DAY);
    return { text: days === 1 ? 'Ngày mai' : `Còn ${days} ngày`, urgency: 'calm', title };
  }

  const late = Math.abs(ms);
  if (late < DAY) return { text: `Quá hạn ${Math.round(late / HOUR)} giờ`, urgency: 'overdue', title };
  const days = Math.floor(late / DAY);
  if (days < 7) return { text: `Quá hạn ${days} ngày`, urgency: 'overdue', title };
  if (days < 30) return { text: `Quá hạn ${Math.floor(days / 7)} tuần`, urgency: 'overdue', title };
  return { text: `Quá hạn từ ${shortDate(d)}`, urgency: 'overdue', title };
}
