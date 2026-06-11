import { Product, Concept } from './types';

export interface VSPreferences {
  area: string;
  budget: string;
  styles: string[];
  needs: string[];
}

export interface StudioLayer {
  id: string;
  productId: string;
  category: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // px base width
  height?: number; // px base height
  scale: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  processedImage?: string;
  bgRemoved?: boolean;
  bgRemovalFailed?: boolean;
  bgRemovalVersion?: string;
  safeBlend?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export type SelectedByZone = {
  mirror?: Product | null;
  faucet?: Product | null;
  lavabo?: Product | null;
  toilet?: Product | null;
  shower?: Product | null;
  accessory?: Product | null;
  vanity?: Product | null;
  tile?: Product | null;
  lighting?: Product | null;
  [key: string]: Product | null | undefined;
};

export const normalizeCategory = (cat: string) => {
  if (!cat) return 'accessory';
  const l = cat.toLowerCase();
  if (l.includes('tủ lavabo') || l.includes('vanity') || l.includes('cabinet') || l.includes('tủ chậu')) return 'vanity';
  if (l.includes('vòi lavabo') || l.includes('vòi rửa') || l.includes('faucet') || l.includes('vòi')) return 'faucet';
  if (l.includes('lavabo') || l.includes('chậu rửa') || l.includes('chậu')) return 'lavabo';
  if (l.includes('gương') || l.includes('mirror')) return 'mirror';
  if (l.includes('bồn cầu') || l.includes('toilet') || l.includes('bồn vệ sinh')) return 'toilet';
  if (l.includes('sen tắm') || l.includes('sen cây') || l.includes('shower')) return 'shower';
  if (l.includes('gạch') || l.includes('tile')) return 'tile';
  if (l.includes('đèn') || l.includes('lighting')) return 'lighting';
  return 'accessory';
};

export const pickProductByNormalizedCategory = (
  products: Product[],
  normalizedCategory: string,
  options: {
    preferBudget?: 'low' | 'mid' | 'premium';
    excludeIds?: Set<string>;
    preferImage?: boolean;
    styles?: string[];
  } = {}
): Product | null => {
  let filtered = products.filter(p => normalizeCategory(p.category) === normalizedCategory);
  
  if (options.excludeIds) {
    filtered = filtered.filter(p => !options.excludeIds!.has(p.id));
  }

  // Filter unavailable products out if needed (In Stock or Made to Order usually fine, skip 'Discontinued' if any)
  filtered = filtered.filter(p => p.availability !== 'Discontinued');

  // Sort by image presence
  if (options.preferImage !== false) {
    filtered.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
  }

  // Optional: bump style matches
  if (options.styles && options.styles.length > 0) {
    filtered.sort((a, b) => {
      const aMatch = options.styles!.some(s => a.style?.includes(s) || a.suitableFor?.includes(s));
      const bMatch = options.styles!.some(s => b.style?.includes(s) || b.suitableFor?.includes(s));
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
  }

  if (filtered.length === 0) return null;

  if (options.preferBudget) {
    filtered.sort((a, b) => {
      if (options.preferBudget === 'low') return a.priceMin - b.priceMin;
      if (options.preferBudget === 'premium') return b.priceMin - a.priceMin;
      return 0; // mid handled via selection below
    });
    if (options.preferBudget === 'mid') {
      return filtered[Math.floor(filtered.length / 2)];
    }
  }

  return filtered[0];
};

export const getVisualStudioSuggestions = (
  products: Product[],
  concepts: Concept[],
  preferences: VSPreferences
) => {
  let budgetTarget: 'low' | 'mid' | 'premium' = 'mid';
  if (preferences.budget.includes('Dưới 30')) budgetTarget = 'low';
  if (preferences.budget.includes('Trên 60')) budgetTarget = 'premium';

  const excludeIds = new Set<string>();
  const recommendedProducts: Product[] = [];

  const addProduct = (cat: string, forceBudget?: 'low' | 'mid' | 'premium') => {
    const p = pickProductByNormalizedCategory(products, cat, {
      preferBudget: forceBudget || budgetTarget,
      excludeIds,
      styles: preferences.styles,
      preferImage: true
    });
    if (p) {
      recommendedProducts.push(p);
      excludeIds.add(p.id);
    }
  };

  // Diverse categories
  addProduct('lavabo');
  addProduct('faucet');
  addProduct('mirror');
  addProduct('toilet');
  addProduct('shower');
  addProduct('accessory');
  if (preferences.area.includes('6-10') || preferences.area.includes('Trên 10')) {
    addProduct('vanity');
    addProduct('tile');
  }

  // Calculate estimated total
  let estimatedMin = 0;
  let estimatedMax = 0;
  recommendedProducts.forEach(p => {
    estimatedMin += p.priceMin || 0;
    estimatedMax += p.priceMax || p.priceMin || 0;
  });

  return {
    recommendedProducts,
    estimatedMin,
    estimatedMax
  };
};

export const getDefaultPosition = (cat: string, zoneId?: string) => {
  const baseScale = typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1.0;

  let width = 200; // default
  let height = 180;

  if (cat === 'faucet') { width = 160; height = 160; }
  else if (cat === 'lavabo') { width = 220; height = 190; }
  else if (cat === 'toilet') { width = 210; height = 220; }
  else if (cat === 'shower') { width = 190; height = 230; }
  else if (cat === 'mirror') { width = 200; height = 200; }

  width = width * baseScale;
  height = height * baseScale;

  switch (cat) {
    case 'mirror': return { x: 50, y: 30, width, height, scale: 1.0 };
    case 'faucet': return { x: 50, y: 55, width, height, scale: 1.0 };
    case 'lavabo': return { x: 50, y: 65, width, height, scale: 1.0 };
    case 'toilet': return { x: 30, y: 70, width, height, scale: 1.0 };
    case 'shower': return { x: 70, y: 40, width, height, scale: 1.0 };
    default: return { x: 50, y: 50, width, height, scale: 1.0 };
  }
};

export const getStudioImage = (product: Product): string | undefined => {
  return (product as any).studioImage || (product as any).cutoutImage || (product as any).transparentImage || product.image;
};
