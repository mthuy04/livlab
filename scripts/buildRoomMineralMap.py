"""Bake LivLab's seamless mineral fields (offline only, NumPy and Pillow)."""
from pathlib import Path

import numpy as np
from PIL import Image


def bake(size=768):
    rng = np.random.default_rng(29041)
    y, x = np.mgrid[:size, :size] / size

    def noise(nx, ny, u=x, v=y):
        grid = rng.random((ny, nx))
        a, b = u * nx, v * ny
        i, j = np.floor(a).astype(int), np.floor(b).astype(int)
        f, g = a - i, b - j
        f, g = f * f * (3 - 2 * f), g * g * (3 - 2 * g)
        top = grid[j % ny, i % nx] * (1 - f) + grid[j % ny, (i + 1) % nx] * f
        bottom = grid[(j + 1) % ny, i % nx] * (1 - f) + grid[(j + 1) % ny, (i + 1) % nx] * f
        return top * (1 - g) + bottom * g

    # Bedding and elongated pores in vein-cut travertine.
    bed = y + 0.035 * noise(3, 5) + 0.008 * noise(8, 13) + 0.002 * noise(37, 40)
    pores = np.clip((noise(110, 330, x, bed) - 0.69) * 4, 0, 1) ** 2
    limestone = (0.24 * noise(4, 10) + 0.33 * noise(5, 72, x, bed)
                 + 0.18 * noise(17, 168, x, bed) + 0.09 * noise(80, 290, x, bed) + 0.33 * pores)

    # Fine calcite fractures, broken by local changes in mineral density.
    u = x + 0.12 * noise(3, 4) + 0.032 * noise(9, 9) + 0.007 * noise(28, 31) + 0.002 * noise(88, 79)
    v = y + 0.09 * noise(3, 3) + 0.015 * noise(13, 9)
    ridge = np.abs(np.sin(np.pi * (2 * u + v + 0.44 * noise(3, 5))))
    secondary = np.abs(np.sin(np.pi * (3 * u - 2 * v + 0.30 * noise(5, 6))))
    calcite = (0.13 * np.exp(-8 * ridge) + 0.82 * np.exp(-68 * ridge)
               + 0.34 * np.exp(-95 * secondary)) * (0.18 + 0.82 * noise(10, 11))
    matrix = 0.35 * noise(5, 5) + 0.26 * noise(16, 19) + 0.18 * noise(58, 64) + 0.21 * noise(256, 254)
    fields = np.stack([limestone, calcite, matrix], axis=-1)
    levels = np.array([127, 63, 63])
    return Image.fromarray(np.uint8(255 * (np.round(np.clip(fields, 0, 1) * levels) / levels)))


if __name__ == '__main__':
    out = Path(__file__).resolve().parents[1] / 'public/room-studio/styles/minerals.webp'
    bake().save(out, lossless=True, method=6)
