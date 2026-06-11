import Link from 'next/link';
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
  'Static PDF catalogues customers forget',
  'Scattered images on Zalo and WhatsApp',
  'Manual consultation that wastes time',
  'Customers who can\'t visualise the final result',
];

const solutions = [
  { icon: BookOpen, title: 'Curated Visual Concepts', desc: 'Present complete room setups with matched products, styled for your target market.' },
  { icon: Layers, title: 'Real Product Hotspots', desc: 'Attach specific products to every element in a room image, with full specs and pricing.' },
  { icon: Inbox, title: 'Structured Lead Collection', desc: 'Receive quotation requests with room details, budget, and a pre-selected product list.' },
  { icon: BarChart3, title: 'Lead Management Dashboard', desc: 'Track and update every lead from New to Won in a single organised pipeline.' },
];

const useCases = [
  { icon: Bath, title: 'Bathroom Showroom', desc: 'Show how your basins, faucets, and sanitaryware fit together in a real bathroom.' },
  { icon: Sofa, title: 'Furniture Showroom', desc: 'Style living rooms and bedrooms with your furniture and let customers imagine it in their home.' },
  { icon: Grid3x3, title: 'Interior Material Supplier', desc: 'Present tiles, finishes, and surfaces in curated room settings for faster decisions.' },
  { icon: Home, title: 'Home Renovation Seller', desc: 'Package complete renovation concepts with itemised quotes that customers can request instantly.' },
];

const benefits = [
  { icon: Star, title: 'Better Customer Understanding', desc: 'Customers see products in real-room context — not just a white background catalogue.' },
  { icon: TrendingUp, title: 'Higher-Quality Leads', desc: 'Every lead arrives pre-qualified with room type, budget range, and selected products.' },
  { icon: Zap, title: 'Faster Consultation', desc: 'Start every conversation with context instead of spending 30 minutes on discovery questions.' },
  { icon: CheckCircle, title: 'More Confident Purchases', desc: 'Customers who visualise the result are more likely to commit without extended hesitation.' },
  { icon: Clock, title: 'Shorter Sales Cycle', desc: 'From browsing to quotation request in minutes — not days of back-and-forth messages.' },
  { icon: BarChart3, title: 'Professional Digital Presence', desc: 'Stand apart from competitors still relying on PDF catalogues and manual follow-ups.' },
];

export default function ShowroomsPage() {
  return (
    <div className="pt-16 bg-[#FAF7F1] min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#1F2421] py-28 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-[#123C5A]" style={{ filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-40 w-48 h-48 rounded-full bg-[#66785F]" style={{ filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-8xl mx-auto relative z-10">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">For Showrooms</p>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 max-w-3xl leading-tight">
            Turn your product catalogue into a visual selling experience.
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed mb-10">
            LivLab helps home and living showrooms present products in curated room contexts, collect structured quotation requests, and manage leads in one dashboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors"
            >
              See Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white text-sm font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
            >
              Explore Example Concepts
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">The Problem</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-[#1F2421] mb-6 leading-tight">
                Static catalogues don't sell rooms. They sell confusion.
              </h2>
              <p className="text-[#6F6A61] leading-relaxed mb-8 text-base">
                Showrooms often rely on PDFs, scattered Zalo messages, and manual consultations. Customers struggle to imagine how individual products work together in a real room — and sales conversations get stuck in the discovery phase.
              </p>
              <ul className="space-y-3">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-[#6F6A61]">
                    <div className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    </div>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#F1E8DA] rounded-3xl p-10 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-4">📋</div>
                <p className="text-[#6F6A61] text-sm font-medium">Static PDF Catalogue</p>
                <p className="text-[#6F6A61] text-xs mt-1 opacity-60">Customer confusion. Slow decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-[#F1E8DA] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">The Solution</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1F2421] mb-4">LivLab for showrooms</h2>
            <p className="text-[#6F6A61] max-w-xl mx-auto text-base">
              A complete visual-commerce layer that connects your product catalogue to customer decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="bg-white rounded-3xl p-7 border border-[#E7DFD2]">
                <div className="w-11 h-11 rounded-2xl bg-[#1F2421] flex items-center justify-center mb-5">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-[#1F2421] mb-2">{s.title}</h3>
                <p className="text-sm text-[#6F6A61] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Use Cases</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1F2421]">Built for your showroom type</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="group bg-[#FAF7F1] border border-[#E7DFD2] rounded-3xl p-7 hover:border-[#1F2421] transition-all duration-200 hover:shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#F1E8DA] group-hover:bg-[#123C5A] flex items-center justify-center mb-5 transition-colors">
                  <uc.icon className="w-5 h-5 text-[#1F2421] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-[#1F2421] mb-2">{uc.title}</h3>
                <p className="text-sm text-[#6F6A61] leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-[#F1E8DA] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Benefits</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1F2421]">Why showrooms choose LivLab</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-3xl p-7 border border-[#E7DFD2]">
                <div className="w-10 h-10 rounded-xl bg-[#123C5A]/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-[#C8A96A]" />
                </div>
                <h3 className="text-base font-bold text-[#1F2421] mb-2">{b.title}</h3>
                <p className="text-sm text-[#6F6A61] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-[#1F2421] py-24 lg:py-32 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
            Launch a digital showroom.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            See how LivLab turns your product catalogue into an interactive visual-commerce experience in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#123C5A] text-white font-semibold rounded-full hover:bg-[#123C5A]/80 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/concepts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
            >
              Explore Sample Concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
