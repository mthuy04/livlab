import { Product } from './types';

export function generateSlug(name: string, sku: string): string {
  const base = `${name} ${sku}`.toLowerCase();
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function getProductSlug(product: Product): string {
  if (product.slug) return product.slug;
  return generateSlug(product.name, product.sku);
}

export function isLikelyInvalidImage(url?: string | null): boolean {
  if (!url) return true;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl === 'placeholder' || lowerUrl === '') return true;
  // Also filter out standard placeholder strings if they were added
  if (lowerUrl.includes('placeholder-sanitary')) return true;
  return false;
}

export function getValidProductImages(product: Product): string[] {
  const images: string[] = [];
  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      if (!isLikelyInvalidImage(img)) images.push(img);
    });
  } else if (product.image && !isLikelyInvalidImage(product.image)) {
    images.push(product.image);
  }
  return images;
}

