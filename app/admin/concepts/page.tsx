'use client';

import { useEffect, useState } from 'react';
import { Concept } from '@/lib/types';
import { Plus, Trash2, Search, Filter, Eye, Edit, EyeOff } from 'lucide-react';

import { importVerifiedConceptsFromCsv } from '@/lib/importVerifiedConcepts';

export default function AdminConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingImport, setLoadingImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('All');
  const [viewConcept, setViewConcept] = useState<Concept | null>(null);

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      const res = await fetch('/api/admin/concepts');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không tải được dữ liệu từ database.');
      } else {
        setConcepts(data.concepts || []);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa concept này?')) return;
    try {
      const res = await fetch(`/api/admin/concepts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConcepts(concepts.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi xảy ra.');
      }
    } catch (err) {
      alert('Có lỗi xảy ra.');
    }
  };

  const handleImportVerified = async () => {
    if (!confirm('Hành động này sẽ thay thế toàn bộ concept hiện tại bằng dữ liệu từ CSV. Bạn có chắc chắn?')) return;
    setLoadingImport(true);
    const imported = await importVerifiedConceptsFromCsv(true);
    setConcepts(imported);
    setLoadingImport(false);
    alert(`Đã nạp thành công ${imported.length} concept.`);
  };

  const styles = ['All', ...Array.from(new Set(concepts.map(c => c.style)))];

  const filteredConcepts = concepts.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStyle = filterStyle === 'All' || c.style === filterStyle;
    return matchSearch && matchStyle;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Quản lý Concept</h1>
          <p className="text-sm text-[#627386] mt-1">Danh sách concept không gian nội thất</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleImportVerified}
            disabled={loadingImport}
            className="flex items-center gap-2 bg-[#F3F7FA] text-[#123C5A] border border-[#D8E2EA] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#EEF4F7] transition-colors disabled:opacity-50"
          >
            {loadingImport ? 'Đang nạp...' : 'Nạp concept verified CSV'}
          </button>
          <button 
            className="flex items-center gap-2 bg-[#123C5A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#123C5A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm concept
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#D8E2EA] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
          <input 
            type="text" 
            placeholder="Tìm theo tên concept..." 
            className="w-full pl-9 pr-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#627386]" />
          <select 
            className="px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A] bg-white"
            value={filterStyle}
            onChange={e => setFilterStyle(e.target.value)}
          >
            {styles.map(s => <option key={s} value={s}>{s === 'All' ? 'Tất cả style' : s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8E2EA] bg-[#F3F7FA]">
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Hình ảnh</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Tên concept</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Loại phòng</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredConcepts.map((c) => (
              <tr key={c.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                <td className="px-6 py-4">
                  <img src={c.image} alt={c.title} className="w-20 h-12 rounded-lg object-cover bg-[#EEF4F7]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[#0B1623]">{c.title}</td>
                <td className="px-6 py-4 text-sm text-[#627386]">
                  {c.roomType}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewConcept(c)} className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Ẩn/Hiện">
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1623]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-[#0B1623]">Chi tiết Concept</h2>
                <button onClick={() => setViewConcept(null)} className="text-[#627386] hover:text-[#0B1623]">X</button>
              </div>
              <img src={viewConcept.image} alt={viewConcept.title} className="w-full h-48 rounded-xl object-cover bg-[#F3F7FA] mb-4" />
              <h3 className="text-lg font-bold text-[#0B1623] mb-1">{viewConcept.title}</h3>
              <p className="text-sm text-[#627386] mb-4">{viewConcept.shortDescription || viewConcept.description}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Loại phòng</span><span className="font-medium text-[#0B1623]">{viewConcept.roomType}</span></div>
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Phong cách</span><span className="font-medium text-[#0B1623]">{viewConcept.style}</span></div>
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Ngân sách</span><span className="font-medium text-[#0B1623]">{viewConcept.budgetRange}</span></div>
              </div>
            </div>
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D8E2EA] flex justify-end">
              <button onClick={() => setViewConcept(null)} className="px-5 py-2.5 bg-white text-[#0B1623] border border-[#D8E2EA] font-semibold rounded-xl text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
