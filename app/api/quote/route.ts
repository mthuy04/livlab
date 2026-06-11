import { NextResponse } from 'next/server';
import { PrismaClient, BudgetFitStatus } from '@prisma/client';
import { getBudgetFit } from '@/lib/budget/getBudgetFit';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create lead
    const showroom = await prisma.showroom.findFirst(); // In real app, might find closest showroom
    
    // Fetch real products from DB to calculate real price
    const productIds = (body.items || []).map((item: any) => item.productId || item.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let realEstimatedValue = 0;

    // Process items safely and calculate real total
    const itemsData = (body.items || []).map((item: any) => {
      const pid = item.productId || item.id;
      const dbProd = dbProducts.find(p => p.id === pid);
      
      const realPriceMin = dbProd?.priceMin || item.priceMin || item.price || 0;
      const realPriceMax = dbProd?.priceMax || item.priceMax || item.price || 0;
      const quantity = item.quantity || 1;

      realEstimatedValue += realPriceMin * quantity; // Or average, using Min for estimation

      return {
        productId: pid || null,
        productName: dbProd?.name || item.name || 'Sản phẩm',
        quantity: quantity,
        priceMin: realPriceMin,
        priceMax: realPriceMax,
      };
    });

    const budgetMin = body.budgetMin ? parseInt(body.budgetMin) : null;
    const budgetMax = body.budgetMax ? parseInt(body.budgetMax) : null;
    
    const budgetFitResult = getBudgetFit({
      total: realEstimatedValue,
      budgetMin,
      budgetMax
    });

    const lead = await prisma.quoteLead.create({
      data: {
        customerName: body.customerName || 'Khách hàng ẩn danh',
        email: body.email || null,
        phone: body.phone || null,
        roomType: body.roomType || null,
        budgetRange: body.budgetRange || null,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
        budgetFit: budgetFitResult.status as BudgetFitStatus,
        conceptName: body.conceptName || null,
        estimatedValue: realEstimatedValue,
        notes: body.notes || null,
        showroomId: showroom?.id || null,
        aiSummary: body.aiSummary || null,
        aiFitScore: body.aiFitScore || null,
        aiSource: body.aiSource || null,
        items: {
          create: itemsData
        }
      }
    });

    // If there's an aiLog payload, we can save it too
    if (body.aiLog) {
      await prisma.aiSuggestionLog.create({
        data: {
          inputJson: body.aiLog.input,
          outputJson: body.aiLog.output,
          source: body.aiSource || 'UNKNOWN',
          quoteLeadId: lead.id
        }
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Error creating quote lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
