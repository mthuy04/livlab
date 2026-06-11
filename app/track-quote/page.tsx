'use client';

import { useState } from 'react';
import { findLeadByCodeAndPhone } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { getProductById } from '@/lib/data';
import Link from 'next/link';
import { Search, Package, Calendar, Tag, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TrackQuotePage() {
  const [requestCode, setRequestCode] = useState('');
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestCode.trim() || !phone.trim()) return;
    
    const found = findLeadByCodeAndPhone(requestCode.trim(), phone.trim());
    setLead(found || null);
    setSearched(true);
  };

  const statusColors: Record<string, string> = {
    'Mới': 'bg-blue-50 text-blue-700 border-blue-200',
    'Đã liên hệ': 'bg-amber-50 text-amber-700 border-amber-200',
    'Đã báo giá': 'bg-purple-50 text-purple-700 border-purple-200',
    'Đã chốt': 'bg-green-50 text-green-700 border-green-200',
    'Mất lead': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const statusMessages: Record<string, string> = {
    'Mới': 'Showroom đang tiếp nhận yêu cầu của bạn.',
    'Đã liên hệ': 'Showroom đã liên hệ hoặc đang chờ phản hồi từ bạn.',
    'Đã báo giá': 'Báo giá đã được chuẩn bị. Vui lòng kiểm tra kênh liên hệ.',
    'Đã chốt': 'Yêu cầu đã được chuyển sang trạng thái chốt.',
    'Mất lead': 'Yêu cầu đã tạm dừng xử lý.',
  };

  const steps = ['Mới', 'Đã liên hệ', 'Đã báo giá', 'Đã chốt'];

  const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-16">
      <div className="bg-[#EEF4F7] border-b border-[#D8E2EA] py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#0B1623] mb-3">Tra cứu yêu cầu báo giá</h1>
          <p className="text-[#627386]">Nhập mã yêu cầu và số điện thoại để kiểm tra trạng thái báo giá của bạn.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#D8E2EA] shadow-sm mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Mã yêu cầu</label>
              <input 
                type="text" 
                placeholder="VD: LLQ-..." 
                value={requestCode} 
                onChange={e => setRequestCode(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm focus:border-[#123C5A] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Số điện thoại</label>
              <input 
                type="tel" 
                placeholder="Số điện thoại đã gửi" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm focus:border-[#123C5A] focus:outline-none"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="w-full h-[46px] flex items-center justify-center gap-2 bg-[#123C5A] text-white rounded-xl text-sm font-semibold hover:bg-[#123C5A] transition-colors">
                <Search className="w-4 h-4" />
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {searched && !lead && (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#D8E2EA]">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1623] mb-2">Không tìm thấy yêu cầu</h3>
            <p className="text-[#627386] text-sm mb-6 max-w-sm mx-auto">Vui lòng kiểm tra lại mã yêu cầu và số điện thoại. Đảm bảo bạn nhập chính xác thông tin đã đăng ký.</p>
            <Link href="/quote" className="inline-flex px-6 py-2.5 bg-[#EEF4F7] text-[#123C5A] rounded-full text-sm font-semibold hover:bg-[#D8E2EA] transition-colors">
              Gửi yêu cầu báo giá mới
            </Link>
          </div>
        )}

        {lead && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#D8E2EA] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B1623]">{lead.requestCode}</h2>
                  <p className="text-sm text-[#627386] mt-1">{lead.customerName} • {lead.phone}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </div>

              <div className="mb-8 p-4 rounded-xl bg-[#F3F7FA] flex gap-3 items-start border border-[#D8E2EA]">
                <Info className="w-5 h-5 text-[#123C5A] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#0B1623] leading-relaxed">
                  {statusMessages[lead.status]}
                </p>
              </div>

              {/* Progress */}
              {lead.status !== 'Mất lead' && (
                <div className="mb-10 relative">
                  <div className="absolute top-4 left-0 w-full h-1 bg-[#EEF4F7] rounded-full -z-10" />
                  <div className="flex justify-between relative z-0">
                    {steps.map((step, idx) => {
                      const currentIdx = steps.indexOf(lead.status);
                      const isPast = idx <= currentIdx;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${isPast ? 'bg-[#486581] text-white' : 'bg-[#D8E2EA] text-[#A0ACA2]'}`}>
                            {isPast ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isPast ? 'text-[#123C5A]' : 'text-[#A0ACA2]'}`}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Status History */}
              {lead.statusHistory && lead.statusHistory.length > 0 && (
                <div className="mb-10 bg-white rounded-2xl p-6 border border-[#D8E2EA]">
                  <h4 className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-4">Lịch sử cập nhật</h4>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#F3F7FA] p-4 rounded-2xl">
                  <Calendar className="w-4 h-4 text-[#627386] mb-2" />
                  <p className="text-[10px] uppercase font-bold text-[#627386] mb-1">Ngày gửi</p>
                  <p className="text-sm font-semibold text-[#0B1623]">{formatDate(lead.createdAt)}</p>
                </div>
                <div className="bg-[#F3F7FA] p-4 rounded-2xl">
                  <Package className="w-4 h-4 text-[#627386] mb-2" />
                  <p className="text-[10px] uppercase font-bold text-[#627386] mb-1">Concept</p>
                  <p className="text-sm font-semibold text-[#0B1623] truncate">{lead.selectedConcept || lead.roomType}</p>
                </div>
                <div className="bg-[#F3F7FA] p-4 rounded-2xl">
                  <Tag className="w-4 h-4 text-[#627386] mb-2" />
                  <p className="text-[10px] uppercase font-bold text-[#627386] mb-1">Ngân sách</p>
                  <p className="text-sm font-semibold text-[#0B1623]">{lead.budgetRange}</p>
                </div>
                <div className="bg-[#F3F7FA] p-4 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-[#627386] mb-2" />
                  <p className="text-[10px] uppercase font-bold text-[#627386] mb-1">Lắp đặt</p>
                  <p className="text-sm font-semibold text-[#0B1623]">{lead.needsInstallation ? 'Có' : 'Không'}</p>
                </div>
              </div>

              <div className="mt-4 bg-[#FDF4EF] p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-[#C8A96A] mb-1">Tổng giá trị ước tính</p>
                <p className="text-lg font-bold text-[#C8A96A]">
                  {lead.estimatedValueMin > 0 ? `${fmtVnd(lead.estimatedValueMin)} - ${fmtVnd(lead.estimatedValueMax)}` : 'Chưa có sản phẩm'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#D8E2EA] shadow-sm">
              <h3 className="text-lg font-bold text-[#0B1623] mb-4">Sản phẩm đã chọn</h3>
              <div className="space-y-3">
                {lead.selectedProducts.length > 0 ? (
                   lead.selectedProducts.map((item, idx) => {
                     const isString = typeof item === 'string';
                     const id = isString ? item : item.productId;
                     const qty = isString ? 1 : (item.quantity || 1);
                     const fallbackProd = getProductById(id);
                     
                     const name = isString ? fallbackProd?.name : (item.name || fallbackProd?.name);
                     const image = isString ? fallbackProd?.image : (item.image || fallbackProd?.image);
                     const brand = isString ? fallbackProd?.brand : (item.brand || fallbackProd?.brand);
                     const priceRange = isString ? fallbackProd?.priceRange : (item.priceRange || fallbackProd?.priceRange);
                     
                     if (!name) return null;
                     
                     return (
                      <div key={`${id}-${idx}`} className="flex items-center gap-4 p-3 border border-[#D8E2EA] rounded-xl">
                        <img src={image || '/images/products/placeholder-sanitary.png'} alt={name} className="w-16 h-16 rounded-lg object-cover bg-[#EEF4F7]" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#0B1623]">{name}</p>
                          <p className="text-xs text-[#627386]">{brand} • {priceRange}</p>
                        </div>
                        <div className="text-sm font-bold text-[#123C5A] bg-[#EEF4F7] px-3 py-1 rounded-lg border border-[#DCEBF5]">
                          SL: {qty}
                        </div>
                      </div>
                     );
                   })
                ) : (
                  <p className="text-sm text-[#627386] text-center py-6 bg-[#F3F7FA] rounded-xl border border-dashed border-[#D8E2EA]">
                    Chưa có sản phẩm được lưu trong yêu cầu này.
                  </p>
                )}
              </div>
            </div>

            {lead.notes && (
              <div className="bg-[#EEF4F7] rounded-3xl p-6 md:p-8 border border-[#DCEBF5]">
                <h3 className="text-sm font-bold text-[#0B1623] mb-2">Ghi chú của bạn</h3>
                <p className="text-sm text-[#627386] leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
