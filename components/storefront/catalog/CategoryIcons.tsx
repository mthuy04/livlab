import type { SVGProps } from 'react';

/**
 * Category icons: one line-icon family, drawn here.
 *
 * The project's icon library has no sanitaryware, and the source site's icons
 * are its own artwork — so these are original outlines sharing one geometry:
 * a 24-unit viewBox, 1.4px stroke, round joins, no fill. Every drawing sits
 * inside roughly the same optical square so a tap target never looks heavier
 * than its neighbour.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

/** Everything — a 2×2 grid. */
export function AllIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
    </svg>
  );
}

/** Toilet: cistern, bowl, base. */
export function ToiletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h8.5v5H7z" />
      <path d="M5 8.5h13v2.5a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6V8.5Z" />
      <path d="M9 17v3.5h6V17" />
    </svg>
  );
}

/** Basin: counter line, bowl, tap. */
export function BasinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5v3.5" />
      <path d="M9.5 7h5" />
      <path d="M3 11h18" />
      <path d="M4.5 11v2.5a6 6 0 0 0 6 6h3a6 6 0 0 0 6-6V11" />
    </svg>
  );
}

/** Basin mixer: spout, body, lever. */
export function FaucetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 20.5h11" />
      <path d="M13.5 20.5v-7" />
      <path d="M13.5 13.5H10a3.5 3.5 0 0 1 0-7h7" />
      <path d="M17 4v5" />
      <path d="M5 9.5h5" />
    </svg>
  );
}

/** Shower: riser, head, spray. */
export function ShowerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 20.5V6a2.5 2.5 0 0 1 2.5-2.5h2" />
      <path d="M11.5 8.5h8l-4 4-4-4Z" />
      <path d="M13.5 16v1.5M16 15v2M18.5 16v1.5" />
    </svg>
  );
}

/** Bathtub: rim, body, feet, tap. */
export function BathtubIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 11.5h19" />
      <path d="M4 11.5v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3" />
      <path d="M6.5 18.5v2M17.5 18.5v2" />
      <path d="M6.5 11.5V5.5A2 2 0 0 1 10 4" />
    </svg>
  );
}

/** Mirror and accessories: framed mirror with a rail. */
export function MirrorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5.5" y="3" width="13" height="14" rx="6.5" />
      <path d="M4 20.5h16" />
    </svg>
  );
}

/** Which icon a category label gets. Unknown labels fall back to the grid. */
export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  'Bồn cầu': ToiletIcon,
  Lavabo: BasinIcon,
  'Vòi lavabo': FaucetIcon,
  'Sen tắm': ShowerIcon,
  'Bồn tắm': BathtubIcon,
  'Gương & phụ kiện': MirrorIcon,
};

export const iconFor = (category: string) => CATEGORY_ICONS[category] ?? AllIcon;
