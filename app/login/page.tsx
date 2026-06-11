'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Store, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, loginDemo } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      // AuthContext will update user state, but let's redirect manually based on result.user if we returned it,
      // or we can just redirect to a protected route and let the guard handle it.
      // Actually let's assume login() returns the user or we handle it in context.
      // If we don't have user role here, we might just redirect to /account and let it redirect further.
      // Wait, let's update AuthContext to return the user. I'll modify AuthContext in a sec.
      if (result.user?.role === 'ADMIN') router.push('/admin');
      else if (result.user?.role === 'SHOWROOM') router.push('/showroom');
      else router.push('/visual-studio');
    }
  };

  const handleDemo = async (demoRole: UserRole) => {
    setLoading(true);
    await loginDemo(demoRole);
    setLoading(false);
    if (demoRole === 'ADMIN') router.push('/admin');
    else if (demoRole === 'SHOWROOM') router.push('/showroom');
    else router.push('/visual-studio');
  };

  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === 'true';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-24">
      <div className="bg-white rounded-[24px] p-8 max-w-md w-full border border-[#D8E3EC] shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0B1623] mb-2">Đăng nhập LivLab</h1>
          <p className="text-[#627386] text-sm">
            Truy cập không gian tư vấn, giỏ báo giá và bảng điều khiển showroom.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#0B1623] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0B1623] mb-1.5">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#123C5A] text-white font-bold rounded-xl hover:bg-[#0B1623] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {isDev && (
          <div className="mt-8 pt-6 border-t border-[#D8E3EC]">
            <p className="text-[10px] font-bold text-[#627386] mb-3 text-center uppercase tracking-widest">Tài khoản thử nghiệm</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemo('CUSTOMER')}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl hover:bg-[#EEF4F7] transition-colors disabled:opacity-50"
              >
                <User className="w-4 h-4 text-[#123C5A]" />
                <span className="text-[11px] font-bold text-[#0B1623]">Khách</span>
              </button>
              <button
                onClick={() => handleDemo('SHOWROOM')}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl hover:bg-[#EEF4F7] transition-colors disabled:opacity-50"
              >
                <Store className="w-4 h-4 text-[#C8A96A]" />
                <span className="text-[11px] font-bold text-[#0B1623]">Showroom</span>
              </button>
              <button
                onClick={() => handleDemo('ADMIN')}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl hover:bg-[#EEF4F7] transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span className="text-[11px] font-bold text-[#0B1623]">Admin</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[#627386]">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-[#123C5A] font-bold hover:underline">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}
