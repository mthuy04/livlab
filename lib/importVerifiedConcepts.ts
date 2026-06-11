import { Concept, Hotspot, Product } from './types';
import { saveStoredConcepts, getStoredConcepts, getStoredProducts } from './storage';
import { parseCSV } from './importVerifiedProducts';

export function mapCsvRowToConcept(row: Record<string, string>, products: Product[]): Concept {
  const parseNum = (val: string) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const splitPipe = (val: string) => val ? val.split('|').map(s => s.trim()).filter(Boolean) : undefined;

  let productIds = splitPipe(row.productIds) || [];
  
  // Clean productIds and map to existing products
  const validProductIds: string[] = [];
  productIds.forEach(id => {
    // Exact match
    let matched = products.find(p => p.id === id);
    if (matched) {
      validProductIds.push(matched.id);
    } else {
      // Graceful fallback match logic can be expanded here if needed
      // Currently skip if not found
    }
  });

  let hotspots: Hotspot[] = [];
  try {
    if (row.hotspots) {
      // Replace double-double quotes with single-double quotes and parse
      let cleanHotspotsStr = row.hotspots.replace(/""/g, '"');
      // Sometimes CSV adds quotes around the whole string
      if (cleanHotspotsStr.startsWith('"') && cleanHotspotsStr.endsWith('"')) {
        cleanHotspotsStr = cleanHotspotsStr.slice(1, -1);
      }
      hotspots = JSON.parse(cleanHotspotsStr) as Hotspot[];
    }
  } catch (error) {
    console.warn(`[LivLab Verified Import] Failed to parse hotspots for concept ${row.id}`, error);
  }

  return {
    id: row.id || `c_${Date.now()}_${Math.random()}`,
    slug: row.slug || '',
    title: row.title || 'Concept không tên',
    roomType: row.roomType || 'Khác',
    style: row.style || '',
    budgetRange: row.budgetRange || '',
    areaSize: row.areaSize || '',
    shortDescription: row.shortDescription || row.description || '',
    description: row.description || '',
    longDescription: row.longDescription || row.description || '',
    image: row.image || '',
    imageAlt: row.imageAlt || row.title,
    productIds: validProductIds,
    hotspots: hotspots,
    suitableFor: splitPipe(row.suitableFor),
    painPoints: splitPipe(row.painPoints),
    keyBenefits: splitPipe(row.keyBenefits),
    tags: splitPipe(row.tags),
    productCount: validProductIds.length,
    estimatedBudgetMin: parseNum(row.estimatedBudgetMin),
    estimatedBudgetMax: parseNum(row.estimatedBudgetMax),
    sourceNote: row.sourceNote || ''
  };
}

export async function importVerifiedConceptsFromCsv(force: boolean = false): Promise<Concept[]> {
  try {
    const existingConcepts = getStoredConcepts();
    const shouldImport = force || !existingConcepts || existingConcepts.length === 0 || existingConcepts.some(c => c.image?.includes('placeholder'));

    if (!shouldImport) {
      return existingConcepts || [];
    }

    console.log('[LivLab Verified Import] Fetching Concepts CSV...');
    const url = '/data/livlab-seed/livlab_verified_concepts_master.csv';
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[LivLab Verified Import] Fetch failed. URL: ${url}, Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch Concepts CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    console.log(`[LivLab Verified Import] URL: ${url}, parsed concept rows: ${rows.length}`);

    if (rows.length === 0) {
      throw new Error(`No data parsed from Concepts CSV.`);
    }

    const currentProducts = getStoredProducts() || [];

    const concepts = rows.map(row => mapCsvRowToConcept(row, currentProducts));
    
    let remoteImageCount = 0;
    concepts.forEach(c => {
      if (c.image?.startsWith('http')) remoteImageCount++;
    });

    console.log(`[LivLab Verified Import] remote images in concepts: ${remoteImageCount}`);
    
    saveStoredConcepts(concepts);
    console.log(`[LivLab Verified Import] saved concepts: ${concepts.length}`);
    
    return concepts;
  } catch (error) {
    console.error('[LivLab Verified Import] Error parsing or fetching Concepts CSV:', error);
    throw error;
  }
}
