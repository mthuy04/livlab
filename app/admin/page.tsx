'use client';

import { useEffect, useState } from 'react';
import { getStoredProducts, getStoredConcepts, getLeads, updateLeadStatus, updateLeadAdminNote } from '@/lib/storage';
import { Product, Concept, Lead, LeadStatus } from '@/lib/types';
import { Package, Layers, FileText, TrendingUp, Users, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardStats from '@/components/showroom/DashboardStats';
import LeadTable from '@/components/showroom/LeadTable';
import LeadKanban from '@/components/showroom/LeadKanban';
import LeadDetailModal from '@/components/showroom/LeadDetailModal';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    // We try to get from storage, if null it means the defaults from data.ts are used in the app, 
    // but in admin we should show the real count. We'll just show the count from storage or default lengths.
    // For MVP, we can just load the leads which is the main thing.
    const storedLeads = getLeads();
    setLeads(storedLeads);
    
    const p = getStoredProducts() || [];
    setProducts(p.length > 0 ? p : []); // Actually, if we want real count including initial data, we'd import from data.ts
    // For simplicity, let's just count leads for now.
  }, []);

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'Mới').length;
  const contactedLeads = leads.filter(l => l.status === 'Đã liên hệ').length;
  const wonLeads = leads.filter(l => l.status === 'Đã chốt').length;

  const pipelineValue = leads
    .filter(l => ['Mới', 'Đã liên hệ', 'Đã báo giá'].includes(l.status))
    .reduce((sum, l) => sum + l.estimatedValueMax, 0);

  const fmtValue = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M';
    return n.toLocaleString('vi-VN');
  };

  const handleStatusChange = (id: string, status: LeadStatus) => {
    const updated = updateLeadStatus(id, status);
    setLeads(updated);
    if (selectedLead?.id === id) {
      setSelectedLead(updated.find(l => l.id === id) || null);
    }
  };

  const handleAdminNoteChange = (id: string, note: string) => {
    const updated = updateLeadAdminNote(id, note);
    setLeads(updated);
    if (selectedLead?.id === id) {
      setSelectedLead(updated.find(l => l.id === id) || null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Bảng điều khiển Admin</h1>
          <p className="text-sm text-[#627386] mt-1">Xin chào, {user?.name || 'Admin'} - Tổng quan hoạt động kinh doanh</p>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D8E3EC] rounded-xl text-sm font-bold text-[#627386] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Tổng yêu cầu</p>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">{totalLeads}</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% so với tháng trước</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Lead mới</p>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">{newLeads}</h3>
          <p className="text-xs text-[#627386] mt-2">Cần phản hồi ngay</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Đã chốt</p>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">{wonLeads}</h3>
          <p className="text-xs text-[#627386] mt-2">Đơn hàng thành công</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Giá trị ước tính</p>
            <div className="w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#123C5A]" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">~ {fmtValue(pipelineValue)}</h3>
          <p className="text-xs text-[#627386] mt-2">Pipeline hiện tại</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#0B1623]">Yêu cầu báo giá gần đây</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#123C5A] text-white' : 'bg-[#F3F7FA] text-[#627386] hover:bg-[#D8E2EA]'}`}
            >Danh sách</button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-[#123C5A] text-white' : 'bg-[#F3F7FA] text-[#627386] hover:bg-[#D8E2EA]'}`}
            >Kanban</button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[#627386] text-sm">Chưa có yêu cầu báo giá nào.</p>
          </div>
        ) : (
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <LeadTable leads={leads.slice(0, 5)} onStatusChange={handleStatusChange} onLeadClick={setSelectedLead} />
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
          onAdminNoteChange={handleAdminNoteChange}
        />
      )}
    </div>
  );
}
