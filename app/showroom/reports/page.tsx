'use client';

import { useEffect, useState } from 'react';
import { BarChart, Download, Printer, Loader2, PieChart } from 'lucide-react';
import { Lead } from '@/lib/types';

export default function ShowroomReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/showroom/leads');
        const data = await res.json();
        setLeads(data.leads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValueMin || 0), 0);
  
  const budgetFitStats = leads.reduce((acc, lead) => {
    const fit = lead.budgetFit || 'UNKNOWN';
    acc[fit] = (acc[fit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Báo cáo và Phân tích</h1>
          <p className="text-[#627386] text-sm mt-1">Xem số liệu hoạt động và hiệu suất kinh doanh.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#123C5A] text-sm font-semibold rounded-xl border border-[#D8E2EA] hover:border-[#123C5A] hover:bg-[#EEF4F7] transition-colors"
          >
            <Printer className="w-4 h-4" /> Xuất PDF
          </button>
          <a 
            href="/api/showroom/leads/export"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#123C5A] text-white text-sm font-semibold rounded-xl hover:bg-[#0D2B42] transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#123C5A]" /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 text-center py-16">
          <BarChart className="w-12 h-12 text-[#D8E2EA] mx-auto mb-4" />
          <p className="text-lg text-[#0B1623] font-bold">Báo cáo đang trống</p>
          <p className="text-[#627386] text-sm mt-2">Chưa có đủ dữ liệu từ yêu cầu báo giá thật để tạo biểu đồ báo cáo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-[#D8E2EA] shadow-sm">
            <h3 className="text-sm font-bold text-[#627386] uppercase tracking-wider mb-2">Tổng giá trị dự toán</h3>
            <p className="text-3xl font-bold text-[#123C5A]">{fmtVnd(totalValue)}</p>
            <p className="text-xs text-[#627386] mt-2">Từ {leads.length} yêu cầu báo giá</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-[#D8E2EA] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-[#C8A96A]" />
              <h3 className="text-sm font-bold text-[#0B1623] uppercase tracking-wider">Mức độ phù hợp ngân sách</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-[10px] uppercase font-bold text-green-700 mb-1">Vừa ngân sách</p>
                <p className="text-2xl font-bold text-green-800">{budgetFitStats['WITHIN_BUDGET'] || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] uppercase font-bold text-blue-700 mb-1">Dưới ngân sách</p>
                <p className="text-2xl font-bold text-blue-800">{budgetFitStats['UNDER_BUDGET'] || 0}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">Hơi vượt</p>
                <p className="text-2xl font-bold text-amber-800">{budgetFitStats['SLIGHTLY_OVER_BUDGET'] || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[10px] uppercase font-bold text-red-700 mb-1">Vượt ngân sách</p>
                <p className="text-2xl font-bold text-red-800">{budgetFitStats['OVER_BUDGET'] || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
