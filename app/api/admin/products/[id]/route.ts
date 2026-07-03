import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();
    
    // Validate if it exists in DB
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm trong database.' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data
    });
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật database.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm trong database.' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Lỗi xoá dữ liệu database.' }, { status: 500 });
  }
}
