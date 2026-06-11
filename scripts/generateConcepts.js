const fs = require('fs');

const concepts = [];
const styles = ['Japandi', 'Modern', 'Minimal', 'Hotel', 'Warm Neutral', 'Luxury', 'Budget', 'Compact'];
const budgets = ['Dưới 30 triệu', '30M–60M', 'Trên 60 triệu'];

// Bathroom
const bathroomTitles = [
  'Phòng tắm căn hộ nhỏ dưới 4m²', 'Phòng tắm Japandi sáng màu', 'Phòng tắm phong cách khách sạn', 
  'Phòng tắm tiết kiệm cho nhà cho thuê', 'Phòng tắm master cao cấp', 'Phòng tắm tối giản trắng sáng', 
  'Phòng tắm Warm Neutral', 'Phòng tắm đen trắng hiện đại', 'Phòng tắm dễ vệ sinh cho gia đình bận rộn', 
  'Phòng tắm cho homestay boutique', 'Phòng tắm compact có tủ lavabo', 'Phòng tắm cho nhà phố hẹp', 
  'Phòng tắm sáng màu cho căn hộ cũ', 'Phòng tắm luxury với sen cây và gương LED', 'Phòng tắm budget dưới 30 triệu', 
  'Phòng tắm cân bằng 30–60 triệu', 'Phòng tắm cao cấp trên 60 triệu', 'Phòng tắm chống ẩm cho khí hậu Việt Nam', 
  'Phòng tắm rental dễ bảo trì', 'Phòng tắm hiện đại cho gia đình trẻ'
];

bathroomTitles.forEach((title, i) => {
  const isBudget = title.toLowerCase().includes('tiết kiệm') || title.toLowerCase().includes('budget') || title.toLowerCase().includes('dưới 30');
  const isLuxury = title.toLowerCase().includes('cao cấp') || title.toLowerCase().includes('luxury') || title.toLowerCase().includes('trên 60');
  let budget = isBudget ? 'Dưới 30 triệu' : (isLuxury ? 'Trên 60 triệu' : '30M–60M');
  let min = isBudget ? 15000000 : (isLuxury ? 65000000 : 35000000);
  let max = isBudget ? 25000000 : (isLuxury ? 120000000 : 55000000);

  concepts.push({
    id: `concept-bath-${i + 1}`,
    slug: `phong-tam-${i + 1}`,
    title: title,
    roomType: 'Phòng tắm',
    style: styles[i % styles.length],
    budgetRange: budget,
    areaSize: `${(i % 5) + 3}m² - ${(i % 5) + 5}m²`,
    shortDescription: `Giải pháp không gian hoàn thiện cho ${title.toLowerCase()}.`,
    description: `Concept ${title} mang lại sự tiện nghi và vẻ đẹp tinh tế, được đội ngũ LivLab tuyển chọn kỹ lưỡng. Phù hợp cho không gian hiện đại.`,
    image: `https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80`,
    productIds: ['llv-lav-toto-lt1705-xw', 'llv-fau-toto-tx109ld', 'llv-tl-toto-ms885dt8'],
    hotspots: [
      { id: `h1-${i}`, productId: 'llv-lav-toto-lt1705-xw', label: 'Lavabo', x: 45, y: 55, category: 'Lavabo' },
      { id: `h2-${i}`, productId: 'llv-fau-toto-tx109ld', label: 'Vòi', x: 45, y: 45, category: 'Vòi lavabo' }
    ],
    suitableFor: ['Căn hộ', 'Nhà phố'],
    painPoints: ['Thiếu ý tưởng', 'Không rõ chi phí'],
    keyBenefits: ['Đẹp', 'Tiện lợi', 'Dễ vệ sinh'],
    tags: ['Hiện đại', 'Báo giá combo']
  });
});

// Kitchen
const kitchenTitles = ['Góc bếp căn hộ tối giản', 'Bếp chữ I cho căn hộ nhỏ', 'Bếp Warm Neutral cho gia đình trẻ', 'Bếp mở phong cách Japandi'];
kitchenTitles.forEach((title, i) => {
  concepts.push({
    id: `concept-kitchen-${i + 1}`,
    slug: `bep-${i + 1}`,
    title: title,
    roomType: 'Bếp',
    style: styles[i % styles.length],
    budgetRange: '30M–60M',
    areaSize: '10m² - 15m²',
    shortDescription: `Bếp tiện dụng cho ${title.toLowerCase()}.`,
    description: `Thiết kế bếp hiện đại tối ưu công năng.`,
    image: `https://images.unsplash.com/photo-1556910103-1c02745a872f?w=800&q=80`,
    productIds: [],
    hotspots: [],
    suitableFor: ['Căn hộ'],
    tags: ['Bếp']
  });
});

// Living Room
const livingTitles = ['Phòng khách căn hộ nhỏ', 'Phòng khách Japandi', 'Phòng khách tối giản', 'Phòng khách hiện đại sang trọng'];
livingTitles.forEach((title, i) => {
  concepts.push({
    id: `concept-living-${i + 1}`,
    slug: `phong-khach-${i + 1}`,
    title: title,
    roomType: 'Phòng khách',
    style: styles[i % styles.length],
    budgetRange: '30M–60M',
    areaSize: '15m² - 25m²',
    shortDescription: `Không gian phòng khách ${title.toLowerCase()}.`,
    description: `Phòng khách ấm cúng và thoải mái.`,
    image: `https://images.unsplash.com/photo-1583847268964-b28ce8f31586?w=800&q=80`,
    productIds: [],
    hotspots: [],
    suitableFor: ['Căn hộ', 'Nhà phố'],
    tags: ['Phòng khách']
  });
});

// Studio
const studioTitles = ['Studio cho thuê 25m²', 'Homestay mini phong cách khách sạn'];
studioTitles.forEach((title, i) => {
  concepts.push({
    id: `concept-studio-${i + 1}`,
    slug: `studio-${i + 1}`,
    title: title,
    roomType: 'Studio',
    style: styles[i % styles.length],
    budgetRange: 'Dưới 30 triệu',
    areaSize: '20m² - 30m²',
    shortDescription: `Tối ưu không gian cho ${title.toLowerCase()}.`,
    description: `Giải pháp nội thất trọn gói cho không gian nhỏ.`,
    image: `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80`,
    productIds: [],
    hotspots: [],
    suitableFor: ['Studio', 'Homestay'],
    tags: ['Cho thuê']
  });
});

const fileContent = `import { Concept } from '../types';

export const generatedConcepts: Concept[] = ${JSON.stringify(concepts, null, 2)};
`;

fs.writeFileSync('./lib/data/concepts.ts', fileContent);
console.log('Generated concepts');
