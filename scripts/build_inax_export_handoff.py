#!/usr/bin/env python3
"""
Builds the 3ds Max export handoff for the six INAX pilot SKUs.

The source files are .max on Box. Box serves a JavaScript viewer rather than
the file, and its `/download` path 404s to an anonymous client, so the files
cannot be fetched here and no attempt is made to work around that. The handoff
therefore carries the verified share URL and asks a person with 3ds Max to do
the one step this environment cannot.

What the operator is asked for is deliberately narrow: the product geometry at
its original scale, in a stated unit. Not a pivot, not an orientation, not a
"looks about right" rescale — those are normalisation steps LivLab performs
afterwards, and an operator eyeballing them is how a 400mm toilet becomes a
380mm toilet that nobody can trace.

    python3 scripts/build_inax_export_handoff.py
"""

import json
import os
import re
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets/3d/handoff/inax')
AUDIT = os.path.join(ROOT, 'data/demo/manufacturer-3d-source-audit.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 LivLab-asset-audit'

# Manufacturer figures, from INAX documentation. The mesh is checked against
# these; they are never read back off the mesh.
#
# INAX states D x W x H. Room Studio is Y-up with X = width (left-to-right),
# Y = height (floor-to-top) and Z = depth (front-to-back), so the mapping is
# direct and is spelled out here because transposing width and depth on a
# toilet produces a model that fits the room and faces the wrong way.
OFFICIAL_DIMENSIONS_MM = {
    'AC-1008VRN': {'depth': 805, 'width': 400, 'height': 588},
    'AC-4005VN':  {'depth': 780, 'width': 518, 'height': 623},
    'AC-2700VN':  {'depth': 810, 'width': 424, 'height': 642},
    'AC-1135VN':  {'depth': 809, 'width': 475, 'height': 615},
    'AC-1035VN':  {'depth': 809, 'width': 475, 'height': 615},
    'AC-1017VRN': {'depth': 805, 'width': 400, 'height': 588},
}

# Order of work when the files come back. Concept usage first, because a model
# nobody can place anywhere proves nothing; then the simplest geometry, because
# the first conversion is validating the pipeline rather than the product.
PRIORITY = ['AC-1017VRN', 'AC-1008VRN', 'AC-1035VN', 'AC-1135VN', 'AC-2700VN', 'AC-4005VN']

EXPORT_INSTRUCTIONS = """INAX {sku} — yêu cầu export từ 3ds Max
================================================================

FILE NGUỒN
  Tên file hãng : {filename}
  Tải tại       : {source_url}
  Trang sản phẩm: {product_url}

CẦN XUẤT RA
  Tên file      : {output_name}
  Định dạng     : FBX
  Đơn vị        : milimét (mm) — nếu dùng đơn vị khác, ghi rõ vào file kèm theo

KÍCH THƯỚC CHÍNH THỨC CỦA HÃNG (để đối chiếu sau khi export)
  Sâu  (trước–sau) : {depth} mm
  Rộng (trái–phải) : {width} mm
  Cao  (sàn–đỉnh)  : {height} mm

GIỮ LẠI
  - Toàn bộ hình học của sản phẩm: thân sứ, nắp, két, nút xả, chi tiết mạ
  - Vật liệu và texture gốc
    (nếu FBX không nhúng được texture, gửi kèm thư mục texture)

XOÁ ĐI
  - Camera
  - Đèn trong cảnh
  - Sàn, tường, phông nền, đạo cụ
  - Đối tượng trợ giúp (helper, dummy), lưới tham chiếu
  - Ghi chú, kích thước, chữ trong cảnh

KHÔNG LÀM
  - KHÔNG scale lại model cho "trông đúng". Giữ nguyên tỷ lệ gốc của file hãng.
  - KHÔNG xoay model cho thẳng hướng.
  - KHÔNG chỉnh pivot / tâm xoay.
  - KHÔNG xoá chi tiết thuộc về sản phẩm thật (nút bấm, bản lề, logo dập nổi).

  Ba việc pivot / hướng / tỷ lệ thế giới do bên em tự chuẩn hoá sau khi nhận
  file. Việc của bước này chỉ là giữ đúng hình học và đúng kích thước gốc.

NẾU CÓ VẤN ĐỀ
  Nếu file .max mở ra mà thiếu texture, sai tỷ lệ rõ rệt, hoặc chứa nhiều sản
  phẩm trong một cảnh — xin báo lại thay vì tự xử lý. Bên em cần biết file gốc
  thực sự chứa gì.
"""


def fetch_share_metadata(url, timeout=45):
    """Filename and byte size from the Box share page, when it states them."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(400_000).decode('utf-8', 'ignore')
    except Exception as err:
        return None, None, f'FETCH_FAILED: {type(err).__name__}'

    name = None
    for m in re.findall(r'"name"\s*:\s*"([^"]{3,120})"', body):
        if re.search(r'\.(max|zip|rar|fbx|obj)$', m, re.I):
            name = m
            break

    size = None
    m = re.search(r'"size"\s*:\s*(\d{4,})', body)
    if m:
        size = int(m.group(1))

    return name, size, 'FROM_SHARE_PAGE'


def main():
    audit = json.load(open(AUDIT, encoding='utf-8'))
    rows = {}
    for entry in audit.get('activeCatalog', []):
        for r in entry.get('rows', []):
            if r.get('sectionType') == 'THREE_D' and r.get('present'):
                rows[entry['sku']] = {'url': r['url'], 'file': r.get('actualFileName'),
                                      'page': entry['manufacturerUrl']}

    os.makedirs(OUT_DIR, exist_ok=True)
    summary = []

    for order, sku in enumerate(PRIORITY, start=1):
        src = rows.get(sku)
        if not src:
            print(f"  {sku}: khong co trong audit — bo qua")
            continue

        name, size, how = fetch_share_metadata(src['url'])
        time.sleep(0.6)
        filename = name or src['file'] or f'{sku}.max'
        dims = OFFICIAL_DIMENSIONS_MM[sku]
        output_name = f"inax_{sku.lower()}_source.fbx"

        sku_dir = os.path.join(OUT_DIR, sku)
        os.makedirs(sku_dir, exist_ok=True)

        info = {
            'brand': 'INAX',
            'sku': sku,
            'sourceFormat': 'MAX',
            'sourceFileName': filename,
            'sourceFileSizeBytes': size,
            'sourceUrl': src['url'],
            # §37: the Box id is opaque and can be re-issued. The product page
            # is what ties this file to the SKU, so both are kept.
            'manufacturerProductUrl': src['page'],
            'officialDimensionsMm': dims,
            'dimensionAxisNote': 'INAX ghi D x W x H. depth = trước–sau, width = trái–phải, height = sàn–đỉnh.',
            'requestedExport': 'FBX',
            'requestedOutputFileName': output_name,
            'preferredUnits': 'millimeters',
            'downloadState': 'DOWNLOAD_MANUAL_REQUIRED',
            'downloadNote': 'Box trả về trang xem bằng JavaScript; /download trả 404 cho client ẩn danh. Không lách hạn chế truy cập.',
            'exportPriority': order,
        }
        with open(os.path.join(sku_dir, 'source-info.json'), 'w', encoding='utf-8') as f:
            json.dump(info, f, ensure_ascii=False, indent=2)
            f.write('\n')

        with open(os.path.join(sku_dir, 'EXPORT-INSTRUCTIONS.txt'), 'w', encoding='utf-8') as f:
            f.write(EXPORT_INSTRUCTIONS.format(
                sku=sku, filename=filename, source_url=src['url'], product_url=src['page'],
                output_name=output_name, **dims))

        mb = f"{size/1_048_576:.1f}MB" if size else "?"
        print(f"  {order}. {sku:12} {filename[:28]:28} {mb:>8}  -> {output_name}")
        summary.append(info)

    with open(os.path.join(OUT_DIR, 'handoff-manifest.json'), 'w', encoding='utf-8') as f:
        json.dump({'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                   'brand': 'INAX', 'skuCount': len(summary), 'items': summary},
                  f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"\nda ghi {os.path.relpath(OUT_DIR, ROOT)}/ ({len(summary)} SKU)")


if __name__ == '__main__':
    main()
