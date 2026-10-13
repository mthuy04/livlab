import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { CollectionItem } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';
import { SectionHeader, ArrowLink, AccentRule, SECTION_PAD, TEXT, BODY_STYLE } from './editorial';

/**
 * Three alternating editorial rows: media 62%, copy 38%.
 *
 * The sides swap by flipping the grid template, not by `order`. Ordering the
 * image second left it in the 38% column, so the middle row rendered its
 * photograph at little over half the width of its neighbours.
 */
export default function HomeCollections({ collections }: { collections: CollectionItem[] }) {
  if (collections.length === 0) return null;

  return (
    <section style={{ paddingBlock: SECTION_PAD, backgroundColor: '#FFFFFF' }}>
      <Container>
        <SectionHeader title="BỘ SƯU TẬP" href={'/concepts' as Route} />

        <div className="mt-10 lg:mt-14">
          {collections.slice(0, 3).map((item, index) => {
            const imageRight = index % 2 === 1;
            return (
              <article
                key={item.slug}
                className={`grid gap-7 lg:items-center lg:gap-[56px] ${
                  imageRight ? 'lg:grid-cols-[38fr_62fr]' : 'lg:grid-cols-[62fr_38fr]'
                }`}
                style={index > 0 ? { marginTop: 'clamp(40px, 3vw, 56px)' } : undefined}
              >
                <Link
                  href={`/concepts/${item.slug}` as Route}
                  className={`group block overflow-hidden ${imageRight ? 'lg:order-2' : ''}`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={1672}
                    height={941}
                    sizes="(max-width: 1024px) 100vw, 62vw"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </Link>

                <div>
                  <AccentRule />
                  <h3
                    className="mt-5"
                    style={{ fontSize: 'clamp(22px, 1.2rem + 0.5vw, 26px)', fontWeight: 500, lineHeight: 1.25, color: TEXT }}
                  >
                    {item.title.toUpperCase()}
                  </h3>
                  {item.description && (
                    <p className="mt-4 max-w-[380px]" style={BODY_STYLE}>
                      {item.description}
                    </p>
                  )}
                  <div className="mt-6">
                    <ArrowLink href={`/concepts/${item.slug}` as Route}>XEM BỘ SƯU TẬP</ArrowLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
