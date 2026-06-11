'use client';

import { useState } from 'react';
import { Mail, Phone, MessageSquare, Building2, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    need: 'Tư vấn concept',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = localStorage.getItem('livlab_contact_messages');
      const messages = existing ? JSON.parse(existing) : [];
      messages.push({
        id: `msg_${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      localStorage.setItem('livlab_contact_messages', JSON.stringify(messages));
    } catch (error) {
      // ignore localstorage errors
    }
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1623] mb-6">Liên hệ LivLab</h1>
          <p className="text-[#627386] text-lg">
            Bạn cần tư vấn concept, combo phòng tắm hoặc muốn hợp tác showroom? Gửi thông tin để LivLab hỗ trợ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-[#D8E2EA]">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#123C5A]" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1623] mb-2">Tư vấn khách hàng</h3>
              <p className="text-sm text-[#627386]">Hỗ trợ sử dụng thư viện concept và nhận gợi ý sản phẩm phù hợp không gian.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-[#D8E2EA]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#C8A96A]" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1623] mb-2">Hỗ trợ báo giá</h3>
              <p className="text-sm text-[#627386]">Giải đáp thắc mắc về quy trình gửi yêu cầu báo giá đến showroom đối tác.</p>
            </div>
            
            <div className="bg-[#0B1623] rounded-3xl p-8 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hợp tác showroom</h3>
              <p className="text-sm text-white/70 mb-4">Dành cho các đối tác thiết bị vệ sinh muốn mở rộng kênh tiếp cận khách hàng trên nền tảng số.</p>
              <a href="mailto:partner@livlab.com" className="text-sm font-bold text-[#C8A96A] hover:text-white transition-colors">
                partner@livlab.com
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-[#D8E2EA]">
              {submitted ? (
                <div className="text-center py-10 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-[#EEF4F7] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-[#123C5A]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0B1623] mb-4">Cảm ơn bạn đã liên hệ</h2>
                  <p className="text-[#627386] max-w-md mx-auto mb-8">
                    LivLab đã nhận thông tin. Chúng tôi sẽ phân loại và liên hệ lại với bạn trong thời gian sớm nhất qua số điện thoại hoặc email đã cung cấp.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setForm({name: '', phone: '', email: '', need: 'Tư vấn concept', message: ''});
                    }}
                    className="px-8 py-3 bg-[#EEF4F7] text-[#123C5A] font-bold rounded-xl hover:bg-[#DCEBF5] transition-colors"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0B1623] mb-6">Gửi tin nhắn cho chúng tôi</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#0B1623] mb-2">Họ và tên <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#D8E2EA] focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] outline-none transition-shadow"
                        placeholder="Nguyễn Văn A"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#0B1623] mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                      <input 
                        type="tel" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#D8E2EA] focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] outline-none transition-shadow"
                        placeholder="090 123 4567"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B1623] mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl border border-[#D8E2EA] focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] outline-none transition-shadow"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B1623] mb-2">Vấn đề bạn cần hỗ trợ là gì? <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-[#D8E2EA] focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] outline-none transition-shadow bg-white"
                      value={form.need}
                      onChange={e => setForm({...form, need: e.target.value})}
                      required
                    >
                      <option value="Tư vấn concept">Tư vấn concept</option>
                      <option value="Yêu cầu báo giá">Yêu cầu báo giá</option>
                      <option value="Hợp tác showroom">Hợp tác showroom</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B1623] mb-2">Nội dung chi tiết <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-[#D8E2EA] focus:border-[#123C5A] focus:ring-1 focus:ring-[#123C5A] outline-none transition-shadow resize-none"
                      placeholder="Mô tả cụ thể nhu cầu của bạn để chúng tôi có thể hỗ trợ tốt nhất..."
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-4 bg-[#0B1623] text-white font-bold rounded-xl hover:bg-[#123C5A] transition-colors"
                  >
                    Gửi thông tin
                  </button>
                  <p className="text-xs text-center text-[#627386] mt-4">
                    Bằng việc gửi thông tin, bạn đồng ý với <a href="/privacy" className="underline hover:text-[#0B1623]">Chính sách bảo mật</a> của chúng tôi.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
