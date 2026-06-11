'use client';

import { useEffect, useState } from 'react';
import { Lead, LeadStatus } from '@/lib/types';
import LeadTable from '@/components/showroom/LeadTable';
import LeadKanban from '@/components/showroom/LeadKanban';
import LeadDetailModal from '@/components/showroom/LeadDetailModal';
import { Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không tải được dữ liệu từ database.');
      } else {
        setLeads(data.leads || []);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      'Mã yêu cầu', 'Khách hàng', 'Số điện thoại', 'Email', 
      'Concept/Phòng', 'Ngân sách', 'Trạng thái', 'Ngày tạo', 
      'Số sản phẩm', 'Giá trị thấp nhất', 'Giá trị cao nhất', 
      'Cần lắp đặt', 'Ghi chú khách hàng', 'Ghi chú nội bộ'
    ];
    const rows = leads.map(l => [
      l.requestCode,
      `"${(l.customerName || '').replace(/"/g, '""')}"`,
      l.phone,
      l.email || '',
      `"${(l.selectedConcept || l.roomType || '').replace(/"/g, '""')}"`,
      `"${l.budgetRange}"`,
      l.status,
      formatDate(l.createdAt),
      l.selectedProducts.length.toString(),
      l.estimatedValueMin.toString(),
      l.estimatedValueMax.toString(),
      l.needsInstallation ? 'Có' : 'Không',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.adminNote || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
        if (selectedLead?.id === id) {
          setSelectedLead({ ...selectedLead, status });
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleAdminNoteChange = async (id: string, note: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note }) // mapping internal logic
      });
      if (res.ok) {
        setLeads(leads.map(l => l.id === id ? { ...l, adminNote: note, notes: note } : l));
        if (selectedLead?.id === id) {
          setSelectedLead({ ...selectedLead, adminNote: note, notes: note });
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-bold">Lỗi</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Quản lý yêu cầu báo giá</h1>
          <p className="text-sm text-[#627386] mt-1">Theo dõi và cập nhật trạng thái báo giá cho khách hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-[#EEF4F7] p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#123C5A] text-white' : 'text-[#627386] hover:text-[#0B1623]'}`}
            >Danh sách</button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-[#123C5A] text-white' : 'text-[#627386] hover:text-[#0B1623]'}`}
            >Kanban</button>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-[#D8E2EA] text-[#0B1623] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#EEF4F7] transition-colors ml-2"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm p-6">
        {loading ? (
          <div className="text-center py-20 text-[#627386]">Đang tải dữ liệu...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-[#627386]">Chưa có dữ liệu yêu cầu báo giá.</div>
        ) : (
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <LeadTable leads={leads} onStatusChange={handleStatusChange} onLeadClick={handleLeadClick} />
            </div>
          ) : (
            <LeadKanban leads={leads} onStatusChange={handleStatusChange} onLeadClick={handleLeadClick} />
          )
        )}
      </div>

      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onStatusChange={handleStatusChange} 
          onAdminNoteChange={handleAdminNoteChange}
        />
      )}
    </div>
  );
}
