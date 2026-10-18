# Giang Sơn Product Catalogue

Date reviewed: 2026-10-18

## Source inventory

| Input | Result |
| --- | --- |
| `GiangSon_Catalog_57_Types.csv` | 57 source-extracted product/service types |
| `GiangSon_Gallery_62_Images.csv` | 62 source image references; reuse rights unverified |
| `GiangSon_TrangVang_Catalog_Extract.xlsx` | Sheets `TongQuan`, `DanhMuc_57`, `ThuVienAnh_62`, `DoanhNghiep` |
| Supplied logo PNG | Used locally at its intrinsic 216 × 90 dimensions |

## Taxonomy

| Category | Product types |
| --- | ---: |
| Bồn cầu | 11 |
| Bồn tắm | 6 |
| Chậu rửa | 9 |
| Vòi nước | 7 |
| Vòi sen | 5 |
| Gạch ốp lát | 5 |
| Thiết bị điện | 9 |
| Vật liệu ngành nước | 5 |
| **Total** | **57** |

## Record rules

- `PRODUCT_TYPE`: source label preserved, `sku = null`, no showroom price, source-extracted verification state.
- `VERIFIED_SKU`: exact brand/model matched to an authoritative page and date checked.
- `SHOWROOM_OFFER`: reserved for commercial data confirmed by the tenant; no Giang Sơn record currently uses it.
- `MARKET_REFERENCE` / `CATEGORY_REFERENCE`: independent reference only, with source URL, unit and checked date.
- Product-type cards show “Loại sản phẩm”, never a fabricated brand or SKU.
- Generic category SVGs are internal interface illustrations and are explicitly not product photography.

## Rights and provenance

Each imported row retains original label, normalized label, source URL, review date, record type, verification state and rights note. The Trang Vàng image URLs remain research metadata only. No uncertain image was downloaded, hotlinked or attributed to Giang Sơn.

All 62 gallery evidence rows are preserved separately in `data/demo/giangson-gallery-references.json` with `UNVERIFIED_FOR_COMMERCIAL_REUSE`; this file is not a storefront image feed.

## Runtime catalogue

The fixture contains 62 rows: 57 source types plus 5 separately verified examples. This additive structure allows product discovery without misrepresenting the source extraction.
