import sys
from pathlib import Path
from rembg import remove
from PIL import Image

def main():
    if len(sys.argv) < 3:
        print("Usage: python remove_bg_one.py <input_image> <output_png>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    if not input_path.exists():
        print(f"Input not found: {input_path}")
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        result = remove(img)
        result.save(output_path)

    print(f"Saved cutout: {output_path}")

if __name__ == "__main__":
    main()
