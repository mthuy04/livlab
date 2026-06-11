'use client';

import { useState } from 'react';
import { Store, MapPin, CheckCircle, Search, Edit, Lock, Eye } from 'lucide-react';

const mockShowrooms = [
  {
    id: 'SR-001',
    name: 'Luxbath Center HCM',
    location: 'Quận 1, TP. Hồ Chí Minh',
    contact: '0901234567 - Mr. Nam',
    productsCount: 150,
    status: 'Đã duyệt',
  },
  {
    id: 'SR-002',
    name: 'Kohler Flagship Store',
    location: 'Quận 2, TP. Hồ Chí Minh',
    contact: '0912345678 - Ms. Lan',
    productsCount: 85,
    status: 'Đã duyệt',
  },
  {
    id: 'SR-003',
    name: 'Thiết Bị Vệ Sinh Cao Cấp Hà Nội',
    location: 'Đống Đa, Hà Nội',
    contact: '0987654321 - Mr. Hải',
    productsCount: 42,
    status: 'Chờ duyệt',
  },
];

export default function AdminShowroomsPage() {
  const [showrooms, setShowrooms] = useState(mockShowrooms);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShowrooms = showrooms.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Quản lý Showroom</h1>
          <p className="text-sm text-[#627386] mt-1">Quản lý các đại lý, showroom đối tác trên LivLab</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-[#123C5A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#123C5A] transition-colors"
        >
          <Store className="w-4 h-4" />
          Thêm Showroom mới
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-2xl border border-[#D8E2EA] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
          <input 
            type="text" 
            placeholder="Tìm showroom, địa chỉ..." 
            className="w-full pl-9 pr-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8E2EA] bg-[#F3F7FA]">
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Thông tin Showroom</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Khu vực</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Số sản phẩm</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredShowrooms.map((s) => (
              <tr key={s.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF4F7] flex items-center justify-center text-[#123C5A]">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0B1623]">{s.name}</p>
                      <p className="text-xs text-[#627386]">{s.contact}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#0B1623]">
                  <div className="flex items-center gap-1 text-[#627386]">
                    <MapPin className="w-4 h-4" />
                    {s.location}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    s.status === 'Đã duyệt' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {s.status === 'Đã duyệt' && <CheckCircle className="w-3 h-3" />}
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[#123C5A]">
                  {s.productsCount}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    {s.status === 'Chờ duyệt' && (
                      <button 
                        className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        onClick={() => {
                          const updated = showrooms.map(sr => sr.id === s.id ? { ...sr, status: 'Đã duyệt' } : sr);
                          setShowrooms(updated);
                        }}
                      >
                        Duyệt
                      </button>
                    )}
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Tạm khóa">
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredShowrooms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[#627386]">
                  Không tìm thấy showroom nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
