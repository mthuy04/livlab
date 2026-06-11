const fs = require('fs');

const lavabos = [
  { name: 'Chậu Rửa Đặt Bàn Hình Oval Minimal', brand: 'Inax', sku: 'INAX-AL-299V', price: 2200000, img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', style: 'Minimal' },
  { name: 'Chậu Rửa Âm Bàn Tròn Bán Điển', brand: 'TOTO', sku: 'TOTO-LW1536V', price: 1850000, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', style: 'Modern' },
  { name: 'Lavabo Treo Tường Nhỏ Gọn', brand: 'Viglacera', sku: 'VIG-V23', price: 650000, img: 'https://plus.unsplash.com/premium_photo-1661877303180-19a028c21048?w=800&q=80', style: 'Budget' },
  { name: 'Chậu Rửa Đặt Bàn Đá Cuội', brand: 'Bancoot', sku: 'BC-STON-01', price: 3500000, img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', style: 'Boutique' },
  { name: 'Chậu Rửa Vuông Cạnh Sắc Nét', brand: 'Kohler', sku: 'KOH-SQ-11', price: 4200000, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', style: 'Luxury' },
  { name: 'Lavabo Góc Tròn Tiết Kiệm Không Gian', brand: 'Caesar', sku: 'CAE-C22', price: 850000, img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', style: 'Compact' },
  { name: 'Chậu Đặt Bàn Gốm Sứ Hoa Văn', brand: 'Bát Tràng', sku: 'BT-CER-99', price: 1200000, img: 'https://plus.unsplash.com/premium_photo-1661877303180-19a028c21048?w=800&q=80', style: 'Boutique' },
  { name: 'Chậu Âm Bàn Chữ Nhật Siêu Lớn', brand: 'Inax', sku: 'INAX-AL-555V', price: 2900000, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', style: 'Modern' },
  { name: 'Lavabo Bán Âm Bàn', brand: 'TOTO', sku: 'TOTO-LW644', price: 3100000, img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', style: 'Modern' },
];

const faucets = [
  { name: 'Vòi Chậu Cổ Cao Phủ Đen Nhám', brand: 'Moen', sku: 'MOEN-B-6702', price: 3200000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Industrial' },
  { name: 'Vòi Lavabo Âm Tường Minimalist', brand: 'Grohe', sku: 'GROHE-AM-100', price: 6800000, img: 'https://images.unsplash.com/photo-1585058177435-098d626889eb?w=800&q=80', style: 'Luxury' },
  { name: 'Vòi Lavabo Nóng Lạnh Cơ Bản', brand: 'Inax', sku: 'INAX-LFV-1112S', price: 1100000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Budget' },
  { name: 'Vòi Chậu Cảm Ứng Tự Động', brand: 'TOTO', sku: 'TOTO-TEN40AW', price: 8500000, img: 'https://images.unsplash.com/photo-1585058177435-098d626889eb?w=800&q=80', style: 'Modern' },
  { name: 'Vòi Rửa Đồng Cổ Điển', brand: 'Kanly', sku: 'KAN-BR-01', price: 2400000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Boutique' },
  { name: 'Vòi Lavabo Cổ Thấp Trắng Nhám', brand: 'Viglacera', sku: 'VIG-VG102', price: 1400000, img: 'https://images.unsplash.com/photo-1585058177435-098d626889eb?w=800&q=80', style: 'Minimal' },
  { name: 'Vòi Chậu Kèm Dây Rút', brand: 'Kohler', sku: 'KOH-K102', price: 5600000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Modern' },
];

const toilets = [
  { name: 'Bồn Cầu Thông Minh Liền Khối', brand: 'TOTO', sku: 'TOTO-NEOREST-X', price: 45000000, img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80', style: 'Hotel' },
  { name: 'Bồn Cầu Một Khối Xả Xoáy', brand: 'Inax', sku: 'INAX-1050', price: 7500000, img: 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?w=800&q=80', style: 'Modern' },
  { name: 'Bồn Cầu Hai Khối Siêu Tiết Kiệm', brand: 'Viglacera', sku: 'VIG-VI66', price: 2200000, img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80', style: 'Budget' },
  { name: 'Bồn Cầu Treo Tường Kèm Két Nước Âm', brand: 'Grohe', sku: 'GROHE-WALL-01', price: 14000000, img: 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?w=800&q=80', style: 'Minimal' },
  { name: 'Bồn Cầu Thông Minh Màu Đen', brand: 'Kohler', sku: 'KOH-NUMI-B', price: 95000000, img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80', style: 'Luxury' },
  { name: 'Bồn Cầu Cổ Điển Két Nước Cao', brand: 'Burlington', sku: 'BUR-HIGH-01', price: 18000000, img: 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?w=800&q=80', style: 'Boutique' },
];

const showers = [
  { name: 'Sen Cây Chỉnh Nhiệt Độ Phím Đàn', brand: 'Kohler', sku: 'K-SH-8822', price: 12500000, img: 'https://images.unsplash.com/photo-1620626012488-825fb4dcbe65?w=800&q=80', style: 'Luxury' },
  { name: 'Sen Tay Tăng Áp Cơ Bản', brand: 'Caesar', sku: 'CAE-S120', price: 450000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Budget' }, // Using faucet image as generic fallback, but wait, let's use shower image
  { name: 'Sen Tắm Âm Tường 3 Chế Độ', brand: 'Grohe', sku: 'GROHE-SMART-3', price: 24000000, img: 'https://images.unsplash.com/photo-1620626012488-825fb4dcbe65?w=800&q=80', style: 'Hotel' },
  { name: 'Sen Cây Đồng Cổ Điển', brand: 'Kanly', sku: 'KAN-SH-BR', price: 4500000, img: 'https://images.unsplash.com/photo-1620626012488-825fb4dcbe65?w=800&q=80', style: 'Boutique' },
  { name: 'Sen Tắm Nhiệt Độ An Toàn Cảm Biến', brand: 'TOTO', sku: 'TOTO-TMNW40', price: 9200000, img: 'https://images.unsplash.com/photo-1620626012488-825fb4dcbe65?w=800&q=80', style: 'Modern' },
  { name: 'Sen Tắm Vuông Inox 304', brand: 'Inax', sku: 'INAX-BFV-3415T', price: 5800000, img: 'https://images.unsplash.com/photo-1620626012488-825fb4dcbe65?w=800&q=80', style: 'Minimal' },
];

const mirrors = [
  { name: 'Gương LED Tròn Cảm Ứng Chống Đọng Hơi Nước', brand: 'Navado', sku: 'NAV-R80', price: 2100000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Modern' },
  { name: 'Gương Chữ Nhật Viền Đen Nhôm', brand: 'Dantalux', sku: 'DAN-REC-6080', price: 950000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Industrial' },
  { name: 'Gương Tròn Dây Da Treo', brand: 'Handmade', sku: 'HM-LEATHER-R60', price: 750000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Boutique' },
  { name: 'Gương LED Viền Gỗ Sồi', brand: 'Navado', sku: 'NAV-OAK-LED', price: 2800000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Japandi' },
  { name: 'Gương Oval Đèn Hắt Sau', brand: 'TOTO', sku: 'TOTO-YM6090A', price: 3500000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Luxury' },
];

const cabinets = [
  { name: 'Tủ Lavabo Treo Tường Gỗ Tự Nhiên Vân Sồi', brand: 'Vicostone', sku: 'CAB-OAK-08', price: 5500000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Japandi' },
  { name: 'Tủ Chậu PVC Chống Nước Tuyệt Đối', brand: 'DADA', sku: 'DADA-PVC-60', price: 3200000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Modern' },
  { name: 'Tủ Lavabo Đặt Sàn Tân Cổ Điển', brand: 'Moen', sku: 'MOEN-CAB-CL', price: 8500000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Boutique' },
  { name: 'Tủ Chậu Bán Nguyệt Siêu Nhỏ', brand: 'Caesar', sku: 'CAE-MINI-C', price: 2100000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Compact' },
  { name: 'Hệ Tủ Lavabo Kép Khách Sạn', brand: 'Kohler', sku: 'KOH-DB-CAB', price: 18000000, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', style: 'Hotel' },
];

const tiles = [
  { name: 'Gạch Thẻ Trắng Men Bóng Cổ Điển', brand: 'Đồng Tâm', sku: 'DT-SUBWAY-W', price: 320000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', style: 'Minimal' },
  { name: 'Gạch Lát Nền Giả Gỗ Chống Trơn', brand: 'Prime', sku: 'PR-WOOD-1560', price: 250000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', style: 'Japandi' },
  { name: 'Gạch Lát Nền Terrazzo Xám', brand: 'Taicera', sku: 'TC-TERZ-6060', price: 420000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', style: 'Modern' },
  { name: 'Gạch Bông Men Trang Trí', brand: 'Secoin', sku: 'SEC-CEM-20', price: 650000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', style: 'Boutique' },
  { name: 'Gạch Ốp Tường Marble Khổ Lớn', brand: 'Vietceramics', sku: 'VC-MAR-80160', price: 1200000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', style: 'Luxury' },
];

const accessories = [
  { name: 'Bộ Phụ Kiện Phòng Tắm 5 Món Đen Nhám', brand: 'Imex', sku: 'IMEX-BLK-5P', price: 1850000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Industrial' },
  { name: 'Thanh Treo Khăn Nóng Sưởi Khô', brand: 'Grohe', sku: 'GROHE-HEAT-T', price: 8500000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Hotel' },
  { name: 'Lô Giấy Vệ Sinh Inox Bóng', brand: 'TOTO', sku: 'TOTO-PAPER-S', price: 450000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Modern' },
  { name: 'Kệ Góc Kính Cường Lực', brand: 'Inax', sku: 'INAX-GLASS-C', price: 320000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Budget' },
  { name: 'Bộ Móc Treo Áo Cổ Điển Bằng Đồng', brand: 'Kanly', sku: 'KAN-HOOK-BR', price: 650000, img: 'https://images.unsplash.com/photo-1584622781867-1c1ac2d159be?w=800&q=80', style: 'Boutique' },
];

let all = [];
let idCounter = 1;

function add(arr, category, priceUnit) {
  for (let item of arr) {
    all.push({
      id: `prod-${category.substring(0,3).toLowerCase()}-${String(idCounter++).padStart(3, '0')}`,
      name: item.name,
      category: category,
      brand: item.brand,
      sku: item.sku,
      priceMin: item.price,
      priceMax: item.price,
      priceRange: item.price.toLocaleString('vi-VN') + 'đ',
      priceUnit: priceUnit,
      material: 'Vật liệu cao cấp',
      finish: 'Tiêu chuẩn',
      dimensions: 'Tuỳ chỉnh',
      installationType: 'Mặc định',
      warranty: 'Bảo hành chính hãng',
      image: item.img,
      imageVerified: false,
      availability: 'In Stock',
      status: 'Còn hàng',
      description: `Sản phẩm ${item.name} chính hãng từ ${item.brand}, phù hợp cho không gian phòng tắm sang trọng. Mức giá tham khảo, chi tiết vui lòng thêm vào giỏ báo giá.`,
      features: ['Thiết kế đẹp mắt', 'Độ bền cao', 'Dễ dàng lắp đặt'],
      technicalSpecs: ['Sản xuất theo tiêu chuẩn quốc tế', 'Phù hợp mọi không gian'],
      showroomName: 'Hệ thống Showroom Đối Tác',
      showroomLocation: 'Hà Nội & TP.HCM',
      sellerType: 'Showroom đối tác',
      soldBy: 'LivLab',
      fulfilledBy: item.brand + ' Partner',
      commerceType: 'Quote-based commerce',
      style: item.style,
    });
  }
}

add(lavabos, 'Basin', 'bộ');
add(faucets, 'Faucet', 'bộ');
add(toilets, 'Toilet', 'bộ');
add(showers, 'Shower', 'bộ');
add(mirrors, 'Mirror', 'cái');
add(cabinets, 'Cabinet', 'bộ');
add(tiles, 'Tiles', 'm2');
add(accessories, 'Accessories', 'bộ');

const output = `import { Product } from './types';

export const visualProducts: Product[] = ${JSON.stringify(all, null, 2)};

export async function seedVisualProducts(force: boolean = false): Promise<void> {
  const currentProductsStr = typeof window !== 'undefined' ? localStorage.getItem('livlab_products') : null;
  const currentProducts: Product[] = currentProductsStr ? JSON.parse(currentProductsStr) : [];

  let shouldSeed = force;

  if (!shouldSeed && typeof window !== 'undefined') {
    if (currentProducts.length < 30) {
      shouldSeed = true;
    } else {
      const placeholders = currentProducts.filter(p => p.image.includes('placeholder'));
      if (placeholders.length / currentProducts.length > 0.5) {
        shouldSeed = true;
      }
    }
  }

  if (shouldSeed && typeof window !== 'undefined') {
    localStorage.setItem('livlab_products', JSON.stringify(visualProducts));
    console.log('[LivLab] Auto-seeded visual products for Phase 2 e-commerce catalogue.');
  }
}
`;

fs.writeFileSync('lib/visualCatalogueSeed.ts', output);
console.log(`Generated ${all.length} products`);
