import type { Metadata } from 'next';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import LivLabContactPage from '@/components/contact/LivLabContactPage';
import ShowroomContact from '@/components/contact/ShowroomContact';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structuredData';

/**
 * A showroom with confirmed business details gets its own contact page; LivLab
 * keeps its partner enquiry page, unchanged.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { tenant } = await resolveTenantContext();
  const business = tenant.business;
  if (!business) return { title: `Liên hệ | ${tenant.brand.name}` };
  return {
    title: `Liên hệ | ${tenant.brand.name}`,
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
