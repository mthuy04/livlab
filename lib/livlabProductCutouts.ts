export const productCutoutMap: Record<string, string> = {
};

export function getProductCutout(productId?: string | null) {
  if (!productId) return null;
  return productCutoutMap[productId] || null;
}
