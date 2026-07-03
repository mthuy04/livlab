'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MessageCircle } from 'lucide-react';

const footerLinks = {
  'Khám phá': [
    { href: '/concepts', label: 'Thư viện concept' },
    { href: '/products', label: 'Danh mục sản phẩm' },
    { href: '/small-bathroom-combo', label: 'Combo phòng tắm' },
  ],
  'Dịch vụ': [
    { href: '/quote', label: 'Yêu cầu báo giá' },
    { href: '/track-quote', label: 'Tra cứu báo giá' },
    { href: '/saved', label: 'Concept đã lưu' },
    { href: '/contact', label: 'Liên hệ' },
  ],
  'Hỗ trợ & Pháp lý': [
    { href: '/quote-process', label: 'Quy trình báo giá' },
    { href: '/privacy', label: 'Chính sách bảo mật' },
    { href: '/terms', label: 'Điều khoản sử dụng' },
    { href: '/showrooms', label: 'Dành cho showroom' },
  ],
};

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/showroom')) {
    return null;
  }

  return (
    <footer className="bg-[#0B1623] text-white/60">
      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              aria-label="LivLab"
              className="inline-flex items-center rounded-2xl bg-white px-3 py-2 mb-4 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
            >
              <Image
                src="/images/logo.png"
                alt="LivLab"
                width={132}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>

            <p className="text-sm text-white/50 leading-relaxed max-w-xs mb-6">
              Số hoá trải nghiệm chọn mua nội thất.
              <br />
              Nền tảng visual-commerce cho showroom nội thất Việt.
            </p>

            <div className="space-y-2">
              <a
                href="mailto:hello@livlab.vn"
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> hello@livlab.vn
              </a>

              <a
                href="tel:0241234567"
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> 024 1234 5678
              </a>

              {/* TODO: bật lại khi có link Zalo/Facebook Business thật */}
              {false && (
                <a
                  href="#"
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Zalo / Facebook
                </a>
              )}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} LivLab. Bảo lưu mọi quyền.
          </p>
          <p className="text-xs text-white/30">
            LivLab — Nền tảng hỗ trợ số hóa trải nghiệm chọn mua nội thất và thiết bị phòng tắm.
          </p>
        </div>
      </div>
    </footer>
  );
}