'use client';

import { useEffect, useState } from 'react';
import { Shield, User, Lock, Trash2, Search, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type DbUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'CUSTOMER' | 'SHOWROOM' | 'ADMIN';
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    if (!confirm(`Bạn có chắc chắn muốn đổi quyền thành ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole as any } : u));
      } else {
        alert('Có lỗi xảy ra khi đổi quyền.');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Quản lý Người dùng</h1>
          <p className="text-sm text-[#627386] mt-1">Quản trị tài khoản, phân quyền hệ thống</p>
        </div>
      </div>

      <div className="flex bg-white p-4 rounded-2xl border border-[#D8E2EA] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc email..." 
            className="w-full pl-9 pr-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#627386]">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8E2EA] bg-[#F3F7FA]">
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Phân quyền</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EEF4F7] flex items-center justify-center text-[#123C5A] font-bold">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B1623]">{u.name || 'Người dùng ẩn danh'}</p>
                        <p className="text-xs text-[#627386]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-red-50 text-red-600' :
                      u.role === 'SHOWROOM' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {u.role === 'SHOWROOM' && <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#627386]">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <select 
                        className="text-xs border border-[#D8E2EA] rounded-lg px-2 py-1 outline-none mr-2 bg-white"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SHOWROOM">Showroom</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Khóa tài khoản">
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[#627386]">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
