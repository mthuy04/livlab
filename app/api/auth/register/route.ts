import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword, role } = body;

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Email không hợp lệ.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Mật khẩu phải từ 6 ký tự trở lên.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ ok: false, error: 'Xác nhận mật khẩu không khớp.' }, { status: 400 });
    }
    if (role !== 'CUSTOMER' && role !== 'SHOWROOM') {
      return NextResponse.json({ ok: false, error: 'Vai trò không hợp lệ.' }, { status: 400 });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ ok: false, error: 'Email này đã được sử dụng.' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ ok: false, error: 'Có lỗi xảy ra khi đăng ký.' }, { status: 500 });
  }
}
