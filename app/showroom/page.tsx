'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Users, Package, FileText, TrendingUp, Download, Eye, Link } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { showroomAnalytics } from '@/lib/showroomDemoData';
import DemoDataBadge from '@/components/ui/DemoDataBadge';
import { Lead, LeadStatus } from '@/lib/types';
import LeadTable from '@/components/showroom/LeadTable';
import LeadKanban from '@/components/showroom/LeadKanban';
import LeadDetailModal from '@/components/showroom/LeadDetailModal';

const COLORS = ['#123C5A', '#C8A96A', '#486581', '#D8E2EA', '#F05252'];

export default function ShowroomDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    if (user?.role === 'CUSTOMER') {
      router.push('/');
    }
  }, [user, router]);

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
      console.error('Error fetching showroom leads:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;
  if (user?.role === 'CUSTOMER') return null;

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'Mới').length;
  const processingLeads = leads.filter(l => ['Mới', 'Đã liên hệ', 'Đã báo giá'].includes(l.status)).length;
  
  const pipelineValue = leads
    .filter(l => ['Mới', 'Đã liên hệ', 'Đã báo giá'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedValueMax || 0), 0);

  const fmtValue = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M';
    return n.toLocaleString('vi-VN');
  };

  const productCounts = leads.flatMap(l => l.selectedProducts).reduce((acc, p) => {
    if (!acc[p.productId]) {
      acc[p.productId] = { id: p.productId, name: p.name, image: p.image || '/images/products/placeholder-sanitary.png', price: `${p.priceMin.toLocaleString('vi-VN')} đ`, count: 0 };
    }
    acc[p.productId].count += p.quantity;
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      // Assuming showroom shares the same API endpoint for updating
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Tổng quan hoạt động</h1>
          <p className="text-[#627386] text-sm mt-1">Xin chào, {user?.name || 'Showroom'} - Dưới đây là tóm tắt kinh doanh</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#123C5A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#0B1623] transition-colors">
            Tạo báo giá mới
          </button>
        </div>
      </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard 
            title="Lead mới" 
            value={newLeads.toString()} 
            icon={<Users className="w-5 h-5 text-[#123C5A]" />} 
            trend="+18% tuần này"
            trendColor="text-green-600"
          />
          <DashboardCard 
            title="Báo giá đang xử lý" 
            value={processingLeads.toString()} 
            icon={<FileText className="w-5 h-5 text-orange-500" />} 
            trend="+6% tuần trước"
            trendColor="text-green-600"
          />
          <DashboardCard 
            title="Sản phẩm trong catalogue" 
            value="156" 
            icon={<Package className="w-5 h-5 text-[#C8A96A]" />} 
            trend="Đã đồng bộ"
            trendColor="text-[#627386]"
          />
          <DashboardCard 
            title="Doanh thu dự kiến" 
            value={`~${fmtValue(pipelineValue)}`} 
            icon={<TrendingUp className="w-5 h-5 text-green-600" />} 
            trend="+22% tháng này"
            trendColor="text-green-600"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1623]">Xu hướng lead trong tuần</h2>
              <DemoDataBadge />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={showroomAnalytics.weeklyRequests}>
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

          <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1623]">Phân bổ ngân sách khách hàng</h2>
              <DemoDataBadge />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={showroomAnalytics.budgetDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {showroomAnalytics.budgetDistribution.map((entry, index) => (
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

          <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1623]">Lead theo trạng thái</h2>
              <DemoDataBadge />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={showroomAnalytics.leadStatusDistribution} barSize={40}>
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

        {/* Lead Pipeline & Product Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1623]">Yêu cầu báo giá mới</h2>
              <div className="flex gap-2">
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
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#D8E2EA] rounded-xl bg-[#F8FAFC]">
                <FileText className="w-8 h-8 text-[#627386] mx-auto mb-3" />
                <p className="text-[#0B1623] font-medium">Chưa có yêu cầu báo giá thật.</p>
                <p className="text-[#627386] text-sm mt-1">Khi khách gửi form báo giá, lead sẽ xuất hiện tại đây.</p>
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

          <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1623]">Sản phẩm được quan tâm</h2>
            </div>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                 <div className="text-center py-6">
                   <p className="text-[#627386] text-sm">Chưa có dữ liệu sản phẩm quan tâm.</p>
                 </div>
              ) : (
                topProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F3F7FA] transition-colors border border-transparent hover:border-[#D8E2EA]">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0B1623] truncate">{p.name}</p>
                      <p className="text-xs text-[#627386]">{p.count} yêu cầu báo giá</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#123C5A]">{p.price}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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

function DashboardCard({ title, value, icon, trend, trendColor }: { title: string, value: string, icon: React.ReactNode, trend?: string, trendColor?: string }) {
  return (
    <div className="bg-white p-6 rounded-[20px] border border-[#D8E3EC] shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-[#627386]">{title}</p>
        <div className="w-10 h-10 rounded-xl bg-[#F3F7FA] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-[#0B1623]">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendColor || 'text-[#627386]'}`}>
            {trend.includes('+') && <TrendingUp className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
