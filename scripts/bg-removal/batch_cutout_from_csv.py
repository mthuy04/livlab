import csv
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image
from rembg import remove

CSV_PATH = Path("public/data/livlab-seed/livlab_verified_products_master.csv")
RAW_DIR = Path("public/images/products-raw")
CUTOUT_DIR = Path("public/images/products-cutout")
MAP_PATH = Path("lib/livlabProductCutouts.ts")

# Chỉ xử lý các nhóm cần demo trước cho đỡ lâu
TARGET_KEYWORDS = [
    "vòi", "faucet",
    "lavabo", "chậu", "basin", "sink",
    "bồn cầu", "toilet", "wc",
    "sen", "shower",
    "gương", "mirror",
]

# Giới hạn số ảnh để demo, muốn chạy hết thì đổi thành None
LIMIT = 20


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value, flags=re.UNICODE)
    value = re.sub(r"[\s_]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value[:100]


def pick_field(row, candidates):
    for c in candidates:
        if c in row and row[c] and row[c].strip():
            return row[c].strip()
    return ""


def is_target_product(row):
    text = " ".join([
        pick_field(row, ["id", "slug", "name", "category", "description"]),
    ]).lower()
    return any(k.lower() in text for k in TARGET_KEYWORDS)


def normalize_image_url(url: str) -> str:
    if not url:
        return ""

    # Nếu CSV có nhiều ảnh phân cách bằng | hoặc ,
    if "|" in url:
        url = url.split("|")[0].strip()
    elif "," in url and not url.startswith("data:image"):
        url = url.split(",")[0].strip()

    return url.strip()


def download_image(url: str, output_path: Path) -> bool:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        }

        r = requests.get(url, headers=headers, timeout=25)
        r.raise_for_status()

        content_type = r.headers.get("content-type", "")
        if "image" not in content_type:
            print(f"  SKIP not image: {content_type}")
            return False

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(r.content)
        return True

    except Exception as e:
        print(f"  DOWNLOAD FAILED: {e}")
        return False


def remove_bg(input_path: Path, output_path: Path) -> bool:
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with Image.open(input_path) as img:
            img = img.convert("RGBA")
            result = remove(img)
            result.save(output_path)

        return True

    except Exception as e:
        print(f"  REMBG FAILED: {e}")
        return False


def main():
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}")
        sys.exit(1)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CUTOUT_DIR.mkdir(parents=True, exist_ok=True)
    MAP_PATH.parent.mkdir(parents=True, exist_ok=True)

    processed = []
    failed = []

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            product_id = pick_field(row, ["id", "productId", "sku", "slug"])
            name = pick_field(row, ["name", "title", "productName"])
            image_url = normalize_image_url(
                pick_field(row, ["image", "imageUrl", "image_url", "thumbnail", "images"])
            )

            if not product_id or not image_url:
                continue

            if not is_target_product(row):
                continue

            if LIMIT is not None and len(processed) >= LIMIT:
                break

            safe_id = slugify(product_id)
            raw_path = RAW_DIR / f"{safe_id}.png"
            cutout_path = CUTOUT_DIR / f"{safe_id}.png"

            print(f"\nProcessing: {product_id}")
            print(f"  Name: {name}")
            print(f"  Image: {image_url}")

            if cutout_path.exists():
                print("  EXISTS cutout, skip")
                processed.append((product_id, f"/images/products-cutout/{safe_id}.png"))
                continue

            ok_download = download_image(image_url, raw_path)
            if not ok_download:
                failed.append((product_id, "download failed"))
                continue

            ok_cutout = remove_bg(raw_path, cutout_path)
            if not ok_cutout:
                failed.append((product_id, "remove bg failed"))
                continue

            processed.append((product_id, f"/images/products-cutout/{safe_id}.png"))
            print(f"  SAVED: {cutout_path}")

            # tránh bị web chặn request quá nhanh
            time.sleep(0.5)

    # Tạo file map TS
    lines = [
        "export const productCutoutMap: Record<string, string> = {",
    ]

    for product_id, path in processed:
        escaped_id = product_id.replace('"', '\\"')
        lines.append(f'  "{escaped_id}": "{path}",')

    lines += [
        "};",
        "",
        "export function getProductCutout(productId?: string | null) {",
        "  if (!productId) return null;",
        "  return productCutoutMap[productId] || null;",
        "}",
        "",
    ]

    MAP_PATH.write_text("\n".join(lines), encoding="utf-8")

    print("\n==============================")
    print(f"Done. Processed: {len(processed)}")
    print(f"Failed: {len(failed)}")
    print(f"Cutout folder: {CUTOUT_DIR}")
    print(f"Map file: {MAP_PATH}")

    if failed:
        print("\nFailed items:")
        for item in failed:
            print(" -", item)


if __name__ == "__main__":
    main()