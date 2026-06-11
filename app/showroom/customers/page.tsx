'use client';

import { Users } from 'lucide-react';

export default function ShowroomCustomersPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Khách hàng</h1>
          <p className="text-[#627386] text-sm mt-1">Quản lý thông tin khách hàng và liên hệ.</p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 text-center py-16">
        <Users className="w-12 h-12 text-[#D8E2EA] mx-auto mb-4" />
        <p className="text-lg text-[#0B1623] font-bold">Chưa có dữ liệu Khách hàng</p>
        <p className="text-[#627386] text-sm mt-2">Dữ liệu khách hàng sẽ hiển thị ở đây khi có lead mới.</p>
      </div>
    </div>
  );
}
