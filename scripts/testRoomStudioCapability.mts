/**
 * Locks what Room Studio may claim about a product.
 *
 * Production showed `3D` on products that had no 3D model at all. The badge
 * was keyed off `model3dUrl`, that field was filled from a category stand-in,
 * and one 16MB basin was therefore announced as the 3D model of every basin in
 * the catalogue. The rule is now one function, and these tests exist so the
 * next person who adds a badge has to come past them.
 *
 * Run with:  npm run test:room-studio
 */

import { readFileSync } from 'node:fs';
import {
  catalogProductToRoomStudio,
  parseDimensionsToMeters,
  toRoomStudioProduct,
} from '../lib/room-studio/productAdapter';
import type { CatalogProduct } from '../lib/storefront/catalogTypes';
import { themeCssVars } from '../lib/storefront/tenantExperience';
import { TENANTS } from '../lib/storefront/tenantConfig';
import {
  deriveCapability,
  hasCompleteDimensions,
  isPlaceable,
  isSurfaceMaterial,
  CAPABILITY_BADGE,
} from '../lib/room-studio/productCapability';
import { allProduct3DAssets, findProduct3DAssetForKeys } from '../lib/room-studio/product3dRegistry';
import { findReconstruction } from '../lib/room-studio/reconstructionRegistry';
import { isRoomStudioReady, QA_CHECKS } from '../lib/room-studio/product3dAsset';
import { availableProductModels } from '../lib/livlabProductModels';
import type { Product3DAsset } from '../lib/room-studio/product3dAsset';
import type { Product } from '../lib/types';

/** Every QA flag set the same way, so a test states only what it varies. */
const qaFlags = (value: boolean): Product3DAsset['qa'] =>
  Object.fromEntries(QA_CHECKS.map((c) => [c, value])) as unknown as Product3DAsset['qa'];

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

/* --------------------------------------------------------- dimension parsing */

console.log('\nđọc chuỗi kích thước');
{
  const clean = parseDimensionsToMeters('550 x 380 x 125 mm');
  check('ba số đọc đủ ba trục', clean.width === 0.55 && clean.depth === 0.38 && clean.height === 0.125, clean);

  const two = parseDimensionsToMeters('500 x 430 mm');
  check('hai số thì không có chiều cao', two.width === 0.5 && two.depth === 0.43 && two.height === undefined, two);

  // The regression. Two measurements in one field, and the old parser took the
  // first three numbers: a 400×400mm face with a 295mm cutout became a
  // 400×400×295 box that is no dimension of the real product.
  const heater = parseDimensionsToMeters('Bề mặt 40 x 40 cm; lỗ khoét 29.5 x 29.5 cm');
  check('bốn số trở lên = không đọc được', !hasCompleteDimensions(heater), heater);

  const drain = parseDimensionsToMeters('Mặt 100 x 75 x 100mm; bề mặt 120 x 120mm');
  check('năm số = không đọc được', !hasCompleteDimensions(drain), drain);

  check('"Theo model" = không có kích thước', !hasCompleteDimensions(parseDimensionsToMeters('Theo model')));
  check('cm đổi đúng', parseDimensionsToMeters('60 x 40 x 20 cm').width === 0.6);
}

/* -------------------------------------------------------------- badge rules */

console.log('\nquy tắc nhãn năng lực');
{
  const base: Product3DAsset = {
    id: 'test',
    catalogProductId: 'demo:t:X:Y',
    brand: 'X',
    sku: 'Y',
    normalizedSku: 'Y',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://example.test/y',
      originalFileName: 'y.glb',
      originalFormat: 'GLB',
      checkedAt: '2026-01-01T00:00:00Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
    },
    identity: { relationType: 'EXACT_PRODUCT' },
    dimensionsMm: { width: 400, depth: 805, height: 588 },
    placement: { type: 'FLOOR_TOILET', pivot: 'BACK_CENTER_FLOOR', defaultRotation: [0, 0, 0] },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: qaFlags(false),
    assetVersion: 1,
  };

  const full = { width: 0.4, depth: 0.805, height: 0.588 };

  check('không có asset + đủ ba chiều -> ĐÚNG KÍCH THƯỚC', deriveCapability(null, full) === 'EXACT_DIMENSIONS');
  check('không có asset + thiếu chiều -> không đặt được', deriveCapability(null, { width: 0.4 }) === 'NO_DIMENSIONS');

  // §95: a verified .max source is a verified source. It is not a model.
  const sourceOnly = { ...base, qa: { ...base.qa, identityVerified: true, dimensionsVerified: true } };
  check('nguồn .max đã xác minh KHÔNG thành 3D VERIFIED', deriveCapability(sourceOnly, {}) === 'EXACT_DIMENSIONS');

  // Status READY with QA flags unset must not pass, and neither must every QA
  // flag set while the status says the asset is still in review.
  const readyNoQa = { ...base, status: 'READY' as const, runtime: { glbUrl: '/a.glb' } };
  check('READY nhưng chưa đủ QA -> không phải 3D VERIFIED', deriveCapability(readyNoQa, full) !== 'VERIFIED_3D');

  const qaNoReady = {
    ...base,
    runtime: { glbUrl: '/a.glb' },
    qa: qaFlags(true),
  };
  check('đủ QA nhưng chưa READY -> không phải 3D VERIFIED', deriveCapability(qaNoReady, full) !== 'VERIFIED_3D');

  const readyFull = { ...qaNoReady, status: 'READY' as const };
  check('READY + đủ QA + có GLB -> 3D VERIFIED', deriveCapability(readyFull, full) === 'VERIFIED_3D');

  const noGlb = { ...readyFull, runtime: {} };
  check('READY + đủ QA nhưng không có GLB -> không phải 3D VERIFIED', deriveCapability(noGlb, full) !== 'VERIFIED_3D');

  check('nhãn 3D VERIFIED đúng chữ', CAPABILITY_BADGE.VERIFIED_3D?.label === '3D VERIFIED');
  check('nhãn ĐÚNG KÍCH THƯỚC đúng chữ', CAPABILITY_BADGE.EXACT_DIMENSIONS?.label === 'ĐÚNG KÍCH THƯỚC');
  check('không có nhãn nào chứa chữ "3D" đơn lẻ',
    Object.values(CAPABILITY_BADGE).every((b) => b === null || b.label !== '3D'));
  check('không có nhãn cho sản phẩm thiếu kích thước', CAPABILITY_BADGE.NO_DIMENSIONS === null);
  check('không đặt được thì không placeable', !isPlaceable('NO_DIMENSIONS') && isPlaceable('EXACT_DIMENSIONS'));
  check('gạch là vật liệu bề mặt, không phải vật thể', isSurfaceMaterial('tile') && !isSurfaceMaterial('toilet'));
}

/* ------------------------------------------------- registry state right now */

console.log('\ntrạng thái thật của registry');
{
  const assets = allProduct3DAssets();
  const ready = assets.filter(isRoomStudioReady);
  check(`registry có ${assets.length} asset, READY = ${ready.length}`, true);
  // §69: with zero READY assets, nothing in the UI may show 3D VERIFIED.
  check('hiện tại không asset nào READY', ready.length === 0, ready.map((a) => a.sku));

  // §68: the generic shared model must stay unreachable.
  check('không category nào trả model dùng chung',
    Object.values(availableProductModels).every((v) => v === false), availableProductModels);
}

/* ------------------------------------------------ the real catalogue, parsed */

console.log('\ndanh mục thật (CSV seed)');
{
  const text = readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8').replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const head = rows[0];
  const records = rows.slice(1).filter((r) => r.length > 5)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])) as unknown as Product);

  const products = records.map(toRoomStudioProduct);
  const placeable = products.filter((p) => isPlaceable(p.capability) && !isSurfaceMaterial(p.normalizedCategory));
  const verified3d = products.filter((p) => p.capability === 'VERIFIED_3D');

  console.log(`  ${products.length} sản phẩm · ${placeable.length} đặt được · ${verified3d.length} có model 3D`);
  check('không sản phẩm nào được gắn 3D VERIFIED', verified3d.length === 0, verified3d.map((p) => p.sku));
  check('có sản phẩm đặt được', placeable.length > 0);
  check('mọi sản phẩm đặt được đều có đủ ba chiều',
    placeable.every((p) => p.width !== undefined && p.depth !== undefined && p.height !== undefined),
    placeable.filter((p) => p.height === undefined).map((p) => p.sku));
  /**
   * Geometry may only reach a product on stated terms.
   *
   * This used to read `every(p => !p.model3dUrl)` — no product may carry a
   * model at all — which was right while the honest answer was zero models,
   * and which is a blunter rule than the thing it was protecting. What went
   * wrong originally was not that a product had geometry; it was that geometry
   * arrived BY CATEGORY and was drawn under the name of a product it was not.
   *
   * So the rule is now: a product carrying a model is either showing its own
   * verified asset, or is declared a stand-in and says so on screen. Anything
   * else — a model that appeared without either claim — is the old failure
   * returning, and fails here.
   *
   * The category path itself stays shut, asserted above and again in the
   * conversion suite. That guard is untouched.
   */
  const withModel = products.filter((p) => p.model3dUrl);
  // Three declared kinds: the manufacturer's verified asset, a stand-in that
  // says so, or LivLab's reconstruction of exactly this brand + SKU.
  const undeclared = withModel.filter(
    (p) =>
      p.capability !== 'VERIFIED_3D' &&
      p.illustrativeModel !== true &&
      !(p.capability === 'PROTOTYPE_3D' && p.reconstruction && findReconstruction(p.brand, p.sku)?.id === p.reconstruction.modelId)
  );
  check('model nào cũng phải khai báo: verified, minh hoạ hoặc tái tạo đúng mã', undeclared.length === 0,
    undeclared.map((p) => p.sku));
  check('model minh hoạ không bao giờ mang 3D VERIFIED',
    products.filter((p) => p.illustrativeModel).every((p) => p.capability !== 'VERIFIED_3D'),
    products.filter((p) => p.illustrativeModel && p.capability === 'VERIFIED_3D').map((p) => p.sku));
  check('model dùng chung phải là minh hoạ, không phải verified',
    (() => {
      const byUrl = new Map<string, typeof products>();
      for (const p of withModel) byUrl.set(p.model3dUrl!, [...(byUrl.get(p.model3dUrl!) ?? []), p]);
      return [...byUrl.values()]
        .filter((group) => group.length > 1)
        .every((group) => group.every((p) => p.illustrativeModel === true));
    })());
  check('đèn sưởi âm trần H4B không đặt được (chuỗi kích thước mơ hồ)',
    !placeable.some((p) => p.sku === 'H4B'));
  check('phụ kiện treo tường, không nằm sàn',
    products.filter((p) => p.normalizedCategory === 'accessory').every((p) => p.placementType === 'wall'));

  // Every registry SKU should either be absent from this catalogue or resolve
  // to exactly one record. A SKU that resolves to two is the collision case.
  for (const asset of allProduct3DAssets()) {
    const matches = products.filter((p) => p.normalizedSku === asset.normalizedSku);
    check(`${asset.sku}: khớp 0 hoặc 1 dòng danh mục`, matches.length <= 1, matches.map((m) => m.id));
  }
  check('tra registry theo SKU không khớp sai',
    findProduct3DAssetForKeys('KHONGTONTAI') === null);
}

/* ------------------------------------------------- a storefront's catalogue */

console.log('\ndanh mục của showroom trong Room Studio');
{
  // The fields the adapter reads; everything else a catalogue row carries is
  // irrelevant to placement and left out of the fixture.
  const row = (over: Partial<CatalogProduct>): CatalogProduct =>
    ({
      id: 'x', catalogProductId: 'demo:tungdang:X:X', sourceType: 'DEMO_FIXTURE', href: '/products/x',
      sku: null, name: 'x', brand: 'X', category: 'Lavabo', image: '/x.webp',
      showroomPrice: 1_000_000, referencePrice: null, dimensions: null,
      material: null, finish: null, color: null, installationType: null, warranty: null, origin: null,
      shortDescription: null, ...over,
    }) as CatalogProduct;

  const toilet = catalogProductToRoomStudio(
    row({ id: 't', category: 'Bồn cầu', sku: 'ZD7202-SO-CJM305', dimensions: { length: 669, width: 423, height: 503, unit: 'mm' } }),
    'tungdang'
  );
  check('bồn cầu: "dài" là chiều sâu từ tường, không phải bề ngang',
    toilet.width === 0.423 && toilet.depth === 0.669 && toilet.height === 0.503,
    [toilet.width, toilet.depth, toilet.height]);

  const basin = catalogProductToRoomStudio(
    row({ id: 'b', category: 'Lavabo', sku: '12138-1/01Z', dimensions: { length: 595, width: 380, height: 200, unit: 'mm' } }),
    'tungdang'
  );
  check('lavabo: "dài" chạy dọc tường', basin.width === 0.595 && basin.depth === 0.38, [basin.width, basin.depth]);

  // The INAX pilot SKUs have no size in the retailer's listing, but the
  // registry holds verified manufacturer figures. Those must reach the scene,
  // or EXACT_DIMENSIONS would be drawn as a category-average box.
  const inax = catalogProductToRoomStudio(
    row({ id: 'inax-ac-1008vrn', catalogProductId: 'demo:tungdang:INAX:AC1008VRN', category: 'Bồn cầu', brand: 'INAX', sku: 'AC-1008VRN' }),
    'tungdang'
  );
  check('kích thước hãng đã xác minh đi tới sản phẩm',
    inax.capability === 'EXACT_DIMENSIONS' && inax.width === 0.4 && inax.depth === 0.805 && inax.height === 0.588,
    [inax.capability, inax.width, inax.depth, inax.height]);

  const bare = catalogProductToRoomStudio(row({ id: 'n', category: 'Sen tắm', sku: 'P36412-484/1B-1' }), 'tungdang');
  check('không có kích thước thì không đặt được', !isPlaceable(bare.capability), bare.capability);

  check('không dòng nào của showroom được gắn 3D VERIFIED',
    [toilet, basin, inax, bare].every((p) => p.capability !== 'VERIFIED_3D'));

  check('giỏ báo giá nhận đúng mục danh mục của showroom',
    toilet.quoteEntry?.tenantId === 'tungdang' &&
      toilet.quoteEntry.catalogProductId === 'demo:tungdang:X:X' &&
      toilet.quoteEntry.sourceContext === 'ROOM_STUDIO',
    toilet.quoteEntry);
  check('một giá chào, không nới thành khoảng giá',
    toilet.priceMin === 1_000_000 && toilet.priceMax === 1_000_000, [toilet.priceMin, toilet.priceMax]);
}

/* ------------------------------------------------------------ tenant theme */

console.log('\ngiao diện theo showroom');
{
  const livlab = TENANTS.livlab;
  const vars = themeCssVars(livlab.brand, livlab.experience.theme);
  // LivLab runs on the Tùng Đăng demo's storefront exactly — layout, variants
  // and warm orange palette — and differs in identity only: its own logo,
  // name and copy, and none of the showroom's name, address or hotline.
  const tungdang = TENANTS.tungdang;
  // Same layout and sections as the retail demo; only LivLab's hero and
  // category list take the editorial variants, so Tùng Đăng is untouched.
  const { hero: llHero, categoryNav: llNav, roomStudio: llRs, consultation: llCs, concepts: llCo, heroTransition: llHt, ...llRest } = livlab.experience.variants;
  const { hero: tdHero, categoryNav: tdNav, roomStudio: tdRs, consultation: tdCs, concepts: tdCo, heroTransition: tdHt, ...tdRest } = tungdang.experience.variants;
  check('LivLab: cùng bố cục và thứ tự phần với storefront Tùng Đăng',
    livlab.experience.home.layout === tungdang.experience.home.layout &&
      JSON.stringify(llRest) === JSON.stringify(tdRest) &&
      JSON.stringify(livlab.experience.home.sections) === JSON.stringify(tungdang.experience.home.sections));
  check('LivLab: hero, danh mục và Room Studio biên tập; Tùng Đăng giữ commerce / iconRail / feature',
    llHero === 'editorialCommerce' && llNav === 'keywords' && tdHero === 'commerce' && tdNav === 'iconRail' &&
      llRs === 'steps' && tdRs === undefined && llCs === 'scene' && tdCs === undefined &&
      llCo === 'spaces' && tdCo === undefined && llHt === 'overlap' && tdHt === undefined);
  // Approved hero (pixel-match brief): literal strings, never paraphrased.
  const llHeroCopy = livlab.experience.copy.hero;
  check('LivLab hero: eyebrow và H1 hai dòng đúng nguyên văn, không dấu chấm',
    llHeroCopy.eyebrow === 'LIVLAB' && !llHeroCopy.kicker &&
      JSON.stringify(llHeroCopy.titleLines) === JSON.stringify(['WEBSITE SHOWROOM', 'PHỐI PHÒNG TẮM 3D']));
  check('LivLab hero: mô tả ngắn đúng nguyên văn',
    llHeroCopy.body === 'Khám phá thiết bị vệ sinh, không gian mẫu và phối phòng tắm 3D.');
  check('LivLab hero: hai liên kết bên phải trỏ tới route có sẵn',
    JSON.stringify(llHeroCopy.railLinks) ===
      JSON.stringify([{ label: 'KHÁM PHÁ KHÔNG GIAN', href: '/concepts' }, { label: 'ROOM STUDIO 3D', href: '/room-studio' }]));
  check('LivLab: tiêu đề và mô tả trang chủ đúng nguyên văn',
    livlab.seo.home?.title === 'LivLab | Website showroom thiết bị vệ sinh & phối phòng tắm 3D' &&
      livlab.seo.home?.description === 'Khám phá thiết bị vệ sinh từ nhiều thương hiệu, tham khảo không gian phòng tắm và phối sản phẩm 3D trên LivLab. Gửi yêu cầu báo giá đến showroom.');
  check('LivLab: các trang khác giữ tiêu đề mặc định', livlab.seo.title === 'LivLab | Nền tảng thương mại trực quan & 3D Room Studio');
  check('LivLab V3: tiêu đề và giới thiệu mục danh mục',
    livlab.experience.copy.sections.categoriesTitle === 'DANH MỤC THIẾT BỊ VỆ SINH' &&
      livlab.experience.copy.sections.categoriesIntro === 'Khám phá danh mục sản phẩm và lựa chọn thiết bị phù hợp với không gian của bạn.');
  const previews = livlab.experience.merchandising?.categoryPreviews ?? {};
  check('LivLab gallery: năm ảnh danh mục, mỗi danh mục một ảnh riêng, không dùng ảnh hero',
    ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Gương & phụ kiện'].every((c) => /\/categories\/gallery-\w+\.webp$/.test(previews[c]?.src ?? '')) &&
      new Set(Object.values(previews).map((p) => p.src)).size === 5 &&
      !Object.values(previews).some((p) => p.src.includes('hero')));
  const rsSteps = livlab.experience.copy.roomStudio.steps;
  check('LivLab Room Studio: bốn bước, đúng nguyên văn bản SEO đã duyệt',
    livlab.experience.variants.roomStudio === 'steps' &&
      rsSteps?.eyebrow === 'ROOM STUDIO' &&
      JSON.stringify(rsSteps?.items.map((i) => [i.id, i.tab, i.title, i.cta])) ===
        JSON.stringify([
          ['01', 'Nhập phòng', 'Tạo phòng tắm 3D theo kích thước thực', 'Khám phá bước 1 →'],
          ['02', 'Chọn vật liệu', 'Phối vật liệu cho phòng tắm 3D', 'Khám phá bước 2 →'],
          ['03', 'Thêm thiết bị', 'Bố trí thiết bị vệ sinh trong phòng tắm 3D', 'Khám phá bước 3 →'],
          ['04', 'Nhận báo giá', 'Gửi yêu cầu báo giá đến showroom', 'Khám phá bước 4 →'],
        ]) &&
      rsSteps?.items[3].description === 'Lưu phương án phòng tắm 3D, gửi danh sách thiết bị đến showroom để xác nhận báo giá.' &&
      (rsSteps?.items ?? []).every((i) => i.benefits.length === 3));
  check('LivLab Room Studio: mỗi bước một ảnh chụp riêng, đúng thứ tự',
    JSON.stringify(livlab.experience.merchandising?.roomStudioSteps?.map((i) => i.src)) ===
      JSON.stringify([1, 2, 3, 4].map((n) => `/images/livlab/room-studio/step-0${n}.webp`)) &&
      (livlab.experience.merchandising?.roomStudioSteps ?? []).every((i) => i.alt.length > 20));
  check('Room Studio bốn bước chỉ bật cho LivLab', tungdang.experience.variants.roomStudio === undefined);
  const closing = livlab.experience.copy.closing;
  check('LivLab closing: đúng nguyên văn bản SEO đã duyệt, một H2 hai dòng',
    closing?.eyebrow === 'TƯ VẤN SHOWROOM' &&
      closing?.titleLines.join(' ') === 'HOÀN THIỆN KHÔNG GIAN PHÒNG TẮM CÙNG LIVLAB.' &&
      JSON.stringify(closing?.titleLines) === JSON.stringify(['HOÀN THIỆN KHÔNG GIAN', 'PHÒNG TẮM CÙNG LIVLAB.']) &&
      closing?.body === 'Kết nối với showroom để được tư vấn thiết bị vệ sinh phù hợp, kiểm tra phương án bố trí và nhận báo giá chi tiết.' &&
      closing?.primaryCta === 'YÊU CẦU BÁO GIÁ' &&
      closing?.secondaryCta === 'NHỜ SHOWROOM TƯ VẤN');
  check('LivLab hero: không còn dải ba tính năng dưới hero; hero đứng ngay trước danh mục',
    !livlab.experience.copy.hero.trust &&
      livlab.experience.home.sections.indexOf('categories') === livlab.experience.home.sections.indexOf('hero') + 1 &&
      (tungdang.experience.copy.hero.trust ?? []).length === 3);
  const spaces = livlab.experience.copy.sections.spaces;
  check('LivLab spaces: dòng chữ đã duyệt, một dòng mô tả cho mỗi không gian',
    livlab.experience.copy.sections.conceptsEyebrow === 'BỘ SƯU TẬP & CẢM HỨNG' &&
      livlab.experience.copy.sections.conceptsTitle === 'GỢI Ý KHÔNG GIAN' &&
      spaces?.cta === 'KHÁM PHÁ KHÔNG GIAN' && spaces?.seeAll === 'XEM TẤT CẢ KHÔNG GIAN' &&
      spaces?.featuredLabel === 'KHÔNG GIAN NỔI BẬT' &&
      ['livlab-golden-retreat', 'livlab-urban-light-spa', 'livlab-monochrome-architectural-bath', 'livlab-warm-smart-retreat']
        .every((slug) => (spaces?.summaries[slug] ?? '').length > 20) &&
      livlab.experience.merchandising?.featuredConceptSlug === 'livlab-golden-retreat' &&
      livlab.experience.merchandising?.conceptCount === 3);
  check('LivLab closing: nền sạch và ảnh phòng tắm cho điện thoại',
    livlab.experience.merchandising?.closingScene?.background.src === '/images/livlab/closing/closing-cta-background.webp' &&
      livlab.experience.merchandising?.closingScene?.mobile.src === '/images/livlab/closing/closing-cta-bathroom-mobile.webp' &&
      tungdang.experience.copy.closing === undefined);
  check('LivLab: ảnh hero là cảnh phòng tắm của mockup đã duyệt, kèm lớp kính',
    livlab.experience.merchandising?.heroImage?.src === '/images/livlab/hero-mockup-bathroom.webp' &&
      livlab.experience.merchandising?.heroImage?.alt === 'Không gian phòng tắm hiện đại với bồn tắm đá, lavabo, gương oval và ánh sáng tự nhiên' &&
      livlab.experience.merchandising?.heroGlassImage?.src === '/images/livlab/hero-fluted-glass.webp');
  const tdVars = themeCssVars(tungdang.brand, tungdang.experience.theme);
  check('LivLab: cùng tông màu cam với storefront Tùng Đăng', JSON.stringify(vars) === JSON.stringify(tdVars), { vars, tdVars });
  check('LivLab: logo của LivLab, không phải logo showroom',
    livlab.brand.logo === '/images/logo.png' && !/tungdang/i.test(`${livlab.brand.logo} ${livlab.brand.icon ?? ''}`));
  check('LivLab: nội dung không nhắc tên showroom demo', !/tùng đăng|tung dang|tungdang/i.test(JSON.stringify(livlab)));
  check('LivLab: không mang hotline hay địa chỉ của showroom',
    !/0983\s?446\s?656|beptungdang/i.test(JSON.stringify(livlab)) && Object.keys(livlab.contact ?? {}).length === 0);

  // A library may carry the showroom's name only when it IS the showroom's
  // catalogue — otherwise the heading describes products it does not sell.
  for (const tenant of Object.values(TENANTS)) {
    const title = tenant.experience.copy.roomStudio.libraryTitle;
    const namesShowroom = title.toLowerCase().includes(tenant.brand.name.toLowerCase());
    // LivLab's library is LivLab's own catalogue, so it may carry LivLab's name.
    const ownLibrary = tenant.experience.roomStudioCatalog === 'tenant' || tenant.id === 'livlab';
    check(`${tenant.id}: tiêu đề thư viện chỉ nêu tên showroom khi là danh mục của showroom`,
      !namesShowroom || ownLibrary, title);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
