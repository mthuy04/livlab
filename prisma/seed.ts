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

  // 4. Do not generate fake demo QuoteLeads or QuoteItems in production or ever.
  // We want an empty table if there are no real leads yet.

  console.log('Skipping fake demo QuoteLeads generation.');

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
