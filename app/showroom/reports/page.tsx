'use client';

import { BarChart, Download, Printer } from 'lucide-react';

export default function ShowroomReportsPage() {
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
            <Printer className="w-4 h-4" /> Xuất PDF (In)
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

      <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm p-6 text-center py-16">
        <BarChart className="w-12 h-12 text-[#D8E2EA] mx-auto mb-4" />
        <p className="text-lg text-[#0B1623] font-bold">Báo cáo đang trống</p>
        <p className="text-[#627386] text-sm mt-2">Chưa có đủ dữ liệu từ yêu cầu báo giá thật để tạo biểu đồ báo cáo.</p>
      </div>
    </div>
  );
}
