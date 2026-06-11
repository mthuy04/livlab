'use client';

import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { User, FileText, Heart, LogOut, ArrowRight, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, logout, loading, isCustomer } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user || !isCustomer) {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-[#486581]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Vui lòng đăng nhập</h2>
          <p className="text-[#627386] text-sm mb-8 leading-relaxed">
            Bạn cần đăng nhập bằng tài khoản Khách hàng để xem thông tin tài khoản.
          </p>
          <Link href="/login" className="flex items-center justify-center w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors text-sm">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-[#0B1623] mb-8">Tài khoản của bạn</h1>
        
        <div className="bg-white rounded-3xl border border-[#D8E2EA] shadow-sm overflow-hidden mb-8">
          <div className="p-8 border-b border-[#D8E2EA] flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#EEF4F7] flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-[#123C5A]">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0B1623] mb-1">{user.name}</h2>
              <p className="text-[#627386] text-sm mb-2">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF4EF] text-[#C8A96A] text-xs font-semibold">
                <User className="w-3.5 h-3.5" />
                Khách hàng LivLab
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-sm font-bold text-[#0B1623] uppercase tracking-widest mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-[#A0ACA2] font-semibold mb-1">Số điện thoại</p>
                <p className="text-[#0B1623] font-medium">{user.phone || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-xs text-[#A0ACA2] font-semibold mb-1">Mật khẩu</p>
                <p className="text-[#0B1623] font-medium">••••••••</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/my-quotes" className="group bg-white rounded-3xl border border-[#D8E2EA] shadow-sm p-6 flex flex-col hover:border-[#486581] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mb-4 group-hover:bg-[#486581] transition-colors">
              <FileText className="w-6 h-6 text-[#486581] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1623] mb-1">Yêu cầu đã gửi</h3>
            <p className="text-sm text-[#627386] mb-4">Quản lý và theo dõi trạng thái các báo giá.</p>
            <div className="mt-auto flex items-center gap-1 text-[#123C5A] text-sm font-semibold group-hover:text-[#C8A96A] transition-colors">
              Xem chi tiết <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
          
          <Link href="/saved" className="group bg-white rounded-3xl border border-[#D8E2EA] shadow-sm p-6 flex flex-col hover:border-[#C8A96A] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF4EF] flex items-center justify-center mb-4 group-hover:bg-[#123C5A] transition-colors">
              <Heart className="w-6 h-6 text-[#C8A96A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1623] mb-1">Concept đã lưu</h3>
            <p className="text-sm text-[#627386] mb-4">Các không gian cảm hứng bạn đã đánh dấu.</p>
            <div className="mt-auto flex items-center gap-1 text-[#123C5A] text-sm font-semibold group-hover:text-[#C8A96A] transition-colors">
              Xem chi tiết <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
