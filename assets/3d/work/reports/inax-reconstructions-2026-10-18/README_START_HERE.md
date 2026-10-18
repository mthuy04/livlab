# LivLab INAX — 5 sản phẩm GLB (18/10/2026)

Bộ asset này để **Claude Code tích hợp vào repo LivLab Room Studio**, chưa được đẩy lên repository hay triển khai.

## Sản phẩm

| SKU | Mẫu | Web | High | Định vị |
|---|---|---|---|---|
| AC-1017VRN | Bồn cầu một khối | `public/models/inax/AC-1017VRN/AC-1017VRN_web.glb` | `_high.glb` | Sàn, mặt sau Z=0 |
| AC-912VN | Bồn cầu một khối | `public/models/inax/AC-912VN/AC-912VN_web.glb` | `_high.glb` | Sàn, mặt sau Z=0 |
| BF-1656V | Bồn tắm đặt sàn | `public/models/inax/BF-1656V/BF-1656V_web.glb` | `_high.glb` | Sàn, chiều dài theo X |
| BFV-70S | Sen cây nóng lạnh | `public/models/inax/BFV-70S/BFV-70S_web.glb` | `_high.glb` | Tường, origin tại tâm bộ trộn |
| L-293V | Lavabo + vòi minh họa | `public/models/inax/L-293V/L-293V_web.glb` | `_high.glb` | Mặt bàn, origin dưới thân chậu |

**L-293V bổ sung** `L-293V_basin_only.glb` để ghép vòi riêng. Bản lavabo có vòi chứa vòi minh họa, kích thước vòi chưa được xác minh.

## Cần làm trong repo

1. Giải nén ZIP vào root repository. Các đường dẫn `public/models/inax/...` được thiết kế cho Next.js.
2. Đọc `product-catalog.json` và `CLAUDE_ROOM_STUDIO_INTEGRATION_PROMPT.md`.
3. Map 5 SKU vào hệ thống data hiện tại; không tạo sản phẩm trùng hoặc thay ảnh sản phẩm thật bằng preview render trừ khi được yêu cầu.
4. Dùng bản `web` cho Room Studio, và `high` chỉ cho viewer riêng (nếu phù hợp cấu hình).
5. Giữ nguyên tỷ lệ 1:1 theo mét. Không scale theo số pixel hoặc auto fit để làm bằng nhau.
6. Sửa category / mounting: toilet và bathtub trên sàn, shower gắn tường, lavabo snap lên countertop (kiểm tra offset thực tế).
7. Kiểm thử bằng room thực tế: orientation, scale, collision, shadows, chrome PBR (cần environment/HDRI để phản xạ).

## Cảnh báo bắt buộc

- Đây là mô hình tham số tái tạo từ ảnh/bản vẽ, **không phải 3D chính hãng hoặc CAD sản xuất**.
- Đã đọc lại GLB bằng Trimesh; **chưa xác nhận runtime bằng Babylon.js/Three.js trong repo thật**.
- `AC-1017VRN` trong package đã được chuyển hình học từ -Z sang +Z forward để đồng nhất với các mẫu khác. Không xoay thêm 180 độ theo lời hướng dẫn cũ.
- `BFV-70S` có min Y âm vì root là tâm bộ trộn; cần đặt y của root tại cao độ lắp bộ trộn trên tường, không đặt y=0 ở sàn.
- `BF-1656V` dài theo X và rộng theo Z; đó là chủ ý, không phải bị xoay.
- `L-293V` chiều cao 155 mm **chỉ tính thân chậu**; bản GLB kèm vòi cao hơn (~278,75 mm).
- Không cho phép download/commercial use claim từ CAD hãng khi chưa có giấy phép; bộ này không dùng CAD hãng.

Xem `product-catalog.json` để lấy `modelUrl`, kích thước và cách đặt đúng cho từng SKU.
