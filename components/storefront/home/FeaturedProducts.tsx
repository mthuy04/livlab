import Link from 'next/link';
import type { Route } from 'next';
import type { FeaturedProduct } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';
import { SectionHeader, ProductStage, SECTION_PAD, TEXT, TEXT_MUTED } from './editorial';

/**
 * Four real catalogue products. Availability is not shown because the
 * catalogue does not carry it, and a SKU column does not exist on the model —
 * neither is invented here.
 */
export default function FeaturedProducts({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section style={{ paddingBlock: SECTION_PAD, backgroundColor: '#FFFFFF' }}>
      <Container>
        <SectionHeader title="SẢN PHẨM NỔI BẬT" href={'/products' as Route} />

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-14 lg:grid-cols-4 lg:gap-x-8">
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
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                {product.brand && (
                  <p className="mt-5" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.1em', color: TEXT_MUTED }}>
                    {product.brand.toUpperCase()}
                  </p>
                )}
                <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 500, color: TEXT }}>
                  {product.name}
                </p>
                {price && (
                  <p className="mt-2" style={{ fontSize: 14, color: TEXT_MUTED }}>
                    Giá tham khảo {price}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
