/**
 * Tenant routing, isolation and search-engine output.
 *
 *   npm run test:tenant-seo
 *
 * A visitor on giangson.livlab.space must get Giang Sơn — its canonical
 * origin, its sitemap, its structured data — whatever cookie they carry, and
 * nothing that resolves to another storefront may be indexed as a copy.
 */
import { readFileSync } from 'node:fs';
import { TENANTS } from '@/lib/storefront/tenantConfig';
import { normalizeHost, siteContext, tenantForHost, absoluteUrl } from '@/lib/storefront/tenantSites';
import { PRIVATE_PATHS, robotsFor, sitemapFor } from '@/lib/seo/siteIndex';
import { breadcrumbJsonLd, localBusinessJsonLd, organizationJsonLd, productJsonLd, serializeJsonLd, websiteJsonLd } from '@/lib/seo/structuredData';
import { channelFor } from '@/lib/analytics/events';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

const GS = TENANTS.giangson;
const TD = TENANTS.tungdang;
const LL = TENANTS.livlab;
const GS_ORIGIN = 'https://giangson.livlab.space';

console.log('\nhostname');
{
  check('chuẩn hoá chữ hoa, cổng, dấu chấm cuối', normalizeHost('GiangSon.LivLab.Space:443.') === null && normalizeHost('GiangSon.LivLab.Space:443') === 'giangson.livlab.space');
  check('bỏ phần sau dấu phẩy (header gộp)', normalizeHost('giangson.livlab.space, evil.example') === 'giangson.livlab.space');
  check('từ chối host không hợp lệ', [null, '', 'a/b', 'evil.example/..', 'x y', '..'].every((h) => normalizeHost(h) === null));
  check('giangson.livlab.space → giangson', tenantForHost('giangson.livlab.space')?.id === 'giangson');
  check('www.livlab.space và livlab.space → livlab', tenantForHost('www.livlab.space')?.id === 'livlab' && tenantForHost('livlab.space')?.id === 'livlab');
  check('vercel.app, localhost không thuộc tenant nào', tenantForHost('livlab.vercel.app') === null && tenantForHost('localhost') === null);
  check('hậu tố giả không khớp', tenantForHost('giangson.livlab.space.evil.example') === null && tenantForHost('evilgiangson.livlab.space') === null);
  const allHosts = Object.values(TENANTS).flatMap((t) => t.site?.hosts ?? []);
  check('mỗi host chỉ thuộc một tenant', new Set(allHosts).size === allHosts.length, allHosts);
}

console.log('\nngữ cảnh site');
{
  const onGs = siteContext({ host: 'giangson.livlab.space', previewTenant: TD });
  check('trên domain Giang Sơn, cookie Tùng Đăng bị bỏ qua', onGs.tenant.id === 'giangson' && onGs.via === 'HOST');
  check('origin canonical là giangson.livlab.space', onGs.origin === GS_ORIGIN);
  check('domain Giang Sơn được index', onGs.indexable === true);

  const preview = siteContext({ host: 'www.livlab.space', previewTenant: TD });
  check('preview Tùng Đăng trên LivLab: không index', preview.tenant.id === 'tungdang' && preview.via === 'PREVIEW' && !preview.indexable);
  // A showroom with its own domain is never painted onto LivLab's hosts, even
  // by a cookie left from before it had one.
  const gsCookieOnLivlab = siteContext({ host: 'www.livlab.space', previewTenant: GS });
  check('cookie Giang Sơn trên www.livlab.space: vẫn là LivLab', gsCookieOnLivlab.tenant.id === 'livlab' && gsCookieOnLivlab.origin === 'https://www.livlab.space');
  const gsCookieOnAlias = siteContext({ host: 'livlab.vercel.app', previewTenant: GS });
  check('cookie Giang Sơn trên alias LivLab: vẫn là LivLab, không index', gsCookieOnAlias.tenant.id === 'livlab' && !gsCookieOnAlias.indexable);

  const www = siteContext({ host: 'www.livlab.space', previewTenant: null });
  check('www.livlab.space: LivLab, được index, origin www', www.tenant.id === 'livlab' && www.indexable && www.origin === 'https://www.livlab.space');
  const alias = siteContext({ host: 'livlab.vercel.app', previewTenant: null });
  check('livlab.vercel.app: LivLab nhưng không index, canonical về www', alias.tenant.id === 'livlab' && !alias.indexable && alias.origin === 'https://www.livlab.space');
  const forged = siteContext({ host: 'attacker.example', previewTenant: null });
  check('host lạ: LivLab, không index', forged.tenant.id === 'livlab' && !forged.indexable && forged.via === 'DEFAULT');
  const temp = siteContext({ host: 'giangson-livlab.vercel.app', previewTenant: TD });
  check('host tạm .vercel.app: phục vụ Giang Sơn, cookie khác bị bỏ qua', temp.tenant.id === 'giangson' && temp.via === 'HOST');
  check('host tạm: không index, canonical vẫn về giangson.livlab.space', !temp.indexable && temp.origin === GS_ORIGIN);
  check('host tạm: không có sitemap, robots không quảng bá sitemap', sitemapFor(temp, { products: [{ id: 'a', category: 'Bồn cầu' }], catalogCheckedAt: null, conceptSlugs: [] }).length === 0 && robotsFor(temp).sitemap === undefined);
  check('absoluteUrl giữ đúng origin', absoluteUrl(GS_ORIGIN, '/') === `${GS_ORIGIN}/` && absoluteUrl(GS_ORIGIN, '/products?category=L') === `${GS_ORIGIN}/products?category=L`);
}

console.log('\nrobots.txt');
{
  const gs = robotsFor(siteContext({ host: 'giangson.livlab.space', previewTenant: null }));
  check('Giang Sơn: sitemap trên domain của mình', gs.sitemap === `${GS_ORIGIN}/sitemap.xml`);
  const rules = Array.isArray(gs.rules) ? gs.rules[0] : gs.rules;
  check('cho phép trang công khai', rules.allow === '/');
  check('chặn API, portal, công cụ nội bộ, công tắc preview', ['/api/', '/admin', '/showroom/', '/dev', '/s/'].every((p) => (rules.disallow as string[]).includes(p)));
  check('không chặn /showrooms (trang công khai của LivLab)', !(rules.disallow as string[]).includes('/showroom'));
  check('không chặn trang có noindex (để Google đọc được noindex)', !PRIVATE_PATHS.some((p) => ['/quote', '/track-quote', '/login'].includes(p)));
  const alias = robotsFor(siteContext({ host: 'livlab.vercel.app', previewTenant: null }));
  check('host không index: không quảng bá sitemap', alias.sitemap === undefined);
}

console.log('\nsitemap.xml');
{
  const fixture = JSON.parse(readFileSync('data/demo/giangson-sanitaryware.json', 'utf8')) as {
    products: { brand: string; sku: string; category: string }[];
  };
  const products = fixture.products.map((p) => ({
    id: `${p.brand}-${p.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category: p.category,
  }));
  const input = { products, catalogCheckedAt: '2026-10-19T04:00:00.000Z', conceptSlugs: ['giangson-master-spa'] };
  const gs = sitemapFor(siteContext({ host: 'giangson.livlab.space', previewTenant: null }), input);
  const urls = gs.map((e) => e.url);
  check('mọi URL thuộc giangson.livlab.space', urls.every((u) => new URL(u).host === 'giangson.livlab.space'), urls.filter((u) => new URL(u).host !== 'giangson.livlab.space'));
  check('có trang chủ, danh mục, liên hệ, Room Studio', ['/', '/products', '/contact', '/room-studio'].every((p) => urls.includes(`${GS_ORIGIN}${p}`)));
  check(`đủ ${products.length} trang sản phẩm`, urls.filter((u) => u.includes('/products/')).length === products.length);
  check('có trang từng danh mục', urls.some((u) => u.includes('/products?category=')));
  check('không có trang cá nhân, portal hay preview', !urls.some((u) => /\/(quote|track-quote|login|register|showroom|admin|s)(\/|$|\?)/.test(new URL(u).pathname + new URL(u).search)));
  check('không trùng URL', new Set(urls).size === urls.length);

  const ll = sitemapFor(siteContext({ host: 'www.livlab.space', previewTenant: null }), { ...input, blogSlugs: ['bai-viet-a'] });
  const llUrls = ll.map((e) => e.url);
  check('LivLab: có trang showroom, liên hệ, cẩm nang và bài viết', ['/showrooms', '/contact', '/blog', '/blog/bai-viet-a'].every((p) => llUrls.includes(`https://www.livlab.space${p}`)));
  check('Giang Sơn: không liệt kê trang riêng hay bài viết của LivLab', !urls.some((u) => /\/(about|showrooms|blog|visual-studio)/.test(u)));
  check('LivLab: không liệt kê trang sản phẩm (vẫn noindex như trước)', !ll.some((e) => e.url.includes('/products/')));
  check('LivLab: chỉ URL của www.livlab.space', ll.every((e) => new URL(e.url).host === 'www.livlab.space'));
  check('host không index: sitemap rỗng', sitemapFor(siteContext({ host: 'livlab.vercel.app', previewTenant: null }), input).length === 0);
  check('preview: sitemap rỗng', sitemapFor(siteContext({ host: 'www.livlab.space', previewTenant: TD }), input).length === 0);
}

console.log('\nstructured data');
{
  const site = websiteJsonLd(GS, GS_ORIGIN);
  check('WebSite.name = "Thiết bị vệ sinh Giang Sơn"', site.name === 'Thiết bị vệ sinh Giang Sơn');
  check('WebSite.url là trang chủ subdomain', site.url === `${GS_ORIGIN}/`);
  // The H1 adds where ("… tại Hà Nội"); it must still lead with the site name Google is told.
  check('H1 bắt đầu bằng WebSite.name', GS.experience.copy.hero.titleLines.join(' ').startsWith(String(site.name)));
  const biz = localBusinessJsonLd(GS, GS_ORIGIN)!;
  check('LocalBusiness: điện thoại theo trang Facebook', biz.telephone === '+84329690164');
  check('LocalBusiness: địa chỉ 240 Hồ Tùng Mậu, Hà Nội', JSON.stringify(biz.address).includes('240 Hồ Tùng Mậu') && JSON.stringify(biz.address).includes('Hà Nội'));
  check('LocalBusiness: sameAs Facebook', JSON.stringify(biz.sameAs).includes('facebook.com/thietbigiangson'));
  const forbidden = ['aggregateRating', 'review', 'openingHours', 'openingHoursSpecification', 'geo', 'priceRange'];
  check('không có rating, review, giờ mở cửa, toạ độ chưa xác minh', forbidden.every((k) => !(k in biz)));
  check('LivLab không có LocalBusiness', localBusinessJsonLd(LL, 'https://www.livlab.space') === null);
  const org = organizationJsonLd(LL, 'https://www.livlab.space');
  check('LivLab: Organization tên LivLab, logo tuyệt đối', org?.name === 'LivLab' && String(org?.logo).startsWith('https://www.livlab.space/'));
  check('LivLab: WebSite trỏ publisher về Organization', JSON.stringify(websiteJsonLd(LL, 'https://www.livlab.space').publisher).includes('#organization'));
  check('Giang Sơn: không có Organization riêng (đã có LocalBusiness)', organizationJsonLd(GS, GS_ORIGIN) === null);
  check('điện thoại hiển thị và cấu hình khớp nhau', GS.contact?.phone === GS.business?.telephoneDisplay);

  const reference = productJsonLd({ origin: GS_ORIGIN, path: '/products/inax-bf-1656v', name: 'Bồn tắm', brand: 'INAX', sku: 'BF-1656V', category: 'Bồn tắm', description: null, images: ['/x.png'], offerPrice: null });
  check('giá tham khảo: Product không kèm Offer', !('offers' in reference));
  check('ảnh tương đối thành URL tuyệt đối trên đúng origin', JSON.stringify(reference.image) === JSON.stringify([`${GS_ORIGIN}/x.png`]));
  const offered = productJsonLd({ origin: GS_ORIGIN, path: '/products/a', name: 'A', brand: 'TOTO', sku: 'A', category: null, description: null, images: [], offerPrice: 1000 });
  check('giá showroom xác nhận: Offer VND, không kèm tồn kho tự đặt', JSON.stringify(offered.offers).includes('"priceCurrency":"VND"') && !JSON.stringify(offered.offers).includes('availability'));
  check('JSON-LD không thể đóng thẻ script', !serializeJsonLd({ name: '</script><script>alert(1)</script>' }).includes('</script>'));
  const crumbs = breadcrumbJsonLd(GS_ORIGIN, [{ name: 'Trang chủ', path: '/' }, { name: 'Sản phẩm', path: '/products' }]);
  check('Breadcrumb trên đúng origin', JSON.stringify(crumbs).includes(`${GS_ORIGIN}/products`));
}

console.log('\ncô lập dữ liệu danh mục');
{
  const { getCatalog } = await import('@/lib/storefront/catalog');
  const { brandLogoFor } = await import('@/components/storefront/catalog/brandLogos');
  const gs = await getCatalog(GS);
  const td = await getCatalog(TD);
  const gsAgain = await getCatalog(GS);
  check('mỗi tenant giữ danh mục riêng trong cùng một tiến trình', gs.products.length === gsAgain.products.length && gs.products.every((p, i) => p.id === gsAgain.products[i].id) && td.products.length !== gs.products.length);
  check('mọi sản phẩm Giang Sơn mang mã danh mục của Giang Sơn', gs.products.every((p) => p.catalogProductId.startsWith('demo:giangson:')));
  const fromTd = gs.products.filter((p) => /beptungdang\.vn/.test(`${p.image} ${p.imageProvenance?.sourceUrl ?? ''}`));
  check('Giang Sơn không dùng ảnh lấy từ website Tùng Đăng', fromTd.length === 0, fromTd.map((p) => p.id));
  check('Tùng Đăng vẫn dùng ảnh của chính mình', td.products.some((p) => /beptungdang\.vn/.test(`${p.image} ${p.imageProvenance?.sourceUrl ?? ''}`)));
  check('logo thương hiệu (nguồn Tùng Đăng) chỉ hiện trên Tùng Đăng', brandLogoFor('giangson', 'TOTO') === null && brandLogoFor('tungdang', 'TOTO') !== null);
}

console.log('\nnguồn truy cập (cho KPI lead)');
{
  check('Google → organic_search', channelFor('www.google.com.vn', null, 'giangson.livlab.space') === 'organic_search');
  check('Cốc Cốc → organic_search', channelFor('coccoc.com', null, 'giangson.livlab.space') === 'organic_search');
  check('Facebook → social', channelFor('l.facebook.com', null, 'giangson.livlab.space') === 'social');
  check('utm_medium=cpc → paid', channelFor('www.google.com', 'cpc', 'giangson.livlab.space') === 'paid');
  check('không referrer → direct', channelFor(null, null, 'giangson.livlab.space') === 'direct');
  check('nội bộ → direct', channelFor('giangson.livlab.space', null, 'giangson.livlab.space') === 'direct');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
