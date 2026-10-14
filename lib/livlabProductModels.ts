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

/**
 * Which categories have a representative stand-in model. All false, and that
 * is now a rule rather than a coincidence.
 *
 * `lavabo` was true, which meant every product the classifier read as a basin
 * — any brand, any shape, any price — was placed in the customer's room as one
 * particular 17MB `lavabo.glb`. The customer chose a TOTO console basin and
 * the room showed something else, under the name of the thing they chose.
 *
 * A 2D placeholder says "no photograph yet" and is honest. A 3D stand-in says
 * "this is your product" and is not, because the whole reason to put a model
 * in a room is to see that product in that room. There is no middle setting,
 * so the category path stays closed and a product gets a model only from
 * `product3dRegistry`, keyed by its own identity.
 */
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
  const modelUrl = productModelMap[category];
  const available = availableProductModels[category];
  
  if (process.env.NODE_ENV !== 'production') {
    console.log("[3D Model]", {
      productName: product.name,
      category,
      modelUrl,
      available
    });
  }

  if (!available) {
    return null;
  }
  return modelUrl;
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
