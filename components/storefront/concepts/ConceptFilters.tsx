'use client';

import { DIVIDER, TEXT, TEXT_FAINT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import {
  AREA_FACET_LABEL,
  BUDGET_FACET_LABEL,
  STYLE_FACET_LABEL,
  type AreaFacet,
  type BudgetFacet,
  type StyleFacet,
} from '@/lib/storefront/conceptTypes';

/**
 * Three filter rows, set as text.
 *
 * The page this replaces offered thirteen pill buttons across four axes for a
 * library of thirty-four, which is a cloud of chips a visitor reads as work
 * rather than as choice. These are radio groups drawn as lines: a small marker,
 * a label, a thin rule between groups, and nothing with a background.
 *
 * Counts are shown next to every option and an option that would empty the
 * grid is disabled, so a visitor cannot walk themselves into an empty state.
 * The old budget filter sent anyone asking for "30–60 triệu" — the band most
 * people want — to a blank page, which is a worse outcome than not offering
 * the filter at all.
 */

export type ConceptFilterState = {
  style: StyleFacet | 'ALL';
  area: AreaFacet | 'ALL';
  budget: BudgetFacet | 'ALL';
};

export const EMPTY_FILTERS: ConceptFilterState = { style: 'ALL', area: 'ALL', budget: 'ALL' };

/**
 * The order each axis is offered in. Not the list that renders.
 *
 * A row appears only when some published concept actually carries that facet,
 * so the column describes the library in front of the reader rather than the
 * taxonomy behind it. With three concepts live, offering "Scandinavian — 0"
 * advertises an absence; as concepts are added their facets appear here on
 * their own, with no list to remember to update.
 */
const STYLE_ORDER: StyleFacet[] = [
  'MODERN',
  'SCANDINAVIAN',
  'JAPANDI',
  'SMART',
  'HOTEL',
  'CONTRAST',
  'LUXURY',
  'SPA',
  'COASTAL',
];
const AREA_ORDER: AreaFacet[] = ['SMALL', 'MEDIUM', 'LARGE'];
const BUDGET_ORDER: BudgetFacet[] = ['UNDER_30', 'FROM_30_TO_60', 'FROM_60_TO_100', 'OVER_100'];

export type ConceptFacetAvailability = {
  style: StyleFacet[];
  area: AreaFacet[];
  budget: BudgetFacet[];
};

function Row<T extends string>({
  name,
  value,
  option,
  label,
  count,
  onChange,
}: {
  name: string;
  value: string;
  option: T | 'ALL';
  label: string;
  count: number;
  onChange: (v: T | 'ALL') => void;
}) {
  const selected = value === option;
  const disabled = count === 0 && option !== 'ALL';

  return (
    <label
      className="flex cursor-pointer items-center gap-2.5 py-[7px] transition-opacity hover:opacity-70"
      style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.38 : 1 }}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        disabled={disabled}
        onChange={() => onChange(option)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="shrink-0"
        style={{
          width: 9,
          height: 9,
          border: `1px solid ${selected ? TEXT : '#C9C9C4'}`,
          background: selected ? TEXT : 'transparent',
        }}
      />
      <span style={{ fontSize: 14, lineHeight: 1.45, color: selected ? TEXT : TEXT_MUTED }}>
        {label}
      </span>
      <span className="ml-auto" style={{ fontSize: 12, color: TEXT_FAINT }}>
        {count}
      </span>
    </label>
  );
}

/** Fewer than two real options is not a choice, so the group does not render. */
function Group({ title, options, children }: { title: string; options: number; children: React.ReactNode }) {
  if (options < 2) return null;
  return (
    <fieldset style={{ paddingBlock: 22, borderTop: `1px solid ${DIVIDER}` }}>
      <legend
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.12em',
          color: TEXT,
          marginBottom: 8,
        }}
      >
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export default function ConceptFilters({
  value,
  onChange,
  counts,
  available,
}: {
  value: ConceptFilterState;
  onChange: (next: ConceptFilterState) => void;
  counts: {
    style: Record<string, number>;
    area: Record<string, number>;
    budget: Record<string, number>;
    all: number;
  };
  available: ConceptFacetAvailability;
}) {
  const styles = STYLE_ORDER.filter((s) => available.style.includes(s));
  const areas = AREA_ORDER.filter((a) => available.area.includes(a));
  const budgets = BUDGET_ORDER.filter((b) => available.budget.includes(b));

  return (
    <div>
      <Group title="PHONG CÁCH" options={styles.length}>
        <Row name="style" value={value.style} option="ALL" label="Tất cả" count={counts.all}
             onChange={(v) => onChange({ ...value, style: v as StyleFacet | 'ALL' })} />
        {styles.map((s) => (
          <Row key={s} name="style" value={value.style} option={s} label={STYLE_FACET_LABEL[s]}
               count={counts.style[s] ?? 0}
               onChange={(v) => onChange({ ...value, style: v as StyleFacet | 'ALL' })} />
        ))}
      </Group>

      <Group title="DIỆN TÍCH" options={areas.length}>
        <Row name="area" value={value.area} option="ALL" label="Tất cả" count={counts.all}
             onChange={(v) => onChange({ ...value, area: v as AreaFacet | 'ALL' })} />
        {areas.map((a) => (
          <Row key={a} name="area" value={value.area} option={a} label={AREA_FACET_LABEL[a]}
               count={counts.area[a] ?? 0}
               onChange={(v) => onChange({ ...value, area: v as AreaFacet | 'ALL' })} />
        ))}
      </Group>

      <Group title="NGÂN SÁCH" options={budgets.length}>
        <Row name="budget" value={value.budget} option="ALL" label="Tất cả" count={counts.all}
             onChange={(v) => onChange({ ...value, budget: v as BudgetFacet | 'ALL' })} />
        {budgets.map((b) => (
          <Row key={b} name="budget" value={value.budget} option={b} label={BUDGET_FACET_LABEL[b]}
               count={counts.budget[b] ?? 0}
               onChange={(v) => onChange({ ...value, budget: v as BudgetFacet | 'ALL' })} />
        ))}
      </Group>
    </div>
  );
}
