import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products as fallbackProducts } from '@/lib/data';
import { seededProducts } from '@/lib/seedData';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] DB rỗng, trả về fallback demo data (Development)');
        const fallback = seededProducts.length > 0 ? seededProducts : fallbackProducts;
        return NextResponse.json({ products: fallback, source: 'fallback' });
      }
      return NextResponse.json({ products: [], source: 'database' }, { status: 200 });
    }

    const mappedProducts = products.map(p => ({
      ...p,
      image: p.imageUrl || null
    }));

    return NextResponse.json({ products: mappedProducts, source: 'database' });
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
        imageUrl: data.image || null,
        category: data.category || 'Accessories',
        status: 'ACTIVE'
      }
    });
    return NextResponse.json({ product: { ...newProduct, image: newProduct.imageUrl } }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Lỗi tạo sản phẩm mới trên database.' }, { status: 500 });
  }
}

