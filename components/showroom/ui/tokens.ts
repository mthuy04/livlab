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
  canvas: '#F7F9FA',
  surface: '#FFFFFF',
  /** Table header, hover rows, inset panels. */
  subtle: '#F4F7F9',
  hover: '#FAFCFD',

  border: '#E3E9EE',
  borderStrong: '#CFD9E1',

  text: '#111A22',
  textSecondary: '#4F6070',
  textMuted: '#7E8D9B',

  /** The one accent. LivLab navy, already used across the storefront. */
  accent: '#123C5A',
  accentHover: '#0D2B42',
  accentSoft: '#EAF1F6',

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
  md: '6px',
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
  card: 'rounded-md border border-[#E3E9EE] bg-white',
  input:
    'h-8 rounded border border-[#E3E9EE] bg-white px-2.5 text-[13px] text-[#111A22] ' +
    'outline-none transition-colors placeholder:text-[#9AA7B4] ' +
    'focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A]/15',
  buttonPrimary:
    'inline-flex h-8 items-center gap-1.5 rounded border border-transparent bg-[#123C5A] px-3 ' +
    'text-[13px] font-medium text-white transition-colors hover:bg-[#0D2B42] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123C5A] ' +
    'disabled:cursor-not-allowed disabled:opacity-45',
  buttonSecondary:
    'inline-flex h-8 items-center gap-1.5 rounded border border-[#E3E9EE] bg-white px-3 ' +
    'text-[13px] font-medium text-[#4F6070] transition-colors hover:border-[#CFD9E1] hover:text-[#111A22] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123C5A] ' +
    'disabled:cursor-not-allowed disabled:opacity-45',
  /** Numeric cells. Tabular figures so columns of money line up. */
  numeric: 'text-right tabular-nums',
  /** Compact uppercase metadata label. The only place uppercase is allowed. */
  microLabel: 'text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7E8D9B]',
} as const;
