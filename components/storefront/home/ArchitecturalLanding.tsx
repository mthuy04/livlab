import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import type { LandingSectionIntro } from '@/lib/storefront/tenantExperience';
import { getCatalog } from '@/lib/storefront/catalog';
import { SHOWROOM_COMBOS, publishedCombos, publishedVideos } from '@/lib/storefront/showroomMedia';
import type { CatalogQuoteEntry } from '@/lib/context/QuoteContext';
import ArchitecturalHero from './ArchitecturalHero';
import ShowroomCombos from './ShowroomCombos';
import ShowroomVideos from './ShowroomVideos';
import styles from './ArchitecturalLanding.module.css';

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

function SectionIntro({ eyebrow, title, description }: LandingSectionIntro) {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

/**
 * Combos the showroom has approved, with basket entries for the catalogue
 * products they name. None are approved yet, so the catalogue is only read
 * when there is something to show.
 */
async function comboData(tenant: TenantStorefrontConfig) {
  const approved = SHOWROOM_COMBOS.some((c) => c.tenantId === tenant.id && c.publication === 'PUBLISHED');
  if (!approved) return { combos: [], entries: {} as Record<string, CatalogQuoteEntry> };
  const catalog = await getCatalog(tenant).catch(() => null);
  const products = catalog?.products ?? [];
  const byId = new Map(products.map((p) => [p.catalogProductId, p]));
  const combos = publishedCombos(tenant.id, new Set(byId.keys()));
  const entries: Record<string, CatalogQuoteEntry> = {};
  for (const combo of combos) {
    for (const part of combo.components) {
      const p = part.catalogProductId ? byId.get(part.catalogProductId) : undefined;
      if (!p) continue;
      entries[p.catalogProductId] = {
        catalogProductId: p.catalogProductId,
        productId: p.id,
        sourceType: p.sourceType,
        tenantId: tenant.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        sku: p.sku,
        image: p.image,
        showroomPrice: p.showroomPrice,
        referencePrice: p.referencePrice,
        sourceContext: `COMBO:${combo.id}`,
      };
    }
  }
  return { combos, entries };
}

export default async function ArchitecturalLanding({ tenant }: { tenant: TenantStorefrontConfig }) {
  const landing = tenant.experience.home.landing;
  if (!landing) return null;
  const { combos, entries } = await comboData(tenant);
  const videos = publishedVideos(tenant.id);

  return (
    <>
      <ArchitecturalHero
        copy={tenant.experience.copy.hero}
        image={landing.hero.image}
        hotspots={landing.hero.hotspots}
        supportLink={landing.hero.supportLink}
      />

      {/* 2 — what the showroom sells, as products rather than rooms */}
      <section id="categories" className={styles.section}>
        <div className="home-container">
          <SectionIntro {...landing.categories} />
          <div className={styles.categoryRow}>
            {landing.categories.items.map((item) => (
              <Link id={item.id} key={item.id} href={item.href as Route} className={styles.categoryTile}>
                <div className={styles.categoryTileImage}>
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 767px) 50vw, (max-width: 1100px) 33vw, 20vw"
                    className={styles.productObject}
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

      {/* 3 — combos, once the showroom has approved one */}
      {landing.combos && combos.length > 0 && (
        <section id="combos" className={`${styles.section} ${styles.productSection}`}>
          <div className="home-container">
            <SectionIntro {...landing.combos} />
            <ShowroomCombos combos={combos} entries={entries} />
          </div>
        </section>
      )}

      {/* 4 — featured products */}
      <section id="featured-products" className={`${styles.section} ${styles.productSection}`}>
        <div className="home-container">
          <SectionIntro {...landing.products} />
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
                  <p className={styles.productSku}>Mã: {product.sku}</p>
                  <p className={styles.productPriceLabel}>{product.sourceLabel}</p>
                  <p className={styles.productPrice}>{formatVnd(product.referencePrice)}</p>
                  <div className={styles.productActions}>
                    <Link href={product.href as Route} className={styles.productLink}>
                      XEM CHI TIẾT
                      <ArrowRight aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/quote?interest=${encodeURIComponent(`${product.brand} ${product.sku}`)}` as Route}
                      className={styles.productQuote}
                    >
                      HỎI GIÁ
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.productNote}>{landing.products.note}</p>
        </div>
      </section>

      {/* 5 — the showroom's own videos */}
      {landing.videos && videos.length > 0 && (
        <section id="videos" className={styles.section}>
          <div className="home-container">
            <SectionIntro {...landing.videos} />
            <ShowroomVideos videos={videos} />
            <p className={styles.productNote}>{landing.videos.note}</p>
          </div>
        </section>
      )}

      {/* 6 — inspiration */}
      <section id="concept-showcase" className={`${styles.section} ${styles.conceptSection}`}>
        <div className="home-container">
          <div className={styles.conceptHeader}>
            <SectionIntro {...landing.concepts} />
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
                <div className={styles.conceptCaption}>
                  <p>{item.note}</p>
                  <h3>{item.title}</h3>
                  <span>XEM THIẾT BỊ GỢI Ý →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Room Studio */}
      <section id="room-studio" className={`${styles.section} ${styles.studioSection}`}>
        <div className={`${styles.studioGrid} home-container`}>
          <Link href={landing.roomStudio.cta.href as Route} className={styles.studioMedia} aria-label={landing.roomStudio.cta.label}>
            <Image
              src={landing.roomStudio.image.src}
              alt={landing.roomStudio.image.alt}
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
              className={styles.studioImage}
            />
          </Link>
          <div className={styles.studioCopy}>
            <p className={styles.eyebrow}>{landing.roomStudio.eyebrow}</p>
            <h2>{landing.roomStudio.title}</h2>
            <p>{landing.roomStudio.description}</p>
            <Link href={landing.roomStudio.cta.href as Route} className={styles.primaryButton}>
              {landing.roomStudio.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            {landing.roomStudio.note && <p className={styles.studioNote}>{landing.roomStudio.note}</p>}
          </div>
        </div>
      </section>

      {/* 8 — the showroom itself */}
      <section id="showroom" className={styles.aboutSection}>
        <div className={`${styles.showroomGrid} home-container`}>
          <SectionIntro {...landing.showroom} />
          <ul className={styles.showroomFacts}>
            <li>
              <MapPin aria-hidden="true" />
              <div>
                <p>Địa chỉ</p>
                <strong>{landing.showroom.address}</strong>
                <a href={landing.showroom.mapsUrl} target="_blank" rel="noreferrer">
                  Chỉ đường trên Google Maps <ExternalLink aria-hidden="true" />
                </a>
              </div>
            </li>
            <li>
              <Phone aria-hidden="true" />
              <div>
                <p>Hotline / Zalo</p>
                <strong>
                  <a href={`tel:+84${landing.showroom.phone.replace(/\s/g, '').replace(/^0/, '')}`}>{landing.showroom.phone}</a>
                </strong>
                {landing.showroom.zaloUrl && (
                  <a href={landing.showroom.zaloUrl} target="_blank" rel="noreferrer">
                    Nhắn Zalo <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
            {landing.showroom.facebookUrl && (
              <li>
                <MessageCircle aria-hidden="true" />
                <div>
                  <p>Facebook</p>
                  <strong>Thiết bị vệ sinh Giang Sơn</strong>
                  <a href={landing.showroom.facebookUrl} target="_blank" rel="noreferrer">
                    Xem trang Facebook <ExternalLink aria-hidden="true" />
                  </a>
                </div>
              </li>
            )}
            <li className={styles.showroomCta}>
              <Link href={landing.showroom.cta.href as Route} className={styles.primaryButton}>
                {landing.showroom.cta.label}
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* 9 — closing quotation call */}
      <section id="contact-giangson" className={styles.contactSection}>
        <div className={`${styles.contactGrid} home-container`}>
          <div>
            <h2>{landing.contact.title}</h2>
            <p>{landing.contact.body}</p>
          </div>
          <div className={styles.contactActions}>
            <Link href={landing.contact.cta.href as Route} className={styles.contactButton}>
              {landing.contact.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            <a href={`tel:+84${landing.contact.phone.replace(/\s/g, '').replace(/^0/, '')}`} className={styles.phoneLink}>
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
