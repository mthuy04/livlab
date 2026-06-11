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

async function main() {
  console.log('Starting seed...');

  // 1. Create Default Showroom
  const showroom = await prisma.showroom.upsert({
    where: { id: 'sr-luxbath-1' },
    update: {},
    create: {
      id: 'sr-luxbath-1',
      name: 'Luxbath / LivLab Partner Showroom',
      contactName: 'Mr. Nam',
      email: 'showroom@luxbath.vn',
      phone: '0901234567',
      address: 'Quận 1, TP. Hồ Chí Minh',
      status: 'ACTIVE'
    }
  });
  console.log(`Default showroom created: ${showroom.name}`);

  // 2. Import Products
  const productsCsvPath = path.join(process.cwd(), 'public', 'data', 'livlab-seed', 'livlab_verified_products_master.csv');
  if (fs.existsSync(productsCsvPath)) {
    const productsText = fs.readFileSync(productsCsvPath, 'utf8');
    const productsData = parseCSV(productsText);
    
    let productCount = 0;
    for (const row of productsData) {
      if (!row.id && !row.name) continue;
      
      const id = row.id || `p_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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
          image: row.image || '/images/products/placeholder-sanitary.png',
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
          image: row.image || '/images/products/placeholder-sanitary.png',
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
      await prisma.concept.upsert({
        where: { id },
        update: {
          name: row.title || 'Concept mẫu',
          slug: row.slug || '',
          roomType: row.roomType || '',
          style: row.style || '',
          budgetRange: row.budgetRange || '',
          description: row.description || '',
          image: row.image || '/images/concepts/placeholder-room.jpg',
          status: 'ACTIVE'
        },
        create: {
          id,
          name: row.title || 'Concept mẫu',
          slug: row.slug || '',
          roomType: row.roomType || '',
          style: row.style || '',
          budgetRange: row.budgetRange || '',
          description: row.description || '',
          image: row.image || '/images/concepts/placeholder-room.jpg',
          status: 'ACTIVE'
        }
      });
      conceptCount++;
    }
    console.log(`Imported ${conceptCount} concepts.`);
  } else {
    console.warn(`File not found: ${conceptsCsvPath}`);
  }

  // 4. Seed 5 Quote Leads
  const demoLeads = [
    {
      customerName: 'Nguyễn Minh Thùy',
      email: 'thuy@example.com',
      phone: '0901234567',
      conceptName: 'Phòng tắm căn hộ nhỏ dưới 4m²',
      roomType: 'Phòng tắm',
      budgetRange: '30–60 triệu',
      estimatedValue: 42000000,
      status: LeadStatus.NEW,
      notes: 'Khách cần thi công gấp'
    },
    {
      customerName: 'Anh Hoàng',
      email: 'hoang@example.com',
      phone: '0912345678',
      conceptName: 'Phòng tắm master cao cấp',
      roomType: 'Phòng tắm master',
      budgetRange: '60–100 triệu',
      estimatedValue: 86000000,
      status: LeadStatus.CONTACTED,
      notes: 'Cần thiết kế thêm tủ lavabo'
    },
    {
      customerName: 'Chị Linh',
      email: 'linh@example.com',
      phone: '0987654321',
      conceptName: 'Phòng tắm Japandi sáng màu',
      roomType: 'Phòng tắm',
      budgetRange: '40–60 triệu',
      estimatedValue: 55000000,
      status: LeadStatus.QUOTED,
      notes: 'Đã gửi file PDF báo giá'
    },
    {
      customerName: 'Minh Anh Homestay',
      email: 'minhanh@homestay.com',
      phone: '0909090909',
      conceptName: 'Phòng tắm tiết kiệm cho nhà cho thuê',
      roomType: 'Phòng tắm',
      budgetRange: '20–40 triệu',
      estimatedValue: 32000000,
      status: LeadStatus.WON,
      notes: 'Đã ký hợp đồng'
    },
    {
      customerName: 'Khách Luxbath',
      email: 'khach@luxbath.vn',
      phone: '0933333333',
      conceptName: 'Phòng tắm khách sạn',
      roomType: 'Phòng tắm',
      budgetRange: '60–100 triệu',
      estimatedValue: 92000000,
      status: LeadStatus.LOST,
      notes: 'Khách chọn nhà thầu khác'
    }
  ];

  // Try to find an existing user or create one (optional, for userId relation)
  const user = await prisma.user.findFirst();

  // Clear existing leads and items to avoid duplicates if run multiple times
  await prisma.quoteItem.deleteMany({});
  await prisma.quoteLead.deleteMany({});

  for (const leadData of demoLeads) {
    const createdLead = await prisma.quoteLead.create({
      data: {
        customerName: leadData.customerName,
        email: leadData.email,
        phone: leadData.phone,
        conceptName: leadData.conceptName,
        roomType: leadData.roomType,
        budgetRange: leadData.budgetRange,
        estimatedValue: leadData.estimatedValue,
        status: leadData.status,
        notes: leadData.notes,
        showroomId: showroom.id,
        userId: user ? user.id : null,
      }
    });

    // Add some random products to this lead
    const randomProducts = await prisma.product.findMany({ take: 3 });
    for (const p of randomProducts) {
      await prisma.quoteItem.create({
        data: {
          leadId: createdLead.id,
          productId: p.id,
          productName: p.name,
          quantity: 1,
          priceMin: p.priceMin,
          priceMax: p.priceMax
        }
      });
    }
  }
  console.log('Imported 5 demo QuoteLeads with QuoteItems.');

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
