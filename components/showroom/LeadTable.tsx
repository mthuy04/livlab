'use client';

import { Lead, LeadStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Eye, ChevronDown } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onLeadClick: (lead: Lead) => void;
}

const statusBadge: Record<LeadStatus, string> = {
  'Mới':        'bg-[#FEF3EC] text-[#C8A96A]',
  'Đã liên hệ': 'bg-blue-50 text-blue-700',
  'Đã báo giá': 'bg-amber-50 text-amber-700',
  'Đã chốt':    'bg-[#EEF4F7] text-[#123C5A]',
  'Mất lead':   'bg-gray-100 text-gray-500',
};

const allStatuses: LeadStatus[] = ['Mới', 'Đã liên hệ', 'Đã báo giá', 'Đã chốt', 'Mất lead'];

export default function LeadTable({ leads, onStatusChange, onLeadClick }: LeadTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D8E2EA]">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="bg-[#EEF4F7] text-left">
            {['Khách hàng', 'Số điện thoại', 'Concept / Phòng', 'Ngân sách', 'Trạng thái', 'Ngày tạo', 'Hành động'].map((h) => (
              <th key={h} className="px-4 py-3.5 text-xs font-bold text-[#627386] uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="bg-white hover:bg-[#F3F7FA] transition-colors">
              <td className="px-4 py-4">
                <p className="text-sm font-bold text-[#0B1623]">{lead.customerName}</p>
                <p className="text-[11px] text-[#627386]">{lead.requestCode}</p>
              </td>
              <td className="px-4 py-4 text-sm text-[#627386]">{lead.phone}</td>
              <td className="px-4 py-4">
                <p className="text-sm text-[#0B1623] max-w-[160px] truncate">{lead.selectedConcept || '—'}</p>
                <p className="text-[11px] text-[#627386]">{lead.roomType}</p>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm font-semibold text-[#0B1623]">{lead.budgetRange}</span>
              </td>
              <td className="px-4 py-4">
                <div className="relative inline-block">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    className={`appearance-none text-xs font-semibold px-3 py-1.5 pr-6 rounded-full border-0 cursor-pointer focus:outline-none ${statusBadge[lead.status]}`}
                  >
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-[#627386]">{formatDate(lead.createdAt)}</td>
              <td className="px-4 py-4">
                <button
                  onClick={() => onLeadClick(lead)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#627386] hover:text-[#0B1623] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-14 text-center text-sm text-[#627386] bg-white">
                Chưa có lead nào. Gửi báo giá từ trang <a href="/quote" className="text-[#C8A96A] hover:underline">Yêu cầu báo giá</a> để xem tại đây.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
