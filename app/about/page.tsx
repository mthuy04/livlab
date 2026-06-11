import Link from 'next/link';
import { Target, Lightbulb, ShieldCheck, Users, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về LivLab - Nền tảng visual-commerce',
  description: 'LivLab - Số hoá trải nghiệm chọn mua phòng tắm. Nền tảng kết nối khách hàng, concept, sản phẩm và showroom trong một luồng liền mạch.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F3F7FA]">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D8E2EA] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#C8A96A]" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#627386]">Câu chuyện của chúng tôi</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B1623] leading-tight mb-6">
            LivLab – Số hoá trải nghiệm <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#123C5A] to-[#486581]">chọn mua phòng tắm</span>
          </h1>
          <p className="text-lg text-[#627386] leading-relaxed max-w-2xl mx-auto">
            Chúng tôi tin rằng việc thiết kế và trang bị cho không gian sống, đặc biệt là phòng tắm, cần phải trực quan, dễ dàng và đầy cảm hứng hơn là những quy trình phức tạp truyền thống.
          </p>
        </div>
      </section>

      {/* LivLab là gì & Vấn đề */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-6">LivLab là gì?</h2>
              <p className="text-[#627386] leading-relaxed mb-6">
                LivLab là một nền tảng visual-commerce tập trung vào ngành nội thất và thiết bị phòng tắm. Chúng tôi chuyển đổi cách khách hàng tìm kiếm, lên ý tưởng và yêu cầu báo giá từ các showroom.
              </p>
              <p className="text-[#627386] leading-relaxed">
                Thay vì phải tự mình chắp vá từng sản phẩm đơn lẻ từ catalogue, LivLab cho phép người dùng khám phá các thiết kế không gian tổng thể (concept) và bóc tách trực tiếp các sản phẩm có trong đó.
              </p>
            </div>
            
            <div className="bg-[#F8FAFC] rounded-[2rem] p-8 lg:p-12 border border-[#D8E2EA]">
              <h2 className="text-2xl font-bold text-[#0B1623] mb-6 flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-[#C8A96A]" />
                Vấn đề chúng tôi nhìn thấy
              </h2>
              <ul className="space-y-5 text-[#627386]">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#123C5A] flex-shrink-0" />
                  <p>Khách hàng khó hình dung sản phẩm đơn lẻ sẽ trông như thế nào khi kết hợp lại trong một phòng tắm thực tế.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#123C5A] flex-shrink-0" />
                  <p>Quy trình lấy báo giá truyền thống tốn nhiều thời gian, qua lại nhiều bước thủ công.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#123C5A] flex-shrink-0" />
                  <p>Showroom thiếu các công cụ số để trình bày sản phẩm một cách trực quan, khó nắm bắt đúng nhu cầu ngân sách ngay từ đầu.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tầm nhìn & Sứ mệnh */}
      <section className="py-20 bg-[#0B1623] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#C8A96A]" />
              </div>
              <h3 className="text-2xl font-bold">Sứ mệnh</h3>
              <p className="text-white/70 leading-relaxed text-lg">
                LivLab giúp khách hàng hình dung phòng tắm hoàn chỉnh trước khi ra quyết định mua, đồng thời giúp showroom chuyển đổi cảm hứng thành yêu cầu báo giá rõ ràng, có cấu trúc và dễ theo dõi.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#C8A96A]" />
              </div>
              <h3 className="text-2xl font-bold">Tầm nhìn</h3>
              <p className="text-white/70 leading-relaxed text-lg">
                LivLab hướng tới trở thành nền tảng visual-commerce dành cho ngành home & living tại Việt Nam, nơi khách hàng có thể khám phá concept không gian, xem sản phẩm trong bối cảnh thực tế và kết nối trực tiếp với showroom phù hợp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-4">Giá trị cốt lõi</h2>
            <p className="text-[#627386]">Những nguyên tắc nền tảng định hình sản phẩm của chúng tôi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CoreValueCard 
              title="Trực quan"
              desc="Giúp khách hàng nhìn thấy tổng thể trước khi mua."
              delay="0"
            />
            <CoreValueCard 
              title="Đơn giản"
              desc="Biến quá trình chọn thiết bị phòng tắm thành một trải nghiệm dễ hiểu."
              delay="100"
            />
            <CoreValueCard 
              title="Kết nối"
              desc="Kết nối khách hàng, concept, sản phẩm và showroom trong một luồng liền mạch."
              delay="200"
            />
            <CoreValueCard 
              title="Thực tế"
              desc="Tập trung vào nhu cầu cải tạo, ngân sách và khả năng báo giá thật."
              delay="300"
            />
            <CoreValueCard 
              title="Tin cậy"
              desc="Cung cấp thông tin sản phẩm và yêu cầu báo giá có cấu trúc."
              delay="400"
            />
          </div>
        </div>
      </section>

      {/* Dành cho ai & Khác biệt */}
      <section className="py-20 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E2EA] flex items-center justify-center mb-6 shadow-sm">
                <Users className="w-6 h-6 text-[#123C5A]" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0B1623] mb-6">LivLab dành cho ai?</h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-[#D8E2EA] shadow-sm">
                  <h4 className="font-bold text-[#0B1623] mb-2">Khách hàng cá nhân</h4>
                  <p className="text-sm text-[#627386]">Những người đang xây dựng, cải tạo nhà cửa, cần tìm kiếm ý tưởng thiết kế phòng tắm và muốn lên ngân sách nhanh chóng, chuẩn xác mà không cần chuyên môn sâu.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#D8E2EA] shadow-sm">
                  <h4 className="font-bold text-[#0B1623] mb-2">Showroom & Đối tác</h4>
                  <p className="text-sm text-[#627386]">Các đơn vị phân phối thiết bị vệ sinh muốn số hoá catalogue, tiếp cận khách hàng qua hình ảnh trực quan và nhận được các yêu cầu báo giá chất lượng (qualified leads).</p>
                </div>
              </div>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E2EA] flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#123C5A]" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0B1623] mb-6">Vì sao LivLab khác biệt?</h2>
              <ul className="space-y-4">
                {[
                  'Bắt đầu từ concept không gian, không phải từ từng món đồ lẻ tẻ.',
                  'Trải nghiệm thương mại điện tử trực quan (Visual Commerce) thay vì list sản phẩm dài vô tận.',
                  'Tạo giỏ báo giá (Quote Cart) chuẩn hóa cấu trúc giúp đôi bên dễ làm việc.',
                  'Minh bạch khoảng giá tham khảo để quản lý kỳ vọng ngân sách.',
                  'Hoàn toàn miễn phí cho người dùng cuối.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#627386]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 text-center px-6">
        <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1623] mb-6">Bạn đã sẵn sàng trải nghiệm?</h2>
        <p className="text-[#627386] mb-10 max-w-xl mx-auto">
          Khám phá thư viện hàng trăm concept phòng tắm và gửi yêu cầu báo giá chỉ với vài thao tác đơn giản.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/concepts" 
            className="w-full sm:w-auto px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#0D2B42] transition-colors flex items-center justify-center gap-2"
          >
            Khám phá concept phòng tắm <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/quote" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-[#0B1623] border border-[#D8E2EA] font-semibold rounded-full hover:border-[#0B1623] transition-colors flex items-center justify-center"
          >
            Gửi yêu cầu báo giá
          </Link>
        </div>
      </section>
    </div>
  );
}

function CoreValueCard({ title, desc, delay }: { title: string, desc: string, delay: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-[#D8E2EA] shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mb-6">
        <div className="w-3 h-3 rounded-full bg-[#123C5A]" />
      </div>
      <h3 className="text-xl font-bold text-[#0B1623] mb-3">{title}</h3>
      <p className="text-[#627386] leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
