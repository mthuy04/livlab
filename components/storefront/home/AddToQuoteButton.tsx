'use client';

import { Check, Plus } from 'lucide-react';
import { useQuote, type CatalogQuoteEntry } from '@/lib/context/QuoteContext';

/** Adds one catalogue product to the quote basket and shows the basket. */
export default function AddToQuoteButton({ entry, label = 'Thêm báo giá' }: { entry: CatalogQuoteEntry; label?: string }) {
  const { addCatalogItem, hasItem, openDrawer } = useQuote();
  const added = hasItem(entry.productId);
  return (
    <button
      type="button"
      data-added={added}
      aria-label={added ? `${entry.name} đã có trong báo giá` : `Thêm ${entry.name} vào báo giá`}
      onClick={() => {
        if (!added) addCatalogItem(entry);
        openDrawer();
      }}
    >
      {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {added ? 'Đã thêm' : label}
    </button>
  );
}
