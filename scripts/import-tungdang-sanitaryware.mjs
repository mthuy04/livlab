#!/usr/bin/env node
/**
 * Sanitaryware-only demo ingestion for the unsigned Tùng Đăng showroom demo.
 *
 *   node scripts/import-tungdang-sanitaryware.mjs [--pages 6] [--out <path>]
 *   node scripts/import-tungdang-sanitaryware.mjs --add <url>[,<url>] --category <c> [--dry-run]
 *
 * `--add` scrapes only the given product pages, with the same extraction as a
 * full crawl, and merges them into the existing fixture by brand + SKU: a
 * product already present is refreshed in place, a new one is appended, and
 * every other record is left exactly as it was. Use it to pick up one product
 * without re-pricing the whole catalogue. `--dry-run` prints what would change.
 *
 * Crawls ONLY the five allowlisted sanitaryware category paths and the
 * /san-pham/ product pages they link to. Kitchen appliances are never
 * followed, and anything that slips through is dropped by EXCLUDE_PATTERNS.
 *
 * It extracts FACTS — name, brand, SKU, prices, dimensions, colour, warranty,
 * technologies, images — and never the source's marketing prose. The short
 * description written into the fixture is composed from those fields here.
 *
 * Output is a JSON fixture under data/demo/. Nothing is written to the
 * database: the demo catalogue is served from the fixture.
 *
 * Imagery is referenced by its source URL for an INTERNAL demo only. LivLab
 * does not own it, and reuse rights must be cleared before any public launch.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ORIGIN = 'https://beptungdang.vn';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

/** The only paths this script is allowed to open. */
const ALLOWLIST = [
  { path: '/danh-muc-san-pham/bon-cau/', category: 'Bồn cầu' },
  { path: '/danh-muc-san-pham/lavabo/', category: 'Lavabo' },
  { path: '/danh-muc-san-pham/voi-sen-tam/', category: 'Sen tắm' },
  { path: '/danh-muc-san-pham/bon-tam/', category: 'Bồn tắm' },
  { path: '/danh-muc-san-pham/guong-va-phu-kien/', category: 'Gương & phụ kiện' },
];

/** Kitchen and appliance words. A product whose name matches is dropped. */
const EXCLUDE_PATTERNS =
  /(bếp từ|bếp gas|bếp điện|bếp hồng ngoại|máy hút mùi|lò nướng|lò vi sóng|máy rửa bát|máy lọc nước|chậu rửa bát|vòi rửa bát|tủ bếp|phụ kiện tủ bếp|máy sấy bát|nồi chiên|máy xay)/i;

const BRANDS = [
  'American Standard', 'Viglacera', 'Grohe', 'Kohler', 'Hafele', 'Häfele',
  'TOTO', 'INAX', 'JOMOO', 'Caesar', 'Mowoen', 'Huge', 'Bancons', 'Govern',
];

/** Subcategory rules, first match wins, evaluated per category. */
const SUBCATEGORY_RULES = {
  'Bồn cầu': [
    [/thông minh/i, 'Thông minh'],
    [/bán thông minh/i, 'Bán thông minh'],
    [/treo tường/i, 'Treo tường'],
    [/(một khối|1 khối|liền khối)/i, '1 khối'],
    [/(hai khối|2 khối)/i, '2 khối'],
  ],
  Lavabo: [
    [/tủ (chậu|lavabo)/i, 'Tủ chậu'],
    [/âm bàn/i, 'Âm bàn'],
    [/bán âm/i, 'Bán âm bàn'],
    [/đặt bàn|dương bàn|đặt trên bàn/i, 'Đặt bàn'],
    [/chân (đứng|lửng)/i, 'Chân đứng / chân lửng'],
    [/treo tường/i, 'Treo tường'],
  ],
  'Vòi lavabo': [
    [/cảm ứng/i, 'Cảm ứng'],
    [/gắn tường|âm tường/i, 'Gắn tường'],
    [/nóng lạnh/i, 'Nóng lạnh'],
    [/vòi lạnh|nước lạnh/i, 'Lạnh'],
  ],
  'Sen tắm': [
    [/âm tường/i, 'Sen âm tường'],
    [/nhiệt độ/i, 'Sen nhiệt độ'],
    [/sen cây/i, 'Sen cây'],
    [/thanh trượt|tay sen/i, 'Tay sen / thanh trượt'],
    [/nóng lạnh/i, 'Sen nóng lạnh'],
  ],
  'Bồn tắm': [
    [/massage|sục/i, 'Massage'],
    [/góc/i, 'Góc'],
    [/xây/i, 'Xây'],
    [/đặt sàn|độc lập/i, 'Đặt sàn'],
  ],
  'Gương & phụ kiện': [
    [/tủ gương/i, 'Tủ gương'],
    [/gương.*(led|đèn)|led.*gương/i, 'Gương LED'],
    [/gương/i, 'Gương'],
    [/thanh (vắt )?khăn|vắt khăn/i, 'Thanh khăn'],
    [/kệ/i, 'Kệ'],
    [/lô giấy|hộp giấy/i, 'Lô giấy'],
    [/móc (áo|treo)/i, 'Móc áo'],
    [/thoát sàn|phễu thu/i, 'Thoát sàn'],
  ],
};

/** A faucet listed under the shower category is really its own category. */
const FAUCET_PATTERN = /vòi (lavabo|chậu|rửa mặt)|vòi chậu/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (error) {
    if (attempt >= 3) throw error;
    await sleep(600 * attempt);
    return fetchText(url, attempt + 1);
  }
}

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ');
const decode = (s) =>
  s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
const clean = (s) => decode(stripTags(s)).replace(/\s+/g, ' ').trim();

/** Both prices when the page strikes one through, otherwise just the one. */
function extractPrices(html) {
  const main = html.slice(0, html.indexOf('Đặc điểm') + 1 || html.length);
  const del = main.match(/<del[^>]*>([\s\S]*?)<\/del>/i);
  const money = (s) => {
    const m = s && s.match(/([\d.]{5,})\s*đ/);
    return m ? Number(m[1].replace(/\./g, '')) : null;
  };
  const referencePrice = money(del?.[1] ?? '');

  // The live price is the first money token after the struck-through one.
  const after = del ? main.slice(main.indexOf(del[0]) + del[0].length) : main;
  const showroomPrice = money(after.slice(0, 400)) ?? money(main.slice(0, 4000));

  if (referencePrice && showroomPrice && showroomPrice >= referencePrice) {
    return { referencePrice: null, showroomPrice: referencePrice };
  }
  return { referencePrice, showroomPrice };
}

/** The "Thông tin chi tiết" block is a list of `Label: value` lines. */
function extractFacts(html) {
  const text = clean(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<(p|br|div|li|h\d)[^>]*>/g, '\n$&'));
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const lines = decode(body.replace(/<[^>]+>/g, '\n'))
    .split('\n')
    .map((l) => l.replace(/[–—\-–—⭐•]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const facts = {};
  const grab = (labels) => {
    for (const line of lines) {
      for (const label of labels) {
        const re = new RegExp(`^${label}\\s*[:：]\\s*(.+)$`, 'i');
        const m = line.match(re);
        if (m && m[1].length < 180) return m[1].trim();
      }
    }
    return null;
  };

  facts.dimensionsRaw = grab(['Kích thước', 'Kích thước sản phẩm']);
  facts.type = grab(['Chủng loại', 'Loại', 'Kiểu dáng']);
  facts.color = grab(['Màu sắc', 'Màu']);
  facts.warranty = grab(['Bảo hành']);
  facts.material = grab(['Chất liệu', 'Vật liệu']);
  facts.origin = grab(['Xuất xứ', 'Nơi sản xuất']);
  facts.finish = grab(['Bề mặt', 'Lớp phủ', 'Hoàn thiện']);
  facts.seat = grab(['Nắp đóng', 'Nắp', 'Kiểu nắp']);
  facts.flush = grab(['Chế độ xả', 'Kiểu xả', 'Van xả']);
  facts.flushVolume = grab(['Lượng nước xả', 'Lượng nước']);
  facts.roughIn = grab(['Tâm thoát', 'Tâm xả', 'Khoảng cách tâm thoát']);
  facts.control = grab(['Chế độ điều khiển', 'Điều khiển']);

  const tech = grab(['Công nghệ']);
  facts.technologies = tech
    ? tech.split(/[,;·]|\s\+\s/).map((t) => t.trim()).filter((t) => t.length > 1 && t.length < 60)
    : [];

  // Dimensions as numbers when the source writes them as L*W*H.
  if (facts.dimensionsRaw) {
    const m = facts.dimensionsRaw.match(/(\d{2,4})\s*[*x×]\s*(\d{2,4})\s*[*x×]\s*(\d{2,4})/i);
    if (m) facts.dimensions = { length: +m[1], width: +m[2], height: +m[3], unit: 'mm' };
  }
  if (!facts.roughIn) {
    const m = text.match(/tâm (?:thoát|xả)[^\d]{0,16}(\d{3})\s*mm/i);
    if (m) facts.roughIn = `${m[1]} mm`;
  }
  return facts;
}

/**
 * The product's own photography.
 *
 * The page carries ~50 upload URLs, most of them site chrome, and the first
 * one is a generic "untitled design" placeholder — taking it blindly gave
 * every product the same picture. A real product shot's filename is derived
 * from the product title, so candidates are scored on how many slug tokens
 * they share with the page's own slug.
 */
function extractImages(html, slug, sku, name) {
  const tags = html.match(/<img[^>]+>/g) ?? [];
  const urls = [];
  for (const tag of tags) {
    if (/class="[^"]*menu-image/.test(tag)) continue;
    const src = tag.match(/(?:data-src|data-lazy-src|src)="([^"]+)"/);
    if (!src) continue;
    const url = src[1];
    if (!url.includes('/wp-content/uploads/')) continue;
    if (/logo|icon|banner|placeholder|avatar|thiet-ke-chua-co-ten/i.test(url)) continue;
    // WordPress embeds a resized copy (…-545x545.jpg). Dropping those lost the
    // only photo many products have; the original sits at the same path with
    // the size segment removed, so ask for that instead.
    const full = url.replace(/-\d{2,4}x\d{2,4}(\.[a-z]+)$/i, '$1');
    if (!urls.includes(full)) urls.push(full);
  }

  // Match on the MODEL CODE, nothing looser.
  //
  // Scoring on word tokens put INAX AC-989VN's card behind a photo of the
  // AC-23PVN, because `bon`, `cau` and `inax` are shared by every INAX toilet
  // on the site. Only a token carrying digits identifies one product, so a
  // candidate qualifies when the filename contains one of those — and a
  // product with no such image is dropped rather than shown the wrong one.
  const codeTokens = [...slug.split('-'), (sku ?? '').toLowerCase()]
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 4 && /\d/.test(t));

  // A filename often carries a shorter form of the code than the slug does:
  // `…-lt4715mtg17.jpg` for `…-lt4715mtg17cmw`, the colour suffix dropped. So
  // each code also matches by its prefixes, down to six characters — still
  // long enough to name one model and not its siblings.
  const prefixes = new Set();
  for (const token of codeTokens) {
    for (let len = token.length; len >= 6; len--) prefixes.add(token.slice(0, len));
  }

  const matches = (url) => {
    const file = decodeURIComponent(url.split('/').pop() ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    return [...prefixes].some((t) => file.includes(t));
  };

  const gallery = urls.filter(matches);
  // Most products ship a dimensioned line drawing beside the photograph, and
  // it is often the first image in the markup. A card wants the photograph.
  const isDrawing = (u) => /ban-?ve|banve|drawing|tskt|kich-?thuoc|-bv[-.]|dimension/i.test(u);
  const technicalDrawing = gallery.find(isDrawing) ?? null;
  const photos = gallery.filter((u) => !isDrawing(u));

  // Fallback, only when no filename carried the model code: the image the
  // page itself declares for THIS product on its add-to-cart control, which
  // carries the product's own name. Some uploads are named with a shortened
  // code (`11252.png` for 11252-2/31KA-I011) that the six-character prefix
  // rule above rightly refuses to guess at; the page's own declaration is not
  // a guess. Related-product cards carry the same attribute with THEIR names,
  // so the name must match exactly.
  if (photos.length === 0 && name) {
    for (const m of html.matchAll(/<[^>]+data-product-name="([^"]+)"[^>]*>/g)) {
      if (decode(m[1]).trim() !== name) continue;
      const declared = m[0].match(/data-product-image="([^"]+)"/)?.[1];
      if (declared && declared.includes('/wp-content/uploads/') && !isDrawing(declared)) {
        photos.push(declared.replace(/-\d{2,4}x\d{2,4}(\.[a-z]+)$/i, '$1'));
        break;
      }
    }
  }
  return {
    primaryImage: photos[0] ?? null,
    additionalImages: photos.slice(1, 5),
    technicalDrawing,
  };
}

function detectBrand(name) {
  for (const brand of BRANDS) {
    if (new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(name)) {
      return brand === 'Häfele' ? 'Hafele' : brand;
    }
  }
  return null;
}

/** The model code in the title: the token carrying digits, kept verbatim. */
function detectSku(name, brand) {
  const tail = brand ? name.slice(name.toLowerCase().indexOf(brand.toLowerCase()) + brand.length) : name;
  const tokens = tail.split(/\s+/).filter(Boolean);
  const candidate = tokens.find((t) => /\d/.test(t) && /^[A-Za-z0-9#._\/-]{4,}$/.test(t));
  return candidate ? candidate.replace(/[.,;]$/, '') : null;
}

function subcategoryFor(category, name, type) {
  const haystack = `${name} ${type ?? ''}`;
  for (const [re, label] of SUBCATEGORY_RULES[category] ?? []) if (re.test(haystack)) return label;
  return null;
}

/** Written here from the extracted fields — never copied from the source. */
function writeSummary(p) {
  const bits = [];
  if (p.subcategory) bits.push(p.subcategory.toLowerCase());
  if (p.color) {
    const colour = p.color.toLowerCase();
    bits.push(colour.startsWith('màu') ? colour : `màu ${colour}`);
  }
  if (p.dimensions) bits.push(`${p.dimensions.length}×${p.dimensions.width}×${p.dimensions.height} mm`);
  if (p.roughIn) bits.push(`tâm thoát ${p.roughIn}`);
  if (p.material) bits.push(p.material.toLowerCase());
  if (bits.length === 0) return null;
  return `${p.brand ?? ''} ${p.name.replace(/^.*?(?=[A-Z0-9#-]{4,}$)/, '')}`.trim()
    ? `${bits[0][0].toUpperCase()}${bits[0].slice(1)}${bits.length > 1 ? ', ' + bits.slice(1).join(', ') : ''}.`
    : null;
}

async function collectProductLinks(entry, maxPages) {
  const found = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${ORIGIN}${entry.path}` : `${ORIGIN}${entry.path}page/${page}/`;
    let html;
    try {
      html = await fetchText(url);
    } catch {
      break;
    }
    const links = [...html.matchAll(/href="(https:\/\/beptungdang\.vn\/san-pham\/[a-z0-9-]+\/)"/g)].map((m) => m[1]);
    if (links.length === 0) break;
    for (const link of links) if (!found.has(link)) found.set(link, entry.category);
    process.stdout.write(`  ${entry.category} p${page}: ${links.length} links (${found.size} unique)\n`);
    await sleep(350);
  }
  return found;
}

async function scrapeProduct(url, category, checkedAt) {
  const html = await fetchText(url);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = h1 ? clean(h1[1]) : null;
  if (!name || EXCLUDE_PATTERNS.test(name)) return null;

  const brand = detectBrand(name);
  const facts = extractFacts(html);
  const { referencePrice, showroomPrice } = extractPrices(html);
  const sku = detectSku(name, brand);
  const images = extractImages(html, url.replace(/\/$/, '').split('/').pop() ?? '', sku, name);
  const resolvedCategory =
    category === 'Sen tắm' && FAUCET_PATTERN.test(name) ? 'Vòi lavabo' : category;

  const product = {
    sourceUrl: url,
    sourceCheckedAt: checkedAt,
    name,
    brand,
    sku,
    category: resolvedCategory,
    subcategory: subcategoryFor(resolvedCategory, name, facts.type),
    primaryImage: images.primaryImage,
    additionalImages: images.additionalImages,
    technicalDrawing: images.technicalDrawing,
    referencePrice,
    showroomPrice,
    dimensions: facts.dimensions ?? null,
    dimensionsRaw: facts.dimensionsRaw,
    color: facts.color,
    finish: facts.finish,
    material: facts.material,
    origin: facts.origin,
    warranty: facts.warranty,
    installationType: facts.type,
    seatType: facts.seat,
    flushType: facts.flush,
    flushVolume: facts.flushVolume,
    roughIn: facts.roughIn,
    control: facts.control,
    technologies: facts.technologies,
  };
  product.shortDescription = writeSummary(product);
  return product;
}

/** brand + normalized SKU. AC989VN and AC-989VN are one product. */
const dedupeKey = (p) =>
  `${(p.brand ?? 'unknown').toLowerCase()}::${(p.sku ?? p.name).toLowerCase().replace(/[^a-z0-9]/g, '')}`;

/** Scrape a few named product pages and merge them into the fixture. */
async function addProducts(urls, category, out, dryRun) {
  const checkedAt = new Date().toISOString();
  const fixture = JSON.parse(await readFile(out, 'utf8'));
  const byKey = new Map(fixture.products.map((p, i) => [dedupeKey(p), i]));

  for (const url of urls) {
    const p = await scrapeProduct(url, category, checkedAt);
    // The same bar a full crawl applies: name, brand, category and a photo
    // whose filename carries the product's own model code.
    if (!p || !p.name || !p.brand || !p.category || !p.primaryImage) {
      console.log(`SKIP ${url} — incomplete:`, p && { name: p.name, brand: p.brand, image: p.primaryImage });
      continue;
    }
    const key = dedupeKey(p);
    const index = byKey.get(key);
    const before = index === undefined ? null : fixture.products[index];
    console.log(`${before ? 'REFRESH' : 'ADD'} ${p.brand} ${p.sku} · ${p.showroomPrice ?? '—'} (list ${p.referencePrice ?? '—'}) · ${p.dimensionsRaw ?? 'no size'}`);
    if (before) {
      for (const field of Object.keys(p)) {
        if (field === 'sourceCheckedAt') continue;
        if (JSON.stringify(before[field]) !== JSON.stringify(p[field])) {
          console.log(`    ${field}: ${JSON.stringify(before[field])} → ${JSON.stringify(p[field])}`);
        }
      }
      fixture.products[index] = p;
    } else {
      byKey.set(key, fixture.products.length);
      fixture.products.push(p);
    }
    await sleep(350);
  }

  if (dryRun) return console.log('\n--dry-run: nothing written');

  const byCategory = {};
  for (const p of fixture.products) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  fixture.counts = { ...fixture.counts, total: fixture.products.length, byCategory };
  await writeFile(out, JSON.stringify(fixture, null, 2), 'utf8');
  console.log(`\nWrote ${fixture.products.length} products → ${out}`);
}

async function main() {
  const args = process.argv.slice(2);
  const addIndex = args.indexOf('--add');
  if (addIndex > -1) {
    const urls = (args[addIndex + 1] ?? '').split(',').filter(Boolean);
    const category = args[args.indexOf('--category') + 1];
    if (urls.length === 0 || !category || args.indexOf('--category') === -1) {
      throw new Error('--add needs <url>[,<url>] and --category <c>');
    }
    const outAt = args.indexOf('--out');
    const target = resolve(outAt > -1 ? args[outAt + 1] : 'data/demo/tungdang-sanitaryware.json');
    return addProducts(urls, category, target, args.includes('--dry-run'));
  }

  const maxPages = Number(args[args.indexOf('--pages') + 1]) || 6;
  const outIndex = args.indexOf('--out');
  const out = resolve(outIndex > -1 ? args[outIndex + 1] : 'data/demo/tungdang-sanitaryware.json');
  const checkedAt = new Date().toISOString();

  console.log(`Allowlist: ${ALLOWLIST.length} categories, up to ${maxPages} pages each\n`);

  const queue = new Map();
  for (const entry of ALLOWLIST) {
    const links = await collectProductLinks(entry, maxPages);
    for (const [url, category] of links) if (!queue.has(url)) queue.set(url, category);
  }
  console.log(`\n${queue.size} product pages queued\n`);

  const products = [];
  const skipped = { excluded: 0, incomplete: 0, failed: 0, duplicate: 0 };
  const seen = new Set();
  const entries = [...queue.entries()];

  for (let i = 0; i < entries.length; i += 3) {
    const batch = entries.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map(([url, category]) => scrapeProduct(url, category, checkedAt))
    );
    for (const result of results) {
      if (result.status === 'rejected') { skipped.failed++; continue; }
      const p = result.value;
      if (!p) { skipped.excluded++; continue; }
      // Minimum for a catalogue card: name, brand, category, image.
      if (!p.name || !p.brand || !p.category || !p.primaryImage) { skipped.incomplete++; continue; }
      const key = dedupeKey(p);
      if (seen.has(key)) { skipped.duplicate++; continue; }
      seen.add(key);
      products.push(p);
    }
    process.stdout.write(`\r  scraped ${Math.min(i + 3, entries.length)}/${entries.length} · kept ${products.length}   `);
    await sleep(250);
  }

  console.log('\n');
  const byCategory = {};
  const brands = new Set();
  for (const p of products) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    brands.add(p.brand);
  }

  await mkdir(dirname(out), { recursive: true });
  await writeFile(
    out,
    JSON.stringify(
      {
        source: ORIGIN,
        sourcePages: ALLOWLIST.map((a) => ORIGIN + a.path),
        sourceCheckedAt: checkedAt,
        notice:
          'Dữ liệu và hình ảnh thu thập từ trang công khai của nguồn, dùng cho demo nội bộ. ' +
          'Giá lấy tại thời điểm đồng bộ dữ liệu. LivLab không sở hữu hình ảnh và chưa có ' +
          'quan hệ hợp tác với showroom này.',
        counts: { total: products.length, byCategory, brands: brands.size, skipped },
        products,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Wrote ${products.length} products → ${out}`);
  console.log('By category:', byCategory);
  console.log('Brands:', [...brands].sort().join(', '));
  console.log('Skipped:', skipped);
}

main().catch((e) => { console.error(e); process.exit(1); });
