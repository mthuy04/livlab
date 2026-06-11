'use client';

import { useEffect, useState } from 'react';
import { Lead, LeadStatus } from '@/lib/types';
import LeadTable from '@/components/showroom/LeadTable';
import LeadKanban from '@/components/showroom/LeadKanban';
import LeadDetailModal from '@/components/showroom/LeadDetailModal';
import { FileText, LayoutList, LayoutGrid } from 'lucide-react';

export default function ShowroomLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/showroom/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
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
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  if (loading) {
    return <div className="p-8 text-[#627386]">Đang tải...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Yêu cầu báo giá (Leads)</h1>
          <p className="text-[#627386] text-sm mt-1">Quản lý và cập nhật trạng thái các yêu cầu từ khách hàng.</p>
        </div>
        
        <div className="flex bg-[#EEF4F7] p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-[#123C5A] shadow-sm' : 'text-[#627386] hover:text-[#0B1623]'}`}
          >
            <LayoutList className="w-4 h-4" /> Danh sách
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white text-[#123C5A] shadow-sm' : 'text-[#627386] hover:text-[#0B1623]'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6">
        {leads.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#D8E2EA] rounded-xl bg-[#F8FAFC]">
            <FileText className="w-12 h-12 text-[#627386] mx-auto mb-4" />
            <p className="text-lg text-[#0B1623] font-bold">Chưa có yêu cầu báo giá thật</p>
            <p className="text-[#627386] text-sm mt-2">Khi khách gửi form báo giá, lead sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <LeadTable leads={leads} onStatusChange={handleStatusChange} onLeadClick={setSelectedLead} />
            </div>
          ) : (
            <LeadKanban leads={leads} onStatusChange={handleStatusChange} onLeadClick={setSelectedLead} />
          )
        )}
      </div>

      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onStatusChange={handleStatusChange} 
        />
      )}
    </div>
  );
}
