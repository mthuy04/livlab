import Link from 'next/link';
import type { Route } from 'next';
import { ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';

/**
 * Footer for a showroom with verified business details (Giang Sơn today).
 *
 * Compact and factual: the logo, the address and numbers the business
 * publishes, what it sells, where to get help, and a small platform credit.
 * Other storefronts keep TenantFooter.
 */
export default function ShowroomFooter({ tenant }: { tenant: TenantStorefrontConfig }) {
  const business = tenant.business!;
  const categories = tenant.catalogScope.categories;
  const facebook = business.sameAs.find((url) => url.includes('facebook.com'));
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.displayAddress)}`;
  const year = new Date().getFullYear();

  const head = 'text-[13px] font-semibold text-[#1D2933]';
  const item = 'text-[14px] text-[#4E5B65] transition-colors hover:text-[#153B55]';

  return (
    <footer className="border-t border-[#DEDBD3] bg-[#F7F7F4]">
      <div className="mx-auto grid w-[min(1320px,calc(100%-2*clamp(16px,4vw,48px)))] gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
        <div>
          {tenant.brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.brand.logo} alt={tenant.brand.logoAlt ?? tenant.brand.name} className="h-11 w-auto" loading="lazy" />
          )}
          <p className="mt-5 max-w-[300px] text-[14px] leading-relaxed text-[#4E5B65]">
            Showroom thiết bị vệ sinh và phòng tắm tại {business.streetAddress}, Hà Nội.
          </p>
          <div className="mt-5 flex gap-2">
            {facebook && (
              <a href={facebook} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 border border-[#CFCBC1] px-3 text-[13px] font-semibold text-[#1D2933] hover:border-[#1D2933]">
                Facebook
              </a>
            )}
            {business.zaloUrl && (
              <a href={business.zaloUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 border border-[#CFCBC1] px-3 text-[13px] font-semibold text-[#1D2933] hover:border-[#1D2933]">
                Zalo
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Danh mục sản phẩm">
          <p className={head}>Sản phẩm</p>
          <ul className="mt-4 space-y-2.5">
            {categories.map((c) => (
              <li key={c}>
                <Link href={`/products?category=${encodeURIComponent(c)}` as Route} className={item}>{c}</Link>
              </li>
            ))}
            <li>
              <Link href={'/concepts' as Route} className={item}>Mẫu phối phòng tắm</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ">
          <p className={head}>Hỗ trợ</p>
          <ul className="mt-4 space-y-2.5">
            {[
              ['Yêu cầu báo giá', '/quote'],
              ['Tra cứu báo giá', '/track-quote'],
              ['Quy trình báo giá', '/quote-process'],
              ['Room Studio 3D', '/room-studio'],
              ['Liên hệ', '/contact'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href as Route} className={item}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className="not-italic">
          <p className={head}>Showroom</p>
          <ul className="mt-4 space-y-3 text-[14px] text-[#1D2933]">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-[#153B55]" aria-hidden="true" />
              <span>
                {business.displayAddress}
                <a href={maps} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-[#07739A]">
                  Chỉ đường <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 flex-none text-[#153B55]" aria-hidden="true" />
              <a href={`tel:${business.telephone}`} className="font-semibold">{business.telephoneDisplay}</a>
            </li>
            {business.zaloUrl && (
              <li className="flex gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 flex-none text-[#153B55]" aria-hidden="true" />
                <a href={business.zaloUrl} target="_blank" rel="noreferrer">Zalo {business.telephoneDisplay}</a>
              </li>
            )}
          </ul>
        </address>
      </div>

      <div className="border-t border-[#DEDBD3]">
        <div className="mx-auto flex w-[min(1320px,calc(100%-2*clamp(16px,4vw,48px)))] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-[12.5px] text-[#5F6D78]">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span>© {year} {business.name}</span>
            <Link href={'/privacy' as Route} className="hover:text-[#1D2933]">Chính sách bảo mật</Link>
            <Link href={'/terms' as Route} className="hover:text-[#1D2933]">Điều khoản sử dụng</Link>
          </div>
          {tenant.poweredByLivLab && <span>Powered by LivLab</span>}
        </div>
      </div>
    </footer>
  );
}
