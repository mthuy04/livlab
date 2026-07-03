import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product } from '@/lib/types';

// Public storefront catalog — no auth. This is the real DB data customers browse,
// as opposed to /api/admin/products which requires an admin/showroom session.
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { showroom: true },
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      return NextResponse.json({ products: [], isEmpty: true });
    }

    const mapped: Product[] = products.map((p) => ({
      id: p.id,
      slug: p.slug || undefined,
      name: p.name,
      category: p.category || '',
      brand: p.brand || '',
      // Prisma's Product model has no sku column — the id is the only stable
      // unique value we have, so it doubles as sku for slug generation etc.
      sku: p.id,
      priceMin: p.priceMin || 0,
      priceMax: p.priceMax || 0,
      priceRange: p.priceRange || '',
      material: p.material || undefined,
      finish: p.finish || undefined,
      dimensions: p.dimensions || undefined,
      warranty: p.warranty || undefined,
      image: p.imageUrl || '',
      // No stock-state column in Prisma yet; admin-entered products are assumed sellable.
      availability: 'In Stock',
      status: p.status === 'ACTIVE' ? 'Còn hàng' : 'Ngừng kinh doanh',
      // No description column in Prisma's Product model yet.
      description: '',
      showroomName: p.showroom?.name || 'LivLab',
      showroomLocation: p.showroom?.address || '',
      showroomContact: p.showroom?.phone || p.showroom?.contactName || undefined,
      sellerType: 'Showroom đối tác',
      sourceUrl: p.sourceUrl || undefined,
      priceSource: p.sourceUrl ? 'Giá tham khảo từ nguồn liên kết' : undefined,
      popularity: 0,
    }));

    return NextResponse.json({ products: mapped, isEmpty: false });
  } catch (error) {
    console.error('Error fetching public products:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu sản phẩm.' }, { status: 500 });
  }
}
