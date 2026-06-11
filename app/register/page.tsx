'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Store } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Vui lòng nhập họ và tên.');
    if (!email.trim() || !email.includes('@')) return setError('Vui lòng nhập email hợp lệ.');
    if (!password) return setError('Vui lòng nhập mật khẩu.');
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    if (password !== confirmPassword) return setError('Xác nhận mật khẩu không khớp.');

    setLoading(true);
    const result = await register({ name, email, password, confirmPassword, role });
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-24">
      <div className="bg-white rounded-[24px] p-8 max-w-md w-full border border-[#D8E3EC] shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0B1623] mb-2">Tạo tài khoản LivLab</h1>
          <p className="text-[#627386] text-sm">
            Bắt đầu lưu concept, sản phẩm và yêu cầu báo giá.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                role === 'CUSTOMER' 
                  ? 'border-[#123C5A] bg-[#EEF4F7] text-[#123C5A]' 
                  : 'border-[#D8E3EC] text-[#627386] hover:bg-[#F8FAFC]'
              }`}
            >
              <User className="w-4 h-4" />
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setRole('SHOWROOM')}
              className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                role === 'SHOWROOM' 
                  ? 'border-[#C8A96A] bg-[#FDF4EF] text-[#C8A96A]' 
                  : 'border-[#D8E3EC] text-[#627386] hover:bg-[#F8FAFC]'
              }`}
            >
              <Store className="w-4 h-4" />
              Showroom
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0B1623] mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] transition-all"
            />
          </div>

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
              placeholder="Ít nhất 6 ký tự"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0B1623] mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D8E3EC] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#123C5A] text-white font-bold rounded-xl hover:bg-[#0B1623] transition-colors text-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#627386] pt-6 border-t border-[#D8E3EC]">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-[#123C5A] font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
