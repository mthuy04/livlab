/**
 * Writes the per-SKU MAX export handoff.
 *
 *     npm run 3d:handoff -- --sku AC-1017VRN
 *     npm run 3d:handoff            # all registered SKUs
 *
 * Generated rather than hand-written because every number in it — the official
 * dimensions, the expected output filename, the Box url — already exists in the
 * registry, and a README that restates them by hand is a second copy that goes
 * stale the first time one of them is corrected.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, resolveSku, sourceStem, parseArgs, runtimeUrl } from './pipeline';
import { allProduct3DAssets } from '../../lib/room-studio/product3dRegistry';
import type { Product3DAsset } from '../../lib/room-studio/product3dAsset';

/** Where the Windows operator is asked to put things. Theirs, not ours. */
const WIN_DIR = 'C:\\livlab';

function readme(asset: Product3DAsset): string {
  const { width, depth, height } = asset.dimensionsMm;
  const stem = sourceStem(asset);
  const fbx = `${stem}.fbx`;
  const winFbx = `${WIN_DIR}\\${fbx}`;
  const maxName = asset.source.originalFileName;

  return `# ${asset.brand} ${asset.sku} — export .max sang FBX

Tài liệu này dành cho người có **Autodesk 3ds Max trên Windows**. Không cần biết
gì về hệ thống LivLab để làm theo.

Làm một lần cho model này. Sau khi có FBX, phần còn lại LivLab tự chạy.

---

## 1. File nguồn

| | |
|---|---|
| Tên file hãng | \`${maxName}\` |
| Định dạng | ${asset.source.originalFormat} |
| Tải tại | ${asset.source.url ?? '(xem source-info.json)'} |
| Trang sản phẩm | ${asset.source.retrievalMethod ?? '—'} |

File nằm trên Box. Tải bằng trình duyệt — link \`/download\` trực tiếp không
dùng được, nên không script nào tải hộ được.

Tải về đâu cũng được; tài liệu này giả định \`${WIN_DIR}\\${maxName}\`.

## 2. Sản phẩm

| | |
|---|---|
| Mã SKU | **${asset.sku}** |
| Thương hiệu | ${asset.brand} |
| Quan hệ với file | ${asset.identity.relationType}${asset.identity.note ? ` — ${asset.identity.note}` : ''} |
| Kiểu lắp | ${asset.placement.type} |

## 3. Kích thước chính thức của hãng

| | mm |
|---|---|
| Rộng (trái–phải) | **${width}** |
| Sâu (trước–sau) | **${depth}** |
| Cao (sàn–đỉnh) | **${height}** |

Dùng để **đối chiếu sau khi export**, không phải để chỉnh model cho khớp.
Nếu model lệch nhiều so với bảng này, **xin báo lại** thay vì scale cho vừa —
lệch có thể do đơn vị đo, và đó chính là thông tin cần biết.

## 4. Tên file cần xuất ra

\`\`\`
${fbx}
\`\`\`

Đúng tên này. LivLab khớp file với SKU bằng **tên chính xác**; tên khác sẽ
không được xử lý, chứ không đoán.

Đừng đặt \`final.fbx\`, \`export1.fbx\`, \`model-new.fbx\`.

## 5. Các bước trên Windows

1. Mở **Autodesk 3ds Max**.
2. \`File > Open\` → mở \`${maxName}\`.
3. Nếu 3ds Max hỏi về đơn vị hoặc gamma: chọn giữ nguyên của file.
4. \`Scripting > Run Script...\` → chọn \`export_product_to_fbx.ms\`
   (gửi kèm cùng thư mục này).
5. Trước khi chạy, mở script và sửa đúng **một dòng**:

   \`\`\`maxscript
   global OUTPUT_FBX = "${winFbx.replace(/\\/g, '\\\\')}"
   \`\`\`

6. Chạy. Script sẽ dọn camera/đèn/phông, rồi xuất FBX.
7. Xong sẽ hiện hộp thoại báo đường dẫn FBX và file log.

### Một dòng dán thẳng vào MAXScript Listener

Nếu tiện hơn, mở \`Scripting > MAXScript Listener\` và dán:

\`\`\`maxscript
fileIn @"${WIN_DIR}\\export_product_to_fbx.ms"
\`\`\`

(đặt file \`.ms\` vào \`${WIN_DIR}\\\` trước)

## 6. Kết quả mong đợi

\`\`\`
${winFbx}
${WIN_DIR}\\${stem}_export_log.txt
\`\`\`

Gửi lại **cả hai**. File log cho biết script đã xoá những gì và cảnh đo được
bao nhiêu — nếu sau này model sai, đó là chỗ đầu tiên cần xem.

LivLab sẽ đặt FBX vào:

\`\`\`
assets/3d/work/incoming/${fbx}
\`\`\`

rồi chạy \`npm run 3d:convert -- --sku ${asset.sku}\`, cho ra
\`${runtimeUrl(asset)}\`.

## 7. XIN ĐỪNG

- **Đừng scale lại** model cho "trông đúng"
- **Đừng xoay** model cho thẳng hướng
- **Đừng chỉnh pivot** / tâm xoay
- **Đừng di chuyển** model về gốc toạ độ
- **Đừng xoá** chi tiết thuộc về sản phẩm thật (nút bấm, bản lề, logo dập nổi)
- **Đừng sửa vật liệu** cho đẹp hơn

Pivot, hướng và tỷ lệ LivLab tự chuẩn hoá từ số liệu của hãng. Việc của bước
này chỉ là giữ đúng hình học và đúng kích thước gốc.

Một model đã được chỉnh "cho đúng" sẽ **luôn** qua được bước kiểm kích thước,
vì bước đó so mesh với catalogue — và mesh vừa bị sửa cho khớp. Đó là lý do
danh sách trên dài hơn mong đợi.

## 8. Vật liệu và texture

Script đã bật **embed textures**, nên texture nằm luôn trong file FBX.

Nếu 3ds Max báo thiếu texture khi mở file (\`Missing External Files\`):

- **đừng** thay bằng texture khác
- **đừng** bỏ qua rồi export
- chụp màn hình danh sách file thiếu và gửi kèm

Vật liệu sai còn sửa được. Vật liệu bị thay bằng thứ trông giống thì không ai
biết để mà sửa.

## 9. Nếu gặp vấn đề

Báo lại thay vì tự xử lý, nhất là khi:

- cảnh chứa **nhiều hơn một sản phẩm**
- tỷ lệ sai rõ rệt so với bảng mục 3
- thiếu texture
- model vỡ, thủng mặt, hoặc thiếu bộ phận

---

*Tài liệu này sinh tự động từ \`lib/room-studio/product3dRegistry.ts\`.
Sửa số liệu ở đó rồi chạy lại \`npm run 3d:handoff\`, đừng sửa tay file này.*
`;
}

const args = parseArgs(process.argv.slice(2));
const targets =
  typeof args.sku === 'string'
    ? [resolveSku(args.sku)].filter((a): a is Product3DAsset => a !== null)
    : allProduct3DAssets();

if (targets.length === 0) {
  console.error(`Không có bản ghi 3D nào cho SKU "${args.sku}".`);
  process.exit(1);
}

for (const asset of targets) {
  const dir = path.join(ROOT, 'assets/3d/handoff', asset.brand.toLowerCase(), asset.sku);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'EXPORT-README.md');
  writeFileSync(file, readme(asset), 'utf8');
  console.log(`  ${path.relative(ROOT, file)}`);
}

console.log(`\n${targets.length} handoff README đã ghi.`);
console.log('MAXScript: scripts/3d/max/export_product_to_fbx.ms');
