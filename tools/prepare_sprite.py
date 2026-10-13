"""Adapt a generated sprite sheet to PachaByte's native pixel grid.

Usage:
  python -I tools/prepare_sprite.py INPUT OUTPUT --frame 16x16 --cols 4 [--rows 1]

The source may be any size (for example an 8x pixel-grid image from an image chat). The tool:
  1. keys a flat #FF00FF magenta background to transparent when the image has no real alpha,
  2. samples the centre of every logical pixel (nearest-neighbor, no blending),
  3. thresholds alpha to binary (0 or 255),
  4. writes the native-size sheet and prints a verification report.
The original file is never modified.
"""
import argparse
import sys

from PIL import Image

MAGENTA = (255, 0, 255)


def key_magenta(img: Image.Image, tolerance: int = 60) -> tuple[Image.Image, int]:
    """Turn near-magenta pixels transparent; returns the image and how many pixels were keyed."""
    px = img.load()
    keyed = 0
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if abs(r - MAGENTA[0]) + abs(g - MAGENTA[1]) + abs(b - MAGENTA[2]) <= tolerance:
                px[x, y] = (0, 0, 0, 0)
                keyed += 1
    return img, keyed


def has_real_alpha(img: Image.Image) -> bool:
    return img.getchannel("A").getextrema()[0] < 255


def sample(img: Image.Image, width: int, height: int) -> Image.Image:
    """Nearest-neighbor sample at each logical pixel centre, with binary alpha."""
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sx, sy = img.width / width, img.height / height
    src, dst = img.load(), out.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = src[min(img.width - 1, int((x + 0.5) * sx)), min(img.height - 1, int((y + 0.5) * sy))]
            dst[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return out


def frame_report(sheet: Image.Image, fw: int, fh: int, cols: int, rows: int) -> list[str]:
    lines, alpha = [], sheet.getchannel("A")
    for row in range(rows):
        for col in range(cols):
            box = (col * fw, row * fh, (col + 1) * fw, (row + 1) * fh)
            bounds = alpha.crop(box).getbbox()
            if not bounds:
                lines.append(f"frame {row},{col}: EMPTY")
                continue
            x0, y0, x1, y1 = bounds
            touches = [side for side, hit in (("left", x0 == 0), ("top", y0 == 0), ("right", x1 == fw), ("bottom", y1 == fh)) if hit]
            note = f"  WARNING touches {'/'.join(touches)} edge (possible crop)" if touches else ""
            lines.append(f"frame {row},{col}: occupied ({x0},{y0})-({x1},{y1}) bottom row {y1}{note}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--frame", required=True, help="native frame size WxH, e.g. 16x16")
    parser.add_argument("--cols", type=int, default=1)
    parser.add_argument("--rows", type=int, default=1)
    args = parser.parse_args()

    fw, fh = (int(v) for v in args.frame.lower().split("x"))
    img = Image.open(args.input).convert("RGBA")
    keyed = 0
    if not has_real_alpha(img):
        img, keyed = key_magenta(img)
    native = sample(img, fw * args.cols, fh * args.rows)
    native.save(args.output)

    colors = {p[:3] for p in native.getdata() if p[3]}
    scale_x, scale_y = img.width / native.width, img.height / native.height
    print(f"source {img.width}x{img.height} -> native {native.width}x{native.height} (scale {scale_x:.2f}x{scale_y:.2f})")
    if abs(scale_x - round(scale_x)) > 0.01 or abs(scale_y - round(scale_y)) > 0.01:
        print("WARNING non-integer scale: check the frame size and grid; result may lose pixels")
    print(f"magenta keyed pixels: {keyed}; opaque colors: {len(colors)}")
    for line in frame_report(native, fw, fh, args.cols, args.rows):
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
