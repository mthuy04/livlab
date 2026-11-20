'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Product, QuoteItem } from '@/lib/types';
import { useTenant } from '@/components/storefront/TenantContext';
import { quoteLineKey,reconcileRoomQuote } from '../room-studio/roomQuote';
import type { RoomStudioProduct } from '../room-studio/productAdapter';
import { saveQuoteItems,getQuoteItems, addQuoteItem, removeQuoteItem, clearQuoteItems, updateQuoteItemQty, calculateQuoteTotalRange } from '@/lib/storage';

interface QuoteContextValue {
  items: QuoteItem[];
  count: number;
  isDrawerOpen: boolean;
  syncRoom: (designId:string,products:RoomStudioProduct[])=>void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (product: Product, conceptId?: string) => void;
  addCatalogItem: (entry: CatalogQuoteEntry) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  increase: (productId: string) => void;
  decrease: (productId: string) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  setItems: (items: QuoteItem[]) => void;
  totalMin: number;
  totalMax: number;
}

/**
 * What the storefront catalogue hands the basket.
 *
 * The legacy `addItem` takes a `Product`, which is the shape of a Prisma row
 * plus the fields the old localStorage catalogue carried. A storefront
 * catalogue product is not that shape and must not be bent into one — the
 * detail page would have to invent `priceMin`, `availability` and a showroom
 * name to satisfy it. So the basket gains a second door onto the same flow
 * rather than a second flow.
 */
export interface CatalogQuoteEntry {
  catalogProductId: string;
  productId: string;
  sourceType: 'DATABASE' | 'DEMO_FIXTURE';
  tenantId: string;
  name: string;
  brand: string;
  category: string;
  sku: string | null;
  image: string | null;
  showroomPrice: number | null;
  referencePrice: number | null;
  sourceContext: string;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const {id}=useTenant();
  return <TenantBasket key={id} tenant={id}>{children}</TenantBasket>;
}
function TenantBasket({tenant,children}:{tenant:string;children:ReactNode}) {
  const [items, setItemsState] = useState<QuoteItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = () => { if (mounted) setItemsState(getQuoteItems(tenant)); };
    queueMicrotask(refresh);
    window.addEventListener('storage', refresh);
    return () => {
      mounted = false;
      window.removeEventListener('storage', refresh);
    };
  }, [tenant]);

  const syncRoom=useCallback((designId:string,products:RoomStudioProduct[])=>{
    const before=getQuoteItems(tenant);
    const next=reconcileRoomQuote(before,tenant,designId,products,new Date().toISOString());
    if(next!==before){saveQuoteItems(next,tenant);setItemsState(next);}
  },[tenant]);

  const addItem = useCallback((product: Product, conceptId?: string) => {
    const quoteItem: QuoteItem = {
      productId: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      sku: product.sku,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      priceRange: product.priceRange,
      quantity: 1,
      image: product.image,
      material: product.material,
      finish: product.finish,
      showroomName: product.showroomName,
      showroomLocation: product.showroomLocation,
      showroomContact: product.showroomContact,
      conceptId,
      addedAt: new Date().toISOString()
    };
    console.log(`[Quote] Adding item: ${product.name}`);
    const updated = addQuoteItem(quoteItem,tenant);
    setItemsState(updated);
    setIsDrawerOpen(true);
  }, [tenant]);

  /**
   * Adds a storefront catalogue product.
   *
   * Price travels as a snapshot of what the showroom was asking, not as a
   * range: the catalogue holds one asking price and one reference price, and
   * widening that into a min/max would invent a spread nobody quoted. The
   * showroom is left to the server, which resolves it from the tenant — a
   * client-supplied showroom name is not evidence of who owns the lead.
   */
  const addCatalogItem = useCallback((entry: CatalogQuoteEntry) => {
    if (entry.tenantId !== tenant) return;
    const price = entry.showroomPrice ?? 0;
    const quoteItem: QuoteItem = {
      productId: entry.productId,
      catalogProductId: entry.catalogProductId,
      sourceType: entry.sourceType,
      tenantId: entry.tenantId,
      sourceContext: entry.sourceContext,
      priceSnapshot: entry.showroomPrice,
      name: entry.name,
      category: entry.category,
      brand: entry.brand,
      sku: entry.sku ?? entry.productId,
      priceMin: price,
      priceMax: entry.referencePrice ?? price,
      priceRange: entry.showroomPrice ? `${entry.showroomPrice.toLocaleString('vi-VN')}đ` : 'Liên hệ',
      quantity: 1,
      image: entry.image,
      // Resolved server-side from the tenant; the client does not assert it.
      showroomName: '',
      showroomLocation: '',
      addedAt: new Date().toISOString(),
    };
    const updated = addQuoteItem(quoteItem,tenant);
    setItemsState(updated);
    setIsDrawerOpen(true);
  }, [tenant]);

  const removeItem = useCallback((productId: string) => {
    const updated = removeQuoteItem(productId,tenant);
    setItemsState(updated);
  }, [tenant]);

  const updateQty = useCallback((productId: string, qty: number) => {
    const updated = updateQuoteItemQty(productId, qty,tenant);
    setItemsState(updated);
  }, [tenant]);

  const increase = useCallback((productId: string) => {
    setItemsState(prev => {
      const item = prev.find(i => quoteLineKey(i) === productId);
      if (!item) return prev;
      return updateQuoteItemQty(productId, item.quantity + 1,tenant);
    });
  }, [tenant]);

  const decrease = useCallback((productId: string) => {
    setItemsState(prev => {
      const item = prev.find(i => quoteLineKey(i) === productId);
      if (!item) return prev;
      return updateQuoteItemQty(productId, item.quantity - 1,tenant);
    });
  }, [tenant]);

  const clearAll = useCallback(() => {
    clearQuoteItems(tenant);
    setItemsState([]);
  }, [tenant]);

  const hasItem = useCallback((productId: string) => {
    return items.some((i) => i.productId === productId);
  }, [items]);

  const setItems = useCallback((newItems: QuoteItem[]) => {
    setItemsState(newItems);
  }, []);

  const openDrawer   = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer  = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((p) => !p), []);

  const { min: totalMin, max: totalMax } = useMemo(() => calculateQuoteTotalRange(items), [items]);

  return (
    <QuoteContext.Provider value={{
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer,
      addItem, addCatalogItem, syncRoom, removeItem, updateQty, increase, decrease, clearAll, hasItem, setItems,
      totalMin, totalMax
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote must be used within QuoteProvider');
  return ctx;
}
