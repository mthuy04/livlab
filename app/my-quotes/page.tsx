'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { getLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import Link from 'next/link';
import { FileText, ArrowRight, Clock, CheckCircle2, ChevronRight, XCircle, PhoneCall } from 'lucide-react';
import CustomerLeadDetailModal from '@/components/customer/CustomerLeadDetailModal';

export default function MyQuotesPage() {
  const { user, loading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      const allLeads = getLeads();
      const myLeads = allLeads.filter(l => 
        l.customerId === user.id || 
        l.customerEmail === user.email || 
        l.email === user.email || 
        l.phone === user.phone
      );
      setLeads(myLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  }, [user]);

  if (loading) return null;

  if (!user || user.role !== 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#D8E2EA] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-[#486581]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1623] mb-2">Vui lòng đăng nhập</h2>
          <p className="text-[#627386] text-sm mb-8 leading-relaxed">
            Bạn cần đăng nhập bằng tài khoản Khách hàng để xem các yêu cầu báo giá đã gửi.
          </p>
          <Link href="/login" className="flex items-center justify-center w-full py-3.5 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors text-sm">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Lead['status']) => {
    switch (status) {
      case 'Mới': return <Clock className="w-4 h-4 text-[#C8A96A]" />;
      case 'Đã liên hệ': return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'Đã báo giá': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'Đã chốt': return <CheckCircle2 className="w-4 h-4 text-[#123C5A]" />;
      case 'Mất lead': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: Lead['status']) => {
    return status;
  };

  const getStatusBg = (status: Lead['status']) => {
    switch (status) {
      case 'Mới': return 'bg-[#FDF4EF] text-[#C8A96A] border-[#FDF4EF]';
      case 'Đã liên hệ': return 'bg-blue-50 text-blue-600 border-blue-50';
      case 'Đã báo giá': return 'bg-purple-50 text-purple-600 border-purple-50';
      case 'Đã chốt': return 'bg-[#EEF4F7] text-[#123C5A] border-[#EEF4F7]';
      case 'Mất lead': return 'bg-red-50 text-red-600 border-red-50';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-[#0B1623] mb-2">Yêu cầu báo giá của bạn</h1>
        <p className="text-[#627386] mb-8">
          Theo dõi trạng thái các yêu cầu báo giá bạn đã gửi cho showroom.
        </p>

        {leads.length > 0 ? (
          <div className="space-y-4">
            {leads.map(lead => (
              <div key={lead.id} className="bg-white rounded-3xl border border-[#D8E2EA] shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-[#0B1623] text-lg mb-1">{lead.selectedConcept || lead.roomType}</h3>
                    <p className="text-sm text-[#627386] font-mono">{lead.requestCode}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBg(lead.status)}`}>
                    {getStatusIcon(lead.status)}
                    {getStatusText(lead.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-[#A0ACA2] mb-1 uppercase tracking-wider font-semibold">Ngày gửi</p>
                    <p className="text-sm font-medium text-[#0B1623]">
                      {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0ACA2] mb-1 uppercase tracking-wider font-semibold">Ngân sách</p>
                    <p className="text-sm font-medium text-[#0B1623]">{lead.budgetRange}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0ACA2] mb-1 uppercase tracking-wider font-semibold">Sản phẩm</p>
                    <p className="text-sm font-medium text-[#0B1623]">{lead.selectedProducts.length} món</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0ACA2] mb-1 uppercase tracking-wider font-semibold">Tổng giá trị (Ước tính)</p>
                    <p className="text-sm font-medium text-[#C8A96A]">{lead.estimatedValueMin > 0 ? `${lead.estimatedValueMin.toLocaleString('vi-VN')}đ - ${lead.estimatedValueMax.toLocaleString('vi-VN')}đ` : 'Đang cập nhật'}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#D8E2EA]">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#EEF4F7] text-[#123C5A] text-sm font-semibold hover:bg-[#DCEBF5] transition-colors"
                  >
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#D8E2EA] shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F3F7FA] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#A0ACA2]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0B1623] mb-2">Chưa có yêu cầu báo giá nào</h3>
            <p className="text-sm text-[#627386] mb-6 max-w-sm mx-auto">
              Khám phá các concept không gian và thêm sản phẩm vào báo giá để nhận tư vấn từ showroom.
            </p>
            <Link
              href="/concepts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#123C5A] text-white font-semibold rounded-2xl hover:bg-[#123C5A] transition-colors text-sm"
            >
              Khám phá concept
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {selectedLead && (
        <CustomerLeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
