import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products as fallbackProducts } from '@/lib/data';
import { seededProducts } from '@/lib/seedData';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('[API] DB rỗng, trả về fallback demo data (Development)');
      const fallback = seededProducts.length > 0 ? seededProducts : fallbackProducts;
      return NextResponse.json({ products: fallback, source: 'fallback' });
    }

    if (products.length === 0) {
      return NextResponse.json({ error: 'Không tải được dữ liệu từ database. Bảng Product hiện đang trống.' }, { status: 404 });
    }

    return NextResponse.json({ products, source: 'database' });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu từ database.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newProduct = await prisma.product.create({
      data: {
        id: `p_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: data.name || 'Sản phẩm mới',
        brand: data.brand || 'LivLab',
        priceRange: data.priceRange || '',
        image: data.image || '/images/products/placeholder-sanitary.png',
        category: data.category || 'Accessories',
        status: 'ACTIVE'
      }
    });
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Lỗi tạo sản phẩm mới trên database.' }, { status: 500 });
  }
}

