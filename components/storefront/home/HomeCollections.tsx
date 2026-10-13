import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { CollectionItem } from '@/lib/storefront/homepageData';
import { SectionHeader, ArrowLink, BG_SOFT, TEXT, TEXT_MUTED } from './editorial';

/**
 * Three alternating editorial rows: media 1.62fr, copy 1fr.
 *
 * The sides swap by flipping the grid template, not by `order` alone — an
 * image ordered second but left in the narrow column renders at half the
 * width of its neighbours.
 */
export default function HomeCollections({ collections }: { collections: CollectionItem[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="home-section" style={{ backgroundColor: BG_SOFT }}>
      <div className="home-container">
        <SectionHeader title="BỘ SƯU TẬP" href={'/concepts' as Route} />

        <div className="space-y-16 md:space-y-24">
          {collections.slice(0, 3).map((item, index) => {
            const imageRight = index % 2 === 1;
            return (
              <div
                key={item.slug}
                className={`grid items-center gap-12 md:gap-16 ${
                  imageRight ? 'md:grid-cols-[1fr_1.62fr]' : 'md:grid-cols-[1.62fr_1fr]'
                }`}
              >
                <Link
                  href={`/concepts/${item.slug}` as Route}
                  className={`group relative block aspect-[16/10] overflow-hidden ${imageRight ? 'md:order-2' : ''}`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 62vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.018]"
                  />
                </Link>

                <div className={imageRight ? 'md:order-1' : ''}>
                  <div className="mb-6 h-[5px] w-8" style={{ backgroundColor: 'var(--tenant-accent)' }} />
                  <h3
                    className="max-w-[430px]"
                    style={{ fontSize: 25, fontWeight: 500, lineHeight: 1.25, color: TEXT }}
                  >
                    {item.title.toUpperCase()}
                  </h3>
                  {item.description && (
                    <p
                      className="mt-5 max-w-[420px]"
                      style={{ fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED }}
                    >
                      {item.description}
                    </p>
                  )}
                  <div className="mt-7">
                    <ArrowLink href={`/concepts/${item.slug}` as Route}>XEM BỘ SƯU TẬP</ArrowLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
