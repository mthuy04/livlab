'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Product, QuoteItem } from '@/lib/types';
import { getQuoteItems, addQuoteItem, removeQuoteItem, clearQuoteItems, updateQuoteItemQty, calculateQuoteTotalRange } from '@/lib/storage';

interface QuoteContextValue {
  items: QuoteItem[];
  count: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (product: Product, conceptId?: string) => void;
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

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<QuoteItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setItemsState(getQuoteItems());
  }, []);

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
    const updated = addQuoteItem(quoteItem);
    setItemsState(updated);
    setIsDrawerOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const updated = removeQuoteItem(productId);
    setItemsState(updated);
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    const updated = updateQuoteItemQty(productId, qty);
    setItemsState(updated);
  }, []);

  const increase = useCallback((productId: string) => {
    setItemsState(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;
      return updateQuoteItemQty(productId, item.quantity + 1);
    });
  }, []);

  const decrease = useCallback((productId: string) => {
    setItemsState(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;
      return updateQuoteItemQty(productId, item.quantity - 1);
    });
  }, []);

  const clearAll = useCallback(() => {
    clearQuoteItems();
    setItemsState([]);
  }, []);

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
      addItem, removeItem, updateQty, increase, decrease, clearAll, hasItem, setItems,
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
