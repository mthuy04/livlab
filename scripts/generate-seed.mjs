import fs from 'fs';
import path from 'path';

// --- DATA LISTS ---
const brands = [
  'TOTO', 'INAX', 'Caesar', 'Viglacera', 'COTTO', 'Kohler', 
  'Grohe', 'Hafele', 'Malloca', 'Rang Dong', 'Dien Quang', 
  'Euroking', 'American Standard', 'Local Showroom'
];

const showrooms = [
  { name: 'LivLab Partner Showroom', loc: 'Mỹ Đình, Hà Nội', contact: '024 1111 2222' },
  { name: 'TDM Tuấn Đức', loc: 'Cầu Giấy, Hà Nội', contact: '024 3333 4444' },
  { name: 'HITA Home', loc: 'TP. Hồ Chí Minh', contact: '028 5555 6666' },
  { name: 'Hải Linh Showroom', loc: 'Hà Đông, Hà Nội', contact: '024 7777 8888' },
  { name: 'HomeBath Studio', loc: 'Đống Đa, Hà Nội', contact: '024 9999 0000' },
  { name: 'Modern Bath Gallery', loc: 'Nam Từ Liêm, Hà Nội', contact: '024 2222 3333' },
  { name: 'Interior Material Hub', loc: 'Long Biên, Hà Nội', contact: '024 4444 5555' }
];

const styles = ['Japandi', 'Modern', 'Minimal', 'Hotel', 'Warm Neutral', 'Industrial'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[getRandomInt(0, arr.length - 1)];
}

function formatPrice(num) {
  return num.toLocaleString('vi-VN') + 'đ';
}

function getBrand(category) {
  if (category === 'Lighting') return getRandomItem(['Rang Dong', 'Dien Quang', 'Hafele', 'Local Showroom']);
  if (category === 'Cabinet') return getRandomItem(['Local Showroom', 'Hafele', 'Kohler']);
  if (category === 'Tiles') return getRandomItem(['Viglacera', 'Local Showroom', 'INAX']);
  return getRandomItem(['TOTO', 'INAX', 'Caesar', 'Viglacera', 'COTTO', 'Kohler', 'Grohe', 'American Standard', 'Euroking']);
}

// Category Configs
const cats = [
  { cat: 'Basin', count: 15, baseName: 'Lavabo', pMin: 500000, pMax: 40000000 },
  { cat: 'Faucet', count: 15, baseName: 'Vòi lavabo', pMin: 600000, pMax: 20000000 },
  { cat: 'Mirror', count: 10, baseName: 'Gương LED', pMin: 600000, pMax: 12000000 },
  { cat: 'Shower', count: 15, baseName: 'Sen tắm', pMin: 1000000, pMax: 35000000 },
  { cat: 'Toilet', count: 15, baseName: 'Bồn cầu', pMin: 2000000, pMax: 60000000 },
  { cat: 'Tiles', count: 10, baseName: 'Gạch ốp lát', pMin: 180000, pMax: 1500000 },
  { cat: 'Cabinet', count: 10, baseName: 'Tủ lavabo', pMin: 2000000, pMax: 30000000 },
  { cat: 'Lighting', count: 8, baseName: 'Đèn phòng tắm', pMin: 250000, pMax: 8000000 },
  { cat: 'Accessories', count: 10, baseName: 'Phụ kiện', pMin: 100000, pMax: 6000000 },
  { cat: 'Accessories', count: 7, baseName: 'Bộ phụ kiện', pMin: 1000000, pMax: 5000000 }, // combo accessory set
];

const products = [];
let pIdCounter = 1;

cats.forEach(c => {
  for (let i = 0; i < c.count; i++) {
    const brand = getBrand(c.cat);
    const sku = `${brand.substring(0, 3).toUpperCase()}-${c.cat.substring(0, 3).toUpperCase()}-${getRandomInt(100, 999)}`;
    
    // Generate realistic price
    let pMin = getRandomInt(c.pMin / 1000, (c.pMin * 2) / 1000) * 1000;
    let pMax = getRandomInt(pMin / 1000, c.pMax / 1000) * 1000;
    if (pMax < pMin) pMax = pMin + 500000;
    
    // For tiles, price is per m2
    let priceRange = `${formatPrice(pMin)} – ${formatPrice(pMax)}`;
    if (c.cat === 'Tiles') priceRange += '/m²';

    const sr = getRandomItem(showrooms);
    const style = getRandomItem(styles);

    products.push({
      id: `p-${pIdCounter.toString().padStart(3, '0')}`,
      name: `${c.baseName} ${brand} ${style} ${sku}`,
      category: c.cat,
      brand: brand,
      sku: sku,
      priceMin: pMin,
      priceMax: pMax,
      priceRange: priceRange,
      material: c.cat === 'Cabinet' ? 'Gỗ công nghiệp' : (c.cat === 'Tiles' ? 'Ceramic/Porcelain' : 'Sứ/Inox/Nhựa'),
      finish: 'Bóng / Mờ',
      size: 'Tiêu chuẩn',
      image: '/images/products/placeholder-sanitary.png',
      availability: getRandomItem(['In Stock', 'Made to Order', 'Limited Stock']),
      status: getRandomItem(['Còn hàng', 'Còn hàng', 'Còn hàng', 'Đặt trước']),
      recommendedFor: ['Phòng tắm căn hộ', 'Phòng tắm nhà phố'],
      description: `Mẫu ${c.baseName.toLowerCase()} chất lượng cao từ ${brand}. Giá và mã sản phẩm cần được xác minh với showroom trước khi báo giá.`,
      style: style,
      popularity: getRandomInt(50, 100),
      showroomName: sr.name,
      showroomLocation: sr.loc,
      showroomContact: sr.contact,
      sellerType: 'Dữ liệu mẫu',
      sourceUrl: '',
      priceSource: 'Giá tham khảo cần xác minh',
      isVerifiedSource: false,
      sourceNote: 'Dữ liệu mẫu phục vụ demo, chưa xác minh từ website hãng.'
    });
    pIdCounter++;
  }
});

function getProductsByCat(cat) {
  return products.filter(p => p.category === cat);
}

// Ensure we have some products for concepts
const concepts = [
  { id: 'c-001', slug: 'phong-tam-can-ho-nho', title: 'Phòng tắm căn hộ nhỏ', roomType: 'Bathroom', style: 'Minimal', budgetRange: 'Under 30M', areaSize: '3-4 m²' },
  { id: 'c-002', slug: 'phong-tam-japandi', title: 'Phòng tắm Japandi cho căn hộ', roomType: 'Bathroom', style: 'Japandi', budgetRange: '30M–60M', areaSize: '5-7 m²' },
  { id: 'c-003', slug: 'phong-tam-khach-san', title: 'Phòng tắm phong cách khách sạn', roomType: 'Bathroom', style: 'Hotel', budgetRange: '60M+', areaSize: '8-12 m²' },
  { id: 'c-004', slug: 'phong-tam-tiet-kiem', title: 'Phòng tắm tiết kiệm cho nhà cho thuê', roomType: 'Bathroom', style: 'Minimal', budgetRange: 'Under 30M', areaSize: '3-5 m²' },
  { id: 'c-005', slug: 'phong-tam-premium-master', title: 'Phòng tắm premium master', roomType: 'Bathroom', style: 'Modern', budgetRange: '60M+', areaSize: '12-15 m²' },
  { id: 'c-006', slug: 'phong-tam-toi-gian-trang', title: 'Phòng tắm tối giản trắng sáng', roomType: 'Bathroom', style: 'Minimal', budgetRange: '30M–60M', areaSize: '5-8 m²' },
  { id: 'c-007', slug: 'phong-khach-toi-gian-am', title: 'Phòng khách tối giản ấm', roomType: 'Living Room', style: 'Warm Neutral', budgetRange: '30M–60M', areaSize: '20-28 m²' },
  { id: 'c-008', slug: 'goc-bep-can-ho', title: 'Góc bếp căn hộ', roomType: 'Kitchen', style: 'Modern', budgetRange: 'Under 30M', areaSize: '6-9 m²' },
  { id: 'c-009', slug: 'studio-cho-thue', title: 'Studio cho thuê', roomType: 'Studio', style: 'Minimal', budgetRange: 'Under 30M', areaSize: '25-35 m²' }
];

const seededConcepts = concepts.map(c => {
  let catList = ['Basin', 'Faucet', 'Toilet', 'Shower', 'Mirror', 'Tiles'];
  if (c.roomType !== 'Bathroom') catList = ['Lighting', 'Accessories', 'Cabinet', 'Tiles'];

  const selectedProds = catList.map(cat => getRandomItem(getProductsByCat(cat))).filter(Boolean);
  
  const hotspots = selectedProds.map((sp, idx) => ({
    id: `h-${c.id}-${idx}`,
    productId: sp.id,
    x: getRandomInt(20, 80),
    y: getRandomInt(20, 80),
    label: sp.category
  }));

  return {
    ...c,
    description: `Mô tả ngắn gọn cho concept ${c.title}.`,
    longDescription: `Đây là concept ${c.title} được tạo sẵn bằng dữ liệu mẫu. Chi tiết thực tế cần được kiểm chứng.`,
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85',
    products: selectedProds.map(p => p.id),
    hotspots: hotspots,
    whyItWorks: ['Phù hợp không gian', 'Tối ưu chi phí', 'Thẩm mỹ cao'],
    productCount: selectedProds.length
  };
});

const combosList = [
  { slug: 'tiet-kiem-duoi-30-trieu', title: 'Tiết kiệm dưới 30 triệu', style: 'Minimal', budget: 'Under 30M' },
  { slug: 'can-bang-30-60-trieu', title: 'Cân bằng 30–60 triệu', style: 'Modern', budget: '30M–60M' },
  { slug: 'cao-cap-tren-60-trieu', title: 'Cao cấp trên 60 triệu', style: 'Hotel', budget: '60M+' },
  { slug: 'japandi-basic', title: 'Japandi Basic', style: 'Japandi', budget: 'Under 30M' },
  { slug: 'japandi-comfort', title: 'Japandi Comfort', style: 'Japandi', budget: '30M–60M' },
  { slug: 'japandi-premium', title: 'Japandi Premium', style: 'Japandi', budget: '60M+' },
  { slug: 'rental-essential', title: 'Rental Essential', style: 'Minimal', budget: 'Under 30M' },
  { slug: 'homestay-standard', title: 'Homestay Standard', style: 'Modern', budget: '30M–60M' },
  { slug: 'homestay-premium', title: 'Homestay Premium', style: 'Hotel', budget: '60M+' }
];

let cbId = 1;
const seededCombos = combosList.map(cb => {
  const catList = ['Basin', 'Faucet', 'Toilet', 'Shower', 'Mirror', 'Cabinet', 'Lighting'];
  const selectedProds = catList.map(cat => getRandomItem(getProductsByCat(cat))).filter(Boolean);
  
  let pMinTotal = 0;
  let pMaxTotal = 0;
  selectedProds.forEach(p => { pMinTotal += p.priceMin; pMaxTotal += p.priceMax; });

  return {
    id: `cb-${cbId++}`,
    slug: cb.slug,
    title: cb.title,
    roomType: 'Bathroom',
    style: cb.style,
    budgetRange: cb.budget,
    priceMin: pMinTotal,
    priceMax: pMaxTotal,
    description: `Gói combo ${cb.title} phù hợp với ngân sách dự kiến.`,
    includedCategories: catList,
    productIds: selectedProds.map(p => p.id),
    suitableFor: ['Căn hộ', 'Nhà phố'],
    image: '/images/products/placeholder-sanitary.png',
    sourceNote: 'Dữ liệu combo mẫu phục vụ demo.'
  };
});

const tsContent = `import { Product, Concept, ComboPackage } from './types';

export const seededProducts: Product[] = ${JSON.stringify(products, null, 2)};

export const seededConcepts: Concept[] = ${JSON.stringify(seededConcepts, null, 2)};

export const seededCombos: ComboPackage[] = ${JSON.stringify(seededCombos, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'lib/seedData.ts'), tsContent);
console.log('Seed data generated successfully!');
