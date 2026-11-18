'use client';

import { Check, Plus } from 'lucide-react';
import { useQuote, type CatalogQuoteEntry } from '@/lib/context/QuoteContext';
import type { ShowroomCombo } from '@/lib/storefront/showroomMedia';
import styles from './ArchitecturalLanding.module.css';

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

/**
 * Approved combos only (see `publishedCombos`). A combo whose parts are all
 * catalogue products can go into the quote basket whole; one that is
 * described rather than itemised is asked about instead.
 */
export default function ShowroomCombos({
  combos,
  entries,
}: {
  combos: ShowroomCombo[];
  /** Basket entries for the catalogue products the combos name, by catalogue id. */
  entries: Record<string, CatalogQuoteEntry>;
}) {
  const { addCatalogItem, hasItem, openDrawer } = useQuote();

  return (
    <div className={styles.comboGrid}>
      {combos.map((combo) => {
        const parts = combo.components.map((c) => (c.catalogProductId ? entries[c.catalogProductId] : undefined));
        const itemised = parts.length > 0 && parts.every(Boolean);
        const added = itemised && parts.every((p) => hasItem(p!.productId));
        return (
          <article key={combo.id} className={styles.comboCard}>
            <h3>{combo.title}</h3>
            <p>{combo.summary}</p>
            <ul>
              {combo.components.map((part) => (
                <li key={part.label}>
                  {part.quantity > 1 ? `${part.quantity} × ` : ''}
                  {part.label}
                  {part.variantNote ? <span> · {part.variantNote}</span> : null}
                </li>
              ))}
            </ul>
            <p className={styles.comboPrice}>
              {combo.pricing.status === 'CONFIRMED' ? formatVnd(combo.pricing.amount) : 'Liên hệ báo giá'}
            </p>
            {itemised ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  parts.forEach((p) => !hasItem(p!.productId) && addCatalogItem({ ...p!, sourceContext: `combo:${combo.id}` }));
                  openDrawer();
                }}
              >
                {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {added ? 'ĐÃ CÓ TRONG BÁO GIÁ' : 'THÊM CẢ BỘ VÀO BÁO GIÁ'}
              </button>
            ) : (
              <a
                href={`/quote?interest=${encodeURIComponent(combo.title)}`}
                className={styles.primaryButton}
              >
                HỎI GIÁ BỘ NÀY
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}
