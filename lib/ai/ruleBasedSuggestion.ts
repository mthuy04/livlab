import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getRuleBasedSuggestion(input: any, candidateConcepts: any[], candidateProducts: any[]) {
  // 1. Pick the best concept
  let bestConcept = null;
  let bestConceptScore = -1;

  for (const c of candidateConcepts) {
    let score = 0;
    if (input.style && c.style && c.style.toLowerCase() === input.style.toLowerCase()) score += 3;
    if (input.roomType && c.roomType && c.roomType.toLowerCase() === input.roomType.toLowerCase()) score += 2;
    if (c.imageUrl) score += 1;
    // We could parse budgetRange and areaRange but for simplicity, we rely on style/roomType matching

    if (score > bestConceptScore) {
      bestConceptScore = score;
      bestConcept = c;
    }
  }

  // 2. Pick best-value products
  const recommendedProducts = [];
  let estimatedTotal = 0;
  const needs = input.needs || [];
  
  // Group products by category
  const productsByCategory: Record<string, any[]> = {};
  for (const p of candidateProducts) {
    const cat = (p.category || 'other').toLowerCase();
    if (!productsByCategory[cat]) productsByCategory[cat] = [];
    productsByCategory[cat].push(p);
  }

  const missingItems = [];

  for (const need of needs) {
    const needLower = need.toLowerCase();
    const availableProducts = productsByCategory[needLower] || [];
    
    if (availableProducts.length === 0) {
      missingItems.push(need);
      continue;
    }

    // Score available products
    // Prioritize valid price, imageUrl, and best value
    let bestProduct = null;
    let bestScore = -1;

    for (const p of availableProducts) {
      let score = 0;
      if (p.imageUrl) score += 2;
      const price = p.priceMax || p.priceMin || 0;
      if (price > 0) score += 3;
      
      // Best value logic: we want products that don't eat up the entire budget but aren't necessarily the absolute cheapest if they lack image.
      // E.g., if we have remaining budget
      const remainingBudget = input.budgetMax - estimatedTotal;
      if (price > 0 && price <= remainingBudget) {
        score += 2; // Fits within remaining budget comfortably
      } else if (price > remainingBudget) {
        score -= 2; // Over budget
      }

      if (score > bestScore) {
        bestScore = score;
        bestProduct = p;
      }
    }

    if (bestProduct) {
      const price = bestProduct.priceMax || bestProduct.priceMin || 0;
      recommendedProducts.push({
        id: bestProduct.id,
        name: bestProduct.name,
        brand: bestProduct.brand,
        category: bestProduct.category,
        price,
        imageUrl: bestProduct.imageUrl,
        reason: `Lựa chọn tối ưu ngân sách cho ${bestProduct.category}`,
        quantity: 1
      });
      estimatedTotal += price;
    } else {
      missingItems.push(need);
    }
  }

  let budgetFit = "WITHIN_BUDGET";
  if (estimatedTotal < input.budgetMin) budgetFit = "UNDER_BUDGET";
  else if (estimatedTotal > input.budgetMax * 1.1) budgetFit = "OVER_BUDGET";
  else if (estimatedTotal > input.budgetMax) budgetFit = "SLIGHTLY_OVER_BUDGET";

  const fitScore = bestConceptScore > 0 ? Math.min(100, 70 + (recommendedProducts.length * 5)) : 60;

  const serviceSuggestions = (input.additionalServices || []).map((s: string) => ({
    type: s.toUpperCase(),
    reason: `Theo yêu cầu ${s} của bạn.`
  }));

  return {
    source: "RULE_FALLBACK",
    input,
    suggestion: {
      summary: "Đây là cấu hình gợi ý dựa trên thuật toán tối ưu của LivLab khi hệ thống AI đang bận.",
      recommendedConcept: bestConcept ? {
        id: bestConcept.id,
        title: bestConcept.title,
        imageUrl: bestConcept.imageUrl,
        style: bestConcept.style,
        roomType: bestConcept.roomType
      } : null,
      recommendedProducts,
      estimatedTotal,
      budgetFit,
      fitScore,
      styleReason: bestConcept ? `Concept ${bestConcept.title} phù hợp với phong cách ${input.style || ''} bạn chọn.` : "Không tìm thấy concept phù hợp hoàn toàn.",
      serviceSuggestions,
      missingItems,
      nextStep: "Gửi yêu cầu báo giá để chúng tôi tư vấn chi tiết hơn."
    }
  };
}
