'use client';

import { Lead, LeadStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ChevronDown, Layers } from 'lucide-react';

interface LeadKanbanProps {
  leads: Lead[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onLeadClick: (lead: Lead) => void;
}

const columns: { status: LeadStatus; labelVi: string; color: string; dot: string }[] = [
  { status: 'Mới',       labelVi: 'Mới',           color: 'bg-[#FEF3EC] border-[#F3C9A8]', dot: 'bg-[#123C5A]' },
  { status: 'Đã liên hệ', labelVi: 'Đã liên hệ',    color: 'bg-blue-50 border-blue-100',   dot: 'bg-blue-500' },
  { status: 'Đã báo giá',    labelVi: 'Đã báo giá',     color: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
  { status: 'Đã chốt',       labelVi: 'Đã chốt',        color: 'bg-[#EEF4F7] border-[#C8D5C6]', dot: 'bg-[#123C5A]' },
  { status: 'Mất lead',      labelVi: 'Mất lead',       color: 'bg-gray-50 border-gray-200',   dot: 'bg-gray-400' },
];

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'Mới',       label: 'Mới' },
  { value: 'Đã liên hệ', label: 'Đã liên hệ' },
  { value: 'Đã báo giá',    label: 'Đã báo giá' },
  { value: 'Đã chốt',       label: 'Đã chốt' },
  { value: 'Mất lead',      label: 'Mất lead' },
];

export default function LeadKanban({ leads, onStatusChange, onLeadClick }: LeadKanbanProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[900px]">
        {columns.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.status);
          return (
            <div key={col.status} className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-bold text-[#0B1623]">{col.labelVi}</span>
                <span className="ml-auto text-xs text-[#627386] bg-white border border-[#D8E2EA] px-2 py-0.5 rounded-full">{colLeads.length}</span>
              </div>

              <div className="space-y-3">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`${col.color} border rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5`}
                    onClick={() => onLeadClick(lead)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-bold text-[#0B1623] leading-snug">{lead.customerName}</p>
                      <div className="flex items-center gap-1 text-[10px] text-[#627386] flex-shrink-0">
                        <Layers className="w-3 h-3" />
                        {lead.selectedProducts.length}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#627386] mb-0.5 truncate">{lead.selectedConcept || lead.roomType}</p>
                    <p className="text-[11px] font-bold text-[#C8A96A] mb-2">{lead.budgetRange}</p>
                    <p className="text-[9px] text-[#627386]">{formatDate(lead.createdAt)}</p>

                    <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={lead.status}
                          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="w-full appearance-none text-[10px] bg-white/80 border border-white/60 rounded-lg px-2.5 py-1.5 pr-6 text-[#0B1623] font-semibold focus:outline-none focus:border-[#123C5A] cursor-pointer"
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#627386] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="border-2 border-dashed border-[#D8E2EA] rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-[#627386]">Không có lead</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
