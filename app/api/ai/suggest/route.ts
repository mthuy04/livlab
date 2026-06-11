import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getRuleBasedSuggestion } from '@/lib/ai/ruleBasedSuggestion';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // 1. Validation
    if (typeof input.budgetMin !== 'number' || typeof input.budgetMax !== 'number') {
      return NextResponse.json({ error: 'budgetMin and budgetMax must be numbers' }, { status: 400 });
    }
    if (input.budgetMax < input.budgetMin) {
      return NextResponse.json({ error: 'budgetMax must be >= budgetMin' }, { status: 400 });
    }

    // 2. Fetch candidates
    const allConcepts = await prisma.concept.findMany({ take: 50 });
    const allProducts = await prisma.product.findMany({ take: 200 });

    // Pre-filter/Score concepts
    let candidateConcepts = allConcepts.map(c => {
      let score = 0;
      if (input.style && c.style && c.style.toLowerCase().includes(input.style.toLowerCase())) score += 3;
      if (input.roomType && c.roomType && c.roomType.toLowerCase().includes(input.roomType.toLowerCase())) score += 2;
      if (c.imageUrl) score += 1;
      return { ...c, _score: score };
    }).sort((a, b) => b._score - a._score).slice(0, 8);

    // Pre-filter/Score products
    const needs = input.needs || [];
    let candidateProducts = allProducts.map(p => {
      let score = 0;
      if (p.category && needs.some((n: string) => n.toLowerCase() === p.category?.toLowerCase())) score += 3;
      if ((p.priceMax || p.priceMin || 0) > 0) score += 2;
      if (p.imageUrl) score += 1;
      return { ...p, _score: score };
    }).filter(p => p._score > 0).sort((a, b) => b._score - a._score).slice(0, 30);

    // Provide clean candidate lists (no huge metadata)
    const cleanConcepts = candidateConcepts.map(c => ({
      id: c.id,
      title: c.title,
      style: c.style,
      roomType: c.roomType,
      budgetRange: c.budgetRange,
      imageUrl: c.imageUrl
    }));

    const cleanProducts = candidateProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.priceMax || p.priceMin || 0,
      imageUrl: p.imageUrl
    }));

    // 3. Fallback check
    if (!process.env.GEMINI_API_KEY) {
      console.warn('No GEMINI_API_KEY found, using rule-based fallback.');
      const fallbackResponse = await getRuleBasedSuggestion(input, cleanConcepts, cleanProducts);
      return NextResponse.json(fallbackResponse);
    }

    // 4. Gemini Integration
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `You are LivLab's AI bathroom bundle advisor. Recommend a bathroom concept and product bundle using ONLY the provided database candidates. Do not invent new products, brands, prices, images, or concepts. Only return product IDs and concept IDs that appear in the candidate lists. If available products are insufficient, explain what is missing. Do not include customer PII.`;

    const promptText = `
Customer Requirements:
- Budget: ${input.budgetMin} to ${input.budgetMax}
- Area: ${input.area || 'Not specified'}
- Style: ${input.style || 'Not specified'}
- Room Type: ${input.roomType || 'Not specified'}
- Needs: ${needs.join(', ') || 'Not specified'}
- Additional Services: ${(input.additionalServices || []).join(', ') || 'None'}

Candidate Concepts:
${JSON.stringify(cleanConcepts, null, 2)}

Candidate Products:
${JSON.stringify(cleanProducts, null, 2)}

Return a structured JSON with your recommendation. Choose exactly ONE concept ID (or null) and an array of product IDs matching their needs.
`;

    // Define response schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        recommendedConceptId: { type: Type.STRING, nullable: true },
        recommendedProducts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              reason: { type: Type.STRING },
              quantity: { type: Type.INTEGER }
            },
            required: ['productId', 'reason', 'quantity']
          }
        },
        budgetFit: { type: Type.STRING, enum: ['UNDER_BUDGET', 'WITHIN_BUDGET', 'SLIGHTLY_OVER_BUDGET', 'OVER_BUDGET'] },
        fitScore: { type: Type.INTEGER },
        styleReason: { type: Type.STRING },
        serviceSuggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ['type', 'reason']
          }
        },
        missingItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        nextStep: { type: Type.STRING }
      },
      required: ['summary', 'recommendedConceptId', 'recommendedProducts', 'budgetFit', 'fitScore', 'styleReason', 'serviceSuggestions', 'missingItems', 'nextStep']
    };

    let geminiResponseText = "";
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      geminiResponseText = response.text || "";
    } catch (e) {
      console.error("Gemini API Error:", e);
      const fallbackResponse = await getRuleBasedSuggestion(input, cleanConcepts, cleanProducts);
      return NextResponse.json(fallbackResponse);
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(geminiResponseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e);
      const fallbackResponse = await getRuleBasedSuggestion(input, cleanConcepts, cleanProducts);
      return NextResponse.json(fallbackResponse);
    }

    // 5. Post-process to guarantee valid DB records and correct pricing
    let estimatedTotal = 0;
    const finalProducts = [];
    
    for (const item of parsedResponse.recommendedProducts || []) {
      const dbProduct = cleanProducts.find(p => p.id === item.productId);
      if (dbProduct) {
        finalProducts.push({
          id: dbProduct.id,
          name: dbProduct.name,
          brand: null, // Omit or fetch if needed
          category: dbProduct.category,
          price: dbProduct.price,
          imageUrl: dbProduct.imageUrl,
          reason: item.reason,
          quantity: item.quantity || 1
        });
        estimatedTotal += dbProduct.price * (item.quantity || 1);
      }
    }

    let finalConcept = null;
    if (parsedResponse.recommendedConceptId) {
      const dbConcept = cleanConcepts.find(c => c.id === parsedResponse.recommendedConceptId);
      if (dbConcept) {
        finalConcept = {
          id: dbConcept.id,
          title: dbConcept.title,
          imageUrl: dbConcept.imageUrl,
          style: dbConcept.style,
          roomType: dbConcept.roomType
        };
      }
    }

    if (finalProducts.length === 0) {
      // If Gemini somehow failed to pick real products, fallback
      const fallbackResponse = await getRuleBasedSuggestion(input, cleanConcepts, cleanProducts);
      return NextResponse.json(fallbackResponse);
    }

    // Budget fit recalculation just to be safe
    let budgetFit = "WITHIN_BUDGET";
    if (estimatedTotal < input.budgetMin) budgetFit = "UNDER_BUDGET";
    else if (estimatedTotal > input.budgetMax * 1.1) budgetFit = "OVER_BUDGET";
    else if (estimatedTotal > input.budgetMax) budgetFit = "SLIGHTLY_OVER_BUDGET";

    const finalOutput = {
      source: "GEMINI",
      input,
      suggestion: {
        summary: parsedResponse.summary,
        recommendedConcept: finalConcept,
        recommendedProducts: finalProducts,
        estimatedTotal,
        budgetFit,
        fitScore: Math.min(100, Math.max(0, parsedResponse.fitScore)),
        styleReason: parsedResponse.styleReason,
        serviceSuggestions: parsedResponse.serviceSuggestions || [],
        missingItems: parsedResponse.missingItems || [],
        nextStep: parsedResponse.nextStep
      }
    };

    return NextResponse.json(finalOutput);

  } catch (error) {
    console.error('Error in AI suggestion API:', error);
    return NextResponse.json({ error: 'Failed to process AI suggestion' }, { status: 500 });
  }
}
