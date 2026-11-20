# LivLab — Bathroom Accessories GLB v2 (INAX)

**Tình trạng:** Ba mô hình tái dựng dựa trên kích thước catalogue, ảnh tham chiếu và hình học tham số. **Không phải CAD gốc của INAX**, không chứng nhận giống sản phẩm thực tế 90%. Chưa tích hợp vào Room Studio.

## Ba mô hình

| SKU | Sản phẩm | Kích thước nominal W × H × D (mm) | Chất liệu | Độ tin cậy |
|---|---|---|---|---|
| KF-545VW | Thanh treo khăn đôi | 620 × 22 × 110 | Inox/Cr-Ni đánh bóng | Có ước lượng đường kính, vị trí hai thanh, đầu khung |
| KF-546V | Lô giấy với nắp kim loại cong | 147.9 × 150.2 × 88.8 | Cr-Ni đánh bóng | **Cần đối chiếu CAD**: hình dáng nắp, lõi và ngàm treo đã ước lượng |
| KF-541V | Móc áo dạng trụ có chốt dựng đứng | 22 × 40 × 50 | Cr-Ni đánh bóng | Có ước lượng trụ, vị trí chốt và viền |

Thông số được lấy từ INAX Catalogue 2026. Hãng/đại lý đang dùng **thứ tự trục khác nhau** khi mô tả KF-546V và KF-541V; thậm chí trang sản phẩm KF-546V đưa ra kích thước khác với catalogue. Trong gói này ưu tiên catalogue 2026, và có ghi sai khác trong `metadata.json`.

## Chất liệu & không gian 3D

- GLB 2.0 / glTF PBR metallic-roughness; chrome-nickel: `metallicFactor=1`, `roughnessFactor=0.038–0.082`, màu nền bạc trung tính.
- **Trông đúng chất chrome khi trình xem sử dụng environment map/HDRI**; nếu không có HDRI, kim loại PBR có thể trông tối/xám.
- Đơn vị **mét**, trục +Y lên, +X ngang, +Z hướng ra ngoài khỏi tường, mặt tường danh định `Z=0`, gốc tọa độ nằm giữa mép dưới ở mặt tường.
- QA: đọc lại 3 file `.glb`, đối chiếu kích thước bao ngoài, vật liệu PBR, winding, tam giác không suy biến; xem `qa/qa_results.json`.
- `contact_sheet.png` và `previews/` được render trực tiếp từ GLB bằng PBR và environment chiếu sáng, không phải hình AI.

## Nguồn tham chiếu

1. INAX Catalogue 2026: https://www.inax.com.vn/wp-content/uploads/2026/04/Cataogue_A5_Ver_042026.pdf
2. INAX KF-545VW: https://www.inax.com.vn/products/accessories/kf-545vw/
3. INAX KF-546V: https://www.inax.com.vn/products/accessories/kf-546v/
4. INAX KF-541V (INAX danh mục): https://www.inax.com.vn/vi/product-category/40-spec-depth-accessories/
5. Ảnh tham khảo nắp lô giấy KF-546V: https://inaxtriviet.vn/lo-giay-ve-sinh-inax-kf-546v.html (lưu ý có trang đại lý gắn nhầm mã ảnh, đối chiếu trước khi dùng).
6. Ảnh thanh khăn KF-545VW: https://www.tdm.vn/thanh-treo-khan-inax-kf-545vw.html (đại lý ghi chiều ngang 660 mm, khác catalogue 620 mm).

## Định dạng bàn giao

- `glb/*.glb` — 3 file model riêng biệt.
- `previews/*.png` — hình sản phẩm được render từ chính GLB.
- `contact_sheet.png` — so sánh hai góc nhìn mỗi SKU.
- `metadata.json` — kích thước, chất liệu, nguồn và độ tin cậy riêng.
- `qa/qa_results.json` — kiểm thử tự động.
- `build_accessories.py` / `render_accessories.py` / `verify_assets.py` — mã nguồn tái tạo, kiểm thử.

## Chú ý cho LivLab

Ba file này có thể dùng để **xem thử và kiểm nghiệm placement**. Trước khi quảng bá là bản sao chính xác theo SKU hoặc dùng cho lắp đặt kỹ thuật, cần kiểm tra bản vẽ CAD/installation của từng mẫu, nhất là KF-546V. Ảnh/thiết kế của hãng có thể được bảo hộ quyền sở hữu trí tuệ; hãy kiểm tra quyền sử dụng khi phát hành công khai.
