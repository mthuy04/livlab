# Multibrand 3D ingestion — kết quả

Ngày chạy: 2026-10-14 · macOS 26.5.2 arm64

**Kết quả ngắn: 0 sản phẩm đạt READY. Không phải vì chưa thử, mà vì không hãng
nào cung cấp hình học 3D xử lý được trên máy Mac cho đúng SKU trong danh mục
hiện tại.** Chi tiết bên dưới, mỗi kết luận đều có bằng chứng đo được.

---

## 1. Danh mục hiện tại (§1)

Có **hai** danh mục, và sự khác nhau giữa chúng là phát hiện quan trọng nhất
của task này.

| | file | số sản phẩm | dùng ở đâu |
|---|---|---|---|
| Room Studio | `public/data/livlab-seed/livlab_verified_products_master.csv` | 57 | `/room-studio` render từ đây |
| Storefront | `data/demo/tungdang-sanitaryware.json` | 99 | `/products`, registry 3D trỏ vào đây |

### Sản phẩm thuộc 8 hãng mục tiêu, trong danh mục **Room Studio**

| hãng | số sp | ghi chú |
|---|---|---|
| TOTO | 14 | 6 lavabo + 2 bồn cầu có đủ kích thước |
| INAX | 6 | AC-602VN, AC-602VN-2, 4 sen |
| Duravit | 1 | BR4050R1021, tủ chậu |
| COTTO | 1 | CT0062(HM), kệ kính, **thiếu kích thước** |
| Kohler | 0 | |
| American Standard | 0 | |
| GROHE | 0 | |
| Caesar | 0 | |

### Lệch danh mục — cần quyết định

Sáu SKU INAX có nguồn `.max` (**AC-1008VRN, AC-4005VN, AC-2700VN, AC-1135VN,
AC-1035VN, AC-1017VRN**) nằm trong danh mục **storefront**, không nằm trong
danh mục **Room Studio**.

Nghĩa là: kể cả khi FBX về và convert thành công, sáu model đó **vẫn không
hiện trong `/room-studio`**, vì Room Studio đọc file CSV và CSV không có chúng.

Đây là việc phải xử lý trước khi pipeline MAX có giá trị thực tế. Không sửa
trong task này vì nó là quyết định về dữ liệu danh mục, không phải về 3D.

---

## 2. Nguồn đã tìm và kiểm (§100)

| Hãng | SKU | Nguồn | Định dạng | Khớp SKU | Đã tải | Chặn |
|---|---|---|---|---|---|---|
| TOTO | CS838DT10 | vn.toto.com (chính hãng) | DWG | tên file chứa SKU | ✓ 386.6 KB | **SOURCE_NOT_3D** |
| TOTO | MS636DT8 | vn.toto.com (chính hãng) | DWG | tên file chứa SKU | ✓ 1.14 MB | **SOURCE_NOT_3D** |
| INAX | 6 SKU | inax.com.vn → Box | MAX | tên file đúng SKU | ✗ Box chặn | **MAX_EXPORT_REQUIRED** |
| Duravit | BR4050R1021 | pro.duravit (Revit/DWG) | RFA/DWG | không mở được trang SP | ✗ | **RFA_CONVERSION_BLOCKED_ON_MAC** + **AUTH_REQUIRED** |
| COTTO | CT0062(HM) | — | — | — | ✗ | **SOURCE_NOT_FOUND** (và sp thiếu kích thước) |

### TOTO DWG — đo, không đoán (§67)

Nhãn "CAD" của hãng **không** đồng nghĩa với model 3D. Đã tải về và đếm thực
thể bằng LibreDWG:

```
CAD_CS838D_Rv02.dwg  [AC1027]   3D: 0   2D: 3655  -> TWO_D_DRAWING_ONLY
CAD_MS636_Rv09.dwg   [AC1015]   3D: 0   2D: 6824  -> TWO_D_DRAWING_ONLY
```

Toàn bộ là `LINE`, `ARC`, `SPLINE`, `ELLIPSE`, `VERTEX_2D`, `POLYLINE_2D`,
`MTEXT` và các thực thể kích thước. Không có một `3DSOLID`, `MESH`, `BODY`,
`REGION` hay `SURFACE` nào.

> `SOLID` trong DWG là tam giác/tứ giác **tô đặc 2D**, không phải khối 3D —
> khối 3D là `3DSOLID`. Nhầm hai cái này là cách dễ nhất để kết luận một bản
> vẽ là một model.

Công cụ kiểm: `npm run 3d:inspect-dwg -- <file.dwg>`

### Vì sao không tìm thêm được định dạng khác

Bộ scraper sẵn có (`scripts/enrich_manufacturer_assets.py`) **đã** bắt các đuôi
`.fbx .obj .glb .gltf .skp .3ds .dae .ifc .rvt .rfa .step .igs .stl` và đã chạy
qua **312 URL vn.toto.com, 246 URL inax.com.vn, 40 URL jomoo.vn**.

Toàn bộ đuôi file nó tìm thấy:

```
png 617 · jpg 234 · pdf 37 · dwg 8 · jpeg 10 · webp 5
```

Không có một file 3D nào ngoài `.max` trên Box. Đây là bằng chứng phủ định có
giá trị: không phải "chưa tìm thấy", mà là "đã quét và không có".

---

## 3. Toolchain macOS (§105)

| | |
|---|---|
| macOS | 26.5.2, arm64 |
| 3ds Max | không có (sản phẩm chỉ chạy Windows) |
| Blender | **không cài** — đúng §18: không có FBX/OBJ nào để convert |
| LibreDWG | **0.14** (vừa cài, để kiểm DWG 2D/3D) |
| @gltf-transform/core | 4.4.1 |
| @gltf-transform/cli | không cài (core đủ cho inspect/validate) |
| assimp / IfcOpenShell | không có |

Định dạng gặp mà không xử lý được: `MAX` (cần Windows), `RFA` (cần Revit),
`DWG 2D` (không phải hình học 3D).

---

## 4. Kết quả (§107)

```
Exact manufacturer sources found:  8   (6 MAX + 2 DWG)
Sources downloaded:                2   (2 DWG)
Successfully converted GLBs:       0
QA_REQUIRED:                       0
3D VERIFIED / READY:               0
```

Categories covered: **không có**
Brands covered: **không có**

### Vì sao từng ứng viên trượt (§106)

| Blocker | Số SKU | Chi tiết |
|---|---|---|
| `SOURCE_NOT_3D` | 2 | DWG của TOTO là bản vẽ 2D — đã đếm thực thể, 0 thực thể 3D |
| `MAX_EXPORT_REQUIRED` | 6 | INAX `.max` trên Box, cần 3ds Max trên Windows |
| `RFA_CONVERSION_BLOCKED_ON_MAC` | 1 | Duravit chỉ có Revit/DWG |
| `AUTH_REQUIRED` | 1 | pro.duravit cần đăng ký |
| `SOURCE_NOT_FOUND` | ~14 | TOTO lavabo/vòi, INAX sen, COTTO — hãng không công bố 3D |

Không có SKU nào trượt vì `DIMENSION_MISMATCH`, `MATERIAL_ISSUE`,
`PERFORMANCE_ISSUE` hay `IDENTITY_ISSUE` — chưa SKU nào đi được xa đến mức đó.

---

## 5. Trạng thái Room Studio — không đổi

```
Product3DAsset READY:     0
roomStudioReady:          0
3D VERIFIED hiển thị:     0
Sản phẩm đặt được:       19  (khối đúng kích thước)
lavabo.glb dùng chung:    vẫn tắt
```

Đúng như §35/§52: không có model nào thì giữ placeholder, không mượn hình
tương tự, không gắn nhãn sai.

---

## 6. Hai việc chặn thật, theo thứ tự giá trị

**1. Export `.max` → FBX trên Windows.** Mở khoá 6 SKU INAX. Mọi bước sau đã
sẵn sàng và đã kiểm bằng model tổng hợp. Xem
`assets/3d/handoff/inax/<SKU>/EXPORT-README.md`.

**2. Hợp nhất danh mục.** Kể cả khi (1) xong, sáu SKU đó vẫn không hiện trong
Room Studio cho tới khi chúng có mặt trong danh mục mà Room Studio đọc.

Nếu muốn nhanh hơn cả hai: chọn một SKU **đang có trong CSV** và hỏi thẳng hãng
xin file 3D. INAX AC-602VN là ứng viên tốt nhất — bồn cầu, kích thước đầy đủ
(720 × 372 × 740 mm), đang dùng trong demo.
