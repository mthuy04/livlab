# INAX — yêu cầu export 6 model 3D sang FBX

Tài liệu này dành cho người dùng **Autodesk 3ds Max**. Không cần biết gì về hệ
thống của LivLab để làm theo.

---

## Việc cần làm, nói ngắn

INAX có công bố file 3D chính hãng (`.max`) cho 6 model bồn cầu dưới đây.
Chúng tôi không mở được file `.max` — định dạng này cần 3ds Max.

Mong anh/chị mở từng file và **export sang FBX**, giữ nguyên hình học và kích
thước gốc. Chỉ vậy thôi.

Những việc như chỉnh tâm xoay, xoay cho đúng hướng, hay chỉnh tỷ lệ cho khớp
phòng — **xin đừng làm**. Chúng tôi sẽ tự xử lý sau khi nhận file. Nếu người
export chỉnh "cho trông đúng", chúng tôi mất khả năng kiểm tra xem model có
đúng kích thước thật hay không, và đó chính là thứ cần kiểm.

---

## Sáu model

Xếp theo thứ tự ưu tiên. Nếu không làm hết được, làm từ trên xuống.

| # | Model | File nguồn | Dung lượng | Tên file cần xuất ra |
|---|---|---|---|---|
| 1 | AC-1017VRN | `AC-1017VRN.max` | 1.0 MB | `inax_ac-1017vrn_source.fbx` |
| 2 | AC-1008VRN | `AC-1008VRN.max` | 0.9 MB | `inax_ac-1008vrn_source.fbx` |
| 3 | AC-1035VN | `AC-1035VN.max` | 1.3 MB | `inax_ac-1035vn_source.fbx` |
| 4 | AC-1135VN | `AC-1135VN.max` | 1.2 MB | `inax_ac-1135vn_source.fbx` |
| 5 | AC-2700VN | `AC-2700VN.max` | 0.4 MB | `inax_ac-2700vn_source.fbx` |
| 6 | AC-4005VN | `4_-_AC_-_4005VN_-_FN.max` | 11.3 MB | `inax_ac-4005vn_source.fbx` |

Link tải từng file nằm trong `source-info.json` ở thư mục của từng model, và
cũng được ghi trong `EXPORT-INSTRUCTIONS.txt` kèm theo.

> **AC-4005VN nặng 11.3 MB**, gấp khoảng mười lần năm file kia. Có thể cảnh
> chứa nhiều hơn một sản phẩm, hoặc có texture nặng. Nếu mở ra thấy vậy, xin
> báo lại trước khi export — chúng tôi cần biết file gốc thực sự chứa gì.

---

## Kích thước chính thức của hãng

Dùng bảng này để **đối chiếu sau khi export**, không phải để chỉnh model cho
khớp.

| Model | Sâu (trước–sau) | Rộng (trái–phải) | Cao (sàn–đỉnh) |
|---|---|---|---|
| AC-1008VRN | 805 mm | 400 mm | 588 mm |
| AC-4005VN | 780 mm | 518 mm | 623 mm |
| AC-2700VN | 810 mm | 424 mm | 642 mm |
| AC-1135VN | 809 mm | 475 mm | 615 mm |
| AC-1035VN | 809 mm | 475 mm | 615 mm |
| AC-1017VRN | 805 mm | 400 mm | 588 mm |

Nếu model sau khi export lệch nhiều so với bảng này, **xin báo lại** thay vì
scale cho vừa. Lệch có thể do đơn vị đo, và đó là thông tin chúng tôi cần.

---

## Yêu cầu export

**Định dạng:** FBX

**Đơn vị:** milimét (mm).
Nếu 3ds Max của anh/chị đang để đơn vị khác và đổi không tiện, cứ export rồi
**ghi rõ đơn vị đang dùng** vào email hoặc một file text kèm theo. Đơn vị nào
cũng được, miễn là nói rõ. Thứ duy nhất không xử lý được là đơn vị không rõ.

**Texture:** bật *embed media* nếu 3ds Max cho phép. Nếu không, gửi kèm thư
mục texture.

### Giữ lại

- Toàn bộ hình học sản phẩm: thân sứ, nắp, két nước, nút xả, chi tiết mạ
- Vật liệu và texture gốc của hãng
- Các chi tiết nhỏ thuộc về sản phẩm thật: nút bấm, bản lề, logo dập nổi

### Xoá đi

- Camera
- Đèn trong cảnh
- Sàn, tường, phông nền, đạo cụ trang trí
- Helper, dummy, lưới tham chiếu
- Ghi chú, đường kích thước, chữ trong cảnh

### Xin đừng

- **Đừng scale lại** model cho "trông đúng"
- **Đừng xoay** model cho thẳng hướng
- **Đừng chỉnh pivot** / tâm xoay
- **Đừng xoá** chi tiết thuộc về sản phẩm thật

Ba việc pivot, hướng và tỷ lệ chúng tôi tự chuẩn hoá. Việc của bước này chỉ là
giữ đúng hình học và đúng kích thước gốc của hãng.

---

## Đặt tên file

Đúng theo cột cuối của bảng trên:

```
inax_ac-1017vrn_source.fbx
inax_ac-1008vrn_source.fbx
inax_ac-1035vn_source.fbx
inax_ac-1135vn_source.fbx
inax_ac-2700vn_source.fbx
inax_ac-4005vn_source.fbx
```

Xin đừng đặt `final.fbx`, `export1.fbx`, `model-new.fbx`. Sáu file trông giống
nhau, và tên là thứ duy nhất phân biệt được chúng về sau.

---

## Gửi lại

Mỗi model một file FBX (kèm thư mục texture nếu không embed được), cộng một
dòng ghi đơn vị đo nếu không phải mm.

Nếu mở file `.max` mà gặp vấn đề — thiếu texture, tỷ lệ sai rõ rệt, nhiều sản
phẩm trong một cảnh — xin báo lại thay vì tự xử lý.

---

## Tin nhắn ngắn để chuyển tiếp

> Anh/chị ơi, bên em đã tìm được file 3D Max chính hãng của INAX cho 6 model
> AC-1008VRN, AC-4005VN, AC-2700VN, AC-1135VN, AC-1035VN và AC-1017VRN. Nếu bên
> mình có máy/nhân sự dùng 3ds Max, anh/chị hỗ trợ export giúp bên em từng model
> sang FBX, giữ nguyên kích thước và vật liệu gốc, không scale lại theo cảm
> quan. Nếu có thể, vui lòng để đơn vị mm và gửi kèm texture nếu FBX không embed
> được. Bên em sẽ tự chuẩn hoá pivot, hướng, vật liệu và convert tiếp sang GLB
> cho Room Studio.

---

## Phần dành cho người trong dự án

File `.max` **không tải tự động được**. Box phục vụ một trang xem bằng
JavaScript; đường dẫn `/download` trả 404 cho client ẩn danh. Không có nỗ lực
nào lách hạn chế đó, nên trạng thái là `DOWNLOAD_MANUAL_REQUIRED` và link chia
sẻ đã xác minh được giữ nguyên trong `source-info.json`.

Sau khi FBX về, quy trình chuẩn hoá nằm ở `lib/room-studio/fbxIngestion.ts`.
Không ai cần cài Blender trước khi có file FBX đầu tiên.
