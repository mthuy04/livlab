/**
 * The showroom workspace's design tokens.
 *
 * One file so a border is the same grey on seven pages. Values are literals
 * rather than Tailwind theme extensions because the rest of this codebase uses
 * arbitrary-value classes, and introducing a parallel theme would mean two
 * places to look when a colour is wrong.
 *
 * The palette is deliberately short. A partner workspace is read for hours at
 * a stretch, so the surfaces stay quiet and colour is reserved for the three
 * things that actually need attention: money, status and lateness.
 */

export const COLOR = {
  /** Page background. Not white — white surfaces need something to sit on. */
  canvas: '#F7F6F2',
  surface: '#FFFFFF',
  /** Table header, hover rows, inset panels. */
  subtle: '#FAF9F6',
  hover: '#FFFCF6',

  border: '#EAE9E4',
  borderStrong: '#D8D6CF',

  text: '#2E2D2B',
  textSecondary: '#64635F',
  textMuted: '#92948D',

  /** The one accent. LivLab navy, already used across the storefront. */
  accent: '#EF9F00',
  accentHover: '#FCA359',
  accentSoft: '#FFF1D6',

  success: '#2E7D52',
  successSoft: '#E9F3ED',
  warning: '#946200',
  warningSoft: '#FBF3E3',
  danger: '#B4322A',
  dangerSoft: '#FBEDEC',
  info: '#1F5A86',
  infoSoft: '#EAF1F8',
} as const;

/** 4px micro, 8px base. Nothing between them without a reason. */
export const SPACE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const RADIUS = {
  /** Controls, chips, inputs. */
  sm: '4px',
  /** Cards, tables, panels. Moderate on purpose — not a pill, not a slab. */
  md: '15px',
} as const;

/**
 * Row heights. Data pages are read by scanning, and scanning depends on a
 * predictable vertical rhythm far more than on padding.
 */
export const ROW_HEIGHT = {
  /** Dense resource tables: leads, catalogue, quotes. */
  compact: 46,
  /** Rows carrying two lines of text (name + phone). */
  comfortable: 56,
} as const;

/** Shared Tailwind fragments, so the same control is not re-specified per page. */
export const CX = {
  card: 'rounded-[15px] border border-[#EAE9E4] bg-white shadow-[0_7px_24px_rgba(46,45,43,.035)]',
  input:
    'h-9 rounded-[9px] border border-[#E6E4DE] bg-white px-3 text-[13px] text-[#2E2D2B] ' +
    'outline-none transition-colors placeholder:text-[#9AA7B4] ' +
    'focus:border-[#EF9F00] focus:ring-2 focus:ring-[#EF9F00]/15',
  buttonPrimary:
    'inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#EF9F00] bg-[#EF9F00] px-3.5 ' +
    'text-[13px] font-semibold text-[#2E2D2B] shadow-[0_2px_0_#C88400] transition-colors hover:bg-[#FCA359] ' +
    'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#EF9F00] ' +
    'disabled:cursor-not-allowed disabled:opacity-45',
  buttonSecondary:
    'inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#E6E4DE] bg-white px-3.5 ' +
    'text-[13px] font-semibold text-[#62615D] transition-colors hover:border-[#D6D2C8] hover:bg-[#FBF8F0] hover:text-[#2E2D2B] ' +
    'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#EF9F00] ' +
    'disabled:cursor-not-allowed disabled:opacity-45',
  /** Numeric cells. Tabular figures so columns of money line up. */
  numeric: 'text-right tabular-nums',
  /** Compact uppercase metadata label. The only place uppercase is allowed. */
  microLabel: 'text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7E8D9B]',
} as const;
