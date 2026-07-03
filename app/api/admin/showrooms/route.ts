import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

  try {
    const showrooms = await prisma.showroom.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ showrooms });
  } catch (error) {
    console.error('Error fetching showrooms:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu từ database.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

  try {
    const data = await request.json();

    if (!data.name) {
      return NextResponse.json({ error: 'Tên showroom là bắt buộc.' }, { status: 400 });
    }

    const showroom = await prisma.showroom.create({
      data: {
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: data.status || 'ACTIVE',
      }
    });

    return NextResponse.json({ showroom }, { status: 201 });
  } catch (error) {
    console.error('Error creating showroom:', error);
    return NextResponse.json({ error: 'Lỗi tạo showroom mới trên database.' }, { status: 500 });
  }
}
