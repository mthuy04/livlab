# Asset thật đầu tiên — INAX AC-1017VRN

Trạng thái: **WAITING_FOR_FBX**

Đây là danh sách kiểm cho model sản phẩm thật đầu tiên đi qua Room Studio.
Nó **không** làm cho AC-1017VRN sẵn sàng. Registry vẫn giữ SKU này ở
`SOURCE_VERIFIED`, và `isRoomStudioReady()` vẫn trả về `false` cho đến khi có
người xác nhận từng mục bên dưới trên một file có thật.

---

## Vì sao là SKU này

Ưu tiên 1 trong `assets/3d/handoff/inax/INAX-3D-EXPORT-HANDOFF.md`: nó xuất
hiện trong concept, và hình học bồn cầu hai khối là thứ đơn giản nhất để nhìn
ra sai hướng hoặc sai tỷ lệ bằng mắt.

## Số liệu của hãng

| | mm |
|---|---|
| Rộng (X, trái–phải) | **400** |
| Sâu (Z, trước–sau) | **805** |
| Cao (Y, sàn–đỉnh) | **588** |

> **Không nhầm với fixture kiểm thử.** Fixture dev là `400 × 800 × 600` — số
> tròn, cố ý. AC-1017VRN là `400 × 805 × 588`. Hai con số gần nhau đủ để một
> người mệt đọc nhầm, và đó chính là lý do fixture không bao giờ được đặt tên
> theo một SKU.

## Hợp đồng đặt trong phòng

| | |
|---|---|
| `placement.type` | `FLOOR_TOILET` |
| `placement.pivot` | `BACK_CENTER_FLOOR` |
| Hướng trước | `+Z` |
| Mặt lắp đặt | `-Z` |
| Đơn vị | 1 unit = 1 mét |
| Trục đứng | `+Y` |

Trong hệ toạ độ cục bộ của file, đúng hợp đồng nghĩa là:
`x ∈ [-0.200, 0.200]`, `y ∈ [0, 0.588]`, `z ∈ [0, 0.805]`.

`public/dev-assets/3d/test-fixture.glb` là bản mẫu của hình dạng đó —
sinh ra bởi `scripts/build_dev_test_glb.mjs`, đã chứng minh chạy đúng qua
đường render thật tại `/dev/room-studio-3d-test`.

---

## Khi FBX về

1. Đặt file vào `assets/3d/received/inax/ac-1017vrn/` — **không** ghi đè nguồn.
2. Ghi lại đơn vị người export khai báo. Không có thì `inferUnitScale()` đoán,
   và kết quả phải được đánh dấu là đoán.
3. Chạy 12 bước trong `lib/room-studio/fbxIngestion.ts` (`NORMALISATION_STEPS`).
4. Xuất `public/assets/3d/inax/ac-1017vrn/inax_ac-1017vrn_master.glb`.
5. Đo bằng `scripts/lib/glbMetrics.mjs` — cùng thước đo đã dùng cho fixture.

## Bảy mục QA phải tự tay xác nhận

Đây là `QA_CHECKS` trong `lib/room-studio/product3dAsset.ts`. `isRoomStudioReady()`
yêu cầu **cả bảy** cùng `status === 'READY'` và có `runtime.glbUrl`.

- [ ] `identityVerified` — file này đúng là AC-1017VRN, không phải model cùng họ
- [ ] `dimensionsVerified` — bbox khớp 400 × 805 × 588, sai số ≤ 2%
- [ ] `scaleVerified` — một hệ số duy nhất cho cả ba trục; ba hệ số khác nhau là
      `DIMENSION_MISMATCH`, không phải việc cần scale
- [ ] `pivotVerified` — gốc toạ độ ở back-center-floor
- [ ] `orientationVerified` — mặt trước hướng `+Z`
- [ ] `materialsVerified` — PBR, sứ trắng không bị ép thành be, mạ là kim loại
- [ ] `performanceVerified` — trong ngưỡng `PERFORMANCE_TARGETS` của danh mục

## Kiểm tại chỗ, trong phòng thật

Dùng `/dev/room-studio-3d-test` trước khi đăng ký vào registry: đổi đường dẫn
trong `devTestAsset.ts` sang file mới là cả bảng QA chạy lại trên hình học thật.

- [ ] Đáy chạm sàn: `0 mm`
- [ ] Mặt sau cách tường trong `20 mm` (CLEARANCE)
- [ ] Xoay 0 / 90 / 180 / 270° không làm hỏng vị trí
- [ ] Chọn / bỏ chọn / kéo hoạt động
- [ ] Hệ số scale runtime ≈ `1.0` nếu file xuất ở mét

## Chỉ sau đó mới đăng ký

Trong `lib/room-studio/product3dRegistry.ts`, bản ghi
`demo:tungdang:INAX:AC1017VRN` đổi sang:

```
status: 'READY'
runtime: { glbUrl: '/assets/3d/inax/ac-1017vrn/inax_ac-1017vrn_master.glb', ... }
qa: cả bảy cờ true
```

Lúc đó — và chỉ lúc đó — thẻ sản phẩm tự đổi từ `ĐÚNG KÍCH THƯỚC` sang
`3D VERIFIED`, và scene thay khối kích thước bằng model thật. Không có đoạn mã
nào phải sửa: đó là điều `/dev/room-studio-3d-test` đã chứng minh.
