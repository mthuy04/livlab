# LivLab — Batch 3: 3 GLB sản phẩm phòng tắm

Bộ ba **model GLB 2.0 được dựng thực tế** từ thông số và hình ảnh công khai của các hãng. Không phải ảnh AI và **không phải CAD chính hãng**. Không tự nhận độ tương đồng 90% khi chưa đối chiếu CAD/3D bản quyền của hãng.

## Danh sách / nguồn

| GLB | Sản phẩm gốc | Kích thước chính hãng | Chất liệu và finish |
| --- | --- | --- | --- |
| `Roca_A812401000.glb` | Roca Luna Ambient A812401000 | Ø800 × 25 mm | Gương tròn, LED viền 3000 K, 13 W, IP44; gương bạc phản xạ không viền kim loại |
| `Roca_A851693513.glb` | Roca Ona Unik A851693513 | W1000 × D460 × H645 mm | Matt Green 513 MDF hai ngăn kéo, lavabo Fineceramic® trắng; **không kèm vòi** |
| `INAX_PBFV-600.glb` | INAX PBFV-600 | Mặt W600 × D126 mm; độ sâu lắp vào sàn 101 mm theo mapping dữ liệu sản phẩm | Đồng thau mạ Cr-Ni, mặt thoát nước dạng khe tuyến tính |

Nguồn:

- Roca Luna: https://www.uk.roca.com/products/round-mirror-perimeter-lighting-colour-temperature-3000k-812401000
- Roca Ona: https://www.export.roca.com/products/unik-base-unit-two-drawers-fineceramic-basin-851693...
- Roca Ona bản vẽ: https://peralba.com/pdfs/ROCA851693513/ficha_ROCA851693513.pdf
- INAX PBFV-600: https://www.inax.com.vn/products/accessories/pbfv-600/

## Những thông số đã xác nhận / kiểm tra

- GLB 2.0, đơn vị **mét**, trục **Y hướng lên**.
- Đã xuất file rồi nạp lại để đo kích thước: gương **X800 / Y800 / Z25 mm**, tủ **X1000 / Y645 / Z460 mm**, thoát sàn **X600 / Y101 / Z126 mm** (tọa độ 3D; không phải thứ tự mô tả kích thước nhà sản xuất).
- Ba sản phẩm có material PBR đặt tên theo từng bộ phận. Không dùng một màu xám cho mọi mesh.
- Gương có material LED phát sáng (emissive) độc lập. GLB không tự hắt sáng thật lên tường xung quanh khi thiếu hệ thống light của Room Studio.
- Tủ có mặt lavabo trắng với hố chậu lõm, lỗ vòi ở vị trí trung tâm; hai ngăn kéo liền không có tay nắm rời.
- Nắp thoát sàn có **khe thật**, không vẽ sọc lên mặt kín.

## Điểm nào còn ước lượng?

**Gương LED:** Hãng xác nhận đường kính, độ sâu, 13 W, 3000 K và IP44. Không có file CAD gốc được tải về trong lần dựng này. Kích thước vỏ đèn sau, đế bắt tường và **bề rộng viền LED phía trước (~8,4 mm)** tái dựng từ hình ảnh, chưa xác nhận chính xác. *Gương bản này không thêm demister vì thông số Roca Luna A812401000 không nêu.*

**Tủ lavabo:** Hãng xác nhận W1000 × D460 × H645 mm, MDF Matt Green 513, hai ngăn kéo soft-close và chậu Fineceramic® trắng. Hình học thành chậu và độ sâu lòng, chi tiết tay nắm âm, lỗ vòi là mô phỏng theo hình hãng + bản vẽ tổng thể; không coi là CAD sản xuất. Màu xanh mờ gần ảnh tham chiếu, **không có mã màu sơn chính thức / phép đo màu**.

**Thoát sàn:** Hãng công bố W600, Depth101, Height126 mm; catalogue cũng cho mặt 600 × 126 mm. File GLB dựng mặt W600 × D126 và thân xuống dưới sàn 101 mm. **Chiều sâu/hướng trục của mô tả website cần kiểm tra CAD nếu dùng thi công**, chưa được phê duyệt cho sản xuất. Số khe/spacing, kết cấu ngăn mùi/phễu bên dưới dựng theo ảnh, không có bản vẽ cắt chính hãng nên không nên dùng để thi công hệ thống nước.

## Gắn vào LivLab

- `Roca_A812401000.glb`: treo tường, +Z ra phía người nhìn, mặt áp tường tại z=0, gốc tại giữa mép dưới. Vật liệu `LED_ON__3000K_PERIMETER_DIFFUSER` có emissiveFactor; để tắt đèn cần giảm `emissiveIntensity` và để sáng tường cần bố trí đèn phụ trong Room Studio. Đây là **logic ứng dụng**, không có hành vi tương tác tự chạy trong GLB.
- `Roca_A851693513.glb`: treo tường, +Z mặt trước, gốc tại giữa mặt sau đáy tủ; hệ thống quyết định độ cao treo thực tế.
- `INAX_PBFV-600.glb`: **gắn sàn**, mặt grate ở Y=0 và thân có Y âm đến −0,101 m. Để tích hợp đúng cần cắt lỗ hình học sàn/điều chỉnh clipping và hệ va chạm; không gắn kiểu tủ treo.
- Gương phản xạ thực tế phụ thuộc environment/probe/planar-reflection của render engine; một PBR kim loại bạc đứng riêng không tự tạo hình ảnh phản xạ động của lavabo.
- Kiểm tra bằng https://gltf-viewer.donmccurdy.com/ và chọn environment nội thất sáng.

## QA

Xem `qa/geometry_and_materials.json`. Đã kiểm tra magic GLB 2.0, dimensions round-trip, PBR materials, emissiveFactor cho LED, số chi tiết và không có tam giác diện tích bằng 0 trong ngưỡng kiểm thử. **Chưa kiểm thử trực tiếp bên trong workspace LivLab của người dùng**, chưa có kiểm chứng 90% CAD fidelity.

## Tài liệu trong pack

- `glb/*.glb` — ba file 3D thành phẩm
- `previews/*.png` — ảnh render từ GLB bằng studio HDRI-like texture, không phải hình AI
- `contact_sheet.png` — tổng hợp so sánh chính diện và 3/4
- `metadata.json` — mã SKU, source, kích thước, provenance và hạn chế
- `qa/geometry_and_materials.json` — các phép đo/kiểm thử tự động
- `build_batch3.py`, `render_batch3.py`, `validate_batch3.py` — mã nguồn tái lập
