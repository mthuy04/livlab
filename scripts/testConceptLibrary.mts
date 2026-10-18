/**
 * Locks what the concept library may claim and who may see it.
 *
 * A concept is a promise in two directions: the pin is on the fixture it names,
 * and the product behind it is one this storefront sells. Both fail silently —
 * a hotspot drifts onto the tile beside the basin, a SKU leaves the catalogue
 * and the pin keeps pointing at it — so they are checked here rather than
 * trusted to the record.
 *
 * Run with:  npm run test:concepts
 */

import { existsSync, readFileSync } from 'node:fs';
import { CONCEPT_LIBRARY } from '../lib/storefront/conceptLibrary';
import { MATCH_LABEL, isCustomerFacing, conceptMetaLabel } from '../lib/storefront/conceptTypes';
import { catalogIdentity } from '../lib/storefront/catalogTypes';

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

/** Catalogue identities of the Tùng Đăng fixture, built the way the catalogue builds them. */
const fixture = JSON.parse(readFileSync('data/demo/tungdang-sanitaryware.json', 'utf8')) as {
  products: { brand: string; sku: string | null; name: string }[];
};
const tungdangIds = new Set(
  fixture.products.map((p) =>
    catalogIdentity({
      sourceType: 'DEMO_FIXTURE',
      sourceRecordId: '',
      tenantId: 'tungdang',
      brand: p.brand,
      sku: p.sku,
      name: p.name,
    })
  )
);

/* ------------------------------------------------------------ whole library */

console.log('\nthư viện concept');
{
  const slugs = CONCEPT_LIBRARY.map((c) => c.slug);
  check('slug không trùng', new Set(slugs).size === slugs.length);

  // A generated scene can resemble a product; it cannot BE one.
  const exactOnGenerated = CONCEPT_LIBRARY.filter((c) => c.imageSourceType === 'LIVLAB_GENERATED')
    .flatMap((c) => c.hotspots.filter((h) => h.matchConfidence === 'EXACT_VISUAL').map((h) => h.id));
  check('ảnh dựng không có điểm nào nhận là "chính xác"', exactOnGenerated.length === 0, exactOnGenerated);

  // A point outside the box it was read against has slid off its fixture.
  const outside = CONCEPT_LIBRARY.flatMap((c) =>
    c.hotspots
      .filter((h) => h.bbox)
      .filter(
        (h) =>
          h.xPct < h.bbox!.xPct ||
          h.xPct > h.bbox!.xPct + h.bbox!.widthPct ||
          h.yPct < h.bbox!.yPct ||
          h.yPct > h.bbox!.yPct + h.bbox!.heightPct
      )
      .map((h) => h.id)
  );
  check('mọi điểm nằm trong vùng của thiết bị nó gọi tên', outside.length === 0, outside);
}

/* ---------------------------------------------------------- Golden Retreat */

console.log('\nGolden Retreat');
{
  const owned = CONCEPT_LIBRARY.filter((c) => c.tenantId === 'tungdang');
  check('đúng một concept riêng của Tùng Đăng', owned.length === 1, owned.map((c) => c.slug));

  const gr = CONCEPT_LIBRARY.find((c) => c.slug === 'tungdang-golden-retreat');
  check('tồn tại và đã xuất bản', gr?.publicationStatus === 'PUBLISHED_VERIFIED');
  if (gr) {
    check('chỉ thuộc tenant tungdang', gr.tenantId === 'tungdang');
    check('dẫn đầu thư viện', CONCEPT_LIBRARY[0].slug === gr.slug);
    check('ảnh nằm trong public', existsSync(`public${gr.canonicalImage}`), gr.canonicalImage);
    check('tên và phụ đề', gr.title === 'Golden Retreat' && gr.titleVi === 'Phòng tắm master thư giãn');
    check('nhãn thông tin', conceptMetaLabel(gr) === 'Hiện đại cao cấp · 10–14 m²', conceptMetaLabel(gr));

    const facing = gr.hotspots.filter(isCustomerFacing);
    check('đúng bốn điểm hiển thị', facing.length === 4 && gr.hotspots.length === 4);
    check(
      'một điểm cho mỗi vùng: lavabo, bồn cầu, bồn tắm, sen',
      facing.map((h) => h.targetType).sort().join() === ['BASIN', 'BATHTUB', 'SHOWER', 'TOILET'].join(),
      facing.map((h) => h.targetType)
    );
    check(
      'mọi điểm là gợi ý trong concept, không nhận là ảnh dựng chính xác',
      facing.every((h) => h.matchConfidence === 'CURATED_SUGGESTION')
    );
    check('nhãn khách hàng thấy', MATCH_LABEL.CURATED_SUGGESTION === 'Sản phẩm gợi ý trong concept');

    const wanted = ['12703-1/01P', '11252-2/31KA-I011', 'PPY1560HPE#P/TVBF411', '36437-477/1B-I011'];
    check('đúng bốn mã đã chọn', facing.map((h) => h.sku).join() === wanted.join(), facing.map((h) => h.sku));
    for (const h of facing) {
      check(`${h.brand} ${h.sku}: có trong danh mục Tùng Đăng`, tungdangIds.has(h.catalogProductId!), h.catalogProductId);
    }
    const distinct = new Set(facing.map((h) => h.catalogProductId));
    check('bốn sản phẩm khác nhau', distinct.size === 4);
  }
}

/* ------------------------------------------------------------- isolation */

console.log('\ncô lập tenant');
{
  // Every other concept is offered to all storefronts, so it must not name a
  // tenant; and nothing but tungdang's own may carry tungdang.
  const strays = CONCEPT_LIBRARY.filter((c) => c.tenantId !== null && c.tenantId !== 'tungdang');
  check('không concept nào gán cho tenant khác', strays.length === 0, strays.map((c) => c.slug));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
