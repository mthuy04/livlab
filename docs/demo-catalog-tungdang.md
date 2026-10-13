# Tùng Đăng sanitaryware demo catalogue

Internal demo data for an **unsigned** showroom. Nothing in the product, the
code or the copy claims a partnership, and the tenant it feeds is named
"Showroom Demo" rather than the source's brand.

## Running the import

```bash
node scripts/import-tungdang-sanitaryware.mjs --pages 8
```

Writes `data/demo/tungdang-sanitaryware.json`. Nothing is written to the
database — the demo tenant reads the fixture directly.

## What is crawled

Only these five public category paths and the `/san-pham/` product pages they
link to, paginated:

- `/danh-muc-san-pham/bon-cau/`
- `/danh-muc-san-pham/lavabo/`
- `/danh-muc-san-pham/voi-sen-tam/`
- `/danh-muc-san-pham/bon-tam/`
- `/danh-muc-san-pham/guong-va-phu-kien/`

`robots.txt` at the source disallows only `/wp-admin/`. Kitchen appliances are
excluded by name — cooktops, hoods, ovens, dishwashers, water filters, kitchen
sinks and kitchen faucets never enter the fixture.

## What is extracted

Facts only: name, brand, model code, category, prices, dimensions, colour,
material, finish, origin, warranty, seat/flush/rough-in, technologies, image
and drawing URLs, `sourceUrl`, `sourceCheckedAt`.

Marketing prose is **not** copied. `shortDescription` is composed in the script
from the extracted fields.

## Prices

`referencePrice` is the struck-through list price, `showroomPrice` the live
one. Both are a snapshot: **giá lấy tại thời điểm đồng bộ dữ liệu**, recorded in
`sourceCheckedAt`. The customer-facing catalogue says "Giá tham khảo" and
leaves the final figure to the showroom. The source's promotional claims are
not reproduced.

## Imagery

Referenced by source URL for an internal demo only. **LivLab does not own these
images.** Reuse or rehosting rights must be confirmed before any public
commercial launch.

A product is only given a photo whose filename carries its own model code, so a
card cannot show a sibling model's picture; a product with no such image is
excluded rather than shown the wrong one.

## Quality gates

A product enters the fixture only with a name, a brand, a category and a
matching image. Deduplication is by brand + normalised model code, so
`AC989VN` and `AC-989VN` are one product; the original code is kept verbatim.

## Image quality

`python3 scripts/audit_catalog_images.py` opens every image the storefront
exposes, for every tenant, and files a status. It measures rather than guesses:
how white the ring around the product is, how much colour and dark ink sit in
that ring, how much ink runs along the bottom edge, and the pixel size.

The question it answers is the one a grid cares about — *is this an isolated
product on a clean plate* — not *does this contain a watermark*, which needs
OCR. A bouquet, a dealer phone number, a QR code, a model-code caption and a
sky-blue advert all put colour or ink in the ring; a product's own badge sits
in the middle, where it belongs.

A product whose only image is rejected is **withheld from the storefront grid**
and kept in the data. `/api/storefront/products?quality=all` returns everything
for cleanup work. Where the importer already captured a cleaner sibling, the
catalogue substitutes it automatically.

No image is ever edited. Watermarks are not painted out, logos are not removed
and missing product area is never invented — a rejected asset is replaced,
withheld, or named here as a data-quality issue.
