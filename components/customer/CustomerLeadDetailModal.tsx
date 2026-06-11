'use client';

import { Lead } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { X, MapPin, Calendar, Layers, Clock, Wrench } from 'lucide-react';

interface CustomerLeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function CustomerLeadDetailModal({ lead, onClose }: CustomerLeadDetailModalProps) {
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
            <h3 className="text-base font-bold text-[#0B1623]">Chi tiết báo giá</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#EEF4F7] flex items-center justify-center hover:bg-[#D8E2EA] transition-colors">
            <X className="w-4 h-4 text-[#0B1623]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Display */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8E2EA]">
            <h4 className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-1">Trạng thái hiện tại</h4>
            <p className="text-lg font-bold text-[#123C5A]">{lead.status}</p>
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

          {/* Value */}
          <div className="bg-[#FDF4EF] rounded-2xl p-4 border border-[#FBE3D5]">
            <h4 className="text-[10px] font-bold text-[#C8A96A] uppercase tracking-wider mb-1">Tổng giá trị ước tính</h4>
            <p className="text-lg font-bold text-[#C8A96A]">
              {lead.estimatedValueMin > 0 ? `${fmtVnd(lead.estimatedValueMin)} - ${fmtVnd(lead.estimatedValueMax)}` : 'Chưa có sản phẩm'}
            </p>
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
        </div>
      </div>
    </>
  );
}
