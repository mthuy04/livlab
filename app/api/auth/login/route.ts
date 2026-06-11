import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Vui lòng nhập email và mật khẩu.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ ok: false, error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const cookieStore = await cookies();
    cookieStore.set('livlab_session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({
      ok: true,
      user: sessionData
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ ok: false, error: 'Database schema has not been pushed. Please run npx prisma db push.' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'Có lỗi xảy ra khi đăng nhập.' }, { status: 500 });
  }
}
