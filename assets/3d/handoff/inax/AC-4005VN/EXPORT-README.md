# INAX AC-4005VN — export .max sang FBX

Tài liệu này dành cho người có **Autodesk 3ds Max trên Windows**. Không cần biết
gì về hệ thống LivLab để làm theo.

Làm một lần cho model này. Sau khi có FBX, phần còn lại LivLab tự chạy.

---

## 1. File nguồn

| | |
|---|---|
| Tên file hãng | `4_-_AC_-_4005VN_-_FN.max` |
| Định dạng | MAX |
| Tải tại | https://app.box.com/s/rcqxfbjkj9ltkrlm5vviy6jjzfokfzf1 |
| Trang sản phẩm | Mục "3D Max Files" trên https://www.inax.com.vn/products/toilet/ac-4005vn/ |

File nằm trên Box. Tải bằng trình duyệt — link `/download` trực tiếp không
dùng được, nên không script nào tải hộ được.

Tải về đâu cũng được; tài liệu này giả định `C:\livlab\4_-_AC_-_4005VN_-_FN.max`.

## 2. Sản phẩm

| | |
|---|---|
| Mã SKU | **AC-4005VN** |
| Thương hiệu | INAX |
| Quan hệ với file | EXACT_PRODUCT — Tên file hãng đặt chứa đúng SKU thương mại. |
| Kiểu lắp | FLOOR_TOILET |

## 3. Kích thước chính thức của hãng

| | mm |
|---|---|
| Rộng (trái–phải) | **518** |
| Sâu (trước–sau) | **780** |
| Cao (sàn–đỉnh) | **623** |

Dùng để **đối chiếu sau khi export**, không phải để chỉnh model cho khớp.
Nếu model lệch nhiều so với bảng này, **xin báo lại** thay vì scale cho vừa —
lệch có thể do đơn vị đo, và đó chính là thông tin cần biết.

## 4. Tên file cần xuất ra

```
inax_ac-4005vn_source.fbx
```

Đúng tên này. LivLab khớp file với SKU bằng **tên chính xác**; tên khác sẽ
không được xử lý, chứ không đoán.

Đừng đặt `final.fbx`, `export1.fbx`, `model-new.fbx`.

## 5. Các bước trên Windows

1. Mở **Autodesk 3ds Max**.
2. `File > Open` → mở `4_-_AC_-_4005VN_-_FN.max`.
3. Nếu 3ds Max hỏi về đơn vị hoặc gamma: chọn giữ nguyên của file.
4. `Scripting > Run Script...` → chọn `export_product_to_fbx.ms`
   (gửi kèm cùng thư mục này).
5. Trước khi chạy, mở script và sửa đúng **một dòng**:

   ```maxscript
   global OUTPUT_FBX = "C:\\livlab\\inax_ac-4005vn_source.fbx"
   ```

6. Chạy. Script sẽ dọn camera/đèn/phông, rồi xuất FBX.
7. Xong sẽ hiện hộp thoại báo đường dẫn FBX và file log.

### Một dòng dán thẳng vào MAXScript Listener

Nếu tiện hơn, mở `Scripting > MAXScript Listener` và dán:

```maxscript
fileIn @"C:\livlab\export_product_to_fbx.ms"
```

(đặt file `.ms` vào `C:\livlab\` trước)

## 6. Kết quả mong đợi

```
C:\livlab\inax_ac-4005vn_source.fbx
C:\livlab\inax_ac-4005vn_source_export_log.txt
```

Gửi lại **cả hai**. File log cho biết script đã xoá những gì và cảnh đo được
bao nhiêu — nếu sau này model sai, đó là chỗ đầu tiên cần xem.

LivLab sẽ đặt FBX vào:

```
assets/3d/work/incoming/inax_ac-4005vn_source.fbx
```

rồi chạy `npm run 3d:convert -- --sku AC-4005VN`, cho ra
`/assets/3d/inax/ac-4005vn/v1/runtime.glb`.

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

Nếu 3ds Max báo thiếu texture khi mở file (`Missing External Files`):

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

*Tài liệu này sinh tự động từ `lib/room-studio/product3dRegistry.ts`.
Sửa số liệu ở đó rồi chạy lại `npm run 3d:handoff`, đừng sửa tay file này.*
