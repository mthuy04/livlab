import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ArrowUpRight, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import type { LandingSectionIntro } from '@/lib/storefront/tenantExperience';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { getCatalog } from '@/lib/storefront/catalog';
import { SHOWROOM_COMBOS, publishedCombos, publishedVideos } from '@/lib/storefront/showroomMedia';
import type { CatalogQuoteEntry } from '@/lib/context/QuoteContext';
import AddToQuoteButton from './AddToQuoteButton';
import ShowroomCombos from './ShowroomCombos';
import ShowroomVideos from './ShowroomVideos';
import s from './ArchitecturalLanding.module.css';

const vnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const tel = (phone: string) => `tel:+84${phone.replace(/\s/g, '').replace(/^0/, '')}`;

function Intro({ eyebrow, title, description, light = false }: LandingSectionIntro & { light?: boolean }) {
  return (
    <div>
      <p className={s.eyebrow}>{eyebrow}</p>
      <h2 className={s.h2}>{title}</h2>
      {description && <p className={s.lead} style={light ? { color: 'rgba(255,255,255,.74)' } : undefined}>{description}</p>}
    </div>
  );
}

function quoteEntry(p: CatalogProduct, tenantId: string, context: string): CatalogQuoteEntry {
  return {
    catalogProductId: p.catalogProductId,
    productId: p.id,
    sourceType: p.sourceType,
    tenantId,
    name: p.name,
    brand: p.brand,
    category: p.category,
    sku: p.sku,
    image: p.image,
    showroomPrice: p.showroomPrice,
    referencePrice: p.referencePrice,
    sourceContext: context,
  };
}

/**
 * The showroom's homepage. Server-rendered; only the quote buttons, the
 * video players and (once approved) the combos run on the client.
 *
 * Products, prices and category counts come from the catalogue at render
 * time, so the page can never show a model or a price the catalogue does not
 * hold. A section with nothing real to show — combos today — is left out.
 */
export default async function ArchitecturalLanding({ tenant }: { tenant: TenantStorefrontConfig }) {
  const landing = tenant.experience.home.landing;
  if (!landing) return null;
  const hero = tenant.experience.copy.hero;

  const catalog = await getCatalog(tenant).catch(() => null);
  const products = catalog?.products ?? [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const featured = landing.products.productIds.map((id) => byId.get(id)).filter((p): p is CatalogProduct => Boolean(p));
  const countIn = (groups: string[]) => products.filter((p) => groups.includes(p.category)).length;
  const brands = [...new Set(products.map((p) => p.brand))].sort();

  const approved = SHOWROOM_COMBOS.some((c) => c.tenantId === tenant.id && c.publication === 'PUBLISHED');
  const combos = approved ? publishedCombos(tenant.id, new Set(products.map((p) => p.catalogProductId))) : [];
  const comboEntries: Record<string, CatalogQuoteEntry> = {};
  for (const combo of combos) {
    for (const part of combo.components) {
      const p = products.find((x) => x.catalogProductId === part.catalogProductId);
      if (p) comboEntries[p.catalogProductId] = quoteEntry(p, tenant.id, `COMBO:${combo.id}`);
    }
  }
  const videos = publishedVideos(tenant.id);
  const [leadConcept, ...sideConcepts] = landing.concepts.items;

  return (
    <div className={s.page}>
      {/* A — Hero: the photograph carries the page; one dominant action. */}
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroCopy}>
          {hero.eyebrow && <p className={s.eyebrow}>{hero.eyebrow}</p>}
          <h1 id="hero-title" className={s.heroTitle}>
            {hero.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={s.heroBody}>{hero.body}</p>
          <div className={s.heroActions}>
            <Link href={hero.primaryCta.href as Route} className={s.btn}>
              {hero.primaryCta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            {hero.secondaryCta && (
              <Link href={hero.secondaryCta.href as Route} className={s.btnGhost}>
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>
          {products.length > 0 && (
            <ul className={s.heroFacts}>
              <li>
                <strong>{products.length} mẫu</strong>
                <span>có mã và thông số</span>
              </li>
              <li>
                <strong>{brands.join(' · ')}</strong>
                <span>thương hiệu</span>
              </li>
              <li>
                <strong>3D</strong>
                <span>bố trí thử phòng</span>
              </li>
            </ul>
          )}
        </div>
        <div className={s.heroMedia}>
          <Image src={landing.hero.image.src} alt={landing.hero.image.alt} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
          {landing.hero.captionHref ? (
            <Link href={landing.hero.captionHref as Route} className={s.heroCaption}>
              {landing.hero.caption}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ) : (
            <p className={s.heroCaption}>{landing.hero.caption}</p>
          )}
        </div>
      </section>

      {/* B — Categories, as the products themselves. */}
      <section id="categories" className={s.section} aria-labelledby="categories-title">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.eyebrow}>{landing.categories.eyebrow}</p>
              <h2 id="categories-title" className={s.h2}>{landing.categories.title}</h2>
              <p className={s.lead}>{landing.categories.description}</p>
            </div>
            <Link href={'/products' as Route} className={s.textLink}>
              Tất cả sản phẩm <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className={s.tiles}>
            {landing.categories.items.map((item, index) => {
              const count = countIn(item.categories);
              return (
                <Link key={item.id} id={item.id} href={item.href as Route} className={`${s.tile} ${index === 0 ? s.tileFeature : ''}`}>
                  <div className={s.tileImage}>
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes={index === 0 ? '(max-width: 1100px) 100vw, 34vw' : '(max-width: 640px) 50vw, 34vw'}
                    />
                  </div>
                  <div className={s.tileFoot}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.note}</p>
                    </div>
                    <span className={s.tileCount}>
                      {count > 0 ? `${count} mẫu` : 'Xem'}
                      <ArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* C — Combos: only once the showroom has approved one. */}
      {landing.combos && combos.length > 0 && (
        <section id="combos" className={`${s.section} ${s.offWhite}`}>
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <Intro {...landing.combos} />
            </div>
            <ShowroomCombos combos={combos} entries={comboEntries} />
          </div>
        </section>
      )}

      {/* D — Featured products, read from the catalogue. */}
      {featured.length > 0 && (
        <section id="featured-products" className={`${s.section} ${s.offWhite}`} aria-labelledby="products-title">
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <div>
                <p className={s.eyebrow}>{landing.products.eyebrow}</p>
                <h2 id="products-title" className={s.h2}>{landing.products.title}</h2>
                <p className={s.lead}>{landing.products.description}</p>
              </div>
              <Link href={'/products' as Route} className={s.textLink}>
                Xem toàn bộ danh mục <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={s.cards}>
              {featured.map((p) => {
                const discount =
                  p.referencePrice && p.showroomPrice ? Math.round((1 - p.showroomPrice / p.referencePrice) * 100) : 0;
                return (
                  <article key={p.id} className={s.card}>
                    <Link href={p.href as Route} className={s.cardStage} tabIndex={-1} aria-hidden="true">
                      <Image src={p.image} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 50vw, 25vw" />
                    </Link>
                    <div className={s.cardBody}>
                      <p className={s.cardMeta}>
                        <b>{p.brand}</b> · {p.sku}
                      </p>
                      <h3 className={s.cardTitle}>
                        <Link href={p.href as Route}>{p.name}</Link>
                      </h3>
                      {p.showroomPrice ? (
                        <>
                          <p className={s.cardPriceLabel}>{p.priceBasis ?? 'Giá tham khảo'}</p>
                          <p className={s.cardPrice}>
                            <strong>{vnd(p.showroomPrice)}</strong>
                            {p.referencePrice && discount > 0 && (
                              <>
                                <s>{vnd(p.referencePrice)}</s>
                                <em>−{discount}%</em>
                              </>
                            )}
                          </p>
                        </>
                      ) : (
                        <p className={s.cardPriceLabel}>Liên hệ báo giá</p>
                      )}
                      <div className={s.cardActions}>
                        <Link href={p.href as Route}>Xem chi tiết</Link>
                        <AddToQuoteButton entry={quoteEntry(p, tenant.id, 'HOME_FEATURED')} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className={s.note}>{landing.products.note}</p>
          </div>
        </section>
      )}

      {/* E — The showroom's own videos. */}
      {landing.videos && videos.length > 0 && (
        <section id="videos" className={s.section}>
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <Intro {...landing.videos} />
            </div>
            <ShowroomVideos videos={videos} />
            <p className={s.note}>{landing.videos.note}</p>
          </div>
        </section>
      )}

      {/* F — Inspiration: fewer, larger images, labelled as renders. */}
      <section id="concept-showcase" className={`${s.section} ${s.offWhite}`}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Intro {...landing.concepts} />
            <Link href={landing.concepts.cta.href as Route} className={s.textLink}>
              {landing.concepts.cta.label} <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className={s.concepts}>
            {leadConcept && (
              <Link href={leadConcept.href as Route} className={s.concept}>
                <div className={s.conceptImage}>
                  <Image src={leadConcept.image.src} alt={leadConcept.image.alt} fill sizes="(max-width: 900px) 100vw, 58vw" />
                  <span className={s.renderTag}>Phối cảnh minh hoạ</span>
                </div>
                <div className={s.conceptCopy}>
                  <div>
                    <p>{leadConcept.note}</p>
                    <h3>{leadConcept.title}</h3>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </div>
              </Link>
            )}
            <div className={s.conceptSide}>
              {sideConcepts.map((item) => (
                <Link key={item.title} href={item.href as Route} className={s.concept}>
                  <div className={s.conceptImage}>
                    <Image src={item.image.src} alt={item.image.alt} fill sizes="(max-width: 900px) 100vw, 42vw" />
                    <span className={s.renderTag}>Phối cảnh minh hoạ</span>
                  </div>
                  <div className={s.conceptCopy}>
                    <div>
                      <p>{item.note}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <ArrowRight aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* G — Room Studio, shown large enough to read. */}
      <section id="room-studio" className={`${s.section} ${s.studio}`}>
        <div className={`${s.wrap} ${s.studioGrid}`}>
          <Link href={landing.roomStudio.cta.href as Route} className={s.studioMedia} aria-label={landing.roomStudio.cta.label}>
            <Image src={landing.roomStudio.image.src} alt={landing.roomStudio.image.alt} fill sizes="(max-width: 1100px) 100vw, 58vw" />
          </Link>
          <div>
            <Intro {...landing.roomStudio} light />
            <ol className={s.steps}>
              {landing.roomStudio.steps.map((step, i) => (
                <li key={step.title}>
                  <span>0{i + 1}</span>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <div className={s.studioCta}>
              <Link href={landing.roomStudio.cta.href as Route} className={s.btnLight}>
                {landing.roomStudio.cta.label}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <p className={s.studioNote}>{landing.roomStudio.note}</p>
          </div>
        </div>
      </section>

      {/* H — The real showroom: a map of the verified address, and how to reach it. */}
      <section id="showroom" className={s.section} aria-labelledby="showroom-title">
        <div className={`${s.wrap} ${s.showroomGrid}`}>
          <div className={s.map}>
            {/* Under the map: what shows if the embed cannot load. */}
            <div className={s.mapFallback}>
              <MapPin aria-hidden="true" />
              <strong>{landing.showroom.address}</strong>
              <a href={landing.showroom.mapsUrl} target="_blank" rel="noreferrer" className={s.textLink}>
                Mở Google Maps <ExternalLink aria-hidden="true" />
              </a>
            </div>
            {landing.showroom.mapEmbedUrl && (
              <iframe
                src={landing.showroom.mapEmbedUrl}
                title={`Bản đồ: ${landing.showroom.address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
          <div>
            <p className={s.eyebrow}>{landing.showroom.eyebrow}</p>
            <h2 id="showroom-title" className={s.h2}>{landing.showroom.title}</h2>
            <p className={s.lead}>{landing.showroom.description}</p>
            <ul className={s.facts}>
              <li>
                <MapPin aria-hidden="true" />
                <small>Địa chỉ</small>
                <strong>{landing.showroom.address}</strong>
                <a href={landing.showroom.mapsUrl} target="_blank" rel="noreferrer">
                  Chỉ đường trên Google Maps <ExternalLink aria-hidden="true" />
                </a>
              </li>
              <li>
                <Phone aria-hidden="true" />
                <small>Hotline / Zalo</small>
                <strong>
                  <a href={tel(landing.showroom.phone)} style={{ color: 'inherit', fontSize: 'inherit', margin: 0 }}>
                    {landing.showroom.phone}
                  </a>
                </strong>
                {landing.showroom.zaloUrl && (
                  <a href={landing.showroom.zaloUrl} target="_blank" rel="noreferrer">
                    Nhắn Zalo <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </li>
              {landing.showroom.facebookUrl && (
                <li>
                  <MessageCircle aria-hidden="true" />
                  <small>Facebook</small>
                  <strong>{tenant.brand.name}</strong>
                  <a href={landing.showroom.facebookUrl} target="_blank" rel="noreferrer">
                    Xem trang Facebook <ExternalLink aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
            <div className={s.showroomCta}>
              <Link href={landing.showroom.cta.href as Route} className={s.btn}>
                {landing.showroom.cta.label}
                <ArrowRight aria-hidden="true" />
              </Link>
              <a href={tel(landing.showroom.phone)} className={s.btnGhost}>
                <Phone aria-hidden="true" /> Gọi showroom
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* I — One closing call. */}
      <section id="contact-giangson" className={s.closing}>
        <div className={`${s.wrap} ${s.closingGrid}`}>
          <div>
            <h2>{landing.contact.title}</h2>
            <p>{landing.contact.body}</p>
          </div>
          <div className={s.closingActions}>
            <Link href={landing.contact.cta.href as Route} className={s.btnLight}>
              {landing.contact.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            {landing.contact.zaloUrl && (
              <a href={landing.contact.zaloUrl} target="_blank" rel="noreferrer" className={s.btnOutlineLight}>
                <MessageCircle aria-hidden="true" /> Liên hệ Zalo
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
