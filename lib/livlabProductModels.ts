import { Product } from './types';

export type Product3DCategory = 'faucet' | 'lavabo' | 'toilet' | 'shower' | 'mirror' | 'unknown';

export const normalizeProduct3DCategory = (product: Product): Product3DCategory => {
  const searchStr = `${product.id} ${product.slug} ${product.name} ${product.category}`.toLowerCase();

  // 1. Faucet
  if (
    searchStr.includes('fau') ||
    searchStr.includes('faucet') ||
    searchStr.includes('vòi') ||
    searchStr.includes('voi') ||
    searchStr.includes('mixer') ||
    searchStr.includes('tap')
  ) {
    return 'faucet';
  }

  // 2. Lavabo
  if (
    searchStr.includes('lavabo') ||
    searchStr.includes('chậu') ||
    searchStr.includes('chau') ||
    searchStr.includes('basin') ||
    searchStr.includes('sink') ||
    searchStr.includes('wash basin')
  ) {
    return 'lavabo';
  }

  // 3. Toilet
  if (
    searchStr.includes('bồn cầu') ||
    searchStr.includes('bon cau') ||
    searchStr.includes('toilet') ||
    searchStr.includes('wc') ||
    searchStr.includes('closet')
  ) {
    return 'toilet';
  }

  // 4. Shower
  if (
    searchStr.includes('sen') ||
    searchStr.includes('shower') ||
    searchStr.includes('shower set') ||
    searchStr.includes('hand shower') ||
    searchStr.includes('rain shower')
  ) {
    return 'shower';
  }

  // 5. Mirror
  if (
    searchStr.includes('gương') ||
    searchStr.includes('guong') ||
    searchStr.includes('mirror')
  ) {
    return 'mirror';
  }

  return 'unknown';
};

export const availableProductModels: Record<Product3DCategory, boolean> = {
  faucet: false,
  lavabo: false,
  toilet: false,
  shower: false,
  mirror: false,
  unknown: false,
};

export const productModelMap: Record<Product3DCategory, string | null> = {
  faucet: '/models/bathroom/faucet.glb',
  lavabo: '/models/bathroom/lavabo.glb',
  toilet: '/models/bathroom/toilet.glb',
  shower: '/models/bathroom/shower.glb',
  mirror: '/models/bathroom/mirror.glb',
  unknown: null,
};

export const getProductModel = (product: Product): string | null => {
  const category = normalizeProduct3DCategory(product);
  if (!availableProductModels[category]) {
    return null;
  }
  return productModelMap[category];
};

export const getProduct3DLabel = (product: Product): string => {
  const category = normalizeProduct3DCategory(product);
  switch (category) {
    case 'faucet': return 'Vòi lavabo';
    case 'lavabo': return 'Chậu lavabo';
    case 'toilet': return 'Bồn cầu';
    case 'shower': return 'Sen tắm';
    case 'mirror': return 'Gương';
    default: return 'Sản phẩm';
  }
};
