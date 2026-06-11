import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('livlab_session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    
    if (!sessionData.id) {
       return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error('Session decode error:', error);
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
}
