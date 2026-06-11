import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeInfo,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Grid2X2,
  Layers3,
  LayoutGrid,
  Lock,
  MessageCircle,
  MessageSquare,
  MousePointer2,
  PhoneCall,
  Search,
  ShieldCheck,
  Trash2,
  UserX,
  Users,
  WalletCards,
} from 'lucide-react';
import { concepts } from '@/lib/data';
import LivLabPortalMockup from '@/components/home/LivLabPortalMockup';
import CategoryCoverageSection from '@/components/home/CategoryCoverageSection';
import DemoPathsSection from '@/components/home/DemoPathsSection';
import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';
import HomeHotspotSection from '@/components/home/HomeHotspotSection';
import SolutionTransformationSection from '@/components/home/SolutionTransformationSection';

const palette = {
  ink: '#0B1623',
  navy: '#102A43',
  blue: '#123C5A',
  slate: '#486581',
  muted: '#627386',
  mist: '#F3F7FA',
  pearl: '#F8FBFD',
  border: '#D8E2EA',
  ice: '#DCEBF5',
  champagne: '#C8A96A',
};



type Problem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const problems: Problem[] = [
  {
    icon: LayoutGrid,
    title: 'Catalogue rời rạc, khó hình dung tổng thể',
    desc: 'Ảnh sản phẩm đơn lẻ không giúp khách tưởng tượng chúng kết hợp thật sự trông như thế nào.',
  },
  {
    icon: MessageSquare,
    title: 'Tư vấn qua Zalo/Facebook mất nhiều thời gian',
    desc: 'Showroom phải giải thích thủ công từng sản phẩm trong khi khách vẫn chưa hình dung được tổng thể.',
  },
  {
    icon: BadgeInfo,
    title: 'Khách thiếu thông tin về giá, vật liệu và combo',
    desc: 'Không biết sản phẩm nào có thể kết hợp cùng nhau và tổng chi phí sẽ là bao nhiêu.',
  },
  {
    icon: ClipboardList,
    title: 'Showroom nhận lead thiếu dữ liệu để báo giá nhanh',
    desc: 'Tin nhắn hỏi giá không kèm thông tin phòng, ngân sách hay phong cách — phải hỏi lại nhiều lần.',
  },
];

const stats = [
  { value: '7', label: 'concept', desc: 'Đã tuyển chọn sẵn' },
  { value: '10+', label: 'sản phẩm', desc: 'Có hotspot trong không gian' },
  { value: '5', label: 'bước', desc: 'Từ cảm hứng đến báo giá' },
  { value: '0', label: 'thiết kế', desc: 'Phải tự hình dung từ đầu' },
];

const howItWorks = [
  {
    step: '01',
    icon: Search,
    title: 'Chọn concept',
    desc: 'Duyệt thư viện concept theo loại phòng, phong cách và ngân sách.',
  },
  {
    step: '02',
    icon: MousePointer2,
    title: 'Bấm vào sản phẩm',
    desc: 'Hotspot trên ảnh phòng dẫn đến thông tin chi tiết từng sản phẩm.',
  },
  {
    step: '03',
    icon: LayoutGrid,
    title: 'Thêm vào báo giá',
    desc: 'Chọn sản phẩm và xem ước tính tổng ngân sách theo thời gian thực.',
  },
  {
    step: '04',
    icon: MessageCircle,
    title: 'Gửi cho showroom',
    desc: 'Điền thông tin phòng và gửi — showroom nhận lead đầy đủ thông tin.',
  },
  {
    step: '05',
    icon: PhoneCall,
    title: 'Showroom liên hệ',
    desc: 'Showroom gọi lại với báo giá và tư vấn cụ thể, không cần hỏi lại từ đầu.',
  },
];

const trustCards = [
  {
    icon: ShieldCheck,
    title: 'Thông tin báo giá rõ ràng',
    desc: 'Giá, vật liệu và thông số hiển thị minh bạch ngay trên từng sản phẩm.',
  },
  {
    icon: Users,
    title: 'Sản phẩm gắn với showroom cụ thể',
    desc: 'Mỗi sản phẩm đều có tên showroom, địa chỉ và số liên hệ chính thức.',
  },
  {
    icon: UserX,
    title: 'Không bán dữ liệu cho bên thứ ba',
    desc: 'Thông tin của bạn không được chia sẻ với bất kỳ bên nào ngoài showroom đã chọn.',
  },
  {
    icon: Lock,
    title: 'Chỉ dùng để showroom liên hệ tư vấn',
    desc: 'Chúng tôi chỉ sử dụng thông tin của bạn cho mục đích tư vấn và báo giá.',
  },
  {
    icon: Trash2,
    title: 'Có thể yêu cầu xoá thông tin',
    desc: 'Sau khi tư vấn xong, bạn có thể yêu cầu xoá toàn bộ thông tin cá nhân.',
  },
];

const socialPosts = [
  {
    channel: 'Facebook',
    title: 'Phòng tắm nhỏ vẫn có thể đẹp',
    objective: 'Tăng nhận diện thương hiệu',
    views: '14.200',
    engagement: '1.840',
    clicks: '620',
  },
  {
    channel: 'Instagram',
    title: 'Combo phòng tắm dưới 30 triệu',
    objective: 'Tạo lượt truy cập website',
    views: '22.500',
    engagement: '3.100',
    clicks: '1.250',
  },
  {
    channel: 'TikTok',
    title: 'Chọn lavabo sao cho đúng?',
    objective: 'Giáo dục khách hàng',
    views: '41.000',
    engagement: '5.600',
    clicks: '890',
  },
  {
    channel: 'Pinterest',
    title: 'Trước khi cải tạo phòng tắm, hãy xem concept trước',
    objective: 'Tạo lưu lượng tìm kiếm',
    views: '9.800',
    engagement: '1.200',
    clicks: '470',
  },
  {
    channel: 'Facebook',
    title: 'Từ catalogue rời rạc đến concept có thể báo giá',
    objective: 'Chuyển đổi — gửi yêu cầu báo giá',
    views: '18.700',
    engagement: '2.340',
    clicks: '980',
  },
];

const dashboardLeads = [
  {
    name: 'Nguyễn Anh Minh',
    concept: 'Phòng tắm Japandi',
    budget: '45M',
    status: 'Mới',
  },
  {
    name: 'Trần Thanh Hương',
    concept: 'Phong cách khách sạn',
    budget: '78M',
    status: 'Đã báo giá',
  },
  {
    name: 'Lê Thu Hà',
    concept: 'Phòng tắm tối giản',
    budget: '32M',
    status: 'Đã chốt',
  },
];

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`mb-3 text-xs font-bold uppercase tracking-[0.18em] ${
        light ? 'text-[#C8A96A]' : 'text-[#A98D4C]'
      }`}
    >
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  highlight,
  desc,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  desc?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      {eyebrow ? <SectionLabel light={dark}>{eyebrow}</SectionLabel> : null}

      <h2
        className={`text-3xl font-extrabold leading-tight tracking-[-0.035em] md:text-5xl ${
          dark ? 'text-white' : 'text-[#061827]'
        }`}
      >
        {title}{' '}
        {highlight ? (
          <span className={dark ? 'text-[#DCEBF5]' : 'text-[#49677F]'}>{highlight}</span>
        ) : null}
      </h2>

      {desc ? (
        <p
          className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg ${
            dark ? 'text-[#AEBECD]' : 'text-[#627386]'
          }`}
        >
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function IconBox({ icon: Icon, dark = false }: { icon: LucideIcon; dark?: boolean }) {
  return (
    <div
      className={`mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border ${
        dark
          ? 'border-white/10 bg-white/[0.06] text-[#DCEBF5]'
          : 'border-[#D8E2EA] bg-[#EEF4F7] text-[#123C5A]'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.9} />
    </div>
  );
}

function PremiumCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border border-[#D8E2EA] bg-white shadow-[0_18px_45px_rgba(11,22,35,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-[#123C5A]/25 hover:shadow-[0_24px_60px_rgba(11,22,35,0.09)] ${className}`}
    >
      {children}
    </div>
  );
}

function getConceptImage(index: number, concept: any) {
  const cTitle = (concept?.title || '').toLowerCase();
  const cSlug = (concept?.slug || '').toLowerCase();
  const cStyle = (concept?.style || '').toLowerCase();
  const cDesc = (concept?.description || '').toLowerCase();
  const cArea = (concept?.areaSize || '').toLowerCase();
  const cBudget = (concept?.budgetRange || '').toLowerCase();

  const allText = `${cTitle} ${cSlug} ${cStyle} ${cDesc} ${cArea} ${cBudget}`;

  if (allText.includes('compact') || allText.includes('căn hộ nhỏ') || allText.includes('dưới 4m')) {
    return livlabImages.concepts.compact;
  }
  if (allText.includes('japandi')) {
    return livlabImages.concepts.japandi;
  }
  if (allText.includes('hotel') || allText.includes('khách sạn') || allText.includes('gray') || allText.includes('xám')) {
    return livlabImages.concepts.hotelGray;
  }
  if (allText.includes('luxury') || allText.includes('cao cấp') || allText.includes('master')) {
    return livlabImages.concepts.luxuryMaster;
  }
  if (allText.includes('minimal') || allText.includes('tối giản') || allText.includes('white') || allText.includes('trắng')) {
    return livlabImages.concepts.minimalWhite;
  }
  if (allText.includes('rental') || allText.includes('budget') || allText.includes('nhà cho thuê') || allText.includes('tiết kiệm') || allText.includes('dưới 30')) {
    return livlabImages.concepts.rentalBudget;
  }
  
  const paths = [
    livlabImages.concepts.compact,
    livlabImages.concepts.japandi,
    livlabImages.concepts.hotelGray,
    livlabImages.concepts.luxuryMaster,
    livlabImages.concepts.minimalWhite,
    livlabImages.concepts.rentalBudget,
  ];
  return paths[index % paths.length];
}

function getConceptHref(concept: any, index: number) {
  const slug = concept?.slug || `phong-tam-${index + 1}`;
  return `/concepts/${slug}`;
}

export default function HomePage() {
  const featuredConcepts = (concepts || []).slice(0, 6);

  return (
    <main className="bg-[#F8FBFD] text-[#0B1623]">
      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden bg-[#0B1623]">
        <img
          src={livlabImages.hero}
          alt="Phòng tắm hiện đại LivLab"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          loading="eager"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,22,35,0.94)_0%,rgba(11,22,35,0.78)_42%,rgba(11,22,35,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(11,22,35,0.78),rgba(11,22,35,0))]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] items-center px-6 py-28 lg:px-10">
          <div className="grid w-full items-end gap-12 lg:grid-cols-[minmax(0,680px)_minmax(320px,1fr)]">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C8A96A]">
                Visual commerce · Nội thất · Showroom
              </p>

              <h1 className="max-w-[600px] text-5xl font-extrabold leading-[1.03] tracking-[-0.055em] text-white md:text-7xl">
                <span className="block">Số hoá trải nghiệm</span>
                <span className="block text-[#DCEBF5]">chọn mua nội thất.</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/76">
                Concept phòng tắm tương tác, hotspot sản phẩm và báo giá theo combo — giúp khách dễ hình dung, giúp showroom nhận yêu cầu đủ dữ liệu.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/concepts"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0B1623] shadow-[0_16px_40px_rgba(255,255,255,0.12)] transition hover:bg-[#DCEBF5]"
                >
                  Khám phá concept
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/visual-studio"
                  className="inline-flex items-center gap-2 rounded-full bg-[#123C5A] px-8 py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(18,60,90,0.24)] transition hover:bg-[#0D2B42]"
                >
                  Dùng Visual Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden justify-end lg:flex">
              <div className="w-full max-w-sm rounded-[1.8rem] border border-white/16 bg-white/[0.10] p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-white/58">
                  Tính năng nổi bật
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Layers3, label: 'Concept tương tác' },
                    { icon: Search, label: 'Hotspot sản phẩm' },
                    { icon: FileText, label: 'Báo giá theo combo' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#DCEBF5]">
                        <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-[#F3F7FA] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Vấn đề chúng tôi giải quyết"
            title="Vì sao khách hàng"
            highlight="khó ra quyết định?"
            desc="Những điểm đau phổ biến trong hành trình chọn mua thiết bị phòng tắm và nội thất."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {problems.map((problem) => (
              <PremiumCard key={problem.title} className="p-7">
                <IconBox icon={problem.icon} />
                <h3 className="text-base font-extrabold leading-snug text-[#0B1623]">
                  {problem.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#627386]">{problem.desc}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <SolutionTransformationSection />

      {/* MOCKUP SOLUTION */}
      <LivLabPortalMockup />

      {/* DEMO PATHS */}
      <DemoPathsSection />

      {/* FEATURED CONCEPTS */}
      <section className="bg-[#F3F7FA] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>Concept nổi bật</SectionLabel>
              <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#061827] md:text-6xl">
                Không gian
                <span className="block text-[#49677F]">được tuyển chọn.</span>
              </h2>
            </div>

            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#123C5A] transition hover:text-[#0D2B42]"
            >
              Xem tất cả concept
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {featuredConcepts.map((concept: any, index) => {
              const image = getConceptImage(index, concept);
              const href = getConceptHref(concept, index);

              return (
                <PremiumCard key={concept.id || concept.slug || concept.title || index} className="overflow-hidden">
                  <Link href={href} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#DCEBF5]">
                      <SafeImage
                        src={image}
                        alt={concept.title || 'Concept phòng tắm LivLab'}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                        fallbackLabel="Hình ảnh concept"
                      />

                      <div className="absolute left-4 bottom-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#123C5A] shadow-sm backdrop-blur">
                        Phòng tắm
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#EEF4F7] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#486581]">
                          {concept.style || ['Japandi', 'Modern', 'Minimal'][index % 3]}
                        </span>
                        <span className="rounded-full border border-[#D8E2EA] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#627386]">
                          {concept.budgetRange || '30–60 triệu'}
                        </span>
                      </div>

                      <h3 className="line-clamp-1 text-lg font-extrabold text-[#0B1623]">
                        {concept.title || 'Phòng tắm được tuyển chọn'}
                      </h3>

                      <div className="mt-3 flex items-center justify-between border-b border-[#E7EEF4] pb-4 text-sm text-[#627386]">
                        <span>
                          Diện tích:{' '}
                          <b className="text-[#0B1623]">{concept.areaSize || '4m² – 6m²'}</b>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers3 className="h-4 w-4" />
                          3 sản phẩm
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#123C5A]">
                          Xem concept
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        <span className="rounded-full bg-[#EEF4F7] px-4 py-2 text-xs font-bold text-[#123C5A]">
                          Yêu cầu báo giá
                        </span>
                      </div>
                    </div>
                  </Link>
                </PremiumCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOTSPOT */}
      <section id="hotspot" className="bg-white px-6 pt-28 pb-24 lg:px-10 lg:pt-36 scroll-mt-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Tính năng cốt lõi"
            title="Xem sản phẩm"
            highlight="ngay trong không gian."
            desc="Bấm vào các điểm trên ảnh để xem thiết bị phòng tắm tương ứng trong không gian thực tế."
          />

          <HomeHotspotSection />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#0B1623] px-6 py-24 text-white lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Cách hoạt động"
            title="Yêu cầu báo giá chất lượng"
            highlight="trong một quy trình."
            desc="Quy trình rõ ràng giúp khách dễ hình dung và showroom nhận yêu cầu đủ dữ liệu."
            dark
          />

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <div className="mb-5 flex items-center gap-4">
                  <span className="text-5xl font-extrabold text-white/[0.08]">{item.step}</span>
                  <IconBox icon={item.icon} dark />
                </div>
                <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#AEBECD]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMBO */}
      <section className="bg-[#F3F7FA] px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#D8E2EA] shadow-[0_20px_55px_rgba(11,22,35,0.08)]">
            <SafeImage
              src={livlabImages.concepts.compact}
              alt="Small Bathroom Makeover Combo"
              className="h-[420px] w-full object-cover"
              fallbackLabel="Small Bathroom Combo"
            />
            <div className="absolute bottom-5 left-5 rounded-full bg-[#123C5A] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
              Combo nổi bật
            </div>
          </div>

          <div>
            <SectionLabel>Gói combo mới</SectionLabel>
            <h2 className="text-4xl font-extrabold tracking-[-0.04em] text-[#061827] md:text-5xl">
              Small Bathroom Makeover Combo
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#627386]">
              Gói concept phòng tắm nhỏ cho căn hộ, nhà thuê và homestay — giúp khách xem trước
              không gian, chọn sản phẩm và gửi yêu cầu báo giá nhanh hơn.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Dưới 3–5 m²', 'Ngân sách dưới 30 triệu', 'Sẵn sàng báo giá'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#D8E2EA] bg-white px-4 py-2 text-xs font-bold text-[#486581]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href="/small-bathroom-combo"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#123C5A] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#0D2B42]"
            >
              Xem combo phòng tắm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-white px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Cam kết"
            title="Minh bạch từ sản phẩm"
            highlight="đến dữ liệu."
            desc="Khách hàng được biết thông tin rõ ràng và có quyền kiểm soát dữ liệu cá nhân."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {trustCards.map((card) => (
              <PremiumCard key={card.title} className="p-6">
                <IconBox icon={card.icon} />
                <h3 className="text-base font-extrabold leading-snug text-[#0B1623]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#627386]">{card.desc}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL STUDIO CTA */}
      <section className="bg-[#F8FBFD] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid overflow-hidden rounded-[2rem] border border-[#D8E2EA] bg-white shadow-[0_24px_70px_rgba(11,22,35,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-8 md:p-12">
              <SectionLabel>Visual Studio</SectionLabel>
              <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#061827] md:text-5xl">
                Ướm thử sản phẩm trong <span className="text-[#49677F]">không gian của bạn.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#627386]">
                Tải ảnh phòng tắm hoặc chọn không gian mẫu để thử bố trí sản phẩm, xem ngân sách
                tham khảo và gửi yêu cầu báo giá.
              </p>

              <Link
                href="/visual-studio"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B2239] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#061827]"
              >
                Dùng Visual Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="border-t border-[#D8E2EA] bg-[#F3F7FA] p-8 lg:border-l lg:border-t-0">
              <div className="rounded-[1.6rem] border border-[#D8E2EA] bg-white p-4 shadow-[0_18px_45px_rgba(11,22,35,0.06)]">
                <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#EEF4F7]">
                  <img
                    src={livlabImages.concepts.compact}
                    alt="Small Bathroom Combo"
                    className="h-full w-full object-cover"
                  />
                  {[
                    ['Gương', '62%', '30%'],
                    ['Lavabo', '52%', '68%'],
                    ['Vòi', '50%', '56%'],
                  ].map(([label, x, y]) => (
                    <span
                      key={label}
                      className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-[#123C5A] text-white shadow-md"
                      style={{ left: x, top: y }}
                      title={label}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Không gian', 'Ảnh phòng tắm'],
                    ['Sản phẩm', '6 lựa chọn'],
                    ['Ngân sách', '23–31 triệu'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#F8FBFD] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#627386]">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#0B1623]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="bg-[#F3F7FA] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Marketing"
            title="LivLab trên"
            highlight="mạng xã hội."
            desc="Một số nội dung truyền thông mẫu cho chiến dịch ra mắt visual-commerce."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {socialPosts.map((post) => (
              <PremiumCard key={`${post.channel}-${post.title}`} className="p-6">
                <span className="inline-flex items-center rounded-full bg-[#EEF4F7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#123C5A]">
                  {post.channel}
                </span>

                <h3 className="mt-5 text-base font-extrabold text-[#0B1623]">{post.title}</h3>
                <p className="mt-2 text-sm text-[#627386]">{post.objective}</p>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#E7EEF4] pt-5">
                  {[
                    ['Lượt xem', post.views],
                    ['Tương tác', post.engagement],
                    ['Lượt click', post.clicks],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] text-[#627386]">{label}</p>
                      <p className="mt-1 font-extrabold text-[#0B1623]">{value}</p>
                    </div>
                  ))}
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="bg-white px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-[1220px] text-center">
          <SectionHeading
            eyebrow="Dashboard showroom"
            title="Lead chất lượng"
            highlight="trong một quy trình."
            desc="Showroom nhận thông tin rõ ràng hơn để tư vấn và báo giá nhanh hơn."
          />

          <div className="mx-auto max-w-[900px] rounded-[2rem] bg-[#0B1623] p-6 text-left shadow-[0_28px_80px_rgba(11,22,35,0.18)] md:p-8">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['24', 'Tổng lead'],
                ['8', 'Lead mới'],
                ['5', 'Đã báo giá'],
                ['3', 'Đã chốt'],
              ].map(([value, label], index) => (
                <div key={label} className="rounded-2xl bg-white/[0.06] p-5">
                  <p className={`text-2xl font-extrabold ${index === 1 ? 'text-[#C8A96A]' : 'text-white'}`}>
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-[#AEBECD]">{label}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#AEBECD]">
              Yêu cầu báo giá gần đây
            </p>

            <div className="mt-4 space-y-3">
              {dashboardLeads.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-5 py-4"
                >
                  <div>
                    <p className="font-bold text-white">{lead.name}</p>
                    <p className="mt-1 text-sm text-[#AEBECD]">{lead.concept}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[#C8A96A]">{lead.budget}</p>
                    <p className="mt-1 text-xs text-[#AEBECD]">{lead.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#123C5A] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#0D2B42]"
          >
            Showroom Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#0B1623] px-6 py-24 text-center text-white lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionLabel light>Bắt đầu ngay</SectionLabel>
          <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.04em] md:text-6xl">
            Dễ hình dung hơn.
            <span className="block text-[#DCEBF5]">Dễ chọn hơn. Dễ báo giá hơn.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#AEBECD]">
            LivLab giúp khách hàng và showroom đi từ cảm hứng hình ảnh đến yêu cầu báo giá rõ ràng
            trong một quy trình.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0B1623] transition hover:bg-[#DCEBF5]"
            >
              Bắt đầu với một concept
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-8 py-4 text-sm font-bold text-white transition hover:bg-white/[0.12]"
            >
              Gửi yêu cầu báo giá
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}