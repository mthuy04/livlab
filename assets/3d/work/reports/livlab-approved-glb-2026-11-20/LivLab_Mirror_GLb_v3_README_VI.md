# LIVLAB — 3D Mirror Assets / Phase 1 — 3 SKU

**Đây là 3 file GLB thật (.glb), do ChatGPT tái dựng từ thông số và hình ảnh tham khảo.**
**KHÔNG phải file CAD/3D được hãng cung cấp hoặc phê duyệt.** Không tuyên bố đã đạt mức giống thực tế 90%; tỷ lệ đó cần kiểm chứng bằng CAD gốc / đo vật thật và thử trong LivLab.

## Bàn giao

| File GLB | SKU | Kích thước W × H × D | Đặc trưng |
|---|---|---|---|
| `glb/INAX_KF-6075VAR.glb` | INAX KF-6075VAR | 610 × 760 × 5 mm | Gương tráng bạc KHÔNG KHUNG, đỉnh vòm cung tròn thấp; phần thẳng tới xấp xỉ 639 mm |
| `glb/INAX_KF-6090VA.glb` | INAX KF-6090VA | 610 × 910 × 5 mm | Gương tráng bạc KHÔNG KHUNG, hình chữ nhật với góc mài nhỏ |
| `glb/KOHLER_K-30638-CPL.glb` | KOHLER K-30638-CPL | 508 × 813 × 35 mm | Gương vòm có KHUNG KIM LOẠI Polished Chrome (CPL) |

### Link hãng và nguồn đối chiếu

- **INAX KF-6075VAR:** https://www.inax.com.vn/vi/products/accessories/guong-treo-tuong-nha-tam-kf-6075var/ ; ảnh chính hãng https://www.inax.com.vn/wp-content/uploads/2026/09/KF-6075VAR.png ; bản vẽ kích thước công khai https://hailinh.com.vn/guong-nha-tam-inax/guong-inax-kf-6075var-116.html
- **INAX KF-6090VA:** https://www.inax.com.vn/vi/products/accessories/guong-treo-tuong-nha-tam-kf-6090va/ ; ảnh chính hãng https://www.inax.com.vn/wp-content/uploads/2026/09/KF-6090VA.png ; bản vẽ công khai https://www.tdm.vn/guong-lavabo-inax-kf-6090va.html
- **KOHLER K-30638-CPL:** https://www.kohler.com/en/products/mirrors-and-medicine-cabinets/shop-mirrors-and-medicine-cabinets/essential-20-x-32-arched-framed-mirror-30638?skuId=30638-CPL ; ảnh https://kohler.scene7.com/is/image/PAWEB/30638-CPL_ISO_d2c0144770_rgb ; PDF kỹ thuật hãng https://techcomm.kohler.com/techcomm/pdf/K-30638_spec_US-CA_Kohler_en.pdf

**Không phân phối lại ảnh gốc/CAD của hãng** trong gói zip. Các ảnh PNG đi kèm đều được dựng trực tiếp từ hình học GLB mới với môi trường studio mô phỏng.

## Hình học và chất liệu

- Các GLB dùng **1 đơn vị = 1 mét**, **+Y lên**, **+Z là phía trước gương**, trục X ngang. Tâm đáy = (0,0,0). Mặt tựa tường ở Z = 0, phía trước ở Z = độ dày.
- **MIRROR_FACE__SILVERED_GLASS__ENVIRONMENT_REQUIRED**: mặt phản chiếu bạc trung tính (R/G/B gần như bằng nhau), `metallicFactor=1`, `roughnessFactor=0.012`; không phải nhựa xám hoặc mặt kính màu xanh. Đây là *proxy phản xạ trực tiếp* của cấu trúc kính tráng bạc trong vật liệu glTF.
- **GLASS_EDGE__POLISHED_CLEAR_FAINT_GREEN**: cạnh kính màu xanh lục rất nhạt đặc trưng cạnh tấm kính dày, không phải vật liệu mặt gương.
- **REAR__SILVERING_COATING_AND_MOISTURE_SEAL**: lớp bạc + bảo vệ mặt sau ở mức hiển thị 3D.
- **FRAME__KOHLER_CPL_POLISHED_CHROME**: chỉ có trên mẫu KOHLER, `metallicFactor=1`, `roughnessFactor=0.038`.
- Không có đèn LED, viền vàng, họa tiết in hoặc khung kim loại giả trên hai gương INAX.

## Chú ý quan trọng: GLB không tự phản chiếu phòng

GLB lưu **hình học và vật liệu PBR**, không lưu được hình ảnh phản chiếu động của các vật trong căn phòng. Với gương thật, ứng dụng LivLab cần cung cấp **scene.environment**, hoặc tốt nhất là **planar mirror/reflection render target** để phản chiếu các thiết bị xung quanh. Nếu xem GLB bằng viewer không có environment map, gương có thể hiển thị tối hoặc đơn sắc **dù glTF material có thông số đúng**. Không nên thay mặt kính thành màu sơn xám hoặc bake ảnh phản chiếu giả lên SKU thật.

Ảnh `contact_sheet_v3.png` và `previews/` cho thấy sự phản xạ trong môi trường kiểm thử studio, **không phải ảnh phản xạ được lưu sẵn trong GLB**.

## Sai số, độ tin cậy

**Đã kiểm tra tự động:** GLB 2.0 hợp lệ, có 3 file độc lập; kích thước bao ngoài đúng thông số hãng (sai số số học < 0.05 mm); mặt gương quay ra +Z; chính xác kiểu không khung/khung; màu PBR bạc trung tính/chrome; không có tam giác diện tích 0. Xem `qa/qa_report.json`.

**Chưa được kiểm chứng bằng CAD hãng:**

- INAX KF-6075VAR: cung vòm dựa trên ảnh + bản vẽ công khai; mặt tiếp giáp cung, cạnh mài vát và bộ pát treo chưa được xác nhận từng mm.
- INAX KF-6090VA: bán kính góc (xấp xỉ 1.3 mm) và vát cạnh (xấp xỉ 0.5 mm) là ước lượng; không dựng pát treo do catalogue 5 mm chỉ là độ dày kính.
- KOHLER K-30638-CPL: mặt trước khung chrome có bề rộng xấp xỉ 7 mm, kính lùi 4.2 mm, phần casing và pát treo phỏng theo ảnh/bản vẽ nhưng không phải profile CAD chính xác. Kích thước tổng thể chính hãng 508×813×35 mm; có pát treo gần vị trí 233 mm tính từ đỉnh gương.

## File trong gói

- `glb/*.glb` — **3 model thực**, không phải ảnh.
- `previews/*.png`, `contact_sheet_v3.png` — ảnh kiểm tra material-aware của các file GLB xuất ra, môi trường studio tạo riêng.
- `metadata.json` — SKU, provenance, số đo và các phần ước lượng.
- `qa/qa_report.json` — kết quả đọc lại file, định dạng và số đo.
- `build_mirrors.py`, `render_mirrors.py`, `validate_mirrors.py` — source tái tạo và kiểm thử.

**Chưa chạy browser QA bên trong LivLab trên máy của bạn.** Trước khi phát hành catalogue, cần lắp thử vào Room Studio và đối chiếu trực tiếp với CAD/ảnh hãng.
