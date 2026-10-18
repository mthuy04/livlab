import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import ArchitecturalHero from './ArchitecturalHero';
import styles from './ArchitecturalLanding.module.css';

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export default function ArchitecturalLanding({ tenant }: { tenant: TenantStorefrontConfig }) {
  const landing = tenant.experience.home.landing;
  if (!landing) return null;

  return (
    <>
      <ArchitecturalHero
        copy={tenant.experience.copy.hero}
        image={landing.hero.image}
        hotspots={landing.hero.hotspots}
      />

      <section id="categories" className={styles.section}>
        <div className="home-container">
          <SectionIntro
            eyebrow={landing.categories.eyebrow}
            title={landing.categories.title}
            description={landing.categories.description}
          />
          <div className={styles.categoryGrid}>
            {landing.categories.items.map((item, index) => (
              <Link
                id={item.id}
                key={item.id}
                href={item.href as Route}
                className={`${styles.categoryCard} ${index < 2 ? styles.categoryCardWide : ''}`}
              >
                <div className={styles.categoryImage}>
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 34vw"
                    className={styles.coverImage}
                  />
                </div>
                <div className={styles.categoryCaption}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.note}</p>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="concept-showcase" className={`${styles.section} ${styles.conceptSection}`}>
        <div className="home-container">
          <div className={styles.conceptHeader}>
            <SectionIntro
              eyebrow={landing.concepts.eyebrow}
              title={landing.concepts.title}
              description={landing.concepts.description}
            />
            <Link href={landing.concepts.cta.href as Route} className={styles.textLink}>
              {landing.concepts.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.conceptGrid}>
            {landing.concepts.items.map((item, index) => (
              <Link
                key={item.title}
                href={item.href as Route}
                className={`${styles.conceptCard} ${index === 0 ? styles.conceptFeatured : ''}`}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes={index === 0 ? '(max-width: 767px) 100vw, 66vw' : '(max-width: 767px) 100vw, 34vw'}
                  className={styles.coverImage}
                />
                <div className={styles.conceptShade} aria-hidden="true" />
                {index === 0 && (
                  <>
                    <span className={styles.conceptPinOne} aria-hidden="true">1</span>
                    <span className={styles.conceptPinTwo} aria-hidden="true">2</span>
                  </>
                )}
                <div className={styles.conceptCaption}>
                  <p>{item.note}</p>
                  <h3>{item.title}</h3>
                  <span>KHÁM PHÁ SẢN PHẨM →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="featured-products" className={`${styles.section} ${styles.productSection}`}>
        <div className="home-container">
          <SectionIntro
            eyebrow={landing.products.eyebrow}
            title={landing.products.title}
            description={landing.products.description}
          />
          <div className={styles.productGrid}>
            {landing.products.items.map((product) => (
              <article key={product.sku} className={styles.productCard}>
                <div className={styles.productImage}>
                  <Image
                    src={product.image.src}
                    alt={product.image.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className={styles.productObject}
                  />
                </div>
                <div className={styles.productCopy}>
                  <p className={styles.productMeta}>{product.category} · {product.brand}</p>
                  <h3>{product.name}</h3>
                  <p className={styles.productSku}>{product.sku}</p>
                  <p className={styles.productPrice}>{formatVnd(product.referencePrice)}</p>
                  <p className={styles.productSource}>{product.sourceLabel}</p>
                  {/* A catalogue product opens its own page; only an off-site
                      reference leaves the storefront, and says so. */}
                  {product.href.startsWith('/') ? (
                    <Link href={product.href as Route} className={styles.productLink}>
                      XEM CHI TIẾT
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ) : (
                    <a href={product.href} target="_blank" rel="noreferrer" className={styles.productLink}>
                      XEM NGUỒN SẢN PHẨM
                      <ArrowRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.productNote}>{landing.products.note}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.studioSection}`}>
        <div className={`${styles.studioGrid} home-container`}>
          <div className={styles.studioMedia}>
            <Image
              src={landing.roomStudio.image.src}
              alt={landing.roomStudio.image.alt}
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
              className={styles.studioImage}
            />
          </div>
          <div className={styles.studioCopy}>
            <p className={styles.eyebrow}>{landing.roomStudio.eyebrow}</p>
            <h2>{landing.roomStudio.title}</h2>
            <p>{landing.roomStudio.description}</p>
            <Link href={landing.roomStudio.cta.href as Route} className={styles.primaryButton}>
              {landing.roomStudio.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="about-giangson" className={styles.aboutSection}>
        <div className={`${styles.aboutGrid} home-container`}>
          <p className={styles.eyebrow}>{landing.about.eyebrow}</p>
          <div>
            <h2>{landing.about.title}</h2>
            <p>{landing.about.body}</p>
          </div>
        </div>
      </section>

      <section id="contact-giangson" className={styles.contactSection}>
        <div className={`${styles.contactGrid} home-container`}>
          <div>
            <h2>{landing.contact.title}</h2>
            <p>{landing.contact.body}</p>
          </div>
          <div className={styles.contactActions}>
            <a href={landing.contact.cta.href} className={styles.contactButton}>
              {landing.contact.cta.label}
              <ArrowRight aria-hidden="true" />
            </a>
            <a href={`tel:${landing.contact.phone.replace(/\s/g, '')}`} className={styles.phoneLink}>
              <Phone aria-hidden="true" />
              Hotline / Zalo {landing.contact.phone}
            </a>
          </div>
        </div>
        <p className={`${styles.demoNotice} home-container`}>
          {tenant.experience.copy.demoNotice}.
        </p>
      </section>
    </>
  );
}
