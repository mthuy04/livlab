# Giang Sơn — UI/UX, nội dung, SEO và chuyển đổi (18/11/2026)

Báo cáo bàn giao cho đợt hoàn thiện website showroom Thiết bị vệ sinh Giang Sơn.
Không thiết kế lại từ đầu: giữ hệ màu trắng – xanh navy, font, danh mục, bộ lọc,
thông số, concept có điểm chạm, Room Studio 3D, luồng báo giá và tra cứu.

## 1. Vấn đề phát hiện và đã sửa

| # | Vấn đề | Đã sửa |
|---|---|---|
| P0 | livlab.space hiện nội dung Giang Sơn khi trình duyệt còn cookie xem thử `/s/giangson` | Showroom có domain riêng không bao giờ hiển thị trên host LivLab nữa (kể cả với cookie cũ). `/s/giangson` chuyển thẳng tới địa chỉ của Giang Sơn và xoá cookie. Tùng Đăng (chưa có domain riêng) vẫn xem thử như cũ. |
| P1 | Phần Room Studio trên trang chủ dùng ảnh chụp thư viện **LivLab** | Chụp lại Room Studio của chính Giang Sơn (phòng mẫu 3,2 × 2,4 m, bồn tắm + bồn cầu INAX). |
| P2 | Hero chung chung, chỉ có CTA "khám phá" | H1 "Thiết bị vệ sinh Giang Sơn tại Hà Nội", mô tả theo sản phẩm thật, CTA chính "Xem sản phẩm", CTA phụ "Nhận báo giá từ Giang Sơn", Room Studio là link hỗ trợ. Không có CTA "combo" vì chưa có combo được duyệt. |
| P3 | Thứ tự trang chủ chưa theo hành trình mua | Hero → danh mục → (combo khi được duyệt) → sản phẩm → video → mẫu phối → Room Studio → showroom → CTA báo giá → footer. Danh mục hiển thị bằng ảnh sản phẩm thay cho ảnh phòng dựng; giảm khoảng trắng; tăng tương phản chữ. |
| P5 | Video Facebook chưa có trên web | 2 video công khai của trang Giang Sơn phát bằng trình phát nhúng chính thức của Facebook, **chỉ tải khi bấm phát** (không tự phát, không chép file). |
| P6 | Bộ lọc danh mục và thương hiệu bị lặp (thanh trên + checkbox bên trái) | Bỏ phần lặp ở cột trái khi đã có thanh chọn. Ô tìm kiếm rộng hơn. |
| P6 | Ảnh TOTO LT710CTR bị vỡ trên danh mục | Lưu bản sao cục bộ (chuẩn hoá như các ảnh hãng khác) cho LT710CTR, BFV-70S, BF-1656V, LFV-1402S; nguồn ghi trong `data/demo/image-assets.json`. |
| P6 | Giá hãng đề xuất hiển thị như giá bán của showroom | Mỗi thẻ và trang sản phẩm ghi rõ loại giá: "Giá hãng đề xuất", "Giá khuyến mãi hãng đề xuất", "Giá thị trường tham khảo". Đã kiểm tra lại −15% của TOTO MS889DRT8 trên vn.toto.com ngày 18/11/2026 (12.276.000đ so với 14.443.000đ). |
| P6 | Trang sản phẩm tràn ngang: tablet 902px/768px, mobile 392px/390px | Thanh công cụ xuống dòng dưới 1024px; thanh danh mục/thương hiệu được cắt đúng lề. Đo lại 9 trang × 3 kích thước: không còn tràn. |
| P7 | Trang bồn cầu TOTO hiện "Mô phỏng sản phẩm" mở công cụ chọn **vòi lavabo** của TOTO | Công cụ TOTO chỉ hiện ở trang vòi và lavabo, ghi rõ "Công cụ chọn vòi lavabo TOTO ↗". |
| P7 | Công cụ trên Coohom được giới thiệu là "công cụ mô phỏng của INAX" qua route nội bộ LivLab | Không xác minh được INAX là chủ sở hữu, nên đổi tên thành "Mô phỏng 3D trên Coohom ↗", ghi chú bên thứ ba, mở thẳng trang Coohom. |
| P8 | Câu chuyện concept dài, chung chung | Rút gọn cho 3 concept Giang Sơn: diện tích + thiết bị gợi ý từ danh mục. Phân biệt "ảnh minh hoạ" và "sản phẩm gợi ý" vẫn giữ trên trang. |
| P9 | Giỏ báo giá trống thì không gửi được gì | Form yêu cầu không cần chọn sản phẩm: họ tên, SĐT/Zalo, cách liên hệ, sản phẩm/nhu cầu, kích thước, ngân sách, ghi chú, đồng ý. Server kiểm tra (thiếu tên/SĐT/nhu cầu, quá dài → 400), gắn tenant, lưu DB, hiện trên dashboard workspace Giang Sơn. Bỏ bắt buộc "loại phòng" và "ngân sách" ở form có sản phẩm. |
| P9 | Hứa "liên hệ trong 1–2 ngày làm việc" chưa được xác nhận | Bỏ ở trang báo giá (mọi tenant). |
| P10 | Trang quy trình báo giá ghi "LivLab hoạt động như thế nào?" và hứa 24–48 giờ | Trang riêng cho showroom: "Giang Sơn tiếp nhận yêu cầu báo giá như thế nào?", 4 bước theo brief, không hứa thời gian. Bản LivLab cũng bỏ câu 24–48 giờ. |
| P10 | Trang liên hệ lặp chữ, không có form | Rút gọn đoạn mở đầu; thêm "Gửi yêu cầu nhanh" (form thật, cùng endpoint báo giá); giữ địa chỉ, chỉ đường Google Maps, hotline, Zalo, Facebook. |
| P10 | Chính sách/điều khoản không phân biệt bên bán và nền tảng | Thêm khối "Bên bán và đơn vị vận hành website": Giang Sơn bán, tư vấn, báo giá, giao, lắp; LivLab vận hành nền tảng, lưu và chuyển yêu cầu; ghi chú video Facebook. Không thêm cam kết pháp lý mới. |
| P11 | Tiêu đề trang chưa theo brief | Xem bảng mục 4. |

## 2. Tệp đã sửa

Mới: `lib/storefront/showroomMedia.ts`, `components/storefront/home/ShowroomVideos.tsx`,
`components/storefront/home/ShowroomCombos.tsx`, `components/quote/InquiryForm.tsx`,
`components/contact/ContactInquiry.tsx`, `components/contact/ShowroomQuoteProcess.tsx`,
`components/legal/SellerNotice.tsx`, `scripts/testShowroomMedia.mts`,
`public/demo/giangson/room-studio.webp`, 4 ảnh sản phẩm trong `public/demo/manufacturers/`.

Sửa: `lib/storefront/tenantConfig.ts`, `tenantExperience.ts`, `tenantSites.ts`, `catalog.ts`,
`catalogTypes.ts`, `conceptLibrary.ts`, `manufacturerTools.ts`, `productDetail.ts`,
`productDetailTypes.ts`, `lib/showroom/publicQuoteService.ts`, `lib/seo/pageMetadata.ts`,
`app/s/[slug]/route.ts`, `app/{quote,quote-process,contact,privacy,terms,products,concepts,room-studio}/page.tsx`,
`components/storefront/home/ArchitecturalLanding.tsx` (+ `.module.css`), `ArchitecturalHero.tsx`,
`components/storefront/catalog/CatalogClient.tsx`, `CatalogFilterPanel.tsx`, `CatalogProductCard.tsx`,
`components/storefront/product/ProductActions.tsx`, `sections.tsx`, `components/contact/ShowroomContact.tsx`,
`components/quote/QuoteForm.tsx`, `data/demo/image-assets.json`, `public/demo/giangson/source-map.json`,
`scripts/testTenantSeo.mts`, `package.json`.

Ảnh hưởng tới tenant khác (cố ý, vì là lỗi chung): bỏ bộ lọc lặp ở trang danh mục, bỏ lời hứa
thời gian phản hồi, form báo giá không bắt buộc loại phòng/ngân sách, trang báo giá trống có form
mô tả nhu cầu. Giao diện, màu và nội dung của LivLab và Tùng Đăng không đổi.

## 3. Ảnh trước / sau

`artifacts/giangson-refinement/before/` (bản đang chạy trước khi sửa) và
`artifacts/giangson-refinement/after/` (bản build mới): 9 trang (trang chủ, danh mục, chi tiết
sản phẩm, mẫu phối, chi tiết mẫu phối, Room Studio, báo giá, liên hệ, quy trình báo giá), toàn trang,
desktop 1440 / tablet 768 (chỉ "sau") / mobile 390.

## 4. SEO — metadata từng trang (giangson.livlab.space)

| Trang | Title | Description | H1 | Canonical | Robots | JSON-LD |
|---|---|---|---|---|---|---|
| / | Thiết bị vệ sinh Giang Sơn \| 240 Hồ Tùng Mậu, Hà Nội | Showroom thiết bị vệ sinh Giang Sơn, 240 Hồ Tùng Mậu, Hà Nội: bồn cầu, lavabo, sen vòi, bồn tắm TOTO, INAX. Xem mẫu, thông số, giá hãng đề xuất và gửi yêu cầu báo giá. | Thiết bị vệ sinh Giang Sơn tại Hà Nội | https://giangson.livlab.space | index, follow | HomeGoodsStore,WebSite |
| /products | Bồn cầu, lavabo, sen vòi, bồn tắm \| Thiết bị vệ sinh Giang Sơn | Xem 10 mẫu thiết bị phòng tắm INAX, TOTO kèm hình ảnh, thông số kỹ thuật và giá tham khảo tại Thiết bị vệ sinh Giang Sơn. | THIẾT BỊ PHÒNG TẮM | https://giangson.livlab.space/products | index, follow | BreadcrumbList |
| /products?category=B%E1%BB%93n%20c%E1%BA%A7u | Bồn cầu INAX, TOTO \| Thiết bị vệ sinh Giang Sơn | Xem 4 mẫu bồn cầu INAX, TOTO kèm hình ảnh, thông số kỹ thuật và giá tham khảo tại Thiết bị vệ sinh Giang Sơn. | BỒN CẦU | https://giangson.livlab.space/products?category=B%E1%BB%93n%20c%E1%BA%A7u | index, follow | BreadcrumbList |
| /products/inax-ac-912vn | Bồn cầu 1 khối INAX AC-912VN \| Thiết bị vệ sinh Giang Sơn | Thiết kế một khối bo tròn, vành trơn dễ lau chùi. Xả xoáy Powerful Vortex hai chế độ 4,5/3,0 L tiết kiệm nước; men Aqua Ceramic chống bám bẩn và ố vàng; nắp đóng êm CF-602VS. | Bồn cầu 1 khối INAX AC-912VN | https://giangson.livlab.space/products/inax-ac-912vn | index, follow | BreadcrumbList,Product |
| /concepts | Mẫu phối phòng tắm theo diện tích và phong cách \| Giang Sơn | Phối cảnh phòng tắm theo diện tích và phong cách, kèm thiết bị gợi ý từ danh mục Giang Sơn. | KHÔNG GIAN PHÒNG TẮM | https://giangson.livlab.space/concepts | index, follow |  |
| /concepts/giangson-master-spa | Master Spa Retreat — Phòng tắm master phong cách spa \| Thiết bị vệ sinh Giang Sơn | Một phòng tắm master rộng rãi với bồn tắm độc lập, khu tắm riêng và kết nối ánh sáng – thiên nhiên để tạo trải nghiệm nghỉ dưỡng tại nhà. | Phòng tắm master phong cách spa | https://giangson.livlab.space/concepts/giangson-master-spa | index, follow | BreadcrumbList |
| /room-studio | Phối phòng tắm 3D với thiết bị vệ sinh \| Giang Sơn | Nhập kích thước phòng và đặt thử bồn cầu, lavabo, sen vòi của Giang Sơn trong không gian 3D trước khi gửi yêu cầu báo giá. | Room Studio | https://giangson.livlab.space/room-studio | index, follow |  |
| /contact | Liên hệ showroom Giang Sơn \| 240 Hồ Tùng Mậu | Showroom Thiết bị vệ sinh Giang Sơn: 240 Hồ Tùng Mậu, Phú Diễn, Bắc Từ Liêm, Hà Nội. Hotline / Zalo 032 969 0164. Tư vấn chọn thiết bị và báo giá. | Liên hệ Thiết bị vệ sinh Giang Sơn | https://giangson.livlab.space/contact | index, follow | BreadcrumbList |
| /quote-process | Quy trình báo giá \| Thiết bị vệ sinh Giang Sơn | Cách Thiết bị vệ sinh Giang Sơn tiếp nhận yêu cầu báo giá: gửi mã sản phẩm, số lượng hoặc kích thước, showroom kiểm tra và xác nhận báo giá. | Quy trình báo giá | https://giangson.livlab.space/quote-process | index, follow |  |
| /quote | Thiết bị vệ sinh Giang Sơn \| 240 Hồ Tùng Mậu, Hà Nội | Showroom thiết bị vệ sinh Giang Sơn, 240 Hồ Tùng Mậu, Hà Nội: bồn cầu, lavabo, sen vòi, bồn tắm TOTO, INAX. Xem mẫu, thông số, giá hãng đề xuất và gửi yêu cầu báo giá. | Cho showroom biết bạn cần gì | — | noindex, follow |  |
| /privacy | Chính sách bảo mật \| Thiết bị vệ sinh Giang Sơn | Cách thông tin bạn gửi trên website được lưu trữ và chuyển đến showroom. | Chính sách bảo mật | https://giangson.livlab.space/privacy | index, follow |  |

- `robots.txt`: cho phép, chặn `/api/ /admin /showroom /dev /image-check /s/`, khai báo sitemap.
- `sitemap.xml`: 23 URL (trang chủ, danh mục và 5 nhóm, 10 sản phẩm, mẫu phối, Room Studio, liên hệ…).
- Bản xem trước `giangson-livlab.vercel.app`: `noindex, follow`, canonical về `https://giangson.livlab.space`.
- JSON-LD: WebSite + HomeGoodsStore (địa chỉ, SĐT, Facebook đã xác minh); Product không có Offer/đánh giá giả.
- Không lẫn metadata giữa tenant: kiểm tra bằng test `testTenantSeo` (67 mục).
- Không thể cam kết thứ hạng Google.

## 5. Danh sách sản phẩm / combo / media

**Danh mục hiện có (10 sản phẩm, đã xác minh nguồn hãng):** INAX AC-1017VRN, AC-912VN, BF-1656V,
BFV-70S, L-293V (giá META.vn), LFV-1402S; TOTO CS838DT10, MS889DRT8, PAY1725VC/TVBF411, LT710CTR.

**Nhóm sản phẩm Facebook có quảng bá nhưng chưa đưa lên (thiếu dữ liệu đã duyệt):** bàn đá lavabo,
tủ chậu lavabo, gương LED, sen vòi đen mờ, phụ kiện, tủ làm theo kích thước. Không tạo mã, giá hay
thông số khi chưa có dữ liệu của showroom.

**Combo (bản ghi trong `lib/storefront/showroomMedia.ts`, trạng thái CHỜ CHỦ SHOP DUYỆT, chưa hiển thị):**

| Combo | Nguồn | Thiếu gì để đăng |
|---|---|---|
| Bàn đá lavabo + vòi + gương LED | facebook.com/thietbigiangson/posts/639995171891324 | Quy cách từng món; giá xác nhận (bài đăng chỉ ghi "1xxx/2xxx"); ảnh gốc và quyền đăng |
| Combo 5 món tông xám – đen mờ (12/2025) | facebook.com/thietbigiangson/posts/879757214581784 (29/12/2025) | Xác nhận còn bán; thương hiệu, mã, kích thước; giá hiện hành. Ưu đãi "giảm 20%" đã hết hạn, **không dùng lại** |

Khi một combo được duyệt (đổi `publication` thành `PUBLISHED`, gắn `catalogProductId` nếu là sản phẩm
trong danh mục), mục "Bộ thiết bị phòng tắm tại Giang Sơn" tự hiện trên trang chủ với nút
"Thêm cả bộ vào báo giá" (hoặc "Hỏi giá bộ này" nếu chưa liệt kê sản phẩm).

**Video (đang hiển thị, phát qua trình phát Facebook):** tủ chậu lavabo (videos/1939802803485299),
giới thiệu showroom (videos/1717154986188552). Mỗi video dẫn tới trang báo giá hoặc mục showroom.

## 6. Kết quả kiểm thử

- `testShowroomMedia` 25/25 · `testTenantSeo` 67/67 · `testConceptLibrary` 66/66 ·
  `testRoomStudioCapability` 54/54 · `testInaxReconstructions` 144/144 · `testTechnicalAdvisor` 46/46 ·
  `testShowroomV3` đạt.
- `tsc --noEmit` sạch; ESLint 0 lỗi trên các tệp đã sửa (còn cảnh báo cũ); `next build` thành công.
- API báo giá: 4 trường hợp sai bị chặn (400). Một yêu cầu thử hợp lệ đã lưu: **YC-2026-000030**,
  tenant `giangson`, workspace `workspace-demo-giangson`, 0 sản phẩm — tên "TEST LivLab QA - vui lòng
  bỏ qua". Có thể xoá trong dashboard nếu muốn.
- Tràn ngang: 0 trên 27 tổ hợp trang × thiết bị.
- `/s/giangson` trên livlab.space → 307 tới giangson-livlab.vercel.app, xoá cookie; livlab.space với
  cookie cũ vẫn hiện LivLab; `/s/tungdang` vẫn hoạt động.

## 7. Trạng thái domain (18/11/2026)

- `giangson.livlab.space`: **chưa có bản ghi DNS** (dig không trả về CNAME/A). Đã thêm trong Vercel;
  cần CNAME `giangson` → `a7f6629289706478.vercel-dns-017.com.` tại Namecheap.
- `giangson-livlab.vercel.app`: đang chạy, noindex, canonical về domain chính.
- `www.livlab.space`: website LivLab, không chứa sản phẩm, logo hay liên hệ của Giang Sơn.

## 8. Việc còn cần chủ shop / tài khoản

1. Thêm CNAME ở Namecheap (tài khoản của thầy). Khi domain trả lời: xoá dòng `entryOrigin` trong
   `DEMO_GIANGSON_TENANT.site`, tạo property Search Console cho `https://giangson.livlab.space/`,
   gửi sitemap.
2. Chủ shop duyệt combo: thành phần, mã, kích thước, giá, ảnh gốc + quyền đăng.
3. Chủ shop xác nhận dùng video Facebook trên website (hiện nhúng từ trang công khai, không chép file);
   nếu có file gốc, có thể đăng trực tiếp thay cho trình phát Facebook.
4. Ảnh showroom thật (mặt tiền, khu trưng bày) để thêm vào mục Showroom.
5. Dữ liệu sản phẩm cho bàn đá, tủ chậu, gương LED, phụ kiện.
6. Số hotline thứ hai trên Facebook (0395 279 360 / 0988 325 606): chưa đăng cho tới khi chủ shop xác nhận.
7. Thời gian phản hồi báo giá, giờ mở cửa, pháp nhân: chưa đăng cho tới khi được xác nhận.
