'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import {
  budgetFacetMatches,
  type BudgetFacet,
  type ConceptCardModel,
} from '@/lib/storefront/conceptTypes';
import ConceptCard from './ConceptCard';
import ConceptFilters, { EMPTY_FILTERS, type ConceptFilterState } from './ConceptFilters';

/**
 * The grid and its filters.
 *
 * Filtering is the only interactive thing on this page, so it is the only
 * thing that runs in the browser; the concepts themselves were resolved,
 * priced and gated on the server and arrive as finished cards.
 *
 * There is no sort control, no pagination, no search. Five curated rooms have
 * no meaningful sort order, fit on one screen, and are faster to look at than
 * to describe in a search box. Each of those controls is here on most
 * catalogue pages out of habit, and each one would say "this is a long list"
 * about a page whose whole argument is that it is short.
 */

const BUDGET_FACETS: BudgetFacet[] = ['UNDER_30', 'FROM_30_TO_60', 'FROM_60_TO_100', 'OVER_100'];

export default function ConceptsBrowser({ concepts }: { concepts: ConceptCardModel[] }) {
  const [filters, setFilters] = useState<ConceptFilterState>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const matches = (c: ConceptCardModel, f: ConceptFilterState) =>
    (f.style === 'ALL' || c.styleFacet === f.style) &&
    (f.area === 'ALL' || c.areaFacet === f.area) &&
    (f.budget === 'ALL' || budgetFacetMatches(f.budget, c.estimate));

  const visible = useMemo(
    () => concepts.filter((c) => matches(c, filters)),
    [concepts, filters]
  );

  /**
   * Counts are computed with the axis being counted left open, so each number
   * answers "how many if I pick this", not "how many are showing".
   */
  const counts = useMemo(() => {
    const count = (axis: keyof ConceptFilterState, option: string) =>
      concepts.filter((c) => matches(c, { ...filters, [axis]: option } as ConceptFilterState)).length;

    // Counted over the facets the library actually has, not a second list of
    // facet names kept by hand. A hardcoded copy here is how "Tương phản" came
    // to render as 0 beside a concept that was in the grid at the time.
    const style: Record<string, number> = {};
    new Set(concepts.map((c) => c.styleFacet)).forEach((s) => {
      style[s] = count('style', s);
    });
    const area: Record<string, number> = {};
    new Set(concepts.map((c) => c.areaFacet)).forEach((a) => {
      area[a] = count('area', a);
    });
    const budget: Record<string, number> = {};
    BUDGET_FACETS.forEach((b) => {
      budget[b] = count('budget', b);
    });
    return { style, area, budget, all: concepts.length };
  }, [concepts, filters]);

  /**
   * Which facets the published library actually contains, independent of what
   * is filtered. The column renders from this, so an option never advertises
   * an absence and a concept added later brings its own options with it.
   */
  const available = useMemo(
    () => ({
      style: [...new Set(concepts.map((c) => c.styleFacet))],
      area: [...new Set(concepts.map((c) => c.areaFacet))],
      budget: BUDGET_FACETS.filter((b) => concepts.some((c) => budgetFacetMatches(b, c.estimate))),
    }),
    [concepts]
  );

  const dirty =
    filters.style !== 'ALL' || filters.area !== 'ALL' || filters.budget !== 'ALL';

  // The sheet covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  const toolbar = (
    <div
      className="flex items-center justify-between gap-6"
      style={{ paddingBottom: 22, borderBottom: `1px solid ${DIVIDER}` }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT }}>
        {visible.length} KHÔNG GIAN
      </p>
      <div className="flex items-center gap-5">
        {dirty && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 12, color: TEXT_MUTED, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Bỏ lọc
          </button>
        )}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="lg:hidden"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}
        >
          BỘ LỌC{dirty ? ' •' : ''}
        </button>
      </div>
    </div>
  );

  return (
    <div className="concepts-layout">
      <aside className="concepts-filter-column hidden lg:block" aria-label="Bộ lọc không gian">
        <ConceptFilters value={filters} onChange={setFilters} counts={counts} available={available} />
      </aside>

      <div className="min-w-0">
        {toolbar}

        {visible.length > 0 ? (
          <div className="concepts-grid">
            {visible.map((c, i) => (
              <ConceptCard key={c.slug} concept={c} priority={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState onReset={() => setFilters(EMPTY_FILTERS)} />
        )}
      </div>

      {sheetOpen && (
        <div className="concepts-sheet lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc">
          <div className="concepts-sheet-panel">
            <div
              className="flex items-center justify-between"
              style={{ paddingBottom: 14 }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT }}>BỘ LỌC</p>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Đóng bộ lọc" autoFocus>
                <X size={20} strokeWidth={1.4} color={TEXT} />
              </button>
            </div>
            <ConceptFilters value={filters} onChange={setFilters} counts={counts} available={available} />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '15px 0',
                background: TEXT,
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.10em',
              }}
            >
              XEM {visible.length} KHÔNG GIAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nothing matched.
 *
 * Reachable only by a combination no single option produces, because every
 * option that would empty the grid is disabled in the column. It still offers
 * the way out rather than only stating the fact.
 */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ paddingBlock: 72, maxWidth: 480 }}>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: TEXT }}>
        Không có không gian nào khớp cả ba tiêu chí đang chọn.
      </p>
      <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: TEXT_MUTED }}>
        Thư viện Phase 1 gồm năm không gian được tuyển chọn, nên một số tổ hợp sẽ chưa có kết quả.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="transition-opacity hover:opacity-60"
        style={{ marginTop: 22, fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}
      >
        XEM TẤT CẢ KHÔNG GIAN →
      </button>
    </div>
  );
}
