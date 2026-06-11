import { Product, Concept, ComboPackage } from './types';
import { getStoredProducts, saveStoredProducts, getStoredConcepts, saveStoredConcepts, getStoredCombos, saveStoredCombos, getStoredSources, saveStoredSources } from './storage';
import { products as fallbackProducts } from './data';
import { seededProducts as fallbackSeededProducts, seededConcepts as fallbackSeededConcepts, seededCombos as fallbackSeededCombos } from './seedData';

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
  // Clean BOM and trim headers
  const headers = rows[0].map((h: string) => h.replace(/^\uFEFF/, '').replace(/^ï»¿/, '').trim()); 
  
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    // Skip empty rows
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

export async function fetchAndParseCSV(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[LivLab Seed] ${url} fetch status: ${response.status}`);
      return [];
    }
    console.log(`[LivLab Seed] ${url} fetch status: ${response.status}`);
    const text = await response.text();
    console.log(`[LivLab Seed] CSV text length: ${text.length}`);
    const parsed = parseCSV(text);
    console.log(`[LivLab Seed] parsed rows: ${parsed.length}`);
    return parsed;
  } catch (error) {
    console.error(`[LivLab Seed] Error fetching/parsing CSV from ${url}:`, error);
    return [];
  }
}

export interface SeedResult {
  products: Product[];
  concepts: Concept[];
  combos: ComboPackage[];
  sources: unknown[];
  seeded: boolean;
}

export async function seedCatalogueFromCsvIfNeeded(force = false): Promise<SeedResult> {
  if (typeof window === 'undefined') {
    return { products: [], concepts: [], combos: [], sources: [], seeded: false };
  }
  
  let currentProds = getStoredProducts() || [];
  let currentConcepts = getStoredConcepts() || [];
  let currentCombos = getStoredCombos() || [];
  let currentSources = getStoredSources() || [];

  const needsProducts = force || currentProds.length < 30;
  const needsConcepts = force || currentConcepts.length === 0;
  const needsCombos = force || currentCombos.length === 0;

  if (!needsProducts && !needsConcepts && !needsCombos) {
    return { products: currentProds, concepts: currentConcepts, combos: currentCombos, sources: currentSources, seeded: false };
  }

  console.log('[LivLab Seed] Seeding catalogue from CSVs...');
  let seeded = false;

  if (needsProducts) {
    const productRows = await fetchAndParseCSV('/data/livlab-seed/livlab_products_research_safe.csv');
    if (productRows.length > 0) {
      const validRows = productRows.filter(r => r.id || r.name);
      currentProds = validRows.map(row => ({
        id: row.id || `p_${Date.now()}_${Math.random()}`,
        name: row.name || 'Sản phẩm mẫu',
        category: row.category as any,
        brand: row.brand || 'LivLab',
        sku: row.sku || '',
        priceMin: parseInt(row.priceMin || '0', 10) || 0,
        priceMax: parseInt(row.priceMax || '0', 10) || 0,
        priceRange: row.priceRange || '',
        material: row.material || '',
        finish: row.finish || '',
        size: row.size || '',
        image: row.image || '/images/products/placeholder-sanitary.png',
        availability: row.availability || 'In Stock',
        status: row.status || 'Còn hàng',
        style: row.style || '',
        description: row.description || '',
        popularity: parseInt(row.popularity || '50', 10) || 50,
        showroomName: row.showroomName || '',
        showroomLocation: row.showroomLocation || '',
        showroomContact: row.showroomContact || '',
        sellerType: row.sellerType || 'Dữ liệu mẫu',
        sourceUrl: row.sourceUrl || '',
        priceSource: row.priceSource || '',
        isVerifiedSource: (row.isVerifiedSource || '').toUpperCase() === 'TRUE',
        sourceNote: row.sourceNote || '',
        recommendedFor: []
      }));
      console.log(`[LivLab Seed] mapped products: ${currentProds.length}`);
      saveStoredProducts(currentProds);
      console.log(`[LivLab Seed] saved products: ${currentProds.length}`);
      seeded = true;
    } else {
      console.warn('[LivLab Seed] CSV fetch failed or 0 products mapped. Using fallback data.');
      currentProds = fallbackSeededProducts.length > 0 ? fallbackSeededProducts : fallbackProducts;
      saveStoredProducts(currentProds);
      seeded = true;
    }
  }

  if (needsConcepts) {
    const conceptRows = await fetchAndParseCSV('/data/livlab-seed/livlab_concepts_seed.csv');
    if (conceptRows.length > 0) {
      currentConcepts = conceptRows.filter(r => r.id || r.title).map(row => {
        const pIds = row.productIds ? row.productIds.split('|').map((s: string) => s.trim()).filter(Boolean) : [];
        let hotspots = [];
        if (row.hotspots) {
          const hsItems = row.hotspots.split('|').map((s: string) => s.trim()).filter(Boolean);
          hotspots = hsItems.map((hs: string, idx: number) => {
            const parts = hs.split(':');
            return {
              id: `h_${row.id}_${idx}`,
              productId: parts[0] || '',
              x: parseFloat(parts[1] || '0') || 0,
              y: parseFloat(parts[2] || '0') || 0,
              label: parts[3] || ''
            };
          });
        }

        return {
          id: row.id || `c_${Date.now()}_${Math.random()}`,
          slug: row.slug || '',
          title: row.title || '',
          roomType: row.roomType as any,
          style: row.style as any,
          budgetRange: row.budgetRange as any,
          areaSize: row.areaSize || '',
          description: row.description || '',
          shortDescription: row.shortDescription || row.description || '',
          longDescription: row.description || '',
          image: row.image || '/images/concepts/placeholder-room.jpg',
          productIds: pIds,
          hotspots: hotspots,
          whyItWorks: [],
          productCount: pIds.length
        };
      });
      saveStoredConcepts(currentConcepts);
      console.log(`[LivLab Seed] saved concepts: ${currentConcepts.length}`);
      seeded = true;
    } else {
      currentConcepts = fallbackSeededConcepts;
      saveStoredConcepts(currentConcepts);
    }
  }

  if (needsCombos) {
    const comboRows = await fetchAndParseCSV('/data/livlab-seed/livlab_combos_seed.csv');
    if (comboRows.length > 0) {
      currentCombos = comboRows.filter(r => r.id || r.title).map(row => ({
        id: row.id || `cb_${Date.now()}_${Math.random()}`,
        slug: row.slug || '',
        title: row.title || '',
        roomType: row.roomType || '',
        style: row.style || '',
        budgetRange: row.budgetRange || '',
        priceMin: parseInt(row.priceMin || '0', 10) || 0,
        priceMax: parseInt(row.priceMax || '0', 10) || 0,
        description: row.description || '',
        includedCategories: row.includedCategories ? row.includedCategories.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
        productIds: row.productIds ? row.productIds.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
        suitableFor: row.suitableFor ? row.suitableFor.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
        image: row.image || '/images/concepts/placeholder-room.jpg',
        sourceNote: row.sourceNote || ''
      }));
      saveStoredCombos(currentCombos);
      console.log(`[LivLab Seed] saved combos: ${currentCombos.length}`);
      seeded = true;
    } else {
      currentCombos = fallbackSeededCombos;
      saveStoredCombos(currentCombos);
    }
  }

  if (force || !currentSources || currentSources.length === 0) {
    const sourceRows = await fetchAndParseCSV('/data/livlab-seed/livlab_sources.csv');
    if (sourceRows.length > 0) {
      currentSources = sourceRows.filter(r => r.source_name || r.url);
      saveStoredSources(currentSources);
      console.log(`[LivLab Seed] saved sources: ${currentSources.length}`);
      seeded = true;
    }
  }

  return { products: currentProds, concepts: currentConcepts, combos: currentCombos, sources: currentSources, seeded };
}
