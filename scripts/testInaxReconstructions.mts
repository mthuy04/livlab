/**
 * Locks the five INAX reconstructions to the files, products and rules they
 * were checked against.
 *
 * The runtime QA (/dev/room-studio-3d-qa) measured these files in the
 * browser; this suite makes sure the files are still those files, that each
 * resolves only from its exact brand + SKU, that a showroom sees one only
 * where its own catalogue lists the SKU, and that the placement rules put
 * each on the surface it belongs to — at its real size, never scaled to fit.
 *
 * Run with:  npm run test:inax-3d
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import {
  allReconstructions,
  canRenderReconstruction,
  envelopeOf,
  findReconstruction,
  originFromCentre,
} from '../lib/room-studio/reconstructionRegistry';
import {
  catalogProductToRoomStudio,
  livlab3dLibraryProducts,
  toRoomStudioProduct,
  withReconstruction,
  type RoomStudioProduct,
} from '../lib/room-studio/productAdapter';
import { allProduct3DAssets } from '../lib/room-studio/product3dRegistry';
import { isRoomStudioReady } from '../lib/room-studio/product3dAsset';
import { clampToRoom, fitInRoom, getDefaultPlacement, rotatedHalfExtents } from '../lib/room-studio/placementRules';
import { placementContextFor, installationHeight, centreYForInstallationHeight } from '../lib/room-studio/mounting';
import * as ops from '../lib/room-studio/roomState';
import { STARTER_ROOMS, buildStarterRoom, getStarterRoom } from '../lib/room-studio/roomPresets';
import { placementStatusByInstance } from '../lib/room-studio/placementStatus';
import { runTechnicalAdvisor } from '../lib/technical-advisor/engine';
import { getProductTechnicalMetadata } from '../lib/technical-advisor/productTechnicalMetadata';
import { getRealWorldSize } from '../lib/room-studio/assetResolver';
import { parseCSV, mapCsvRowToProduct } from '../lib/importVerifiedProducts';
import type { CatalogProduct } from '../lib/storefront/catalogTypes';
import type { Product } from '../lib/types';

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
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

const product = (over: Partial<Product>): Product =>
  ({
    id: 'x',
    slug: 'x',
    name: 'x',
    category: 'Bồn cầu',
    brand: 'INAX',
    sku: '',
    priceMin: 0,
    priceMax: 0,
    priceRange: '',
    image: '',
    description: '',
    availability: '',
    status: '' as Product['status'],
    showroomName: '',
    showroomLocation: '',
    sellerType: '',
    ...over,
  }) as Product;

/* ------------------------------------------------------- A. the files */

console.log('\nA. file GLB khớp với bản đã kiểm tra');
{
  const io = new NodeIO();
  for (const model of allReconstructions()) {
    for (const [variant, file] of Object.entries(model.files)) {
      if (!file) continue;
      const path = `public${file.url}`;
      const bytes = readFileSync(path);
      check(`${model.sku} ${variant}: kích thước file`, statSync(path).size === file.bytes, statSync(path).size);
      check(
        `${model.sku} ${variant}: sha256`,
        createHash('sha256').update(bytes).digest('hex') === file.sha256
      );
      const doc = await io.read(path);
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      let triangles = 0;
      let transforms = false;
      for (const node of doc.getRoot().listNodes()) {
        const t = node.getTranslation();
        const r = node.getRotation();
        const s = node.getScale();
        if (t.some((v) => v !== 0) || r[3] !== 1 || s.some((v) => v !== 1)) transforms = true;
        const mesh = node.getMesh();
        if (!mesh) continue;
        for (const prim of mesh.listPrimitives()) {
          const pos = prim.getAttribute('POSITION')!;
          const idx = prim.getIndices();
          triangles += (idx ? idx.getCount() : pos.getCount()) / 3;
          const pmin = pos.getMin([]);
          const pmax = pos.getMax([]);
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k], pmin[k]);
            max[k] = Math.max(max[k], pmax[k]);
          }
        }
      }
      check(`${model.sku} ${variant}: không có biến đổi node (scale 1, gốc nguyên)`, !transforms);
      check(`${model.sku} ${variant}: số tam giác`, Math.round(triangles) === file.triangles, Math.round(triangles));
      check(
        `${model.sku} ${variant}: hộp bao khớp bản ghi (≤ 0,01 mm)`,
        [0, 1, 2].every((k) => near(min[k], file.boundsM.min[k], 1e-5) && near(max[k], file.boundsM.max[k], 1e-5)),
        { min, max }
      );
    }
  }
}

/* ---------------------------------------------------- B. identity */

console.log('\nB. chỉ khớp đúng hãng + mã');
{
  check('INAX AC-1017VRN → có', findReconstruction('INAX', 'AC-1017VRN')?.sku === 'AC-1017VRN');
  check('mã viết khác dạng vẫn khớp (ac1017vrn)', findReconstruction('inax', 'ac1017vrn')?.sku === 'AC-1017VRN');
  check('cùng mã nhưng JOMOO → không', findReconstruction('JOMOO', 'AC-1017VRN') === null);
  check('cùng mã nhưng TOTO → không', findReconstruction('TOTO', 'BF-1656V') === null);
  check('L-293VFC (bản một lỗ) → L-293V', findReconstruction('INAX', 'L-293VFC')?.sku === 'L-293V');
  check('L-293VEC (bản ba lỗ) → không: các lỗ không có trong mô hình', findReconstruction('INAX', 'L-293VEC') === null);
  check('mã họ hàng AC-1017 → không', findReconstruction('INAX', 'AC-1017') === null);
  check('không có hãng → không', findReconstruction(null, 'AC-912VN') === null);

  const jomooToilet = toRoomStudioProduct(product({ id: 'j', brand: 'JOMOO', sku: 'AC-912VN', dimensions: '372 x 721 x 680 mm' }));
  check('sản phẩm JOMOO trùng mã không nhận mô hình INAX', !jomooToilet.reconstruction && jomooToilet.capability !== 'PROTOTYPE_3D');
}

/* ------------------------------------------------- C. readiness */

console.log('\nC. trạng thái sẵn sàng');
{
  for (const model of allReconstructions()) {
    check(`${model.sku}: 3D_READY sau kiểm tra runtime`, canRenderReconstruction(model), model.runtimeQa.readiness);
    check(`${model.sku}: có ngày và công cụ kiểm tra`, Boolean(model.runtimeQa.checkedAt && model.runtimeQa.checkedWith));
    check(`${model.sku}: nguồn ghi là tái tạo, không dùng CAD hãng`,
      model.provenance.kind === 'LIVLAB_RECONSTRUCTION' && model.provenance.manufacturerCadUsed === false);
  }
  // The manufacturer gate is a different claim and must not have moved.
  check('cổng READY của file hãng vẫn = 0', allProduct3DAssets().filter(isRoomStudioReady).length === 0);
  const unready = { ...allReconstructions()[0], runtimeQa: { ...allReconstructions()[0].runtimeQa, readiness: 'QA_PENDING' as const } };
  check('chưa kiểm tra thì không vẽ', !canRenderReconstruction(unready));
}

/* ------------------------------------------------- D. adapter */

console.log('\nD. sản phẩm trong Room Studio');
{
  const toilet = toRoomStudioProduct(product({ id: 't', name: 'AC-1017VRN', sku: 'AC-1017VRN' }));
  check('bồn cầu: 3D TÁI TẠO, không phải 3D VERIFIED', toilet.capability === 'PROTOTYPE_3D');
  check('bồn cầu: scale đúng 1', toilet.modelScale === 1);
  check('bồn cầu: kích thước 400 × 805 × 588', near(toilet.width!, 0.4) && near(toilet.depth!, 0.805) && near(toilet.height!, 0.588));
  check('bồn cầu: đặt sàn', toilet.placementType === 'floor');

  const tub = toRoomStudioProduct(product({ id: 'b', category: 'Bồn tắm', sku: 'BF-1656V' }));
  check('bồn tắm: nhóm bathtub, đặt sàn (không treo tường như phụ kiện)',
    tub.normalizedCategory === 'bathtub' && tub.placementType === 'floor');
  check('bồn tắm: dài 1600 theo X, rộng 800 theo Z', near(tub.width!, 1.6) && near(tub.depth!, 0.8));

  const shower = toRoomStudioProduct(product({ id: 's', category: 'Sen tắm', sku: 'BFV-70S' }));
  check('sen: gắn tường', shower.placementType === 'wall');

  const basin = toRoomStudioProduct(product({ id: 'l', category: 'Lavabo', sku: 'L-293V' }));
  check('lavabo: mặc định chỉ chậu, cao 155', basin.reconstruction?.variant === 'basin_only' && near(basin.height!, 0.155));
  check('lavabo: đặt mặt bàn', basin.placementType === 'counter');
  const withFaucet = withReconstruction(basin, findReconstruction('INAX', 'L-293V')!, 'web');
  check('lavabo kèm vòi: cao 278,75, ghi rõ vòi minh hoạ',
    near(withFaucet.height!, 0.27875) && Boolean(withFaucet.reconstruction?.illustrativeParts));
  check('biến thể không có thì về mặc định',
    withReconstruction(basin, findReconstruction('INAX', 'L-293V')!, 'high')!.reconstruction!.variant === 'basin_only');

  const meta = getProductTechnicalMetadata(shower);
  check('sen: dữ liệu kỹ thuật cần nước nóng + lạnh, gắn tường',
    meta.placementType === 'WALL' && meta.plumbing?.requiresHotWater === true && meta.plumbing?.requiresColdWater === true);
  check('khoảng trống là tham khảo LivLab, không phải của hãng',
    getProductTechnicalMetadata(toilet).clearanceOrigin === 'CURATED_DEMO');
}

/* -------------------------------------------- E. LivLab library */

console.log('\nE. thư viện 3D của LivLab');
{
  const csv = parseCSV(readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8'));
  const mapped = csv.map(mapCsvRowToProduct).map(toRoomStudioProduct);
  const library = livlab3dLibraryProducts(mapped);
  check('năm sản phẩm 3D có trong thư viện LivLab', library.length === 5, library.map((p) => p.sku));
  check('không giá, không tồn kho bịa', library.every((p) => !p.priceMin && p.source.priceRange === 'Liên hệ' && !p.source.availability));
  check('mỗi sản phẩm một id ổn định', new Set(library.map((p) => p.id)).size === 5);
  const already = livlab3dLibraryProducts([...mapped, library[0]]);
  check('mã đã có trong danh mục thì không thêm lần hai', already.length === 4);
}

/* -------------------------------------------- F. Tùng Đăng */

console.log('\nF. danh mục Tùng Đăng');
{
  const fixture = JSON.parse(readFileSync('data/demo/tungdang-sanitaryware.json', 'utf8')) as {
    products: Array<Record<string, unknown>>;
  };
  const rows = fixture.products.map(
    (p) =>
      ({
        id: `${String(p.brand).toLowerCase()}-${String(p.sku ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        catalogProductId: `demo:tungdang:${p.brand}:${String(p.sku ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`,
        sourceType: 'DEMO_FIXTURE',
        href: '/products/x',
        sku: p.sku ?? null,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: '/x.webp',
        showroomPrice: p.showroomPrice ?? null,
        referencePrice: p.referencePrice ?? null,
        dimensions: p.dimensions ?? null,
      }) as unknown as CatalogProduct
  );
  const td = rows.map((r) => catalogProductToRoomStudio(r, 'tungdang'));
  const with3d = td.filter((p) => p.reconstruction);
  check('chỉ AC-1017VRN và AC-912VN có mô hình (đúng các mã showroom bán)',
    with3d.map((p) => p.sku).sort().join() === ['AC-1017VRN', 'AC-912VN'].join(), with3d.map((p) => p.sku));
  check('không sản phẩm JOMOO/TOTO/CAESAR/VIGLACERA nào nhận mô hình INAX',
    td.filter((p) => p.brand !== 'INAX').every((p) => !p.reconstruction));
  const ac1017 = td.find((p) => p.sku === 'AC-1017VRN')!;
  const src = fixture.products.find((p) => p.sku === 'AC-1017VRN')!;
  check('giá của showroom giữ nguyên trong mục báo giá',
    ac1017.quoteEntry?.showroomPrice === src.showroomPrice && ac1017.quoteEntry?.tenantId === 'tungdang');
  check('bồn tắm của showroom đặt được trên sàn khi có đủ kích thước',
    td.filter((p) => p.normalizedCategory === 'bathtub' && p.capability !== 'NO_DIMENSIONS').every((p) => p.placementType === 'floor'));
}

/* ------------------------------------------------ G. placement */

console.log('\nG. lắp đặt và độ vừa phòng');
{
  const room = { length: 3, width: 2, height: 2.7 };
  const back = -room.width / 2;
  const toilet = toRoomStudioProduct(product({ id: 't', sku: 'AC-912VN' }));
  const t = getDefaultPlacement(placementContextFor(toilet, room), 'toilet').position;
  check('bồn cầu: đáy chạm sàn', near(t[1] - toilet.height! / 2, 0));
  check('bồn cầu: lưng cách tường 15 mm theo bản vẽ', near(t[2] - toilet.depth! / 2 - back, 0.015));

  const shower = toRoomStudioProduct(product({ id: 's', category: 'Sen tắm', sku: 'BFV-70S' }));
  const sp = getDefaultPlacement(placementContextFor(shower, room), 'shower').position;
  const placedShower = { instanceId: 'x', productId: 's', position: sp, rotationY: 0, placementType: 'wall' as const };
  check('sen: bộ trộn ở 1000 mm, không đặt xuống sàn', near(installationHeight(shower, placedShower)!, 1.0));
  check('sen: sát tường (≤ 2 mm)', sp[2] - shower.depth! / 2 - back <= 0.002);
  check('sen: đỉnh dưới trần', sp[1] + shower.height! / 2 <= room.height);
  const tooLow = clampToRoom([sp[0], 0.2, sp[2]], placementContextFor(shower, room));
  check('sen: kéo thấp quá vẫn giữ bộ trộn ≥ 800 mm',
    installationHeight(shower, { ...placedShower, position: tooLow })! >= 0.8 - 1e-9);
  const y12 = centreYForInstallationHeight(shower, 1.2);
  check('sen: đặt bộ trộn 1200 mm → đúng 1200', near(installationHeight(shower, { ...placedShower, position: [0, y12, 0] })!, 1.2));

  const basin = toRoomStudioProduct(product({ id: 'l', category: 'Lavabo', sku: 'L-293V' }));
  const bp = getDefaultPlacement(placementContextFor(basin, room), 'lavabo').position;
  check('lavabo: đáy chậu ở mặt bàn 800 mm', near(bp[1] - basin.height! / 2, 0.8));
  const bp2 = clampToRoom(bp, placementContextFor(basin, room, { rotationY: 0, mountHeight: 0.9 }));
  check('lavabo: đổi mặt bàn 900 mm → chậu lên theo', near(bp2[1] - basin.height! / 2, 0.9));

  const tub = toRoomStudioProduct(product({ id: 'b', category: 'Bồn tắm', sku: 'BF-1656V' }));
  check('bồn tắm vừa phòng 3,0 × 2,0', fitInRoom(placementContextFor(tub, room)).fits);
  const small = fitInRoom(placementContextFor(tub, { length: 1.5, width: 1.5, height: 2.6 }));
  check('bồn tắm không vừa phòng 1,5 × 1,5 — có lý do, không thu nhỏ', !small.fits && Boolean(small.reason));
  check('kích thước bồn tắm không đổi sau khi từ chối', near(getRealWorldSize(tub).width, 1.6));
  const narrow = fitInRoom(placementContextFor(tub, { length: 1.2, width: 2.0, height: 2.6 }));
  check('phòng hẹp nhưng sâu: vừa khi xoay 90°', narrow.fits && near(narrow.rotationY, Math.PI / 2), narrow);
  const turned = clampToRoom([0, 0.28, 0.9], { ...placementContextFor(tub, room), rotationY: Math.PI / 2 });
  const { halfZ } = rotatedHalfExtents(getRealWorldSize(tub), Math.PI / 2);
  check('bồn tắm xoay 90°: không xuyên tường (kẹp theo hình chiếu đã xoay)', turned[2] + halfZ <= room.width / 2 + 1e-9);

  // A toilet slid under a countertop basin's drawn counter is a collision:
  // the counter is context, not product, but it still occupies the room.
  {
    let r = ops.createInitialRoomState();
    r = ops.addProduct(r, basin, { instanceId: 'basin' });
    r = ops.addProduct(r, toilet, { instanceId: 'wc' });
    const b = r.placedProducts.find((p) => p.instanceId === 'basin')!;
    r = ops.updatePlacement(r, 'wc', { position: [b.position[0], toilet.height! / 2, -room.width / 2 + toilet.depth! / 2] });
    const entries = r.placedProducts.map((placed) => {
      const p = placed.productId === basin.id ? basin : toilet;
      return { placed, product: p, metadata: getProductTechnicalMetadata(p) };
    });
    const withCounter = placementStatusByInstance(
      runTechnicalAdvisor({ room, entries, utilityPoints: [], counterSupport: true }),
      ['basin', 'wc']
    );
    const without = placementStatusByInstance(runTechnicalAdvisor({ room, entries, utilityPoints: [] }), ['basin', 'wc']);
    check('bồn cầu dưới bệ đặt chậu: báo va chạm', withCounter.wc === 'COLLISION', withCounter);
    check('tắt bệ minh hoạ: chậu treo trên cao không va chạm bồn cầu', without.wc !== 'COLLISION', without);
  }

  let s = ops.setDimensions(ops.createInitialRoomState(), { length: 1.5, width: 1.5, height: 2.6 });
  const before = s.placedProducts.length;
  s = ops.addProduct(s, tub, { instanceId: 'tub' });
  check('phòng quá nhỏ: không thêm bồn tắm vào phòng', s.placedProducts.length === before);
}

/* --------------------------------------------------- H. presets */

console.log('\nH. phòng mẫu');
{
  const csv = parseCSV(readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8'));
  const mapped = csv.map(mapCsvRowToProduct).map(toRoomStudioProduct);
  const livlab = [...mapped, ...livlab3dLibraryProducts(mapped)];
  let n = 0;
  const id = (p: string) => `p${++n}_${p}`;

  for (const preset of STARTER_ROOMS) {
    let base = ops.createInitialRoomState();
    base = ops.setTargetBudget(base, 40_000_000);
    base = ops.addUtilityPoint(base, { id: 'u1', type: 'DRAIN', position: [0, 0, 0], label: 'x' });
    const result = buildStarterRoom(base, preset, livlab, id);
    check(`${preset.id}: giữ ngân sách và điểm kỹ thuật`,
      result.state.targetBudget === 40_000_000 && result.state.utilityPoints?.length === 1);
    const entries = result.state.placedProducts.map((placed) => {
      const p = livlab.find((x) => x.id === placed.productId) as RoomStudioProduct;
      return { placed, product: p, metadata: getProductTechnicalMetadata(p) };
    });
    const findings = runTechnicalAdvisor({ room: result.state.dimensions, entries, utilityPoints: [], counterSupport: true });
    const status = placementStatusByInstance(findings, result.state.placedProducts.map((p) => p.instanceId));
    const bad = Object.entries(status).filter(([, v]) => v === 'COLLISION' || v === 'OUTSIDE_ROOM' || v === 'UNSUPPORTED_SURFACE');
    check(`${preset.id}: ${result.placed.length} sản phẩm, không va chạm, không ra ngoài phòng`, bad.length === 0, bad);
    check(`${preset.id}: chỉ dùng sản phẩm có trong danh mục`,
      result.state.placedProducts.every((p) => livlab.some((x) => x.id === p.productId)));
  }
  const warm = buildStarterRoom(ops.createInitialRoomState(), getStarterRoom('warm-stone')!, livlab, id);
  check('Đá ấm (LivLab): lavabo + bồn cầu + sen INAX', warm.placed.map((p) => p.product.sku).join() === 'L-293V,AC-1017VRN,BFV-70S',
    warm.placed.map((p) => p.product.sku));
  const hotel = buildStarterRoom(ops.createInitialRoomState(), getStarterRoom('modern-hotel')!, livlab, id);
  check('Khách sạn (LivLab): đủ bốn vị trí kể cả bồn tắm', hotel.placed.length === 4 && hotel.skipped.length === 0, hotel.skipped);

  // A showroom catalogue with only some of the SKUs: slots are skipped, never substituted.
  const tdLike = [
    toRoomStudioProduct(product({ id: 'td-ac1017', sku: 'AC-1017VRN', priceMin: 13_340_000 })),
    toRoomStudioProduct(product({ id: 'td-jomoo', brand: 'JOMOO', category: 'Sen tắm', sku: '36437-477/1B-I011', dimensions: '300 x 450 x 1200 mm' })),
  ];
  const tdWarm = buildStarterRoom(ops.createInitialRoomState(), getStarterRoom('warm-stone')!, tdLike, id);
  check('danh mục thiếu mã: bỏ trống vị trí, không thay bằng sản phẩm khác',
    tdWarm.placed.map((p) => p.product.sku).join() === 'AC-1017VRN' && tdWarm.skipped.join() === 'Lavabo,Sen tắm', tdWarm);

  const empty = buildStarterRoom(warm.state, getStarterRoom('empty')!, livlab, id);
  check('Phòng trống: bỏ sản phẩm, giữ kích thước', empty.state.placedProducts.length === 0 &&
    empty.state.dimensions.length === warm.state.dimensions.length);
}

/* ------------------------------------------------- I. persistence */

console.log('\nI. lưu và mở lại');
{
  let s = ops.createInitialRoomState();
  const basin = toRoomStudioProduct(product({ id: 'l', category: 'Lavabo', sku: 'L-293V' }));
  s = ops.addProduct(s, basin, { instanceId: 'b1' });
  s = ops.updatePlacement(s, 'b1', { variant: 'web', mountHeight: 0.85 });
  s = ops.setLighting(s, 'warm');
  s = ops.setArchitecture(s, { niche: true });
  const back = ops.deserializeRoomState(JSON.parse(JSON.stringify(ops.serializeRoomState(s))));
  check('giữ biến thể và cao mặt bàn', back.placedProducts[0].variant === 'web' && back.placedProducts[0].mountHeight === 0.85);
  check('giữ ánh sáng và chi tiết kiến trúc', back.lighting === 'warm' && back.architecture?.niche === true);
  check('không lưu hình học hay vật liệu, chỉ tham chiếu', !JSON.stringify(ops.serializeRoomState(s)).includes('glb'));

  const legacy = ops.deserializeRoomState({
    version: 1,
    dimensions: { length: 3, width: 2, height: 2.7 },
    placedProducts: [{ instanceId: 'old', productId: 'llv-toi-inax-ac602vn', position: [0, 0.37, -0.6], rotationY: 0, placementType: 'floor' }],
  });
  check('bản lưu cũ: sản phẩm và vị trí giữ nguyên', legacy.placedProducts[0].productId === 'llv-toi-inax-ac602vn' &&
    legacy.placedProducts[0].position[1] === 0.37);
  check('bản lưu cũ: ánh sáng và kiến trúc mặc định', legacy.lighting === 'daylight' && legacy.architecture?.skirting === true);
  const junk = ops.deserializeRoomState({ lighting: 'disco', architecture: { niche: 'yes' }, placedProducts: [
    { instanceId: 'a', productId: 'b', position: [0, 0, 0], rotationY: 0, placementType: 'floor', mountHeight: -3, variant: 7 },
  ] });
  check('giá trị hỏng bị bỏ, không đoán', junk.lighting === 'daylight' && junk.architecture?.niche === false &&
    junk.placedProducts[0].mountHeight === undefined && junk.placedProducts[0].variant === undefined);
}

/* --------------------------------------------- J. origin helpers */

console.log('\nJ. gốc toạ độ');
{
  const shower = findReconstruction('INAX', 'BFV-70S')!;
  const o = originFromCentre(shower.files.web);
  check('sen: gốc (tâm bộ trộn) thấp hơn tâm hộp bao', o[1] < 0);
  const env = envelopeOf(shower.files.web);
  check('sen: bao 294 × 524 × 1638 mm', near(env.width, 0.294) && near(env.depth, 0.5235) && near(env.height, 1.638048, 1e-5));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
