'use client';

import { useEffect, useState } from 'react';
import { Product, Concept, Lead, LeadStatus } from '@/lib/types';
import { Package, Layers, FileText, TrendingUp, Users, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardStats from '@/components/showroom/DashboardStats';
import LeadTable from '@/components/showroom/LeadTable';
import LeadKanban from '@/components/showroom/LeadKanban';
import LeadDetailModal from '@/components/showroom/LeadDetailModal';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminDemoAnalytics } from '@/lib/adminDemoAnalytics';

const COLORS = ['#123C5A', '#C8A96A', '#486581', '#D8E2EA', '#F05252'];

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, prodsRes, conceptsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/products'),
        fetch('/api/admin/concepts')
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (prodsRes.ok) {
        const data = await prodsRes.json();
        setProducts(data.products || []);
      }
      if (conceptsRes.ok) {
        const data = await conceptsRes.json();
        setConcepts(data.concepts || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'Mới').length;
  const contactedLeads = leads.filter(l => l.status === 'Đã liên hệ').length;
  const wonLeads = leads.filter(l => l.status === 'Đã chốt').length;

  const pipelineValue = leads
    .filter(l => ['Mới', 'Đã liên hệ', 'Đã báo giá'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedValueMax || 0), 0);

  const fmtValue = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M';
    return n.toLocaleString('vi-VN');
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
        body: JSON.stringify({ notes: note })
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
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">-5% so với tuần trước</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Đã chốt</p>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">{wonLeads}</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18% so với tháng trước</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8E2EA] shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-[#627386]">Giá trị ước tính</p>
            <div className="w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#123C5A]" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1623]">~ {fmtValue(pipelineValue)}</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +22% so với tháng trước</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[#0B1623] mb-6">Xu hướng yêu cầu báo giá</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminDemoAnalytics.weeklyRequests}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF4F7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#627386', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#627386', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid #D8E2EA', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 'bold', color: '#0B1623'}}
                />
                <Line type="monotone" dataKey="value" stroke="#123C5A" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0B1623] mb-6">Phân bổ ngân sách</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adminDemoAnalytics.budgetDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {adminDemoAnalytics.budgetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid #D8E2EA'}}
                  itemStyle={{color: '#0B1623', fontWeight: 500}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm p-6 lg:col-span-3">
          <h2 className="text-lg font-bold text-[#0B1623] mb-6">Lead theo trạng thái</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminDemoAnalytics.leadStatusDistribution} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF4F7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#627386', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#627386', fontSize: 12}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#F3F7FA'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #D8E2EA'}}
                />
                <Bar dataKey="value" fill="#C8A96A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
