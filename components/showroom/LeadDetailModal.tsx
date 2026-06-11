'use client';

import { Lead, LeadStatus } from '@/lib/types';
import { getProductById } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { X, Phone, Mail, MapPin, Calendar, Layers, Clock, Wrench } from 'lucide-react';
import BudgetFitCard from '@/components/budget/BudgetFitCard';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onAdminNoteChange?: (id: string, note: string) => void;
}

const statusActions: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'Đã liên hệ', label: 'Đánh dấu đã liên hệ', color: 'bg-blue-600 text-white hover:bg-blue-700' },
  { status: 'Đã báo giá', label: 'Đánh dấu đã báo giá', color: 'bg-amber-500 text-white hover:bg-amber-600' },
  { status: 'Đã chốt',    label: 'Đánh dấu đã chốt',    color: 'bg-[#123C5A] text-white hover:bg-[#0B1623]' },
  { status: 'Mất lead',   label: 'Đánh dấu mất lead',   color: 'bg-gray-400 text-white hover:bg-gray-500' },
];

export default function LeadDetailModal({ lead, onClose, onStatusChange, onAdminNoteChange }: LeadDetailModalProps) {
  if (!lead) return null;

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#F3F7FA] shadow-2xl overflow-y-auto slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-[#F3F7FA] border-b border-[#D8E2EA] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-[#627386] font-medium">{lead.requestCode}</p>
            <h3 className="text-base font-bold text-[#0B1623]">{lead.customerName}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center hover:bg-[#D8E2EA] transition-colors">
            <X className="w-4 h-4 text-[#0B1623]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA] space-y-2.5">
            <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">Thông tin khách hàng</h4>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 text-[#627386] flex-shrink-0" />
              <span className="text-[#0B1623]">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-[#627386] flex-shrink-0" />
                <span className="text-[#0B1623]">{lead.email}</span>
              </div>
            )}
            {lead.customerEmail && lead.customerEmail !== lead.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <span className="w-4 h-4 flex items-center justify-center text-[#627386] flex-shrink-0 text-[10px] font-bold">@</span>
                <span className="text-[#627386] italic">Tài khoản: {lead.customerEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <MapPin className="w-4 h-4 text-[#627386] flex-shrink-0" />
              <span className="text-[#0B1623]">{lead.roomType} · {lead.roomSize || 'Chưa xác định'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="w-4 h-4 text-[#627386] flex-shrink-0" />
              <span className="text-[#0B1623]">{formatDate(lead.createdAt)}</span>
            </div>
          </div>

          {/* Room requirements */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
            <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">Yêu cầu không gian</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Ngân sách', value: lead.budgetRange },
                { label: 'Phong cách', value: lead.style || 'Chưa xác định' },
                { label: 'Loại phòng', value: lead.roomType },
                { label: 'Diện tích', value: lead.roomSize || 'Chưa xác định' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-[#627386] uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-sm font-bold text-[#0B1623]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Project details */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA] space-y-2.5">
            <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">Chi tiết dự án</h4>
            {lead.selectedConcept && (
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-[#627386] flex-shrink-0" />
                <span className="text-[#0B1623]">Concept: <strong>{lead.selectedConcept}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#627386] flex-shrink-0" />
              <span className="text-[#0B1623]">Thời gian: <strong>{lead.timeline || 'Chưa xác định'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-[#627386] flex-shrink-0" />
              <span className="text-[#0B1623]">Lắp đặt: <strong>{lead.needsInstallation ? 'Có' : 'Không'}</strong></span>
            </div>
          </div>

          {/* Value and Budget Fit */}
          <div className="bg-[#FDF4EF] rounded-2xl p-4 border border-[#FBE3D5]">
            <h4 className="text-[10px] font-bold text-[#C8A96A] uppercase tracking-wider mb-1">Tổng giá trị ước tính</h4>
            <p className="text-lg font-bold text-[#C8A96A] mb-3">
              {lead.estimatedValueMax > 0 ? `${fmtVnd(lead.estimatedValueMin)} - ${fmtVnd(lead.estimatedValueMax)}` : (lead.estimatedValueMin > 0 ? fmtVnd(lead.estimatedValueMin) : 'Chưa có sản phẩm')}
            </p>
            {lead.budgetFit && lead.budgetFit !== 'UNKNOWN' && (
              <div className="pt-3 border-t border-[#FBE3D5]">
                <p className="text-[10px] font-bold text-[#C8A96A] uppercase tracking-wider mb-2">Mức độ phù hợp ngân sách</p>
                <BudgetFitCard 
                  total={lead.estimatedValueMax || lead.estimatedValueMin} 
                  budgetMin={lead.budgetMin} 
                  budgetMax={lead.budgetMax} 
                  compact={true} 
                  showAdvice={false} 
                />
              </div>
            )}
          </div>

          {/* Products */}
          {lead.selectedProducts && lead.selectedProducts.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
              <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">
                Sản phẩm đã chọn ({lead.selectedProducts.length})
              </h4>
              <div className="space-y-2">
                {lead.selectedProducts.map((item: any, idx) => {
                  const isStr = typeof item === 'string';
                  const pId = isStr ? item : item.productId;
                  const name = isStr ? 'Sản phẩm (legacy)' : item.name;
                  const img = isStr ? '/images/products/placeholder-sanitary.png' : (item.image || '/images/products/placeholder-sanitary.png');
                  const cat = isStr ? 'Unknown' : item.category;
                  const prc = isStr ? 'N/A' : item.priceRange;
                  return (
                    <div key={`${pId}-${idx}`} className="flex items-center gap-3 py-2 border-b border-[#D8E2EA] last:border-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EEF4F7] flex-shrink-0">
                        <img src={img} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#0B1623] truncate">{name}</p>
                        <p className="text-[10px] text-[#627386]">{cat} · {prc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Suggestion Info */}
          {lead.aiSource && (
            <div className="bg-gradient-to-br from-[#EEF4F7] to-white rounded-2xl p-4 border border-[#D8E2EA] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#123C5A] flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">AI</span>
                </div>
                <h4 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider">
                  Khách chọn từ {lead.aiSource === 'GEMINI' ? 'Gemini AI' : 'LivLab Smart Fallback'}
                </h4>
                {lead.aiFitScore !== null && (
                  <span className="ml-auto text-xs font-bold text-[#C8A96A] bg-[#FDF4EF] px-2 py-1 rounded-md">
                    Điểm phù hợp: {lead.aiFitScore}/100
                  </span>
                )}
              </div>
              {lead.aiSummary && (
                <p className="text-sm text-[#627386] italic leading-relaxed">
                  "{lead.aiSummary}"
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="bg-[#EEF4F7] rounded-2xl p-4 border border-[#D8E2EA]">
              <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Ghi chú</h4>
              <p className="text-sm text-[#0B1623] leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
            <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">Cập nhật trạng thái</h4>
            <div className="grid grid-cols-2 gap-2">
              {statusActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => onStatusChange(lead.id, action.status)}
                  disabled={lead.status === action.status}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-default ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status History */}
          {lead.statusHistory && lead.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
              <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-3">Lịch sử trạng thái</h4>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#D8E2EA] before:to-transparent">
                {lead.statusHistory.map((h, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-[#123C5A] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] bg-[#F3F7FA] p-3 rounded-xl border border-[#D8E2EA]">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-[#0B1623] text-xs">{h.status}</h5>
                        <span className="text-[10px] text-[#627386]">{new Date(h.at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {h.note && <p className="text-[11px] text-[#627386]">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Note */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
            <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Ghi chú xử lý nội bộ</h4>
            <textarea
              className="w-full h-24 p-3 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] resize-none"
              placeholder="Thêm ghi chú cho showroom..."
              defaultValue={lead.adminNote || ''}
              onBlur={(e) => {
                 if (onAdminNoteChange) {
                   onAdminNoteChange(lead.id, e.target.value);
                 }
              }}
            />
            <p className="text-[10px] text-[#627386] mt-2 italic">Trong bản demo, showroom cập nhật trạng thái thủ công sau khi liên hệ, gửi báo giá hoặc chốt với khách qua điện thoại/Zalo/email.</p>
          </div>

        </div>
      </div>
    </>
  );
}
