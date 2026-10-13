'use client';

import { useState } from 'react';
import type { CatalogFilters, Facet } from '@/lib/storefront/catalogFilters';
import { PRICE_PRESETS } from '@/lib/storefront/catalogFilters';
import { AVAILABILITY_LABEL, type Availability } from '@/lib/storefront/catalogTypes';
import { TEXT, DIVIDER } from '@/components/storefront/home/editorial';

/**
 * The filter sidebar.
 *
 * Every group is a real `<button>` with `aria-expanded`, and a group whose
 * facet is empty is not rendered at all — a catalogue of basins should not
 * offer a flush-volume filter.
 */

function Group({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${DIVIDER}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
        style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}
      >
        <span>
          {title}
          {count ? <span style={{ color: '#999999', fontWeight: 400 }}> ({count})</span> : null}
        </span>
        <span aria-hidden="true" style={{ fontSize: 14, color: '#777777' }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5" style={{ fontSize: 14, color: '#444444' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-[14px] w-[14px] shrink-0 accent-[color:var(--tenant-accent)]"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span style={{ fontSize: 12, color: '#999999' }}>{count}</span>}
    </label>
  );
}

export interface Facets {
  categories: Facet[];
  brands: Facet[];
  subcategories: Facet[];
  colors: Facet[];
  availability: Facet[];
  roomStudio: number;
}

export default function CatalogFilterPanel({
  filters,
  facets,
  onChange,
}: {
  filters: CatalogFilters;
  facets: Facets;
  onChange: (next: Partial<CatalogFilters>) => void;
}) {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const pricePresets = PRICE_PRESETS.filter((p) => p.min !== null || p.max !== null);

  return (
    <div>
      {facets.categories.length > 1 && (
        <Group title="DANH MỤC">
          {facets.categories.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.category === f.value}
              onChange={() =>
                onChange({ category: filters.category === f.value ? null : f.value, subcategories: [] })
              }
            />
          ))}
        </Group>
      )}

      {facets.brands.length > 1 && (
        <Group title="THƯƠNG HIỆU">
          {facets.brands.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.brands.includes(f.value)}
              onChange={() => onChange({ brands: toggle(filters.brands, f.value) })}
            />
          ))}
        </Group>
      )}

      <Group title="KHOẢNG GIÁ">
        {pricePresets.map((preset) => {
          const checked = filters.priceMin === preset.min && filters.priceMax === preset.max;
          return (
            <CheckRow
              key={preset.label}
              label={preset.label}
              checked={checked}
              onChange={() =>
                onChange(
                  checked
                    ? { priceMin: null, priceMax: null }
                    : { priceMin: preset.min, priceMax: preset.max }
                )
              }
            />
          );
        })}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Từ"
            aria-label="Giá từ"
            value={filters.priceMin ?? ''}
            onChange={(e) => onChange({ priceMin: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-2.5 py-2"
            style={{ border: `1px solid ${DIVIDER}`, fontSize: 13 }}
          />
          <span style={{ color: '#999999' }}>–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Đến"
            aria-label="Giá đến"
            value={filters.priceMax ?? ''}
            onChange={(e) => onChange({ priceMax: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-2.5 py-2"
            style={{ border: `1px solid ${DIVIDER}`, fontSize: 13 }}
          />
        </div>
      </Group>

      {/* Category-specific: the subcategory facet only has values once a
          category narrows the catalogue to one kind of product. */}
      {facets.subcategories.length > 1 && (
        <Group title="LOẠI SẢN PHẨM">
          {facets.subcategories.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.subcategories.includes(f.value)}
              onChange={() => onChange({ subcategories: toggle(filters.subcategories, f.value) })}
            />
          ))}
        </Group>
      )}

      {facets.colors.length > 1 && (
        <Group title="MÀU SẮC" defaultOpen={false}>
          {facets.colors.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.colors.includes(f.value)}
              onChange={() => onChange({ colors: toggle(filters.colors, f.value) })}
            />
          ))}
        </Group>
      )}

      {/* Rendered only when the tenant actually has offer rows behind it. */}
      {facets.availability.length > 0 && (
        <Group title="TÌNH TRẠNG THƯƠNG MẠI">
          {facets.availability.map((f) => (
            <CheckRow
              key={f.value}
              label={AVAILABILITY_LABEL[f.value as Availability] ?? f.value}
              count={f.count}
              checked={filters.availability.includes(f.value)}
              onChange={() => onChange({ availability: toggle(filters.availability, f.value) })}
            />
          ))}
        </Group>
      )}

      {facets.roomStudio > 0 && (
        <Group title="ROOM STUDIO">
          <CheckRow
            label="Thử được trong Room Studio"
            count={facets.roomStudio}
            checked={filters.roomStudio}
            onChange={() => onChange({ roomStudio: !filters.roomStudio })}
          />
        </Group>
      )}
    </div>
  );
}
