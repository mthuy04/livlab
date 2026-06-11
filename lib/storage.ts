

import { QuoteItem, Lead, Product, Concept } from './types';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const QUOTE_KEY   = 'livlab_quote_items';
const QUOTE_PREFILL_KEY = 'livlab_quote_prefill';
const LEADS_KEY   = 'livlab_leads';
const PRODUCTS_KEY = 'livlab_products';
const CONCEPTS_KEY = 'livlab_concepts';
const SAVED_KEY   = 'livlab_saved_concepts';
const COMPARE_KEY = 'livlab_compare_items';
export const USERS_KEY = 'livlab_users';

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Users ────────────────────────────────────────────────────────────────────
import { User } from './types';
export function getStoredUsers(): User[] { return safeGet<User[]>(USERS_KEY, []); }
export function saveStoredUsers(users: User[]): void { safeSet(USERS_KEY, users); }

// ─── Quote Items ──────────────────────────────────────────────────────────────
export function getQuoteItems(): QuoteItem[]          { return safeGet<QuoteItem[]>(QUOTE_KEY, []); }
export function saveQuoteItems(items: QuoteItem[]): void { safeSet(QUOTE_KEY, items); }

export interface QuotePrefill {
  roomType?: string;
  budgetRange?: string;
  selectedConcept?: string;
}
export function getQuotePrefill(): QuotePrefill | null { return safeGet<QuotePrefill | null>(QUOTE_PREFILL_KEY, null); }
export function saveQuotePrefill(prefill: QuotePrefill): void { safeSet(QUOTE_PREFILL_KEY, prefill); }
export function clearQuotePrefill(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUOTE_PREFILL_KEY);
}

export function calculateQuoteTotalRange(items: QuoteItem[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  items.forEach(item => {
    min += (item.priceMin || 0) * item.quantity;
    max += (item.priceMax || 0) * item.quantity;
  });
  return { min, max };
}

export function addQuoteItem(item: QuoteItem): QuoteItem[] {
  const items = getQuoteItems();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    const updated = items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i);
    saveQuoteItems(updated);
    return updated;
  }
  const updated = [...items, item];
  saveQuoteItems(updated);
  return updated;
}

export function removeQuoteItem(productId: string): QuoteItem[] {
  const items = getQuoteItems().filter((i) => i.productId !== productId);
  saveQuoteItems(items);
  return items;
}

export function updateQuoteItemQty(productId: string, quantity: number): QuoteItem[] {
  if (quantity < 1) return removeQuoteItem(productId);
  const items = getQuoteItems().map((i) => i.productId === productId ? { ...i, quantity } : i);
  saveQuoteItems(items);
  return items;
}

export function clearQuoteItems(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUOTE_KEY);
}

// ─── Leads ────────────────────────────────────────────────────────────────────
import { demoLeadsSeed } from './adminDemoAnalytics';

export function getLeads(): Lead[] {
  let rawLeads = safeGet<Lead[]>(LEADS_KEY, []);
  if (rawLeads.length === 0) {
    rawLeads = demoLeadsSeed;
    saveLeads(rawLeads);
  }
  return rawLeads.map((lead) => {
    let normalized = { ...lead };
    if (!normalized.requestCode && typeof normalized.id === 'string' && normalized.id.startsWith('LLQ-')) {
      normalized.requestCode = normalized.id;
    }
    if (!normalized.selectedProducts) {
      normalized.selectedProducts = [];
    }
    if (!normalized.statusHistory) {
      normalized.statusHistory = [{ status: normalized.status, at: normalized.createdAt }];
    }
    return normalized;
  });
}
export function saveLeads(leads: Lead[]): void { safeSet(LEADS_KEY, leads); }

export function addLead(lead: Lead): Lead[] {
  const leads = getLeads();
  const updated = [lead, ...leads];
  saveLeads(updated);
  return updated;
}

export function updateLeadStatus(id: string, status: Lead['status'], note?: string): Lead[] {
  const defaultNotes: Record<string, string> = {
    'Đã liên hệ': 'Showroom đã liên hệ với khách hàng.',
    'Đã báo giá': 'Showroom đã chuẩn bị hoặc gửi báo giá.',
    'Đã chốt': 'Khách hàng đã xác nhận phương án.',
    'Mất lead': 'Yêu cầu tạm dừng hoặc không tiếp tục xử lý.',
  };

  const leads = getLeads().map((l) => {
    if (l.id !== id) return l;
    const history = l.statusHistory || [{ status: l.status, at: l.createdAt }];
    const finalNote = note || defaultNotes[status];
    return {
      ...l,
      status,
      statusHistory: [...history, { status, at: new Date().toISOString(), note: finalNote }]
    };
  });
  saveLeads(leads);
  return leads;
}

export function updateLeadAdminNote(id: string, adminNote: string): Lead[] {
  const leads = getLeads().map((l) => (l.id === id ? { ...l, adminNote } : l));
  saveLeads(leads);
  return leads;
}

export function findLeadByCodeAndPhone(requestCode: string, phone: string): Lead | undefined {
  return getLeads().find((l) =>
    l.requestCode.toLowerCase() === requestCode.toLowerCase() &&
    l.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')
  );
}

export function generateRequestCode(existingLeads: Lead[]): string {
  const prefix = 'LLQ-2026-';
  let maxNum = 0;

  existingLeads.forEach((lead) => {
    const maybeCode =
      typeof lead.requestCode === 'string'
        ? lead.requestCode
        : typeof lead.id === 'string' && lead.id.startsWith(prefix)
          ? lead.id
          : '';

    if (!maybeCode.startsWith(prefix)) return;

    const numStr = maybeCode.replace(prefix, '');
    const num = Number.parseInt(numStr, 10);

    if (!Number.isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

// ─── Products (admin override) ────────────────────────────────────────────────
export function getStoredProducts(): Product[] | null {
  const val = safeGet<Product[] | null>(PRODUCTS_KEY, null);
  return val;
}
export function saveStoredProducts(products: Product[]): void { safeSet(PRODUCTS_KEY, products); }

export function addStoredProduct(product: Product): Product[] {
  const base = getStoredProducts() || [];
  const updated = [product, ...base];
  saveStoredProducts(updated);
  return updated;
}

export function updateStoredProduct(product: Product): Product[] {
  const base = getStoredProducts() || [];
  const updated = base.map((p) => p.id === product.id ? product : p);
  saveStoredProducts(updated);
  return updated;
}

export function deleteStoredProduct(id: string): Product[] {
  const base = getStoredProducts() || [];
  const updated = base.filter((p) => p.id !== id);
  saveStoredProducts(updated);
  return updated;
}

// ─── Concepts (admin override) ────────────────────────────────────────────────
export function getStoredConcepts(): Concept[] | null {
  return safeGet<Concept[] | null>(CONCEPTS_KEY, null);
}
export function saveStoredConcepts(concepts: Concept[]): void { safeSet(CONCEPTS_KEY, concepts); }

export function updateStoredConcept(concept: Concept): Concept[] {
  const base = getStoredConcepts() || [];
  const updated = base.map((c) => c.id === concept.id ? concept : c);
  saveStoredConcepts(updated);
  return updated;
}

export function deleteStoredConcept(id: string): Concept[] {
  const base = getStoredConcepts() || [];
  const updated = base.filter((c) => c.id !== id);
  saveStoredConcepts(updated);
  return updated;
}

// ─── Saved Concepts ───────────────────────────────────────────────────────────
export function getSavedSlugs(): string[]            { return safeGet<string[]>(SAVED_KEY, []); }
export function saveSavedSlugs(slugs: string[]): void { safeSet(SAVED_KEY, slugs); }

export function toggleSavedConcept(slug: string): string[] {
  const slugs = getSavedSlugs();
  const updated = slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
  saveSavedSlugs(updated);
  return updated;
}

export function isConceptSaved(slug: string): boolean {
  return getSavedSlugs().includes(slug);
}

// ─── Compare Items ────────────────────────────────────────────────────────────
export function getCompareIds(): string[]             { return safeGet<string[]>(COMPARE_KEY, []); }
export function saveCompareIds(ids: string[]): void   { safeSet(COMPARE_KEY, ids); }

export function toggleCompareItem(id: string): { ids: string[]; error?: string } {
  const ids = getCompareIds();
  if (ids.includes(id)) {
    const updated = ids.filter((i) => i !== id);
    saveCompareIds(updated);
    return { ids: updated };
  }
  if (ids.length >= 3) return { ids, error: 'Bạn chỉ có thể so sánh tối đa 3 sản phẩm.' };
  const updated = [...ids, id];
  saveCompareIds(updated);
  return { ids: updated };
}

// ─── Combos ───────────────────────────────────────────────────────────────────
const COMBOS_KEY = 'livlab_combos';
import { ComboPackage } from './types';

export function getStoredCombos(): ComboPackage[] | null {
  return safeGet<ComboPackage[] | null>(COMBOS_KEY, null);
}
export function saveStoredCombos(combos: ComboPackage[]): void { safeSet(COMBOS_KEY, combos); }

// ─── Sources ──────────────────────────────────────────────────────────────────
const SOURCES_KEY = 'livlab_sources';

export function getStoredSources(): any[] | null {
  return safeGet<any[] | null>(SOURCES_KEY, null);
}
export function saveStoredSources(sources: any[]): void { safeSet(SOURCES_KEY, sources); }

// ─── Seeding ──────────────────────────────────────────────────────────────────
import { seededProducts, seededConcepts, seededCombos } from './seedData';

export function seedRichProductCatalogIfNeeded(force = false): void {
  if (typeof window === 'undefined') return;
  const currentProds = getStoredProducts();
  if (force || !currentProds || currentProds.length < 30) {
    saveStoredProducts(seededProducts);
    saveStoredConcepts(seededConcepts);
    saveStoredCombos(seededCombos);
    console.log('Seeded rich catalogue successfully!');
  }
}
