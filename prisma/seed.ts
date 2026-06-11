import { PrismaClient, LeadStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(text: string): any[] {
  const rows: any[] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      if (char === '\r') i++; // skip \n
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  
  if (rows.length === 0) return [];
  const headers = rows[0].map((h: string) => h.replace(/^\uFEFF/, '').replace(/^ï»¿/, '').trim()); 
  
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length === 0 || (rows[i].length === 1 && rows[i][0].trim() === '')) {
      continue;
    }
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = rows[i][index] !== undefined ? rows[i][index].trim() : '';
    });
    result.push(obj);
  }
  return result;
}

function normalizeImageUrl(url: string | undefined): string | null {
  if (!url || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return '/' + trimmed;
}

async function main() {
  console.log('Starting seed...');

  // 1. Create Default Showroom
  const showroom = await prisma.showroom.upsert({
    where: { id: 'sr-luxbath-1' },
    update: {
      name: 'Luxbath Studio Hà Nội',
      email: 'showroom@livlab.vn',
      phone: '0901 234 567',
      address: 'Mỹ Đình, Hà Nội'
    },
    create: {
      id: 'sr-luxbath-1',
      name: 'Luxbath Studio Hà Nội',
      email: 'showroom@livlab.vn',
      phone: '0901 234 567',
      address: 'Mỹ Đình, Hà Nội',
      status: 'ACTIVE'
    }
  });
  console.log(`Default showroom created: ${showroom.name}`);

  // 2. Import Products
  const productsCsvPath = path.join(process.cwd(), 'public', 'data', 'livlab-seed', 'livlab_verified_products_master.csv');
  let productsData: any[] = [];
  if (fs.existsSync(productsCsvPath)) {
    const productsText = fs.readFileSync(productsCsvPath, 'utf8');
    productsData = parseCSV(productsText);
    
    let productCount = 0;
    for (const row of productsData) {
      if (!row.id && !row.name) continue;
      
      const id = row.id || `p_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const rawImage = row.image || row.imageUrl || row.thumbnail || null;
      const imageUrl = normalizeImageUrl(rawImage);

      await prisma.product.upsert({
        where: { id },
        update: {
          name: row.name || 'Sản phẩm mẫu',
          brand: row.brand || 'LivLab',
          category: row.category || '',
          priceMin: parseInt(row.priceMin || '0', 10) || 0,
          priceMax: parseInt(row.priceMax || '0', 10) || 0,
          priceRange: row.priceRange || '',
          material: row.material || '',
          finish: row.finish || '',
          dimensions: row.size || '',
          warranty: row.warranty || '',
          imageUrl,
          sourceUrl: row.sourceUrl || '',
          showroomId: showroom.id,
          status: 'ACTIVE'
        },
        create: {
          id,
          name: row.name || 'Sản phẩm mẫu',
          brand: row.brand || 'LivLab',
          category: row.category || '',
          priceMin: parseInt(row.priceMin || '0', 10) || 0,
          priceMax: parseInt(row.priceMax || '0', 10) || 0,
          priceRange: row.priceRange || '',
          material: row.material || '',
          finish: row.finish || '',
          dimensions: row.size || '',
          warranty: row.warranty || '',
          imageUrl,
          sourceUrl: row.sourceUrl || '',
          showroomId: showroom.id,
          status: 'ACTIVE'
        }
      });
      productCount++;
    }
    console.log(`Imported ${productCount} products.`);
  } else {
    console.warn(`File not found: ${productsCsvPath}`);
  }

  // 3. Import Concepts
  const conceptsCsvPath = path.join(process.cwd(), 'public', 'data', 'livlab-seed', 'livlab_verified_concepts_master.csv');
  if (fs.existsSync(conceptsCsvPath)) {
    const conceptsText = fs.readFileSync(conceptsCsvPath, 'utf8');
    const conceptsData = parseCSV(conceptsText);
    
    let conceptCount = 0;
    for (const row of conceptsData) {
      if (!row.id && !row.title) continue;
      
      const id = row.id || `c_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const rawImage = row.image || row.imageUrl || null;
      const imageUrl = normalizeImageUrl(rawImage);

      await prisma.concept.upsert({
        where: { id },
        update: {
          title: row.title || 'Concept mẫu',
          slug: row.slug || '',
          roomType: row.roomType || '',
          style: row.style || '',
          budgetRange: row.budgetRange || '',
          areaRange: row.areaSize || '',
          description: row.description || '',
          imageUrl,
          status: 'ACTIVE'
        },
        create: {
          id,
          title: row.title || 'Concept mẫu',
          slug: row.slug || '',
          roomType: row.roomType || '',
          style: row.style || '',
          budgetRange: row.budgetRange || '',
          areaRange: row.areaSize || '',
          description: row.description || '',
          imageUrl,
          status: 'ACTIVE'
        }
      });
      conceptCount++;
    }
    console.log(`Imported ${conceptCount} concepts.`);
  } else {
    console.warn(`File not found: ${conceptsCsvPath}`);
  }

  // 4. Seed QuoteLead demo data (only if enabled)
  const isDemo = process.env.SEED_DEMO_DATA === 'true' || process.env.NODE_ENV === 'development';
  if (!isDemo) {
    console.log('Skipped demo leads because SEED_DEMO_DATA is not enabled.');
    return;
  }

  console.log('Seeding demo leads...');

  const dbProducts = await prisma.product.findMany();
  
  const findProduct = (category: string) => {
    return dbProducts.find(p => p.category?.toLowerCase() === category.toLowerCase()) || dbProducts[0];
  };

  const getQuoteItems = (categories: string[]) => {
    return categories.map(cat => {
      const p = findProduct(cat);
      if (!p) return null;
      return {
        productId: p.id,
        productName: p.name,
        quantity: 1,
        priceMin: p.priceMin,
        priceMax: p.priceMax
      };
    }).filter(Boolean) as any[];
  };

  const demoLeads = [
    {
      customerName: 'Nguyễn Minh Anh',
      phone: '0912 345 678',
      roomType: 'Phòng tắm căn hộ',
      budgetRange: '18,000,000 - 25,000,000 VND',
      conceptName: 'Japandi / sáng sạch',
      status: LeadStatus.NEW,
      notes: 'Cần combo lavabo, gương, sen tắm và tủ chậu cho căn hộ mới.\nAdditional services:\n- Cần tư vấn phối concept\n- Cần lắp đặt thiết bị',
      showroomId: showroom.id,
      items: getQuoteItems(['Basin', 'Mirror', 'Shower', 'Cabinet'])
    },
    {
      customerName: 'Trần Hoàng Nam',
      phone: '0988 120 456',
      roomType: 'Phòng tắm nhà phố',
      budgetRange: '30,000,000 - 45,000,000 VND',
      conceptName: 'Modern Gray',
      status: LeadStatus.CONTACTED,
      notes: 'Muốn cải tạo phòng tắm cũ, ưu tiên thiết bị bền, dễ vệ sinh.\nAdditional services:\n- Cần đo đạc thực tế\n- Cần cải tạo / thi công phòng tắm',
      showroomId: showroom.id,
      items: getQuoteItems(['Shower', 'Toilet', 'Basin'])
    },
    {
      customerName: 'Lê Thu Hà',
      phone: '0936 888 219',
      roomType: 'Homestay bathroom',
      budgetRange: '15,000,000 - 22,000,000 VND',
      conceptName: 'Minimal White',
      status: LeadStatus.QUOTED,
      notes: 'Cần combo tiết kiệm nhưng nhìn sạch và phù hợp homestay.\nAdditional services:\n- Cần lắp đặt thiết bị',
      showroomId: showroom.id,
      items: getQuoteItems(['Basin', 'Toilet'])
    },
    {
      customerName: 'Phạm Đức Long',
      phone: '0977 456 111',
      roomType: 'Phòng tắm cho thuê',
      budgetRange: '10,000,000 - 16,000,000 VND',
      conceptName: 'Rental Budget',
      status: LeadStatus.WON,
      notes: 'Cần giải pháp nhanh, chi phí hợp lý, dễ bảo trì.\nAdditional services:\n- Chưa chắc, cần showroom tư vấn thêm',
      showroomId: showroom.id,
      items: getQuoteItems(['Toilet', 'Shower'])
    },
    {
      customerName: 'Vũ Ngọc Linh',
      phone: '0904 222 789',
      roomType: 'Master bathroom',
      budgetRange: '50,000,000 - 70,000,000 VND',
      conceptName: 'Luxury Hotel',
      status: LeadStatus.LOST,
      notes: 'Muốn concept cao cấp, có tủ chậu, gương LED, sen cây và phụ kiện đồng bộ.\nAdditional services:\n- Cần tư vấn concept\n- Cần kiến trúc sư / designer hỗ trợ',
      showroomId: showroom.id,
      items: getQuoteItems(['Cabinet', 'Mirror', 'Shower', 'Accessories'])
    }
  ];

  await prisma.quoteLead.deleteMany({
    where: { showroomId: showroom.id }
  });

  for (const leadData of demoLeads) {
    const { items, ...leadDetails } = leadData;
    const estimatedValue = items.reduce((sum, i) => sum + (i.priceMax || 0) * i.quantity, 0);

    await prisma.quoteLead.create({
      data: {
        ...leadDetails,
        estimatedValue,
        items: {
          create: items
        }
      }
    });
  }

  console.log(`Created 5 demo leads with items.`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
