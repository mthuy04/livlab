import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle,
  BookOpen,
  Layers,
  Inbox,
  BarChart3,
  Bath,
  Sofa,
  Grid3x3,
  Home,
  Zap,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';

const problems = [
  'Catalogue PDF tĩnh, khách xem xong là quên',
  'Ảnh sản phẩm rải rác trên Zalo, không có hệ thống',
  'Tư vấn thủ công tốn nhiều thời gian',
  'Khách khó hình dung kết quả cuối cùng sẽ trông ra sao',
];

const solutions = [
  { icon: BookOpen, title: 'Concept trực quan được tuyển chọn', desc: 'Trình bày trọn bộ không gian với sản phẩm đã phối sẵn, theo đúng phong cách khách hàng mục tiêu của bạn.' },
  { icon: Layers, title: 'Hotspot gắn sản phẩm thật', desc: 'Gắn từng sản phẩm cụ thể vào mọi chi tiết trong ảnh không gian, kèm đầy đủ thông số và giá.' },
  { icon: Inbox, title: 'Thu thập lead có cấu trúc', desc: 'Nhận yêu cầu báo giá kèm thông tin phòng, ngân sách và danh sách sản phẩm khách đã chọn sẵn.' },
  { icon: BarChart3, title: 'Dashboard quản lý lead', desc: 'Theo dõi và cập nhật từng lead từ Mới đến Chốt đơn trong một pipeline duy nhất.' },
];

const useCases = [
  { icon: Bath, title: 'Showroom thiết bị phòng tắm', desc: 'Thể hiện lavabo, vòi và thiết bị vệ sinh phối hợp với nhau trong không gian phòng tắm thực tế.' },
  { icon: Sofa, title: 'Showroom nội thất', desc: 'Phối phòng khách, phòng ngủ với nội thất của bạn, giúp khách hình dung ngay trong nhà mình.' },
  { icon: Grid3x3, title: 'Nhà cung cấp vật liệu nội thất', desc: 'Trình bày gạch, vật liệu hoàn thiện trong bối cảnh không gian thật, giúp khách quyết định nhanh hơn.' },
  { icon: Home, title: 'Đơn vị cải tạo nhà', desc: 'Đóng gói trọn bộ concept cải tạo kèm báo giá chi tiết, khách có thể yêu cầu ngay lập tức.' },
];

const benefits = [
  { icon: Star, title: 'Khách hiểu sản phẩm rõ hơn', desc: 'Khách thấy sản phẩm trong bối cảnh không gian thật — không chỉ là ảnh nền trắng trong catalogue.' },
  { icon: TrendingUp, title: 'Lead chất lượng cao hơn', desc: 'Mỗi lead đến đã có sẵn loại phòng, khoảng ngân sách và danh sách sản phẩm đã chọn.' },
  { icon: Zap, title: 'Tư vấn nhanh hơn', desc: 'Bắt đầu mỗi cuộc trò chuyện đã có sẵn ngữ cảnh, thay vì mất 30 phút hỏi lại từ đầu.' },
  { icon: CheckCircle, title: 'Khách quyết định tự tin hơn', desc: 'Khách đã hình dung được kết quả thường quyết định mua nhanh hơn, ít do dự.' },
  { icon: Clock, title: 'Rút ngắn chu kỳ bán hàng', desc: 'Từ xem sản phẩm đến gửi yêu cầu báo giá chỉ mất vài phút — không cần nhắn tin qua lại nhiều ngày.' },
  { icon: BarChart3, title: 'Hiện diện số chuyên nghiệp', desc: 'Khác biệt với đối thủ vẫn còn dùng catalogue PDF và theo dõi thủ công.' },
];

export default function ShowroomsPage() {
  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#0B1623] py-28 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-[#123C5A]" style={{ filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-40 w-48 h-48 rounded-full bg-[#66785F]" style={{ filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-8xl mx-auto relative z-10">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">Dành cho showroom</p>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 max-w-3xl leading-tight">
            Biến catalogue sản phẩm thành trải nghiệm bán hàng trực quan.
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed mb-10">
            LivLab giúp showroom nội thất và phòng tắm trình bày sản phẩm trong không gian thực tế, thu thập yêu cầu báo giá có cấu trúc, và quản lý lead trong một dashboard duy nhất.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors"
            >
              Liên hệ hợp tác
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white text-sm font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
            >
              Khám phá concept
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">Vấn đề</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-[#0B1623] mb-6 leading-tight">
                Catalogue tĩnh không bán được không gian. Nó chỉ bán sự rối rắm.
              </h2>
              <p className="text-[#627386] leading-relaxed mb-8 text-base">
                Nhiều showroom vẫn phụ thuộc vào file PDF, tin nhắn Zalo rời rạc và tư vấn thủ công. Khách hàng khó hình dung các sản phẩm sẽ phối hợp với nhau ra sao trong không gian thực tế — khiến cuộc tư vấn dễ bị mắc kẹt ngay từ bước tìm hiểu nhu cầu.
              </p>
              <ul className="space-y-3">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-[#627386]">
                    <div className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    </div>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {/* TODO: ảnh tạm — cần thay bằng ảnh thật minh hoạ catalogue PDF tĩnh / tư vấn thủ công */}
            <div className="relative rounded-3xl overflow-hidden aspect-square">
              <Image
                src="/images/concept-minimal-white-bathroom.png"
                alt="Catalogue PDF tĩnh và tư vấn thủ công"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-[#EEF4F7] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Giải pháp</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#0B1623] mb-4">LivLab dành cho showroom</h2>
            <p className="text-[#627386] max-w-xl mx-auto text-base">
              Một lớp visual-commerce hoàn chỉnh, kết nối catalogue sản phẩm của bạn với quyết định mua của khách hàng.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="bg-white rounded-3xl p-7 border border-[#D8E2EA]">
                <div className="w-11 h-11 rounded-2xl bg-[#0B1623] flex items-center justify-center mb-5">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-[#0B1623] mb-2">{s.title}</h3>
                <p className="text-sm text-[#627386] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Ứng dụng</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#0B1623]">Phù hợp với mọi loại showroom</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="group bg-[#F3F7FA] border border-[#D8E2EA] rounded-3xl p-7 hover:border-[#0B1623] transition-all duration-200 hover:shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF4F7] group-hover:bg-[#123C5A] flex items-center justify-center mb-5 transition-colors">
                  <uc.icon className="w-5 h-5 text-[#0B1623] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-[#0B1623] mb-2">{uc.title}</h3>
                <p className="text-sm text-[#627386] leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-[#EEF4F7] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Lợi ích</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#0B1623]">Vì sao showroom chọn LivLab</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-3xl p-7 border border-[#D8E2EA]">
                <div className="w-10 h-10 rounded-xl bg-[#123C5A]/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-[#C8A96A]" />
                </div>
                <h3 className="text-base font-bold text-[#0B1623] mb-2">{b.title}</h3>
                <p className="text-sm text-[#627386] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-[#0B1623] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
            Khởi động showroom số của bạn.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Xem cách LivLab biến catalogue sản phẩm của bạn thành trải nghiệm visual-commerce tương tác chỉ trong vài phút.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors"
            >
              Liên hệ hợp tác
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
            >
              Khám phá concept
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
