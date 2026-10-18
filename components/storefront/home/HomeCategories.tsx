import Link from 'next/link';
import type { Route } from 'next';
import type { CategoryEntry } from '@/lib/storefront/homepageData';
import { SectionHeader, ProductStage, TEXT } from './editorial';

/** Four categories, each a stage and a title. No card, no product count. */
export default function HomeCategories({
  categories,
  title = 'SẢN PHẨM',
}: {
  categories: CategoryEntry[];
  title?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-container">
        <SectionHeader title={title} href={'/products' as Route} />

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-7">
          {categories.map((category) => (
            <Link key={category.name} href={category.href as Route} className="group block">
              <ProductStage
                src={category.image}
                alt={category.name}
                scale={category.imageScale}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="mt-5 flex items-center justify-between gap-3">
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', color: TEXT }}>
                  {category.name.toUpperCase()}
                </span>
                <span
                  aria-hidden="true"
                  className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ color: TEXT }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
