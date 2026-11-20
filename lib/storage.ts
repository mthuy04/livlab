

import { quoteLineKey } from './room-studio/roomQuote';
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
const basketKey = (tenant: string) => tenant === 'livlab' ? QUOTE_KEY : QUOTE_KEY + ':' + tenant;
export function getQuoteItems(tenant = 'livlab'): QuoteItem[] {
  const legacy = safeGet<QuoteItem[]>(QUOTE_KEY, []);
  if (tenant === 'livlab') return legacy.filter(i => !i.tenantId || i.tenantId === tenant);
  return safeGet<QuoteItem[]>(basketKey(tenant), legacy.filter(i => i.tenantId === tenant));
}
export function saveQuoteItems(items: QuoteItem[], tenant = 'livlab'): void {
  const legacyForeign = tenant === 'livlab' ? safeGet<QuoteItem[]>(QUOTE_KEY, []).filter(i => i.tenantId && i.tenantId !== tenant) : [];
  safeSet(basketKey(tenant), [...items,...legacyForeign]);
}

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

export function addQuoteItem(item: QuoteItem, tenant = 'livlab'): QuoteItem[] {
  const items = getQuoteItems(tenant);
  const existing = items.find((i) => quoteLineKey(i) === quoteLineKey(item));
  if (existing) {
    const updated = items.map((i) => quoteLineKey(i) === quoteLineKey(item) ? { ...i, quantity: i.quantity + 1 } : i);
    saveQuoteItems(updated,tenant);
    return updated;
  }
  const updated = [...items, item];
  saveQuoteItems(updated,tenant);
  return updated;
}

export function removeQuoteItem(productId: string, tenant = 'livlab'): QuoteItem[] {
  const items = getQuoteItems(tenant).filter((i) => quoteLineKey(i) !== productId);
  saveQuoteItems(items,tenant);
  return items;
}

export function updateQuoteItemQty(productId: string, quantity: number, tenant = 'livlab'): QuoteItem[] {
  if (quantity < 1) return removeQuoteItem(productId,tenant);
  const items = getQuoteItems(tenant).map((i) => quoteLineKey(i) === productId ? { ...i, quantity } : i);
  saveQuoteItems(items,tenant);
  return items;
}

export function clearQuoteItems(tenant = 'livlab'): void {
  saveQuoteItems([],tenant);
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
    const normalized = { ...lead };
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

export function getStoredSources(): Record<string, string>[] | null {
  return safeGet<Record<string, string>[] | null>(SOURCES_KEY, null);
}
export function saveStoredSources(sources: Record<string, string>[]): void { safeSet(SOURCES_KEY, sources); }

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

// ─── Server sync ──────────────────────────────────────────────────────────────
export async function syncProductCatalogFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`Unexpected response: ${res.status}`);
    const data = await res.json();
    if (data.isEmpty) {
      seedRichProductCatalogIfNeeded();
    } else if (data.products) {
      saveStoredProducts(data.products);
    }
  } catch (error) {
    console.error('Failed to sync product catalog from server, falling back to demo data:', error);
    seedRichProductCatalogIfNeeded();
  }
}
