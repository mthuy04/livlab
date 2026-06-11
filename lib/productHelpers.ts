import { Product, ProductReview } from './types';

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

export function getRelatedProducts(product: Product, allProducts: Product[]): Product[] {
  let relatedCategories: string[] = [];
  const cat = product.category.toLowerCase();

  switch (cat) {
    case 'basin':
    case 'lavabo':
      relatedCategories = ['faucet', 'mirror', 'cabinet', 'tiles'];
      break;
    case 'faucet':
      relatedCategories = ['basin', 'mirror', 'cabinet', 'accessories'];
      break;
    case 'toilet':
      relatedCategories = ['shower', 'tiles', 'accessories'];
      break;
    case 'shower':
      relatedCategories = ['tiles', 'mirror', 'accessories'];
      break;
    case 'mirror':
      relatedCategories = ['basin', 'faucet', 'lighting'];
      break;
    case 'cabinet':
      relatedCategories = ['basin', 'faucet', 'mirror'];
      break;
    case 'tiles':
      relatedCategories = ['basin', 'toilet', 'shower'];
      break;
    default:
      relatedCategories = ['accessories', 'lighting'];
  }

  const related = allProducts.filter((p) => {
    if (p.id === product.id) return false;
    const pCat = p.category.toLowerCase();
    return relatedCategories.includes(pCat);
  });

  return related.slice(0, 4);
}

export function getSimilarProducts(product: Product, allProducts: Product[]): Product[] {
  const similar = allProducts.filter((p) => {
    return p.id !== product.id && p.category.toLowerCase() === product.category.toLowerCase();
  });
  return similar.slice(0, 4);
}

export function generateMockReviews(product: Product): ProductReview[] {
  if (product.reviews && product.reviews.length > 0) {
    return product.reviews;
  }

  return [
    {
      id: `rev-1-${product.id}`,
      reviewerName: 'Minh Tuấn',
      rating: 5,
      reviewText: 'Thông tin sản phẩm chi tiết, đầy đủ. Hỗ trợ rất tốt trong việc lên dự toán.',
      useCase: 'Căn hộ 45m²',
      date: '12/05/2026',
    },
    {
      id: `rev-2-${product.id}`,
      reviewerName: 'Hương Giang',
      rating: 4,
      reviewText: 'Mức giá tham khảo rõ ràng giúp tôi dễ dàng so sánh trước khi gửi yêu cầu.',
      useCase: 'Phòng tắm nhà phố',
      date: '28/04/2026',
    },
    {
      id: `rev-3-${product.id}`,
      reviewerName: 'Thành Đạt',
      rating: 5,
      reviewText: 'Tính năng gợi ý phối cùng rất hữu ích, giúp tôi dễ chọn đồng bộ sản phẩm.',
      useCase: 'Homestay',
      date: '15/04/2026',
    },
  ];
}

export function getProductVisualCategory(product: Product): string {
  const pId = product.id.toLowerCase();
  const pSlug = product.slug ? product.slug.toLowerCase() : '';
  const pName = product.name.toLowerCase();
  const pCat = product.category.toLowerCase();

  if (pId.startsWith('fau') || pId.includes('-fau-') || pSlug.startsWith('fau') || pSlug.includes('-fau-') || pName.includes('vòi') || pName.includes('faucet') || pName.includes('mixer') || pCat.includes('vòi') || pCat.includes('faucet')) {
    return 'faucet';
  }

  if ((pName.includes('chậu') || pName.includes('lavabo') || pName.includes('basin') || pName.includes('sink') || pCat.includes('chậu') || pCat.includes('lavabo') || pCat.includes('basin') || pCat.includes('sink')) && !pName.includes('vòi') && !pCat.includes('vòi')) {
    return 'lavabo';
  }

  if (pName.includes('gương') || pName.includes('mirror') || pCat.includes('gương') || pCat.includes('mirror')) {
    return 'mirror';
  }

  if (pName.includes('bồn cầu') || pName.includes('toilet') || pName.includes('wc') || pCat.includes('bồn cầu') || pCat.includes('toilet') || pCat.includes('wc')) {
    return 'toilet';
  }

  if (pName.includes('sen') || pName.includes('shower') || pCat.includes('sen') || pCat.includes('shower')) {
    return 'shower';
  }

  if (pName.includes('gạch') || pName.includes('tile') || pName.includes('material') || pCat.includes('gạch') || pCat.includes('tile') || pCat.includes('material')) {
    return 'tile';
  }

  return pCat;
}
