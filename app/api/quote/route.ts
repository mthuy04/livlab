import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create lead
    const showroom = await prisma.showroom.findFirst(); // In real app, might find closest showroom
    
    // Process items safely
    const itemsData = (body.items || []).map((item: any) => ({
      productId: item.id || null,
      productName: item.name || 'Sản phẩm',
      quantity: item.quantity || 1,
      priceMin: item.price || 0,
      priceMax: item.price || 0,
    }));

    const lead = await prisma.quoteLead.create({
      data: {
        customerName: body.customerName || 'Khách hàng ẩn danh',
        email: body.email || null,
        phone: body.phone || null,
        roomType: body.roomType || null,
        budgetRange: body.budgetRange || null,
        conceptName: body.conceptName || null,
        estimatedValue: body.estimatedValue || 0,
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
