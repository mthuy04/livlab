import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getPublishedConcepts } from '@/lib/storefront/concepts';
import { toCardModel } from '@/lib/storefront/conceptTypes';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import ConceptsBrowser from '@/components/storefront/concepts/ConceptsBrowser';

/**
 * Bathroom concepts, on the server.
 *
 * The page this replaces was a client component that read a generated library
 * out of `lib/data` and localStorage: thirty-four records built from nine
 * stock photographs, with kitchens and living rooms among them, every hotspot
 * stamped from one of six hardcoded coordinate templates, and a hero promising
 * that each concept was "gắn nhãn sản phẩm thật".
 *
 * What is published now is resolved here against this tenant's catalogue and
 * gated on it. A concept appears only if it passed manual QA *and* enough of
 * its mapped products are still sold by this showroom today, so the grid can
 * get smaller on its own and never shows a room it cannot back.
 */

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  return {
    title: `Không gian phòng tắm | ${tenant.brand.name}`,
    description:
      'Những không gian phòng tắm được tuyển chọn theo phong cách, diện tích và ngân sách, ' +
      'với các sản phẩm có thể xem trực tiếp trong từng concept.',
    alternates: { canonical: '/concepts' },
  };
}

export default async function ConceptsPage() {
  const tenant = await resolveTenant();
  const resolved = await getPublishedConcepts(tenant);
  const concepts = resolved.map(toCardModel);

  return (
    <>
      <div className="home-container" style={{ paddingTop: 28, paddingBottom: 34 }}>
        <nav aria-label="Breadcrumb">
          <ol
            className="flex items-center gap-2"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}
          >
            <li>
              <Link href={'/' as Route} className="transition-opacity hover:opacity-60">
                TRANG CHỦ
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>
              KHÔNG GIAN
            </li>
          </ol>
        </nav>

        <h1
          style={{
            marginTop: 22,
            fontSize: 'clamp(30px, 1.6rem + 1.1vw, 45px)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '.012em',
            color: TEXT,
          }}
        >
          KHÔNG GIAN PHÒNG TẮM
        </h1>

        <p className="max-w-[660px]" style={{ marginTop: 16, fontSize: 15, lineHeight: 1.68, color: TEXT_MUTED }}>
          Khám phá những không gian được tuyển chọn theo phong cách, diện tích và ngân sách — với
          các sản phẩm có thể xem trực tiếp trong từng concept.
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${DIVIDER}` }} />

      <div className="home-container" style={{ paddingTop: 40, paddingBottom: 96 }}>
        {concepts.length > 0 ? (
          <ConceptsBrowser concepts={concepts} />
        ) : (
          <p style={{ paddingBlock: 64, fontSize: 15, color: TEXT_MUTED }}>
            Showroom đang cập nhật thư viện không gian.
          </p>
        )}
      </div>
    </>
  );
}
