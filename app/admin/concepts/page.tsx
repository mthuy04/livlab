'use client';

import { useEffect, useState } from 'react';
import { getStoredConcepts, saveStoredConcepts, deleteStoredConcept } from '@/lib/storage';
import { concepts as initialConcepts } from '@/lib/data';
import { Concept } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

import { importVerifiedConceptsFromCsv } from '@/lib/importVerifiedConcepts';

export default function AdminConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loadingImport, setLoadingImport] = useState(false);

  useEffect(() => {
    const stored = getStoredConcepts();
    if (stored) {
      setConcepts(stored);
    } else {
      setConcepts(initialConcepts);
      saveStoredConcepts(initialConcepts);
    }
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa concept này?')) return;
    const updated = deleteStoredConcept(id);
    setConcepts(updated);
  };

  const handleImportVerified = async () => {
    if (!confirm('Hành động này sẽ thay thế toàn bộ concept hiện tại bằng dữ liệu từ CSV. Bạn có chắc chắn?')) return;
    setLoadingImport(true);
    const imported = await importVerifiedConceptsFromCsv(true);
    setConcepts(imported);
    setLoadingImport(false);
    alert(`Đã nạp thành công ${imported.length} concept.`);
  };

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
            {concepts.map((c) => (
              <tr key={c.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                <td className="px-6 py-4">
                  <img src={c.image} alt={c.title} className="w-20 h-12 rounded-lg object-cover bg-[#EEF4F7]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[#0B1623]">{c.title}</td>
                <td className="px-6 py-4 text-sm text-[#627386]">
                  {c.roomType}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
