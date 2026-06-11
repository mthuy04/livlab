import Link from 'next/link';
import { Target, Lightbulb, ShieldCheck, Users, Sparkles, ArrowRight, CheckCircle2, Eye, MousePointerClick, Link as LinkIcon, PiggyBank, Award } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về LivLab - Nền tảng visual-commerce',
  description: 'LivLab - Số hoá trải nghiệm chọn mua phòng tắm. Nền tảng kết nối khách hàng, concept, sản phẩm và showroom trong một luồng liền mạch.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1623]">
      
      {/* A. Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 text-[#0B1623]">
                LivLab – Số hoá trải nghiệm <span className="text-[#123C5A]">chọn mua phòng tắm</span>
              </h1>
              <p className="text-lg text-[#627386] leading-relaxed mb-10">
                LivLab giúp khách hàng hình dung phòng tắm hoàn chỉnh trước khi ra quyết định mua, đồng thời giúp showroom chuyển đổi cảm hứng thành yêu cầu báo giá rõ ràng, có cấu trúc và dễ theo dõi.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  href="/concepts" 
                  className="w-full sm:w-auto px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#0D2B42] transition-colors flex items-center justify-center gap-2"
                >
                  Khám phá concept <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/quote" 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#0B1623] border border-[#D8E2EA] font-semibold rounded-full hover:border-[#0B1623] transition-colors flex items-center justify-center"
                >
                  Gửi yêu cầu báo giá
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[2rem] overflow-hidden shadow-2xl relative z-10 aspect-[4/3] lg:aspect-square">
                <img 
                  src="/images/hero-bathroom-luxury.png" 
                  alt="LivLab Hero" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#123C5A]/10 to-[#C8A96A]/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* B. LivLab là gì? */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 rounded-[2rem] overflow-hidden shadow-lg aspect-[4/3]">
               <img 
                 src="/images/visual-studio-concept-preview.png" 
                 alt="LivLab là gì" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">LivLab là gì?</h2>
              <p className="text-[#627386] leading-relaxed mb-6">
                LivLab là nền tảng visual-commerce dành cho lĩnh vực phòng tắm và home-living. Thay vì để khách hàng xem từng sản phẩm riêng lẻ, LivLab trình bày sản phẩm trong các concept không gian hoàn chỉnh, cho phép người dùng khám phá sản phẩm qua hotspot, xem thông tin cơ bản và gửi yêu cầu báo giá đến showroom.
              </p>
              <p className="text-[#627386] leading-relaxed">
                LivLab không phải là một cửa hàng thiết bị vệ sinh truyền thống, cũng không chỉ là một website thương mại điện tử thông thường. LivLab kết nối ba yếu tố: cảm hứng không gian, dữ liệu sản phẩm và quy trình báo giá có cấu trúc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* C. Vấn đề chúng tôi nhìn thấy */}
      <section className="py-20 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-[#123C5A]" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Vấn đề chúng tôi nhìn thấy</h2>
              <p className="text-[#627386] leading-relaxed mb-6">
                Khi cải tạo hoặc thiết kế phòng tắm, khách hàng thường phải xem lavabo, gương, sen tắm, bồn cầu, tủ chậu và phụ kiện như những sản phẩm rời rạc. Điều này khiến họ khó hình dung tổng thể, khó biết sản phẩm nào phù hợp với nhau, khó ước lượng ngân sách và dễ trì hoãn quyết định mua hàng.
              </p>
              <p className="text-[#627386] leading-relaxed">
                Ở phía showroom, nhiều đơn vị có danh mục sản phẩm phong phú nhưng vẫn gặp khó khăn trong việc tư vấn theo concept, thu thập thông tin nhu cầu của khách hàng và quản lý các yêu cầu báo giá đến từ nhiều kênh khác nhau như Zalo, điện thoại hoặc tin nhắn cá nhân.
              </p>
            </div>
            <div className="rounded-[2rem] overflow-hidden shadow-lg aspect-[4/3]">
               <img 
                 src="/images/concept-compact-bathroom.png" 
                 alt="Vấn đề phòng tắm" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
        </div>
      </section>

      {/* D. Sứ mệnh & E. Tầm nhìn */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-12">
              <div className="bg-[#123C5A] text-white p-10 rounded-[2rem] shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-[#C8A96A]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Sứ mệnh</h3>
                <p className="text-white/80 leading-relaxed">
                  LivLab giúp khách hàng hình dung phòng tắm hoàn chỉnh trước khi ra quyết định mua, đồng thời giúp showroom chuyển đổi cảm hứng thành yêu cầu báo giá rõ ràng, có cấu trúc và dễ theo dõi.
                </p>
              </div>

              <div className="bg-[#F8FAFC] p-10 rounded-[2rem] border border-[#D8E2EA] shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E2EA] flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles className="w-6 h-6 text-[#C8A96A]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[#0B1623]">Tầm nhìn</h3>
                <p className="text-[#627386] leading-relaxed">
                  LivLab hướng tới trở thành nền tảng visual-commerce dành cho ngành home & living tại Việt Nam, nơi khách hàng có thể khám phá concept không gian, xem sản phẩm trong bối cảnh thực tế và kết nối trực tiếp với showroom phù hợp.
                </p>
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden shadow-xl aspect-[3/4] lg:aspect-auto h-full">
               <img 
                 src="/images/concept-japandi-bathroom.png" 
                 alt="Tầm nhìn LivLab" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
        </div>
      </section>

      {/* F. Giá trị cốt lõi */}
      <section className="py-20 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Giá trị cốt lõi</h2>
            <p className="text-[#627386]">Những nguyên tắc nền tảng định hình sản phẩm của chúng tôi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <CoreValueCard 
              icon={<Eye className="w-6 h-6 text-[#123C5A]" />}
              title="Trực quan"
              desc="Giúp khách hàng nhìn thấy tổng thể trước khi mua, thay vì chỉ xem từng sản phẩm riêng lẻ."
            />
            <CoreValueCard 
              icon={<MousePointerClick className="w-6 h-6 text-[#123C5A]" />}
              title="Đơn giản"
              desc="Biến quá trình chọn thiết bị phòng tắm thành một trải nghiệm dễ hiểu, dễ so sánh và dễ ra quyết định."
            />
            <CoreValueCard 
              icon={<LinkIcon className="w-6 h-6 text-[#123C5A]" />}
              title="Kết nối"
              desc="Kết nối khách hàng, concept, sản phẩm và showroom trong một luồng trải nghiệm liền mạch."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <CoreValueCard 
              icon={<PiggyBank className="w-6 h-6 text-[#123C5A]" />}
              title="Thực tế"
              desc="Tập trung vào nhu cầu cải tạo, diện tích, ngân sách và khả năng báo giá thật."
            />
            <CoreValueCard 
              icon={<Award className="w-6 h-6 text-[#123C5A]" />}
              title="Tin cậy"
              desc="Cung cấp thông tin sản phẩm và yêu cầu báo giá có cấu trúc, giúp showroom dễ tư vấn và theo dõi."
            />
          </div>
        </div>
      </section>

      {/* G. LivLab dành cho ai? */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">LivLab dành cho ai?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 bg-white rounded-[2rem] border border-[#D8E2EA] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF4F7] flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-[#123C5A]" />
              </div>
              <h3 className="text-2xl font-bold mb-6">Khách hàng cá nhân</h3>
              <ul className="space-y-4 text-[#627386]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Người trẻ mới nhận căn hộ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Gia đình đang cải tạo phòng tắm.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Chủ homestay, căn hộ cho thuê hoặc nhà ở nhỏ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Người muốn xem concept tổng thể trước khi mua thiết bị.</span>
                </li>
              </ul>
            </div>
            
            <div className="p-10 bg-[#123C5A] text-white rounded-[2rem] shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-[#C8A96A]" />
              </div>
              <h3 className="text-2xl font-bold mb-6">Showroom và Đơn vị bán hàng</h3>
              <ul className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Showroom thiết bị vệ sinh.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Nhà bán nội thất / home-living SME.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Đơn vị muốn tư vấn theo concept thay vì chỉ gửi bảng giá rời rạc.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
                  <span>Đơn vị muốn quản lý lead báo giá rõ ràng hơn.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* H. Vì sao LivLab khác biệt? */}
      <section className="py-20 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="rounded-[2rem] overflow-hidden shadow-xl aspect-square lg:aspect-[4/3]">
                <img 
                  src="/images/demo-path-concept-preview.png" 
                  alt="LivLab khác biệt" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Vì sao LivLab khác biệt?</h2>
              <p className="text-[#627386] leading-relaxed mb-6">
                LivLab khác với marketplace truyền thống vì không chỉ liệt kê sản phẩm theo danh mục. LivLab đặt sản phẩm vào bối cảnh không gian thật, giúp khách hàng hiểu sản phẩm sẽ xuất hiện như thế nào trong phòng tắm hoàn chỉnh.
              </p>
              <p className="text-[#627386] leading-relaxed">
                LivLab cũng khác với catalogue showroom tĩnh vì nền tảng cho phép khách hàng tương tác với concept, xem sản phẩm quan tâm và gửi yêu cầu báo giá có cấu trúc. Với showroom, LivLab không chỉ là nơi trưng bày sản phẩm mà còn là công cụ hỗ trợ chuyển đổi khách hàng tiềm năng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* I. Concept nổi bật */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Concept nổi bật trên LivLab</h2>
            <p className="text-[#627386]">Khám phá các không gian phòng tắm được thiết kế chuẩn mực</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ConceptCard 
              image="/images/concept-hotel-gray-bathroom.png"
              title="Hotel Gray Bathroom"
              desc="Không gian phòng tắm hiện đại, trung tính, phù hợp căn hộ và homestay cao cấp."
            />
            <ConceptCard 
              image="/images/concept-minimal-white-bathroom.png"
              title="Minimal White Bathroom"
              desc="Concept sáng, sạch và tối giản, phù hợp phòng tắm nhỏ và căn hộ đô thị."
            />
            <ConceptCard 
              image="/images/concept-rental-budget-bathroom.png"
              title="Rental Budget Bathroom"
              desc="Giải pháp tiết kiệm ngân sách cho phòng trọ, căn hộ cho thuê và cải tạo nhanh."
            />
          </div>
        </div>
      </section>

      {/* J. CTA cuối trang */}
      <section className="py-24 lg:py-32 bg-[#123C5A] text-white text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Sẵn sàng hình dung phòng tắm của bạn rõ hơn?</h2>
          <p className="text-white/80 mb-10 text-lg leading-relaxed">
            Khám phá các concept phòng tắm trên LivLab hoặc gửi yêu cầu báo giá để showroom có thể tư vấn theo nhu cầu, diện tích và ngân sách của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/concepts" 
              className="w-full sm:w-auto px-8 py-4 bg-[#C8A96A] text-[#0B1623] font-bold rounded-full hover:bg-[#b09459] transition-colors flex items-center justify-center gap-2"
            >
              Khám phá concept <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/quote" 
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 font-bold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              Gửi yêu cầu báo giá
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function CoreValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-[#D8E2EA] shadow-sm hover:shadow-md transition-shadow group">
      <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#D8E2EA] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#0B1623] mb-3">{title}</h3>
      <p className="text-[#627386] leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function ConceptCard({ image, title, desc }: { image: string, title: string, desc: string }) {
  return (
    <Link href="/concepts" className="group block bg-white rounded-[2rem] border border-[#D8E2EA] overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-[#0B1623] mb-2">{title}</h3>
        <p className="text-[#627386] text-sm leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
