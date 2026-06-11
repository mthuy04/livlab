'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { LogOut, Users, Package, FileText, TrendingUp } from 'lucide-react';

export default function ShowroomDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1623]">Bảng điều khiển Showroom</h1>
            <p className="text-[#627386] text-sm mt-1">Xin chào, {user?.name || 'Showroom'}</p>
          </div>
          
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D8E3EC] rounded-xl text-sm font-bold text-[#627386] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard 
            title="Lead mới" 
            value="12" 
            icon={<Users className="w-5 h-5 text-[#123C5A]" />} 
          />
          <DashboardCard 
            title="Báo giá đang xử lý" 
            value="8" 
            icon={<FileText className="w-5 h-5 text-orange-500" />} 
          />
          <DashboardCard 
            title="Sản phẩm" 
            value="156" 
            icon={<Package className="w-5 h-5 text-[#C8A96A]" />} 
          />
          <DashboardCard 
            title="Doanh thu dự kiến" 
            value="1.2B đ" 
            icon={<TrendingUp className="w-5 h-5 text-green-600" />} 
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[20px] border border-[#D8E3EC] shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-bold text-[#627386] mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-[#0B1623]">{value}</h3>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#F3F7FA] flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
