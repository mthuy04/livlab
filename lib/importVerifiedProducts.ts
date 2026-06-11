import { Product } from './types';
import { saveStoredProducts, getStoredProducts } from './storage';
import { generateSlug } from './productHelpers';

export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Split lines accounting for newlines inside quotes
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    }
    if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else if (char === '\r' && !inQuotes) {
      // Ignore \r
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headersLine = lines[0];
  const headers = parseCSVLine(headersLine);

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    data.push(row);
  }
  return data;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next char
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
}

export function mapCsvRowToProduct(row: Record<string, string>): Product {
  const parseNum = (val: string) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const splitPipe = (val: string) => val ? val.split('|').map(s => s.trim()).filter(Boolean) : undefined;

  const name = row.name || 'Sản phẩm không tên';
  const sku = row.sku || '';

  const imagesRaw = splitPipe(row.images);
  const images = imagesRaw && imagesRaw.length > 0 ? imagesRaw : (row.image ? [row.image] : undefined);

  return {
    id: row.id || generateSlug(name, sku),
    slug: row.slug || generateSlug(name, sku),
    name: name,
    brand: row.brand || '',
    sku: sku,
    category: row.category || 'Khác',
    subCategory: row.subCategory,
    priceMin: parseNum(row.priceMin),
    priceMax: parseNum(row.priceMax),
    priceRange: row.priceRange || `${row.priceMin}đ - ${row.priceMax}đ`,
    priceUnit: row.priceUnit,
    material: row.material,
    finish: row.finish,
    color: row.color,
    dimensions: row.dimensions,
    size: row.size,
    installationType: row.installationType,
    warranty: row.warranty,
    origin: row.origin,
    availability: row.availability || 'Còn hàng',
    status: (row.status as "Còn hàng" | "Đặt trước" | "Ngừng kinh doanh") || 'Còn hàng',
    stockNote: row.stockNote,
    image: row.image || '',
    images: images,
    imageAlt: row.imageAlt,
    imageVerified: row.imageVerified?.toUpperCase() === 'TRUE',
    imageSourceUrl: row.imageSourceUrl,
    style: row.style,
    compatibleStyles: splitPipe(row.compatibleStyles),
    suitableFor: splitPipe(row.suitableFor),
    suitableRoomSize: row.suitableRoomSize,
    budgetSegment: row.budgetSegment,
    description: row.description || '',
    features: splitPipe(row.features),
    technicalSpecs: splitPipe(row.technicalSpecs),
    careInstructions: splitPipe(row.careInstructions),
    includedItems: splitPipe(row.includedItems),
    showroomName: row.showroomName || 'LivLab',
    showroomLocation: row.showroomLocation,
    showroomContact: row.showroomContact,
    sellerType: (row.sellerType as "Showroom đối tác" | "Đại lý phân phối" | "Retailer tham khảo" | "Dữ liệu mẫu" | string) || 'Retailer tham khảo',
    soldBy: row.soldBy || 'LivLab',
    fulfilledBy: row.fulfilledBy || row.showroomName || 'LivLab',
    commerceType: (row.commerceType as "Quote-based commerce") || 'Quote-based commerce',
    supplierType: row.supplierType,
    sourceUrl: row.sourceUrl,
    priceSource: row.priceSource,
    sourceNote: row.sourceNote,
  };
}

export async function importVerifiedProductsFromCsv(force: boolean = false): Promise<Product[]> {
  try {
    const existingProducts = getStoredProducts();
    const shouldImport = force || !existingProducts || existingProducts.length < 30 || existingProducts.some(p => p.image?.includes('placeholder-sanitary'));

    if (!shouldImport) {
      return existingProducts || [];
    }

    console.log('[LivLab Verified Import] Fetching CSV...');
    const response = await fetch('/data/livlab-seed/livlab_verified_products_master.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    console.log(`[LivLab Verified Import] parsed rows: ${rows.length}`);

    const products = rows.map(mapCsvRowToProduct);
    
    let remoteImageCount = 0;
    products.forEach(p => {
      if (p.image?.startsWith('http')) remoteImageCount++;
    });

    console.log(`[LivLab Verified Import] remote images: ${remoteImageCount}`);
    
    saveStoredProducts(products);
    console.log(`[LivLab Verified Import] saved products: ${products.length}`);
    
    return products;
  } catch (error) {
    console.error('[LivLab Verified Import] Error:', error);
    return [];
  }
}
