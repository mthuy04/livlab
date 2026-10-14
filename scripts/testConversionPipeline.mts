/**
 * Locks the conversion pipeline's contract.
 *
 * None of this can test Blender — Blender is not installed, and these tests
 * must keep passing whether it is or not. What they CAN test is everything
 * that decides whether a conversion should be attempted, what it is judged
 * against, and what may follow it. Those are the decisions that turn a bad
 * file into a published product, and they are all pure functions.
 *
 * Run with:  npm run test:3d-pipeline
 */

import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  SUPPORTED_INPUT_FORMATS,
  blockers,
  resolveSku,
  runtimeUrl,
  sourceStem,
  masterPath,
  reportPath,
  WORKSPACE,
  activationRefusals,
  findBlender,
  type GlbFacts,
} from './3d/pipeline';
import { allProduct3DAssets } from '../lib/room-studio/product3dRegistry';
import {
  isRoomStudioReady,
  performanceTargetFor,
  PERFORMANCE_CATEGORY_FOR_PLACEMENT,
  QA_CHECKS,
} from '../lib/room-studio/product3dAsset';
import { needsDimensionReview, DIMENSION_REVIEW_REQUIRED } from '../lib/room-studio/dimensionReview';
import { availableProductModels } from '../lib/livlabProductModels';

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

/* ------------------------------------------------------- A. the six records */

console.log('\nA. sau INAX record (§65)');

const assets = allProduct3DAssets();
const skus = assets.map((a) => a.sku).sort();
check(
  'dung bay SKU, khong thieu khong thua',
  JSON.stringify(skus) ===
    JSON.stringify([
      'AC-1008VRN',
      'AC-1017VRN',
      'AC-1035VN',
      'AC-1135VN',
      'AC-2700VN',
      'AC-4005VN',
      'TLG02301B#BFG',
    ]),
  skus
);
check('tat ca con o SOURCE_VERIFIED', assets.every((a) => a.status === 'SOURCE_VERIFIED'));
check('khong asset nao co glbUrl', assets.every((a) => !a.runtime.glbUrl));
check('READY = 0', assets.filter(isRoomStudioReady).length === 0);
/**
 * Three official dimensions, or refused — not "three official dimensions".
 *
 * The original rule assumed every manufacturer publishes all three, which was
 * true while every record was a toilet. TOTO dimensions the TLG02301B faucet's
 * height and spout reach and nothing across its body, and its official CAD is
 * a 2D drawing, so there is no width to record and inventing one would defeat
 * the check it is supposed to feed.
 *
 * What has to hold is that an incomplete record cannot become a product: it is
 * blocked from convert and can never be READY. Both halves are asserted, so a
 * toilet that quietly loses a dimension is still caught.
 */
for (const a of assets) {
  const complete = Boolean(a.dimensionsMm.width && a.dimensionsMm.depth && a.dimensionsMm.height);
  if (complete) continue;
  check(
    `${a.sku}: thieu chieu cua hang thi bi chan convert`,
    blockers(a).some((b) => b.startsWith('MISSING_OFFICIAL_DIMENSIONS')),
    blockers(a)
  );
  check(`${a.sku}: thieu chieu cua hang thi khong the READY`, !isRoomStudioReady(a));
}

// §66: the two SKUs whose 3D section exists but carries no file must not have
// crept into the registry as if a source had been found.
check(
  'AC-912VN va AC-900VRN-2 KHONG nam trong registry (§66)',
  !skus.includes('AC-912VN') && !skus.includes('AC-900VRN-2'),
  skus
);
const audit = JSON.parse(readFileSync('data/demo/manufacturer-3d-source-audit.json', 'utf8'));
const unavailable = (audit.activeCatalog ?? []).filter((e: { sku: string }) =>
  ['AC-912VN', 'AC-900VRN-2'].includes(e.sku)
);
check(
  'ho van duoc ghi nhan la "co muc 3D nhung khong co file"',
  unavailable.length === 2 &&
    unavailable.every((e: { rows: Array<{ sectionType: string; present: boolean }> }) =>
      e.rows.some((r) => r.sectionType === 'THREE_D' && r.present === false)
    ),
  unavailable.length
);

/* ------------------------------------------------- B. what blocks a convert */

console.log('\nB. dieu kien chan (§67)');

const pilot = resolveSku('AC-1017VRN');
check('tra cuu SKU hoat dong', pilot !== null);
check('AC-1017VRN khong bi chan', blockers(pilot!).length === 0, blockers(pilot!));

// §67: the disputed row must be refused by the same gate, for a stated reason.
check('BFV-655T-8C nam trong danh sach can xac minh', needsDimensionReview('BFV-655T-8C'));
check('khong phan biet hoa thuong', needsDimensionReview('bfv-655t-8c'));
check('SKU binh thuong khong bi gan co', !needsDimensionReview('AC-1017VRN'));
check(
  'ly do duoc viet ra, khong chi la mot co',
  DIMENSION_REVIEW_REQUIRED.every((r) => r.reason.length > 40 && r.resolution.length > 20)
);
// The catalogue value is recorded verbatim — the point is that nothing here
// corrects it.
check(
  'gia tri danh muc duoc chep nguyen, khong sua',
  DIMENSION_REVIEW_REQUIRED[0].catalogueValue === '575 x 1176 x 450 mm'
);

const fakeBlocked = blockers({
  ...pilot!,
  sku: 'BFV-655T-8C',
  qa: { ...pilot!.qa },
});
check('asset co SKU dang tranh chap thi bi chan', fakeBlocked.some((b) => b.startsWith('DIMENSION_REVIEW_REQUIRED')), fakeBlocked);

const noIdentity = blockers({ ...pilot!, qa: { ...pilot!.qa, identityVerified: false } });
check('chua xac minh danh tinh thi bi chan', noIdentity.some((b) => b.startsWith('IDENTITY_NOT_VERIFIED')));

const noDims = blockers({ ...pilot!, dimensionsMm: { width: 400 } });
check('thieu kich thuoc hang thi bi chan', noDims.some((b) => b.startsWith('MISSING_OFFICIAL_DIMENSIONS')));

/* ------------------------------------------------------------ C. the paths */

console.log('\nC. duong dan va dinh dang (§8, §71)');

check('ten file nguon dung quy uoc', sourceStem(pilot!) === 'inax_ac-1017vrn_source');
check(
  'url runtime co so phien ban (§71)',
  runtimeUrl(pilot!) === '/assets/3d/inax/ac-1017vrn/v1/runtime.glb',
  runtimeUrl(pilot!)
);
check('phien ban sau doi url', runtimeUrl(pilot!, 2).includes('/v2/'), runtimeUrl(pilot!, 2));
check(
  'dinh dang nhan dung bon loai (§12)',
  JSON.stringify([...SUPPORTED_INPUT_FORMATS]) === JSON.stringify(['.fbx', '.obj', '.gltf', '.glb'])
);
check('master nam trong workspace, khong nam trong public', masterPath(pilot!).includes('assets/3d/work/normalized'));
check('bao cao nam trong reports', reportPath(pilot!).includes('assets/3d/work/reports'));

// §74: raw sources must not be committable.
const ignore = readFileSync('.gitignore', 'utf8');
check('incoming/ bi gitignore', ignore.includes('assets/3d/work/incoming/'));
check('normalized/ bi gitignore', ignore.includes('assets/3d/work/normalized/'));
check('reports/ KHONG bi gitignore', !ignore.includes('assets/3d/work/reports/'));

/* ----------------------------------------------------- D. performance gates */

console.log('\nD. nguong hieu nang (§33)');

const toiletTarget = performanceTargetFor('FLOOR_TOILET');
check('FLOOR_TOILET -> ngan sach TOILET', PERFORMANCE_CATEGORY_FOR_PLACEMENT.FLOOR_TOILET === 'TOILET');
check('toilet: 20k-60k tam giac', JSON.stringify(toiletTarget?.triangles) === '[20000,60000]', toiletTarget);
check('toilet: toi da 3MB', toiletTarget?.maxBytes === 3_000_000, toiletTarget?.maxBytes);
check(
  'moi placement type deu co ngan sach',
  Object.keys(PERFORMANCE_CATEGORY_FOR_PLACEMENT).every((p) => performanceTargetFor(p as never) !== null)
);

/* ------------------------------------------------------- E. the state today */

console.log('\nE. trang thai hom nay (§81, §82)');

check('workspace incoming/ ton tai', existsSync(WORKSPACE.incoming));
check('workspace reports/ ton tai', existsSync(WORKSPACE.reports));
check(
  'chua co file nguon nao cho pilot — WAITING_FOR_REAL_FBX',
  !SUPPORTED_INPUT_FORMATS.some((ext) => existsSync(path.join(WORKSPACE.incoming, sourceStem(pilot!) + ext)))
);
check('chua co master GLB', !existsSync(masterPath(pilot!)));
check(
  'chua co runtime GLB trong public',
  !existsSync(path.join('public', runtimeUrl(pilot!).replace(/^\//, '')))
);
check('khong co model dung chung nao duoc bat', Object.values(availableProductModels).every((v) => v === false));
check('bo bay co QA van nguyen ven', QA_CHECKS.length === 7);

/* ------------------------------------------------ F. the activation gate */

console.log('\nF. cong kich hoat (§47, §48)');

const official = pilot!.dimensionsMm as Required<NonNullable<typeof pilot>['dimensionsMm']>;
const perfectMm = { width: official.width, depth: official.depth, height: official.height };

/** An asset whose seven flags a person has already ticked. */
const qaDone = {
  ...pilot!,
  qa: Object.fromEntries(QA_CHECKS.map((c) => [c, true])) as unknown as NonNullable<typeof pilot>['qa'],
};

const goodGlb: GlbFacts = {
  exists: true,
  inspected: true,
  measuredMm: perfectMm,
  bboxMin: [-0.2, 0, 0],
};

// The case that matters: everything right, so the gate must OPEN. A gate only
// ever seen refusing is a gate nobody has checked.
check('du dieu kien -> khong con ly do tu choi', activationRefusals(qaDone, goodGlb).length === 0, activationRefusals(qaDone, goodGlb));

check(
  'thieu co QA -> tu choi',
  activationRefusals(pilot!, goodGlb).some((r) => r.startsWith('QA_INCOMPLETE'))
);
check(
  'khong co file -> tu choi',
  activationRefusals(qaDone, { exists: false, inspected: false }).some((r) => r.startsWith('NO_RUNTIME_GLB'))
);
check(
  'file hong -> tu choi',
  activationRefusals(qaDone, { exists: true, inspected: false, error: 'bad glb' }).some((r) =>
    r.startsWith('GLB_INVALID')
  )
);

// §18: PASS is <=2%. REVIEW (2-5%) is explicitly not enough to activate.
const reviewBand = { ...perfectMm, depth: Math.round(official.depth * 1.03) };
check(
  'sai so 3% (REVIEW) van bi tu choi',
  activationRefusals(qaDone, { ...goodGlb, measuredMm: reviewBand }).some((r) =>
    r.startsWith('DIMENSION_NOT_PASSED')
  )
);
const withinPass = { ...perfectMm, depth: Math.round(official.depth * 1.015) };
check(
  'sai so 1.5% van qua',
  activationRefusals(qaDone, { ...goodGlb, measuredMm: withinPass }).length === 0
);

// §20: the pivot contract is checked against the file, not assumed.
check(
  'pivot khong o back-center-floor -> tu choi',
  activationRefusals(qaDone, { ...goodGlb, bboxMin: [-0.2, 0.05, 0] }).some((r) =>
    r.startsWith('PIVOT_NOT_NORMALISED')
  )
);
check(
  'goc toa do dung thi khong phan nan',
  !activationRefusals(qaDone, { ...goodGlb, bboxMin: [-0.2, 0, 0] }).some((r) =>
    r.startsWith('PIVOT_NOT_NORMALISED')
  )
);

// §67 again, at the last gate: a disputed dimension row cannot be activated
// even with a perfect-looking model, because the figure it was checked against
// is the thing in doubt.
check(
  'SKU dang tranh chap kich thuoc -> tu choi du model dep',
  activationRefusals({ ...qaDone, sku: 'BFV-655T-8C' }, goodGlb).some((r) =>
    r.startsWith('DIMENSION_REVIEW_REQUIRED')
  )
);

/* --------------------------------------------- G. handoff + maxscript (§45) */

console.log('\nG. goi ban giao MAX (§7, §9, §45)');

const maxScript = 'scripts/3d/max/export_product_to_fbx.ms';
check('co MAXScript', existsSync(maxScript));
const ms = readFileSync(maxScript, 'utf8');
// Strip the /* */ header and -- line comments before asserting on behaviour.
// The prose warns AGAINST rescaling, so searching the raw text for "rescale"
// finds the warning and fails the script for saying the right thing.
const msCode = ms
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n');

check('MAXScript xoa camera va den', msCode.includes('cameras as array') && msCode.includes('lights as array'));
// §8: no geometry-altering transform anywhere in the executable body.
check(
  'MAXScript khong scale / move / xoay hinh hoc',
  !/\bscale\b|\bmove\b|\brotate\b|\.pos\s*=|\.pivot\s*=|resetXForm/i.test(msCode),
  msCode.match(/\bscale\b|\bmove\b|\brotate\b|\.pos\s*=|\.pivot\s*=|resetXForm/i)?.[0]
);
check('MAXScript dat don vi mm va truc Y', ms.includes('"ConvertUnit" #mm') && ms.includes('"UpAxis" #y'));
check('MAXScript nhung texture', ms.includes('"EmbedTextures" true'));
check('MAXScript tat animation', ms.includes('"Animation" false'));

const readmePath = `assets/3d/handoff/inax/${pilot!.sku}/EXPORT-README.md`;
check('co EXPORT-README cho pilot', existsSync(readmePath));
const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
check('README neu dung ten FBX can xuat', readme.includes(`${sourceStem(pilot!)}.fbx`));
check('README neu du ba kich thuoc hang', ['400', '805', '588'].every((n) => readme.includes(n)));
check('README co lenh dan thang vao MAXScript', readme.includes('fileIn @"'));
check('README canh bao khong scale lai', readme.includes('Đừng scale lại'));
check('README dan link Box cua dung SKU', readme.includes(pilot!.source.url ?? 'KHONG_CO'));

/* ------------------------------------------- H. multibrand source manifest */

console.log('\nH. kho nguon da hang (§12, §67)');

const manifestPath = 'data/3d/manufacturer-sources.json';
check('co manifest nguon', existsSync(manifestPath));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  records: Array<{
    brand: string; sku: string; sourceFormat: string; sourceStatus: string;
    rejectionReason?: string | null; blocker?: string | null;
    geometryInspection?: { verdict: string; threeDEntities: number } | null;
    sourceSha256?: string | null;
  }>;
};

check('manifest co ban ghi', manifest.records.length > 0, manifest.records.length);

// §67: a 2D drawing must never be recorded as usable geometry, whatever the
// manufacturer filed it under.
const twoD = manifest.records.filter((r) => r.geometryInspection?.verdict === 'TWO_D_DRAWING_ONLY');
check('ban ve 2D bi danh dau REJECTED', twoD.every((r) => r.sourceStatus === 'REJECTED'), twoD.map((r) => r.sourceStatus));
check('ban ve 2D ghi ro ly do SOURCE_NOT_3D', twoD.every((r) => r.rejectionReason === 'SOURCE_NOT_3D'));
check('ban ve 2D that su co 0 thuc the 3D', twoD.every((r) => r.geometryInspection!.threeDEntities === 0));

// Nothing in the manifest may claim usable geometry today.
const usable = manifest.records.filter((r) => r.geometryInspection?.verdict === 'HAS_3D_GEOMETRY');
check('chua co nguon nao dung duoc lam model', usable.length === 0, usable.map((r) => r.sku));

// Every record states where it is blocked, rather than just "not ready".
check(
  'moi ban ghi chua READY deu neu blocker cu the',
  manifest.records.every((r) => r.sourceStatus === 'READY' || r.rejectionReason || r.blocker),
  manifest.records.filter((r) => !r.rejectionReason && !r.blocker).map((r) => r.sku)
);

// Downloaded files are hashed, so a later re-download can be compared.
const downloaded = manifest.records.filter((r) => r.geometryInspection);
check('file da tai deu co sha256', downloaded.every((r) => typeof r.sourceSha256 === 'string' && r.sourceSha256.length === 64));

// §11: raw manufacturer geometry stays out of the repository.
check('assets/3d/sources/ bi gitignore', readFileSync('.gitignore', 'utf8').includes('assets/3d/sources/'));

// The six INAX records in the manifest must agree with the registry, not drift.
// Compared brand against brand: this used to check the INAX manifest against
// every SKU in the registry, which only held while the registry was all INAX
// and broke the moment a TOTO record joined it.
const inaxManifest = manifest.records.filter((r) => r.brand === 'INAX').map((r) => r.sku).sort();
const inaxRegistry = assets.filter((a) => a.brand === 'INAX').map((a) => a.sku).sort();
check(
  'manifest va registry khop sau SKU INAX',
  JSON.stringify(inaxManifest) === JSON.stringify(inaxRegistry),
  { inaxManifest, inaxRegistry }
);

/* ------------------------------------------- I. the axis convention (§11) */

/**
 * Blender is Z-up; glTF is Y-up. `import_scene.fbx` lands geometry in
 * Blender's world and `export_scene.gltf(export_yup=True)` rotates it on the
 * way out, so the converter measures X=width, Y=depth, Z=height and the GLB
 * comes out X=width, Y=height, Z=depth.
 *
 * Reading one of those spaces with the other's axis order is silent: a model
 * whose height and depth are close enough still converts, and ships lying on
 * its side with its pivot on the wrong face. The only thing that catches it is
 * running the converter and measuring what came out, so this section does that
 * when Blender is available and says so plainly when it is not.
 */
const blenderForAxis = findBlender();
if (!blenderForAxis) {
  console.log('\nI. quy uoc truc (§11)\n  SKIP  khong co Blender — bo qua kiem tra truc');
} else {
  const tmp = mkdtempSync(path.join(tmpdir(), 'livlab-axis-'));
  /**
   * Three clearly different extents, so no two axes can be confused — and
   * three that are obviously not a product.
   *
   * These were 40 x 117.2 x 133.2, which borrowed the TOTO faucet's real
   * height and reach so the fixture would resemble the thing being shipped.
   * That was a mistake worth naming: the one number nobody had a manufacturer
   * source for, 40, then looked like the faucet's width, and a fixture
   * constant is the worst possible provenance for a QA target. The numbers
   * below match no catalogue entry, and the assertion under
   * `OFFICIAL_VS_FIXTURE` keeps it that way.
   */
  const W = 41, D = 173, H = 229;
  const mk = path.join(tmp, 'mk.py');
  writeFileSync(
    mk,
    'import bpy,sys\n' +
      'out=sys.argv[sys.argv.index("--")+1]\n' +
      'bpy.ops.wm.read_factory_settings(use_empty=True)\n' +
      'bpy.ops.mesh.primitive_cube_add(size=1)\n' +
      'o=bpy.context.active_object\n' +
      `o.scale=(${W}/1000,${D}/1000,${H}/1000)\n` +
      'bpy.ops.object.transform_apply(scale=True)\n' +
      'bpy.ops.export_scene.fbx(filepath=out)\n'
  );
  const fbx = path.join(tmp, 'box.fbx');
  const glb = path.join(tmp, 'box.glb');
  const rep = path.join(tmp, 'box.json');
  const run = (args: string[]) =>
    spawnSync(blenderForAxis.path, ['--background', ...args], { encoding: 'utf8', timeout: 180_000 });

  run(['--python', mk, '--', fbx]);
  check('dung duoc FBX thu nghiem', existsSync(fbx));

  run([
    '--python', path.join('scripts/3d/blender_convert_product.py'), '--',
    '--input', fbx, '--output', glb, '--report', rep,
    '--brand', 'TEST', '--sku', 'AXIS-FIXTURE',
    '--width-mm', String(W), '--depth-mm', String(D), '--height-mm', String(H),
    '--placement', 'DECK_FAUCET', '--pivot', 'BOTTOM_CENTER',
  ]);

  check('convert chay ra report', existsSync(rep));
  if (existsSync(rep)) {
    const r = JSON.parse(readFileSync(rep, 'utf8'));
    // Geometry that matches the spec sheet exactly must not be rejected.
    check('kich thuoc dung thi CONVERTED', r.status === 'CONVERTED', r.failures);
    const errs = r.dimensionErrorsPct ?? {};
    check(
      'sai so ca ba truc ~ 0%',
      ['width', 'depth', 'height'].every((k) => (errs[k] ?? 99) < 0.01),
      errs
    );
  }

  check('convert xuat ra GLB', existsSync(glb));
  if (existsSync(glb)) {
    // Read the GLB's own POSITION bounds — the number Room Studio will load.
    const buf = readFileSync(glb);
    let off = 12;
    let json: { accessors?: { min?: number[]; max?: number[] }[] } = {};
    while (off < buf.length) {
      const clen = buf.readUInt32LE(off);
      const ctype = buf.readUInt32LE(off + 4);
      off += 8;
      if (ctype === 0x4e4f534a) json = JSON.parse(buf.subarray(off, off + clen).toString('utf8'));
      off += clen;
    }
    const pos = (json.accessors ?? []).find((a) => a.min?.length === 3 && a.max?.length === 3);
    check('GLB co POSITION bounds', !!pos);
    if (pos && pos.min && pos.max) {
      const ext = [0, 1, 2].map((i) => (pos.max![i] - pos.min![i]) * 1000);
      check('GLB: chieu cao nam tren truc Y (Y-up)', Math.abs(ext[1] - H) < 0.5, ext);
      check('GLB: chieu rong nam tren truc X', Math.abs(ext[0] - W) < 0.5, ext);
      check('GLB: chieu sau nam tren truc Z', Math.abs(ext[2] - D) < 0.5, ext);
      // BOTTOM_CENTER: the product sits ON its mounting plane, not through it.
      check('GLB: BOTTOM_CENTER dat day o goc toa do', Math.abs(pos.min[1]) < 1e-4, pos.min);
      check('GLB: can giua theo X', Math.abs(pos.min[0] + pos.max[0]) < 1e-4, pos.min);
    }
  }
  rmSync(tmp, { recursive: true, force: true });

  /* ------------------------------------------- OFFICIAL_VS_FIXTURE (§14) */

  /**
   * A manufacturer's figure and a test constant must never be the same number.
   *
   * The regression fixture above exists to prove the converter maps axes
   * correctly, so its cube has to have three distinguishable edges — and that
   * is all it is. If one of those edges ever equals a dimension a product is
   * judged against, the QA target has quietly acquired a fixture for a source,
   * and the measurement would agree with itself forever.
   *
   * 40 is called out by name because it was that number: it sat in this file
   * as the fixture's width while the TOTO faucet had no published width at
   * all, which is exactly the circumstance in which the two get confused.
   */
  for (const asset of assets) {
    const { width, depth, height } = asset.dimensionsMm;
    check(
      `${asset.sku}: kich thuoc hang khong trung hang so fixture`,
      ![width, depth, height].some((v) => v !== undefined && [W, D, H].includes(v)),
      { official: asset.dimensionsMm, fixture: { W, D, H } }
    );
  }

  const faucet = resolveSku('TLG02301B#BFG');
  check(
    'TLG02301B#BFG: chieu rong la 55 cua catalogue, khong phai 40 cua fixture',
    faucet?.dimensionsMm.width === 55,
    faucet?.dimensionsMm
  );
  check(
    'khong asset nao lay 40mm lam kich thuoc hang',
    assets.every(
      (a) => ![a.dimensionsMm.width, a.dimensionsMm.depth, a.dimensionsMm.height].includes(40)
    )
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
