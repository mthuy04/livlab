'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useQuote } from '@/lib/context/QuoteContext';
import { useTenant } from '@/components/storefront/TenantContext';
import type { ConceptProductView } from '@/lib/storefront/conceptTypes';

/**
 * The room's closing actions: put every product in it into the quote basket,
 * or carry on in Room Studio.
 *
 * Uses the basket's own catalogue door, one entry per product, exactly as the
 * product page adds one — the showroom receives each with its tenant, price
 * snapshot and `CONCEPT:<slug>` as the context it came from. A product already
 * in the basket is not added twice; the drawer opens either way so the
 * customer sees what they are about to send.
 */
export default function ConceptQuoteActions({
  products,
  conceptSlug,
  roomStudio,
}: {
  products: ConceptProductView[];
  conceptSlug: string;
  roomStudio: boolean;
}) {
  const tenant = useTenant();
  const { addCatalogItem, hasItem, openDrawer } = useQuote();
  const { copy } = tenant.experience;

  const addAll = () => {
    const missing = products.filter((p) => !hasItem(p.id));
    for (const p of missing) {
      addCatalogItem({
        catalogProductId: p.catalogProductId,
        productId: p.id,
        sourceType: p.sourceType,
        tenantId: tenant.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        sku: p.sku,
        image: p.image,
        showroomPrice: p.showroomPrice,
        referencePrice: p.referencePrice,
        sourceContext: `CONCEPT:${conceptSlug}`,
      });
    }
    if (missing.length === 0) openDrawer();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <button
        type="button"
        onClick={addAll}
        className="inline-flex h-12 items-center bg-[color:var(--tenant-accent)] px-6 transition-colors hover:bg-[color:var(--tenant-accent-hover)]"
        style={{
          borderRadius: 'var(--tenant-radius)',
          color: 'var(--tenant-accent-contrast)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '.09em',
        }}
      >
        {copy.quote.cta}
        <span className="ml-2 opacity-75">({products.length} sản phẩm)</span>
      </button>
      {roomStudio && (
        <Link
          href={'/room-studio' as Route}
          className="group inline-flex items-center gap-2 transition-colors hover:text-[color:var(--tenant-accent-ink)]"
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-ink)' }}
        >
          MỞ ROOM STUDIO
          <span aria-hidden="true" style={{ color: 'var(--tenant-accent-ink)' }}>→</span>
        </Link>
      )}
    </div>
  );
}
