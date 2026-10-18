import Link from 'next/link';
import type { Route } from 'next';
import type { FeaturedProduct } from '@/lib/storefront/homepageData';
import { SectionHeader, ProductStage, TEXT } from './editorial';

/**
 * Four real catalogue products. Availability is not shown because the
 * catalogue does not carry it, and a SKU column does not exist on the model —
 * neither is invented here.
 */
export default function FeaturedProducts({
  products,
  title = 'SẢN PHẨM NỔI BẬT',
}: {
  products: FeaturedProduct[];
  title?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-container">
        <SectionHeader title={title} href={'/products' as Route} />

        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-7">
          {products.map((product) => {
            const price =
              product.priceRange ??
              (product.priceMin ? `${product.priceMin.toLocaleString('vi-VN')}đ` : null);
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug ?? product.id}` as Route}
                className="group block"
              >
                <ProductStage
                  src={product.imageUrl ?? ''}
                  alt={product.name}
                  scale={product.imageScale}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  ratio="1 / 1"
                  inset="10%"
                />
                {product.brand && (
                  <p className="mt-5" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', color: '#777777' }}>
                    {product.brand.toUpperCase()}
                  </p>
                )}
                <h3
                  className="mt-2 min-h-[42px]"
                  style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}
                >
                  {product.name}
                </h3>
                {price && (
                  <p className="mt-2" style={{ fontSize: 13, lineHeight: 1.5, color: '#707070' }}>
                    Giá tham khảo {price}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
