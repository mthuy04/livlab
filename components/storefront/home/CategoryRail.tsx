import Link from 'next/link';
import type { Route } from 'next';
import type { HomeCategory } from '@/lib/storefront/tenantHome';
import { AllIcon, iconFor } from '@/components/storefront/catalog/CategoryIcons';

/**
 * The `iconRail` category navigation.
 *
 * Every category the catalogue holds, as one line icon and a count — the
 * category-first browsing a sanitaryware retailer's customers expect, without
 * a wall of category cards. The icons are the catalogue's own family
 * (CategoryIcons), so the rail and the catalogue filter speak one language.
 *
 * Categories come from the catalogue, never from configuration: a category
 * with nothing in it cannot appear, and a new one appears on its own.
 */
export default function CategoryRail({
  title,
  categories,
  productCount,
}: {
  title: string;
  categories: HomeCategory[];
  productCount: number;
}) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="home-category-rail" className="bg-white">
      <div className="home-container pb-12 pt-7 md:pb-16">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="home-category-rail"
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.16em', color: 'var(--tenant-ink)' }}
          >
            {title}
          </h2>
          <Link
            href={'/products' as Route}
            className="transition-colors hover:text-[color:var(--tenant-accent-ink)]"
            style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.1em', color: '#5E5C58' }}
          >
            XEM TẤT CẢ {productCount} SẢN PHẨM →
          </Link>
        </div>

        <ul
          className="grid grid-cols-3 sm:grid-cols-6"
          style={{ borderBlock: '1px solid #E7E5E1' }}
        >
          {categories.map((category) => (
            <RailItem
              key={category.name}
              href={category.href}
              label={category.name}
              count={category.count}
              Icon={iconFor(category.name)}
            />
          ))}
          <RailItem href="/products" label="Tất cả" count={productCount} Icon={AllIcon} />
        </ul>
      </div>
    </section>
  );
}

function RailItem({
  href,
  label,
  count,
  Icon,
}: {
  href: string;
  label: string;
  count: number;
  Icon: ReturnType<typeof iconFor>;
}) {
  return (
    <li className="[&:not(:first-child)]:border-l [&:not(:first-child)]:border-[#EFEDEA] max-sm:[&:nth-child(3n+1)]:border-l-0 max-sm:[&:nth-child(n+4)]:border-t">
      <Link
        href={href as Route}
        className="group relative flex h-full flex-col items-center px-2 pb-4 pt-5 text-center outline-offset-[-2px]"
      >
        <Icon
          width={34}
          height={34}
          className="text-[color:var(--tenant-ink)] transition-colors group-hover:text-[color:var(--tenant-accent)] group-focus-visible:text-[color:var(--tenant-accent)]"
        />
        <span
          className="mt-3.5 transition-colors group-hover:text-[color:var(--tenant-accent-ink)]"
          style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.08em', color: 'var(--tenant-ink)' }}
        >
          {label.toUpperCase()}
        </span>
        <span className="mt-1" style={{ fontSize: 12, color: '#8A8782' }}>
          {count} sản phẩm
        </span>
        {/* The accent arrives on hover, as a rule along the item's foot. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-6 bottom-[-1px] h-[2px] origin-center scale-x-0 transition-transform group-hover:scale-x-100 group-focus-visible:scale-x-100"
          style={{ backgroundColor: 'var(--tenant-accent)' }}
        />
      </Link>
    </li>
  );
}
