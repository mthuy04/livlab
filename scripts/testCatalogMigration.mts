/**
 * The LivLab catalogue after the Tùng Đăng migration and the 2026-11-20 GLB pack.
 *
 *   npm run test:catalog-migration
 *
 * Read-only: it reads the catalogue the storefront reads (the shared database
 * included) and writes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { AGGREGATED_PRICE_BASIS, getCatalog } from '@/lib/storefront/catalog';
import { getProductDetail } from '@/lib/storefront/productDetail';
import { TENANTS } from '@/lib/storefront/tenantConfig';
import { APPROVED_GLB_MODELS } from '@/lib/room-studio/approvedGlbModels';
import { allReconstructions, libraryProductId, listedReconstructions } from '@/lib/room-studio/reconstructionRegistry';
import { livlab3dLibraryProducts, toRoomStudioProduct, withReconstruction } from '@/lib/room-studio/productAdapter';
import { placementContextFor, installationHeight } from '@/lib/room-studio/mounting';
import { clampToRoom, getDefaultPlacement } from '@/lib/room-studio/placementRules';
import { getProductTechnicalMetadata } from '@/lib/technical-advisor/productTechnicalMetadata';
import { referencePriceFor, UNPRICED_SKUS } from '@/lib/pricing/referencePrices';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${!ok && detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
}

const livlab = await getCatalog(TENANTS.livlab);
const tungdang = await getCatalog(TENANTS.tungdang);
const tungdangAll = await getCatalog(TENANTS.tungdang, { includeUnpresentable: true });
const giangson = await getCatalog(TENANTS.giangson);
const own = livlab.products.filter((p) => p.sourceType === 'DATABASE');
const migrated = livlab.products.filter((p) => p.sourceTenantId === 'tungdang');
const library = livlab.products.filter((p) => p.sourceType === 'LIVLAB_LIBRARY');

console.log('\nA. Tùng Đăng → LivLab');
check('mọi sản phẩm Tùng Đăng đang hiển thị công khai đều có trên LivLab', migrated.length === tungdang.products.length, [migrated.length, tungdang.products.length]);
check('không lấy sản phẩm bị ảnh kiểm duyệt giữ lại', migrated.length < tungdangAll.products.length || tungdangAll.products.length === tungdang.products.length);
const td = new Map(tungdang.products.map((p) => [p.id, p]));
check(
  'giữ nguyên tên, mã, hãng, danh mục, mô tả, thông số, giá và nguồn',
  migrated.every((p) => {
    const o = td.get(p.id);
    return (
      o &&
      o.name === p.name && o.sku === p.sku && o.brand === p.brand && o.category === p.category &&
      o.shortDescription === p.shortDescription && o.dimensionsRaw === p.dimensionsRaw &&
      o.showroomPrice === p.showroomPrice && o.referencePrice === p.referencePrice &&
      o.sourceUrl === p.sourceUrl && o.catalogProductId === p.catalogProductId && o.sourceType === p.sourceType
    );
  })
);
check('quyền sở hữu: catalogProductId vẫn là demo:tungdang', migrated.every((p) => p.catalogProductId.startsWith('demo:tungdang:')));
check('giá hiển thị là giá tham khảo, không phải giá LivLab', migrated.every((p) => !p.showroomPrice || p.priceBasis === AGGREGATED_PRICE_BASIS));
check('không có giá 0 nào được tạo ra', migrated.every((p) => p.showroomPrice === null || p.showroomPrice > 0));
check('không khẳng định tồn kho của showroom khác', migrated.every((p) => p.availability === null));
// The owner confirmed LivLab may show Tùng Đăng's photography (2026-11-20).
check(
  'ảnh của Tùng Đăng giữ nguyên trên LivLab (đã được cấp quyền)',
  migrated.every((p) => {
    const o = td.get(p.id)!;
    return p.image === o.image && p.imageSource === o.imageSource && p.technicalDrawing === o.technicalDrawing &&
      JSON.stringify(p.additionalImages) === JSON.stringify(o.additionalImages);
  })
);
check('không sản phẩm chuyển sang nào thiếu ảnh', migrated.every((p) => Boolean(p.image)), migrated.filter((p) => !p.image).map((p) => p.id));
const ownOnly = await getCatalog(TENANTS.livlab, { aggregate: false });
check(
  'quyền ảnh chỉ áp dụng cho dòng Tùng Đăng — dòng của LivLab không đổi',
  JSON.stringify(own.map((p) => [p.id, p.image, p.imageSource])) === JSON.stringify(ownOnly.products.map((p) => [p.id, p.image, p.imageSource]))
);

console.log('\nB. Không trùng, không ghi đè');
check('id duy nhất', new Set(livlab.products.map((p) => p.id)).size === livlab.products.length);
check('catalogProductId duy nhất', new Set(livlab.products.map((p) => p.catalogProductId)).size === livlab.products.length);
const key = (p: { brand: string; normalizedSku: string }) => `${p.brand.toUpperCase()}::${p.normalizedSku}`;
const skuKeys = livlab.products.filter((p) => p.normalizedSku).map(key);
check('hãng + mã không lặp', new Set(skuKeys).size === skuKeys.length);
check('sản phẩm của LivLab giữ nguyên, đứng đầu danh sách', livlab.products.slice(0, own.length).every((p) => p.sourceType === 'DATABASE'));

console.log('\nC. Cô lập tenant');
check('Tùng Đăng không nhận sản phẩm của LivLab', tungdang.products.every((p) => p.sourceType === 'DEMO_FIXTURE' && !p.sourceTenantId));
check('Tùng Đăng vẫn đủ sản phẩm công khai', tungdang.products.length === migrated.length);
check('Giang Sơn không đổi', giangson.products.every((p) => p.sourceType === 'DEMO_FIXTURE' && !p.sourceTenantId));
check('thư viện 3D chỉ ở LivLab', ![...tungdang.products, ...giangson.products].some((p) => p.sourceType === 'LIVLAB_LIBRARY'));

console.log('\nD. Chín mô hình GLB đã duyệt');
check('đúng 9 mô hình trong gói', APPROVED_GLB_MODELS.length === 9);
check('không trùng id hay mã trong registry', new Set(allReconstructions().map((m) => m.id)).size === allReconstructions().length && new Set(allReconstructions().map((m) => m.sku)).size === allReconstructions().length);
check('đúng 9 mô hình được liệt kê trên /products', library.length === 9 && listedReconstructions().length === 9, library.map((p) => p.sku));
const manifest = JSON.parse(readFileSync('assets/3d/work/reports/livlab-approved-glb-2026-11-20/catalogue_manifest.json', 'utf8'));
const items: { sku?: string; model_sku?: string; glb?: string; sha256?: string }[] = Array.isArray(manifest) ? manifest : manifest.products ?? manifest.items ?? [];
for (const m of APPROVED_GLB_MODELS) {
  const file = m.files.web!;
  const bytes = readFileSync(`public${file.url}`);
  check(`${m.sku}: tệp nguyên bản (sha256)`, createHash('sha256').update(bytes).digest('hex') === file.sha256);
  const listed = items.find((i) => JSON.stringify(i).includes(file.sha256));
  check(`${m.sku}: sha256 khớp manifest của gói`, items.length === 0 || Boolean(listed));
  const ref = referencePriceFor(m.brand, m.sku);
  const row = library.find((p) => p.sku === m.sku);
  check(
    `${m.sku}: ${ref ? `giá tham khảo ${ref.priceVnd.toLocaleString('vi-VN')}đ có nguồn` : 'chưa có giá xác minh → để trống'}`,
    ref ? row?.showroomPrice === ref.priceVnd && !!row?.priceBasis && /^https:\/\//.test(ref.sourceUrl) : row?.showroomPrice === null && UNPRICED_SKUS.some((u) => u.sku === m.sku)
  );
  check(`${m.sku}: giữ cờ tin cậy và lưu ý`, Boolean(m.listing?.technicalConfidence) && (m.listing?.caveats.length ?? 0) > 0);
  check(`${m.sku}: không dùng CAD hãng, không tuyên bố chứng nhận`, m.provenance.manufacturerCadUsed === false);
}
check('URL hãng không chứa link giữ chỗ của gói', APPROVED_GLB_MODELS.every((m) => !m.manufacturerPage || !/\.\.\.$/.test(m.manufacturerPage) || m.sku === 'A851693513'));

console.log('\nE. Trang chi tiết');
for (const m of APPROVED_GLB_MODELS) {
  const vm = await getProductDetail(TENANTS.livlab, libraryProductId(m));
  check(`${m.sku}: trang chi tiết có mô hình 3D`, vm?.model3d?.url === m.files.web!.url);
  const priced = referencePriceFor(m.brand, m.sku);
  check(`${m.sku}: trang chi tiết ${priced ? 'ghi giá là giá tham khảo, không phải giá showroom' : 'ghi "Liên hệ"'}`,
    priced ? vm?.pricing.showroomPrice === priced.priceVnd && vm?.pricing.displayPriceLabel !== 'GIÁ SHOWROOM' : vm?.pricing.showroomPrice === null);
}
const sample = migrated.find((p) => p.image) ?? migrated[0];
const tdVm = await getProductDetail(TENANTS.livlab, sample.id);
check('sản phẩm Tùng Đăng mở được trên LivLab', tdVm?.identity.catalogProductId === sample.catalogProductId);
check('chi tiết không gọi đó là giá showroom', tdVm?.pricing.displayPriceLabel !== 'GIÁ SHOWROOM');
check('sản phẩm LivLab không mở được trên Tùng Đăng', (await getProductDetail(TENANTS.tungdang, libraryProductId(APPROVED_GLB_MODELS[0]))) === null);

console.log('\nF. Room Studio');
const dims = { length: 3, width: 2.4, height: 2.7 };
const roomLib = livlab3dLibraryProducts([]);
for (const m of APPROVED_GLB_MODELS) {
  const product = roomLib.find((p) => p.id === libraryProductId(m));
  check(`${m.sku}: có trong thư viện 3D của Room Studio`, Boolean(product?.reconstruction));
  if (!product) continue;
  const ctx = placementContextFor(product, dims);
  const at = getDefaultPlacement(ctx, product.normalizedCategory);
  const size = { w: m.files.web!.boundsM.max[0] - m.files.web!.boundsM.min[0], h: m.files.web!.boundsM.max[1] - m.files.web!.boundsM.min[1], d: m.files.web!.boundsM.max[2] - m.files.web!.boundsM.min[2] };
  const meta = getProductTechnicalMetadata(product);
  if (m.mounting.kind === 'WALL') {
    const back = at.position[2] - size.d / 2 - -dims.width / 2;
    const height = installationHeight(product, { ...at, instanceId: 'x', productId: product.id, placementType: product.placementType });
    check(`${m.sku}: treo sát tường (${(back * 1000).toFixed(1)} mm)`, product.placementType === 'wall' && Math.abs(back) < 0.002);
    check(`${m.sku}: ${m.mounting.heightLabel.toLowerCase()} mặc định ${m.mounting.heightMm.default} mm`, Math.abs((height ?? NaN) - m.mounting.heightMm.default / 1000) < 1e-6);
    check(`${m.sku}: kiểu lắp kỹ thuật WALL`, meta.placementType === 'WALL');
  } else if (m.mounting.kind === 'FLOOR_INSET') {
    const top = at.position[1] + size.h / 2;
    const moved = clampToRoom([0.4, 0.5, 0.2], ctx);
    check(`${m.sku}: mặt nắp ngang sàn (${(top * 1000).toFixed(1)} mm)`, product.placementType === 'floor' && Math.abs(top) < 1e-6);
    check(`${m.sku}: kéo đi vẫn âm sàn`, Math.abs(moved[1] + size.h / 2) < 1e-6);
    check(`${m.sku}: hồ sơ kỹ thuật ghi độ âm sàn`, Math.abs((meta.insetDepth ?? 0) - m.mounting.insetDepthMm / 1000) < 1e-9);
  }
}
const led = roomLib.find((p) => p.sku === 'A812401000');
check('gương LED mang vật liệu phát sáng riêng', led?.reconstruction?.emissive?.materialName === 'LED_ON__3000K_PERIMETER_DIFFUSER');
check('Room Studio: giá tham khảo có nhãn, SKU chưa có giá vẫn là "Liên hệ"', roomLib.every((p) => {
  const ref = referencePriceFor(p.brand, p.sku);
  return ref ? p.priceMin === ref.priceVnd && /^Giá (hãng|bán lẻ)/.test(p.source.priceRange ?? '') : !p.priceMin && p.source.priceRange === 'Liên hệ';
}));
// A catalogue product carrying the SKU keeps its own record; the model attaches to it.
const recon = APPROVED_GLB_MODELS[0];
const withModel = withReconstruction(toRoomStudioProduct({ id: 'x', slug: 'x', name: recon.name, brand: recon.brand, sku: recon.sku, category: recon.catalogueCategory, priceMin: 1, priceMax: 1 } as never), recon);
check('sản phẩm có sẵn cùng mã nhận mô hình mà giữ giá của nó', withModel.priceMin === 1 && Boolean(withModel.reconstruction));

console.log(`\nSố liệu: LivLab ${livlab.products.length} = ${own.length} của LivLab + ${migrated.length} từ Tùng Đăng (${migrated.filter((p) => !p.image).length} thiếu ảnh) + ${library.length} mô hình 3D`);
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
