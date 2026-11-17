# Thiết bị vệ sinh Giang Sơn — website, SEO và bàn giao

Cập nhật: 17/11/2026. Website: `https://giangson.livlab.space` (tenant `giangson`).

Tài liệu này ghi lại những gì đã làm trong mã nguồn, những bước cần quyền truy cập
của chủ doanh nghiệp, và cách kiểm tra kết quả. Không có cam kết về thứ hạng hay
thời gian Google lập chỉ mục.

---

## 1. Thông tin doanh nghiệp đang hiển thị

Chỉ dùng thông tin do chính doanh nghiệp công bố trên trang Facebook
`facebook.com/thietbigiangson` (mục Giới thiệu, kiểm tra 17/11/2026).

| Mục | Giá trị trên website | Nguồn |
|---|---|---|
| Tên hiển thị | Thiết bị vệ sinh Giang Sơn | Facebook |
| Địa chỉ | 240 Hồ Tùng Mậu, Phú Diễn, Bắc Từ Liêm, Hà Nội | Facebook |
| Hotline / Zalo | 032 969 0164 | Facebook |
| Mạng xã hội | facebook.com/thietbigiangson | Facebook |
| Logo | logo do khách hàng cung cấp (`public/demo/giangson/logo.png`) | Khách hàng |

### Chưa công bố — cần chủ showroom xác nhận

| Mục | Hiện trạng | Vì sao chưa dùng |
|---|---|---|
| Số thứ hai 0988 325 606 | Có trên Facebook | Đề bài yêu cầu xác nhận trước |
| Số 0395 279 360 | Có trên Trang Vàng | Khác số trên Facebook — cần biết số nào còn dùng |
| Tên pháp nhân "Công ty TNHH TM & XD Giang Sơn Việt Nam" (MST 0106917237) | Trang Vàng, masothue, TopCV — cùng địa chỉ 240 Hồ Tùng Mậu | Chưa xác nhận là cùng chủ với trang Facebook; có doanh nghiệp trùng tên khác (MST 0107671378) |
| Giờ mở cửa | Facebook ghi "Luôn mở cửa" | Không rõ là giờ thực tế |
| Địa chỉ theo đơn vị hành chính mới | Thuế ghi "Phường Phú Diễn, TP Hà Nội" | Facebook vẫn dùng dạng cũ có quận; chủ showroom chọn một dạng thống nhất |
| Danh mục và tồn kho | Website trưng bày 10 mẫu TOTO/INAX chính hãng | Chưa xác nhận Giang Sơn có sẵn các mẫu này |
| Giá | Giá bán lẻ đề xuất của hãng (TOTO/INAX) | Không phải giá bán của Giang Sơn — vì vậy không gắn `Offer` |
| Đánh giá 5,0 (16) trên Google | Hiện ở kết quả Facebook | Không đưa vào dữ liệu có cấu trúc |

Sửa thông tin ở một chỗ duy nhất: `lib/storefront/tenantConfig.ts` → `DEMO_GIANGSON_TENANT`
(`contact`, `business`, `seo`) và `GIANGSON_EXPERIENCE` (nội dung trang chủ).

---

## 2. Tên miền — cần quyền Vercel và Namecheap

Hiện trạng (17/11/2026): `livlab.space` đăng ký tại Namecheap, DNS do Namecheap quản
lý (`dns1/dns2.registrar-servers.com`), đã trỏ về Vercel. `giangson.livlab.space`
**chưa có bản ghi DNS** nên chưa truy cập được.

1. **Vercel** → Project `livlab` → Settings → Domains → Add → `giangson.livlab.space`.
   Vercel hiển thị bản ghi cần thêm. Với `www.livlab.space` dự án đang dùng
   `CNAME a7f6629289706478.vercel-dns-017.com` — dùng đúng giá trị Vercel hiển thị.
2. **Namecheap** → Domain List → `livlab.space` → Advanced DNS → Add New Record:
   - Type: `CNAME Record` · Host: `giangson` · Value: *(giá trị Vercel hiển thị ở bước 1)* · TTL: Automatic
3. Chờ Vercel báo "Valid Configuration" và cấp HTTPS (thường vài phút).
4. Không cần đổi mã nguồn: hostname đã được khai báo trong `site.hosts` của tenant.

Kiểm tra:

```bash
dig +short CNAME giangson.livlab.space
curl -sI https://giangson.livlab.space/ | head -1
curl -s https://giangson.livlab.space/robots.txt
curl -s https://giangson.livlab.space/sitemap.xml | head
```

---

## 3. Google Search Console — cần tài khoản Google của chủ doanh nghiệp

1. search.google.com/search-console → Add property → **URL prefix** →
   `https://giangson.livlab.space/`.
2. Chọn xác minh bằng **HTML tag**, chép giá trị `content="…"`.
3. Thêm biến môi trường trên Vercel (Production):
   `GOOGLE_SITE_VERIFICATION_GIANGSON=<giá trị content>` rồi redeploy.
   Website tự in thẻ `<meta name="google-site-verification">` cho riêng Giang Sơn.
4. Bấm Verify. Chỉ ghi "đã xác minh" khi Search Console báo thành công.
5. Sitemaps → gửi `https://giangson.livlab.space/sitemap.xml`.
6. URL Inspection → `https://giangson.livlab.space/` → Request indexing.
7. Theo dõi Pages (lập chỉ mục) và Performance sau 3–14 ngày.

Không dùng Indexing API cho trang thường.

---

## 4. Google Analytics 4 — cần tạo property

1. Tạo GA4 property "Thiết bị vệ sinh Giang Sơn" → Web stream `giangson.livlab.space`.
2. Thêm biến Vercel: `NEXT_PUBLIC_GA4_ID_GIANGSON=G-XXXXXXX` rồi redeploy.
   Không có biến này thì website không tải script Google nào.
3. Đánh dấu các sự kiện sau là **Key event**: `generate_lead`, `quote_request_submit`,
   `room_studio_quote_request`, `phone_click`, `zalo_click`.
4. Liên kết GA4 với Search Console (Admin → Product links).

Sự kiện đã gắn (không gửi tên, số điện thoại, email hay nội dung khách nhập):

| Sự kiện | Khi nào |
|---|---|
| `view_item` | Mở trang chi tiết sản phẩm |
| `view_item_list` | Danh sách sản phẩm / danh mục hiển thị |
| `select_item` | Bấm vào một sản phẩm |
| `phone_click` | Bấm số điện thoại |
| `zalo_click` | Bấm liên kết Zalo |
| `contact_click` | Bấm tới trang Liên hệ / Báo giá / Facebook |
| `quote_request_submit` | Yêu cầu báo giá **đã được lưu** (có mã YC) |
| `room_studio_open` | Mở Room Studio |
| `room_studio_quote_request` | Gửi yêu cầu từ Room Studio thành công |
| `generate_lead` | Mỗi yêu cầu thành công, kèm `lead_source` (kênh truy cập) |

Nguồn truy cập của mỗi yêu cầu (organic_search / social / paid / referral / direct,
trang đích, tên miền giới thiệu, utm) được lưu kèm yêu cầu trong
`QuoteLead.contextJson.attribution`, nên đếm được lead từ Google kể cả khi chưa có GA4:

```sql
SELECT "contextJson"->'attribution'->>'channel' AS channel, count(*)
FROM "QuoteLead"
WHERE "sourceTenantId" = 'giangson' AND "createdAt" >= now() - interval '30 days'
GROUP BY 1 ORDER BY 2 DESC;
```

Lưu ý quyền riêng tư: trước khi bật GA4 nên có thông báo cookie/đồng ý theo
Nghị định 13/2023/NĐ-CP.

---

## 5. Facebook — chủ fanpage thực hiện

### 5.1 Sửa mục Website

Facebook → Trang → Giới thiệu → Thông tin liên hệ → Website: thay
`facebook.com/thietbivesinh` bằng `https://giangson.livlab.space`.

### 5.2 Bài ghim giới thiệu website

> 🛁 THIẾT BỊ VỆ SINH GIANG SƠN RA MẮT WEBSITE
>
> Từ nay anh chị có thể xem sản phẩm, thông số và giá tham khảo của bồn cầu,
> lavabo, sen vòi, bồn tắm ngay trên website — và thử bố trí phòng tắm 3D trước khi
> chọn mua.
>
> 👉 https://giangson.livlab.space
>
> 📍 240 Hồ Tùng Mậu, Phú Diễn, Bắc Từ Liêm, Hà Nội
> ☎️ Hotline / Zalo: 032 969 0164

### 5.3 Bài ngắn về lợi ích

> Chọn thiết bị phòng tắm dễ hơn với website Giang Sơn:
> ✔ Xem mã sản phẩm, kích thước, bản vẽ kỹ thuật
> ✔ Lưu các mẫu ưng ý vào giỏ báo giá và gửi một lần
> ✔ Thử đặt bồn cầu, lavabo, bồn tắm vào phòng đúng kích thước trong Room Studio
> Xem ngay: https://giangson.livlab.space

### 5.4 Lời kêu gọi

- Xem sản phẩm: "Xem mẫu và thông số tại https://giangson.livlab.space/products"
- Yêu cầu báo giá: "Gửi danh sách thiết bị để nhận báo giá: https://giangson.livlab.space/quote"
- Trong bài giới thiệu từng sản phẩm: gắn link trang sản phẩm, ví dụ
  `https://giangson.livlab.space/products/toto-cs838dt10`.

### 5.5 Tài sản có thể dùng lại (cần chủ fanpage đồng ý)

Ảnh chụp thực tế tại showroom, video sản phẩm (ví dụ bài "Bàn đá lavabo cao cấp"),
ảnh bàn giao công trình. Website hiện **không** dùng ảnh hay bài viết nào từ Facebook.

---

## 6. Google Business Profile — chủ doanh nghiệp thực hiện

Kết quả tìm kiếm ngày 17/11/2026 **không thấy** hồ sơ Google Maps của Thiết bị vệ
sinh Giang Sơn tại 240 Hồ Tùng Mậu (khối bản đồ hiện các doanh nghiệp khác, trong đó
có "Giang Sơn" ở 54 Lê Lợi — doanh nghiệp khác).

1. Mở google.com/maps, tìm "Giang Sơn 240 Hồ Tùng Mậu". Nếu đã có hồ sơ → "Bạn có
   phải là chủ doanh nghiệp này?" để nhận quyền. **Không tạo hồ sơ mới khi đã có.**
2. Nếu chưa có: business.google.com → tạo hồ sơ với đúng tên "Thiết bị vệ sinh Giang
   Sơn", danh mục chính "Cửa hàng thiết bị phòng tắm" (hoặc gần nhất), địa chỉ 240 Hồ
   Tùng Mậu, số 032 969 0164, website `https://giangson.livlab.space`.
3. Xác minh theo cách Google đưa ra (video, điện thoại hoặc thư).
4. Thêm ảnh mặt tiền và bên trong showroom do chủ chụp.
5. Không mua hay xin đánh giá giả.

---

## 7. Đồng bộ tên – địa chỉ – điện thoại (NAP)

| Nguồn | Tên | Địa chỉ | Điện thoại | Việc cần làm |
|---|---|---|---|---|
| Website | Thiết bị vệ sinh Giang Sơn | 240 Hồ Tùng Mậu | 032 969 0164 | — |
| Facebook | Thiết bị vệ sinh Giang Sơn | 240 Hồ Tùng Mậu | 032 969 0164, 0988 325 606 | Đổi mục Website |
| Trang Vàng | Thiết Bị Vệ Sinh Giang Sơn Việt Nam – Cty TNHH TM & XD Giang Sơn Việt Nam | Số 240 Hồ Tùng Mậu | 0395 279 360 | Xác nhận số; thêm website |
| yellowpages.vn | như Trang Vàng | Số 240 Hồ Tùng Mậu | — | Thêm website |
| Cốc Cốc Maps | "Giang Sơn – Gạch ốp lát, thiết bị vệ sinh, sơn" | **256** Hồ Tùng Mậu | — | Dùng "Đề xuất chỉnh sửa" nếu là cùng cửa hàng |
| Google Business Profile | chưa thấy | — | — | Mục 6 |

Không mua backlink, không đăng hàng loạt danh bạ kém chất lượng.

---

## 8. Mức cơ sở tìm kiếm thương hiệu (17/11/2026)

Google, `hl=vi&gl=vn`, vị trí ước tính Hà Nội, không cá nhân hoá. Không có quảng cáo
xuất hiện ở các truy vấn này. Website mới **chưa xuất hiện** (chưa có DNS, chưa index).

| Truy vấn | Facebook | Website mới | Hồ sơ Maps của Giang Sơn | Kết quả khác đáng chú ý |
|---|---|---|---|---|
| Thiết bị vệ sinh Giang Sơn | #1 organic | không có | không có | Cốc Cốc Maps (#2), Trang Vàng, yellowpages |
| Giang Sơn thiết bị vệ sinh | #1 | không có | không có | giangson.vn (doanh nghiệp khác) #6 |
| Giang Sơn 240 Hồ Tùng Mậu | #1 | không có | không có | yellowpages, Trang Vàng, masothue, TopCV |
| Giang Sơn Việt Nam thiết bị vệ sinh | #1 | không có | không có | masothue của **Cty TNHH Giang Sơn Việt Nam** (MST khác) |
| Showroom Giang Sơn Hà Nội | #1 | không có | không có | giangson.vn (gia dụng Đức) #2–3 |

---

## 9. Mẫu báo cáo SEO hằng tháng (dùng được cho mọi showroom LivLab)

| KPI | Nguồn | Tháng 1 | Tháng 2 | Tháng 3 |
|---|---|---|---|---|
| Trang đã lập chỉ mục | Search Console → Pages | | | |
| Lượt hiển thị (tổng / thương hiệu) | Search Console → Performance, lọc truy vấn chứa "giang sơn" | | | |
| Lượt nhấp (tổng / thương hiệu) | như trên | | | |
| CTR trung bình | như trên | | | |
| Vị trí trung bình truy vấn thương hiệu | như trên | | | |
| Phiên truy cập organic | GA4 → Acquisition, Organic Search | | | |
| Trang đích hàng đầu | GA4 → Landing page | | | |
| Bấm gọi / Zalo / liên hệ | GA4 → `phone_click`, `zalo_click`, `contact_click` | | | |
| Yêu cầu báo giá đã gửi | Workspace showroom / truy vấn SQL mục 4 | | | |
| Yêu cầu từ organic | `attribution.channel = organic_search` | | | |
| Tỷ lệ chuyển đổi lead organic | Yêu cầu organic ÷ phiên organic | | | |

Để trống cho tới khi có dữ liệu thật.

---

## 10. Bàn giao cho showroom

| Việc | Cách làm |
|---|---|
| Sửa thông tin doanh nghiệp, liên hệ | Báo LivLab; một chỗ trong `tenantConfig.ts` cập nhật cả trang, footer, dữ liệu có cấu trúc |
| Thêm, bớt sản phẩm | `data/demo/giangson-sanitaryware.json`; sitemap tự cập nhật |
| Xem yêu cầu báo giá | Workspace `/showroom` (cần tài khoản Showroom được gắn vào `workspace-demo-giangson`) |
| Xem SEO, lưu lượng | Search Console và GA4 của chủ doanh nghiệp (mục 3–4) |
| Giữ quyền tài sản số | Search Console, GA4, Google Business Profile, Facebook và Zalo nên do chủ doanh nghiệp sở hữu, LivLab chỉ được thêm làm người dùng |
