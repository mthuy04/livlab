import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '@/lib/auth/sessionToken';

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

    // The cookie carries only what the route gate needs. Email and name are
    // returned in the response body instead — there is no reason to put a
    // customer's details in a cookie that travels with every request.
    const token = await signSession({ id: user.id, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // Lets the portal tell an unassigned showroom account why it is empty
        // instead of showing a blank dashboard.
        showroomId: user.showroomId
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ ok: false, error: 'Database schema has not been pushed. Please run npx prisma db push.' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'Có lỗi xảy ra khi đăng nhập.' }, { status: 500 });
  }
}
