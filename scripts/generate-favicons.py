#!/usr/bin/env python3
"""Generate the raster favicon set from an SVG master.

Usage: python3 generate-favicons.py <favicon.svg> <output-dir>

Produces, in <output-dir>:
  favicon.ico        (16, 32, 48 multi-size)
  apple-touch-icon.png (180x180)
  icon-192.png
  icon-512.png

Requires cairosvg + Pillow (see requirements.txt next to this script, or
install into a venv: `python3 -m venv .venv && .venv/bin/pip install
cairosvg pillow`). Re-run this any time favicon.svg changes -- the raster
files are generated artifacts, not hand-edited.
"""
import sys
from pathlib import Path

import cairosvg
from PIL import Image


def render_png(svg_path: Path, size: int) -> Image.Image:
    png_bytes = cairosvg.svg2png(url=str(svg_path), output_width=size, output_height=size)
    import io

    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    svg_path = Path(sys.argv[1]).resolve()
    out_dir = Path(sys.argv[2]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    ico_sizes = [16, 32, 48]
    ico_images = [render_png(svg_path, s) for s in ico_sizes]
    ico_images[0].save(
        out_dir / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )

    render_png(svg_path, 180).save(out_dir / "apple-touch-icon.png")
    render_png(svg_path, 192).save(out_dir / "icon-192.png")
    render_png(svg_path, 512).save(out_dir / "icon-512.png")

    print(f"Wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png to {out_dir}")


if __name__ == "__main__":
    main()
