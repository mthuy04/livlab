import type { Metadata } from 'next';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import LivLabContactPage from '@/components/contact/LivLabContactPage';
import ShowroomContact from '@/components/contact/ShowroomContact';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structuredData';
import { livlabPageMetadata, shortBusinessName } from '@/lib/seo/pageMetadata';

/**
 * A showroom with confirmed business details gets its own contact page; LivLab
 * keeps its partner enquiry page, unchanged.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { tenant } = await resolveTenantContext();
  const business = tenant.business;
  if (!business) {
    return livlabPageMetadata('/contact', {
      title: 'Liên hệ | LivLab',
      description: 'Liên hệ LivLab để được tư vấn concept, combo phòng tắm hoặc hợp tác đưa showroom lên nền tảng.',
    });
  }
  return {
    title: `Liên hệ showroom ${shortBusinessName(business.name)} | ${business.streetAddress}`,
    description: `Showroom ${business.name}: ${business.displayAddress}. Hotline / Zalo ${business.telephoneDisplay}. Tư vấn chọn thiết bị và báo giá.`,
    alternates: { canonical: '/contact' },
  };
}

export default async function ContactPage() {
  const { tenant, origin } = await resolveTenantContext();
  if (!tenant.business) return <LivLabContactPage />;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: 'Trang chủ', path: '/' },
            { name: 'Liên hệ', path: '/contact' },
          ]),
        ]}
      />
      <ShowroomContact tenant={tenant} />
    </>
  );
}
