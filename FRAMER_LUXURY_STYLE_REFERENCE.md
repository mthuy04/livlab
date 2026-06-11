# LivLab — Framer Luxury Style Reference

## 1. Visual Goal

LivLab must visually follow the luxury Framer interior template direction inspired by **Interias** and **Moonline**.

The website should feel like:

* premium interior visual-commerce
* luxury showroom website
* editorial project gallery
* cinematic interior portfolio
* high-end product catalogue
* calm, refined, spacious, intentional
* beautiful enough for a startup/e-commerce presentation

The website should NOT feel like:

* generic SaaS landing page
* plain white/green website
* student project
* basic Tailwind layout
* green wellness brand
* real estate listing website
* cluttered marketplace
* admin dashboard on public homepage

LivLab is a visual-commerce platform, so the design must combine:

**Luxury interior visuals + product catalogue + interactive hotspots + quote request flow.**

---

## 2. Main References

### Reference 1: Interias

Use Interias as the primary style reference.

Key visual traits to follow:

* black/dark outer background around preview sections
* large rounded image cards
* warm interior photography
* soft blur/glow around images
* premium editorial layout
* large hero visual with overlay text
* project cards arranged like a visual gallery
* metadata labels on cards
* clean, minimal navigation
* strong visual hierarchy
* refined spacing and padding
* warm neutral colors
* not too many colors

Interias feels like:
“premium architecture/interior project showcase.”

LivLab should adapt this into:
“premium visual-commerce showroom platform.”

Use Interias style for:

* homepage hero
* concept cards
* concept library
* project/product gallery sections
* blog/social proof cards
* final CTA sections

---

### Reference 2: Moonline

Use Moonline as a secondary style reference.

Key visual traits to follow:

* cinematic hero
* very large typography
* darkened interior image background
* minimal navigation floating above image
* bold brand-like word treatment
* moody luxury atmosphere
* strong contrast
* immersive full-screen first impression
* fewer text blocks, more visual impact

Moonline feels more artistic and portfolio-driven.

Use Moonline carefully for:

* oversized typography
* cinematic hero feeling
* darker visual mood in selected sections
* dramatic spacing and image scale

Do NOT copy Moonline’s giant brand word directly.
Do NOT make LivLab look like only an interior design studio.

---

## 3. LivLab Design Formula

Use this formula:

**70% Interias + 20% Moonline + 10% Furnexa/NORDIQ**

Meaning:

* Interias = main layout, image cards, project gallery, premium visual structure
* Moonline = cinematic hero mood and oversized typography
* Furnexa/NORDIQ = product cards, catalogue, inquiry/quote flow

---

## 4. Color System

Use a luxury warm-neutral palette with dark contrast.

### Main colors

```css
--background-dark: #050505;
--background-charcoal: #11110F;
--background-ivory: #F4F0E8;
--background-stone: #E8E1D4;
--card-white: #FFFFFF;
--card-ivory: #F8F5EF;

--text-dark: #151713;
--text-light: #FFFFFF;
--text-muted: #7A746A;
--text-muted-light: rgba(255, 255, 255, 0.72);

--olive-deep: #26372B;
--olive-soft: #6F7F68;
--taupe: #B8AA98;
--copper: #C97855;
--border-warm: #DED6C8;
--border-dark: rgba(255, 255, 255, 0.18);
```

### Usage rules

Use:

* dark black/charcoal backgrounds for premium framing sections
* warm ivory/stone backgrounds for content sections
* white/ivory cards for product and quote forms
* deep olive for primary CTA
* copper for active nav, small metadata, hover accent
* warm muted gray for secondary text

Avoid:

* pure white everywhere
* too much green
* bright SaaS blue/green
* flat beige blocks
* heavy brown
* low contrast text
* neon colors

### Recommended page balance

* 35% dark cinematic sections
* 40% warm ivory/stone content sections
* 15% white product cards/forms
* 10% olive/copper accents

---

## 5. Typography System

Use a modern sans-serif such as Inter, Plus Jakarta Sans, or Geist.

Typography must feel editorial and premium.

### Hero heading

Desktop:

* font-size: 72px–112px
* font-weight: 800–950
* line-height: 0.9–1.02
* letter-spacing: -0.05em
* max-width: 900px

Mobile:

* font-size: 44px–60px
* line-height: 0.95–1.05

Example:

```text
Số hoá trải nghiệm
chọn mua nội thất.
```

### Section heading

* font-size: 44px–72px
* font-weight: 800–900
* line-height: 0.95–1.08
* letter-spacing: -0.04em

### Card title

* font-size: 22px–34px
* font-weight: 750–850
* line-height: 1.05–1.18

### Metadata labels

Use small uppercase labels.

* font-size: 11px–13px
* font-weight: 700
* letter-spacing: 0.14em–0.22em
* text-transform: uppercase
* color: copper / muted text

Examples:

```text
VISUAL COMMERCE · NỘI THẤT · SHOWROOM
PHÒNG TẮM · JAPANDI
30–60 TRIỆU · 5–7 M² · 8 SẢN PHẨM
```

---

## 6. Public Navbar Style

Navbar must feel premium and minimal.

### Public navbar

Guest/public navbar should include:

* Logo
* Trang chủ
* Khám phá dropdown

  * Concept
  * Sản phẩm
  * Combo phòng tắm
  * Cẩm nang
* Tra cứu báo giá
* Liên hệ
* Đăng nhập
* CTA: Yêu cầu báo giá

Do NOT show:

* Admin demo
* Admin dashboard
* Quản lý sản phẩm
* Quản lý lead

### Navbar visual style

Use one of these:

#### Option A: Interias-like transparent hero navbar

On dark hero:

* transparent
* white logo/text
* nav aligned top
* CTA with white or dark pill
* no heavy background block

#### Option B: sticky glass/ivory navbar after scroll

On light sections:

* warm ivory background
* subtle blur
* thin border-bottom
* logo dark olive/charcoal
* active link copper
* CTA deep olive with ivory text

Navbar should be minimal, not crowded.

---

## 7. Homepage Hero Direction

The homepage hero must be the strongest visual section.

Current split white layout is not acceptable.

Use an Interias/Moonline style hero.

### Preferred hero layout

Use a full-width or near full-screen interior/bathroom image.

Hero structure:

* dark cinematic background or large rounded image frame
* soft dark gradient overlay
* logo/nav on top
* large Vietnamese headline at bottom-left or left-middle
* short subheadline below
* CTA buttons
* small preview card at bottom-right

### Hero image

Use:

* luxury bathroom interior
* warm modern apartment bathroom
* interior showroom
* vanity / shower / tiles / mirror in real context
* warm lighting
* premium composition

Avoid:

* exterior houses
* random bedroom images
* empty white bathroom with no warmth
* generic stock photo feeling
* overexposed bright image

### Hero copy

Metadata:

```text
VISUAL COMMERCE · NỘI THẤT · SHOWROOM
```

Headline:

```text
Số hoá trải nghiệm
chọn mua nội thất.
```

Subheadline:

```text
Khám phá concept phòng, bấm vào từng sản phẩm thật và gửi yêu cầu báo giá cho showroom chỉ trong vài bước.
```

CTA:

```text
Khám phá concept
Yêu cầu báo giá
```

Text link:

```text
Xem combo phòng tắm
```

### Hero preview card

A small card should appear on image, similar to Interias project preview.

It should show:

* image thumbnail
* title: “Phòng tắm Japandi”
* tags: “8 sản phẩm · 30–60 triệu”
* CTA arrow

It should NOT look like a generic SaaS feature list.

---

## 8. Overall Page Layout

Use large editorial sections.

Preferred layouts:

* asymmetric grids
* image-led sections
* large cards
* horizontal galleries
* overlapping cards
* dark frame sections
* warm ivory content blocks
* fewer but more beautiful cards

Avoid:

* plain centered SaaS section after section
* too many small equal cards
* empty white space without composition
* generic icon cards
* dashboards on public homepage
* over-explaining with text

---

## 9. Concept Card Style

Concept cards should follow Interias project cards.

### Visual style

* large image
* rounded 28–36px
* dark or warm overlay when needed
* metadata on image or below image
* editorial title
* soft hover scale
* subtle shadow/glow
* fine warm border
* strong image crop

### Concept card content

Each card should include:

* room type
* style
* budget
* area
* product count
* save/favorite button
* CTA arrow

Example:

```text
PHÒNG TẮM · JAPANDI
Phòng tắm Japandi cho căn hộ
30–60 triệu · 5–7 m² · 8 sản phẩm
```

### Card layout inspiration

Use Interias project gallery layout:

* cards can vary slightly in size
* first card can be larger
* gallery should feel curated, not like a database table
* make visual hierarchy clear

---

## 10. Product Card Style

Product cards should follow Furnexa/NORDIQ luxury product-commerce style.

### Visual style

* clean product image
* warm ivory/white card
* rounded 24–32px
* subtle border
* spacious padding
* refined price display
* seller/showroom info
* compact CTA row

### Product card content

Each product card should include:

* product image
* category metadata
* product name
* brand/SKU
* price range
* material/finish
* availability
* showroom info
* buttons:

  * Thêm vào báo giá
  * Xem nhanh
  * So sánh

### Product card should not feel like Shopee.

It should feel like a premium catalogue/inquiry card.

---

## 11. Interactive Hotspot Viewer Style

This is LivLab’s core feature.

It must look premium and refined.

### Layout

* large image in a rounded frame
* product hotspot pins on image
* selected product panel beside or overlaid
* quote CTA
* seller/showroom info

### Hotspot pin

Use:

* small ivory/white circular pin
* deep olive center dot
* active copper ring
* subtle shadow

Avoid:

* huge pulsing circles
* bright colors
* noisy animation
* too many pins

### Product panel

Style as premium product card:

* small product thumbnail
* category label
* product name
* price range
* material
* finish
* showroom info
* availability badge
* CTA: “Thêm vào báo giá”

Panel should be elegant, not dashboard-like.

---

## 12. Small Bathroom Combo Section

This should feel like a campaign/service section, not a plain info block.

Use:

* large image
* package cards
* warm stone background
* premium CTA
* short copy
* editorial title

Title:

```text
Small Bathroom Makeover Combo
```

Vietnamese headline:

```text
Combo nâng cấp phòng tắm nhỏ cho căn hộ, nhà thuê và homestay.
```

Package cards:

* Tiết kiệm: dưới 30 triệu
* Cân bằng: 30–60 triệu
* Cao cấp: trên 60 triệu

Cards should look premium, not price-table SaaS.

---

## 13. Blog / Social Proof Card Style

Blog/social proof cards should look like magazine/editorial cards.

Use:

* large image or abstract visual
* category label
* title
* short excerpt
* reading time or metric
* soft border
* warm ivory background

Avoid:

* basic text-only cards
* generic icons
* too many colors

---

## 14. Trust / Privacy Section Style

Trust/privacy should feel elegant and reassuring.

Use:

* warm ivory or dark charcoal section
* 3–5 refined cards
* small icons only if tasteful
* concise text

Content:

* Thông tin báo giá rõ ràng
* Sản phẩm gắn với showroom/đối tác cụ thể
* Không bán dữ liệu khách hàng cho bên thứ ba
* Chỉ dùng thông tin để showroom liên hệ tư vấn
* Có thể yêu cầu xoá thông tin sau khi tư vấn

---

## 15. Role Separation

Public website must not expose admin management.

### Guest

Can see:

* Trang chủ
* Concept
* Sản phẩm
* Combo phòng tắm
* Cẩm nang
* Tra cứu báo giá
* Liên hệ
* Đăng nhập
* Yêu cầu báo giá

### Customer

Can see:

* saved concepts
* quote drawer
* account dropdown
* quote tracking
* logout

### Admin / Showroom

Must use separate admin layout/sidebar.

Admin pages should not appear in public navbar.

Admin access:

* through `/login`
* or subtle footer link “Khu vực showroom”

---

## 16. Admin Pages

Admin pages do not need Moonline/Interias cinematic style.

Admin should be:

* clean
* functional
* dashboard-like
* separate from public website
* professional

Use deep olive/ivory style but not cinematic hero.

---

## 17. Images and Assets

Use remote images only if reliable.

If image quality is poor, use fewer images but bigger and better.

Images should be:

* warm
* premium
* interior-focused
* product-in-context
* bathroom/showroom relevant

Avoid:

* exterior building
* random bedroom not related to commerce
* low-quality stock
* repeated same image everywhere

---

## 18. Components To Refactor

Refactor public-facing components:

* Navbar
* Homepage hero
* Featured concepts
* ConceptCard
* ProductCard
* InteractiveRoomViewer
* SmallBathroomCombo section
* BlogCard
* SocialProofCard
* FinalCTA
* Footer

Do NOT refactor logic-heavy admin/quote unless needed for visual consistency.

---

## 19. Implementation Constraints

Do not change:

* routes
* auth logic
* localStorage keys
* quote flow
* product data structure
* admin CRUD logic
* lead status logic
* CSV export logic

Only change:

* layout
* visual style
* component composition
* typography
* spacing
* image treatment
* card design
* public UI polish

---

## 20. Final Quality Bar

The final LivLab public website should look like:

**Interias/Moonline luxury interior template adapted into a Vietnamese visual-commerce platform.**

It should have:

* cinematic hero
* large interior imagery
* editorial typography
* premium project-style concept cards
* refined product cards
* elegant hotspot viewer
* warm ivory/stone/dark palette
* minimal public navigation
* clear quote CTAs
* no public admin clutter

It should not look like:

* a green SaaS landing page
* a plain white Tailwind project
* a student dashboard demo
* a real estate website
* a Shopee-style marketplace
* a generic bathroom catalogue

---

## 21. Design Command For AI

When applying this file, follow this instruction:

“Read this file carefully and use it as the source of truth for LivLab public UI. Refactor the public visual design to match Interias and Moonline luxury Framer template style while preserving all working e-commerce functionality.”
