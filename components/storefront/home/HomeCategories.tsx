import Link from 'next/link';
import type { Route } from 'next';
import type { CategoryEntry } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';
import { SectionHeader, ProductStage, SECTION_PAD, TEXT } from './editorial';

/** Four categories, each a stage and a title. No card, no product count. */
export default function HomeCategories({ categories }: { categories: CategoryEntry[] }) {
  if (categories.length === 0) return null;

  return (
    <section style={{ paddingBlock: SECTION_PAD, backgroundColor: '#FFFFFF' }}>
      <Container>
        <SectionHeader title="SẢN PHẨM" href={'/products' as Route} />

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-14 lg:grid-cols-4 lg:gap-x-8">
          {categories.map((category) => (
            <Link key={category.name} href={category.href as Route} className="group block">
              <ProductStage
                src={category.image}
                alt={category.name}
                scale={category.imageScale}
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <p className="mt-5" style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.08em', color: TEXT }}>
                {category.name.toUpperCase()}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
