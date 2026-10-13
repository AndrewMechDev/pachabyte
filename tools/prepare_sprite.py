"""Adapt a generated sprite sheet to PachaByte's native pixel grid.

Grid mode (sources drawn on an exact grid):
  python -I tools/prepare_sprite.py INPUT OUTPUT --frame 16x16 --cols 4 [--rows 1]

Auto mode (sources whose frames are not on a uniform cell grid):
  python -I tools/prepare_sprite.py INPUT OUTPUT --auto [--row N] [--target WxH] [--factor F] [--colors 8]
      [--detail 0.3] [--merge PX] [--anchor center|bottom]

Self-check of the auto mode:
  python -I tools/prepare_sprite.py --self-test

Grid mode:
  1. keys a flat #FF00FF magenta background to transparent when the image has no real alpha,
  2. samples the centre of every logical pixel (nearest-neighbor, no blending),
  3. thresholds alpha to binary (0 or 255),
  4. writes the native-size sheet and prints a verification report.

Auto mode:
  1. keys magenta when there is no real alpha, then picks a binary alpha threshold from the alpha histogram:
     at least 128 (a pixel more than half covered belongs to the shape) and above every value found in the
     soft halo population (semi-transparent pixels farther than HALO_DISTANCE px from any solid pixel),
  2. splits sprites by transparent gaps (connected components, merged when closer than --merge px, default
     4 art pixels, so loose particles join their sprite) and groups them into rows,
  3. estimates the source's art-pixel size from the boundaries of its colour runs (the pitch whose run
     boundaries line up best, preferring the largest such pitch so harmonics are not chosen),
  4. samples every sprite at its art-pixel centres (nearest-neighbor, binary alpha) to get its natural size,
  5. reduces each row's palette (one sprite type) to --colors without dithering,
  6. if the natural size exceeds --target, reduces every frame by the same factor (the smallest whole factor
     that fits, or --factor) with a coverage vote over the source pixels mapped to the row palette: no new
     colors, binary alpha, the outline redrawn, small bright details and loose particles kept; it says so,
  7. places all frames of the row in equal cells, aligning the centre of each frame's main body (largest
     connected part) to the same cell point (cell centre, or bottom-centre with --anchor bottom).
The original file is never modified.
"""
import argparse
import cmath
import math
import random
import sys
import tempfile
from collections import Counter, deque
from pathlib import Path

from PIL import Image

MAGENTA = (255, 0, 255)
HALO_DISTANCE = 4
EDGE_DIFF = 60


def pixels(img: Image.Image) -> list:
    """Flat pixel list (get_flattened_data on Pillow >= 12, getdata before)."""
    return list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata())


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


# ---------------------------------------------------------------- auto mode
def alpha_threshold(img: Image.Image) -> tuple[int, dict]:
    """Binary alpha threshold justified by the histogram: >= 128 and above the soft halo population."""
    w, h = img.size
    a = img.getchannel("A").load()
    solid = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if a[x, y] >= 200:
                solid[y * w + x] = 1
    # Distance test by a separable max filter of radius HALO_DISTANCE.
    near_row = bytearray(w * h)
    for y in range(h):
        row, last = y * w, -10 ** 9
        for x in range(w):
            if solid[row + x]:
                last = x
            if x - last <= HALO_DISTANCE:
                near_row[row + x] = 1
        last = 10 ** 9
        for x in range(w - 1, -1, -1):
            if solid[row + x]:
                last = x
            if last - x <= HALO_DISTANCE:
                near_row[row + x] = 1
    near = bytearray(w * h)
    for x in range(w):
        last = -10 ** 9
        for y in range(h):
            if near_row[y * w + x]:
                last = y
            if y - last <= HALO_DISTANCE:
                near[y * w + x] = 1
        last = 10 ** 9
        for y in range(h - 1, -1, -1):
            if near_row[y * w + x]:
                last = y
            if last - y <= HALO_DISTANCE:
                near[y * w + x] = 1
    halo, edge = Counter(), Counter()
    for y in range(h):
        for x in range(w):
            v = a[x, y]
            if 0 < v < 255:
                (edge if near[y * w + x] else halo)[v] += 1
    halo_total = sum(halo.values())
    # 99.9th percentile of the halo population, so a handful of stray values cannot raise the threshold.
    ceiling, seen = 0, 0
    for v in sorted(halo):
        seen += halo[v]
        ceiling = v
        if seen >= 0.999 * halo_total:
            break
    threshold = max(128, ceiling + 1)
    stats = {"halo_pixels": halo_total, "halo_ceiling": ceiling, "halo_max": max(halo) if halo else 0,
             "edge_pixels": sum(edge.values()), "edge_below": sum(c for v, c in edge.items() if v < threshold)}
    return threshold, stats


def components(mask: bytearray, w: int, h: int) -> list[dict]:
    """8-connected components of a binary mask: bbox, area and pixel list."""
    seen = bytearray(w * h)
    out = []
    for start in range(w * h):
        if not mask[start] or seen[start]:
            continue
        seen[start] = 1
        queue, pixels = deque([start]), []
        x0 = y0 = 10 ** 9
        x1 = y1 = -1
        while queue:
            i = queue.popleft()
            pixels.append(i)
            x, y = i % w, i // w
            x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= h:
                    continue
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if 0 <= nx < w:
                        j = ny * w + nx
                        if mask[j] and not seen[j]:
                            seen[j] = 1
                            queue.append(j)
        out.append({"box": [x0, y0, x1 + 1, y1 + 1], "area": len(pixels), "pixels": pixels})
    return out


def box_gap(a: list[int], b: list[int]) -> int:
    dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
    dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
    return max(dx, dy)


def merge_sprites(parts: list[dict], distance: float) -> list[dict]:
    """Union parts whose boxes are closer than `distance` px; the largest part is each sprite's main body."""
    sprites = [{"box": list(p["box"]), "parts": [p]} for p in parts]
    changed = True
    while changed:
        changed = False
        for i in range(len(sprites)):
            for j in range(i + 1, len(sprites)):
                if box_gap(sprites[i]["box"], sprites[j]["box"]) <= distance:
                    a, b = sprites[i], sprites.pop(j)
                    a["box"] = [min(a["box"][0], b["box"][0]), min(a["box"][1], b["box"][1]), max(a["box"][2], b["box"][2]), max(a["box"][3], b["box"][3])]
                    a["parts"] += b["parts"]
                    changed = True
                    break
            if changed:
                break
    for s in sprites:
        s["area"] = sum(p["area"] for p in s["parts"])
        s["main"] = max(s["parts"], key=lambda p: p["area"])["box"]
    return sprites


def group_rows(sprites: list[dict]) -> list[list[dict]]:
    """Rows by vertical overlap, top to bottom; sprites left to right inside a row."""
    rows: list[list[dict]] = []
    for s in sorted(sprites, key=lambda s: (s["box"][1] + s["box"][3]) / 2):
        cy = (s["box"][1] + s["box"][3]) / 2
        for row in rows:
            top, bottom = min(r["box"][1] for r in row), max(r["box"][3] for r in row)
            if top <= cy <= bottom:
                row.append(s)
                break
        else:
            rows.append([s])
    return [sorted(row, key=lambda s: s["box"][0]) for row in rows]


def color_diff(a: tuple, b: tuple) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def run_boundaries(img: Image.Image, box: list[int], threshold: int) -> tuple[Counter, Counter]:
    """Positions where a colour run ends (colour change or alpha edge), per axis, inside `box`."""
    px = img.load()
    x0, y0, x1, y1 = box
    ex, ey = Counter(), Counter()
    for y in range(y0, y1):
        prev = px[x0, y]
        for x in range(x0 + 1, x1):
            cur = px[x, y]
            if (prev[3] >= threshold) != (cur[3] >= threshold) or (cur[3] >= threshold and color_diff(prev, cur) > EDGE_DIFF):
                ex[x] += 1
            prev = cur
    for x in range(x0, x1):
        prev = px[x, y0]
        for y in range(y0 + 1, y1):
            cur = px[x, y]
            if (prev[3] >= threshold) != (cur[3] >= threshold) or (cur[3] >= threshold and color_diff(prev, cur) > EDGE_DIFF):
                ey[y] += 1
            prev = cur
    return ex, ey


def coherence(edges: Counter, pitch: float) -> tuple[float, float]:
    """How well run boundaries line up on a grid of `pitch` (0..1) and the grid's offset in px."""
    total = sum(edges.values())
    if not total:
        return 0.0, 0.0
    s = sum(c * cmath.exp(2j * math.pi * pos / pitch) for pos, c in edges.items())
    offset = (cmath.phase(s) / (2 * math.pi) * pitch) % pitch
    return abs(s) / total, offset


def estimate_pitch(regions: list[tuple[Counter, Counter]], low: float = 3.0, high: float = 64.0, step: float = 0.05) -> tuple[float, float]:
    """Art-pixel size shared by every region (square pixels; each region may sit on its own grid offset)."""
    weight = sum(sum(ex.values()) + sum(ey.values()) for ex, ey in regions) or 1

    def score(p: float) -> float:
        return sum(coherence(ex, p)[0] * sum(ex.values()) + coherence(ey, p)[0] * sum(ey.values()) for ex, ey in regions) / weight

    scores = []
    p = low
    while p <= high:
        scores.append((score(p), p))
        p += step
    best, base = max(scores)
    # A grid of pitch p also aligns at p/2, p/3...: walk up the multiples of the best pitch and keep the largest
    # one that still aligns (local maximum within 3 %), which is the real art pixel rather than a harmonic.
    chosen, k = base, 2
    while base * k <= high:
        lo, hi = base * k * 0.97, base * k * 1.03
        local = max(((r, p) for r, p in scores if lo <= p <= hi), default=(0.0, 0.0))
        if local[0] >= 0.85 * best:
            chosen = local[1]
        k += 1
    fine = max((score(q), q) for q in [chosen - step + j * step / 10 for j in range(21)])
    return fine[1], fine[0]


def sample_sprite(img: Image.Image, box: list[int], pitch: float, ox: float, oy: float, threshold: int) -> tuple[Image.Image, int, int]:
    """Nearest-neighbor sample at art-pixel centres covering `box`; returns the image and its art-grid origin."""
    px = img.load()
    k0 = math.floor((box[0] - ox) / pitch)
    k1 = math.ceil((box[2] - ox) / pitch)
    j0 = math.floor((box[1] - oy) / pitch)
    j1 = math.ceil((box[3] - oy) / pitch)
    out = Image.new("RGBA", (k1 - k0, j1 - j0), (0, 0, 0, 0))
    dst = out.load()
    for j in range(j0, j1):
        for k in range(k0, k1):
            x = int(ox + (k + 0.5) * pitch)
            y = int(oy + (j + 0.5) * pitch)
            if 0 <= x < img.width and 0 <= y < img.height:
                r, g, b, a = px[x, y]
                if a >= threshold:
                    dst[k - k0, j - j0] = (r, g, b, 255)
    return out, k0, j0


def quantize(frames: list[Image.Image], colors: int) -> list[Image.Image]:
    """One shared palette of at most `colors` opaque colors for all frames, no dithering; alpha stays binary.
    Agglomerative: near-identical colours are binned first, then the cheapest pair merges until `colors` remain.
    The cost is mostly colour distance, so a rare but distinct colour (an eye, a glint, a glowing vent) is kept
    instead of being absorbed by the body colour as median cut would do."""
    opaque = Counter(p[:3] for f in frames for p in pixels(f) if p[3])
    if len(opaque) <= colors:
        return frames
    bins: dict[tuple, list] = {}
    for c, n in opaque.items():
        key = tuple(v // 12 for v in c)
        b = bins.setdefault(key, [0, 0, 0, 0, []])
        b[0] += c[0] * n; b[1] += c[1] * n; b[2] += c[2] * n; b[3] += n; b[4].append(c)
    clusters = [[b[0] / b[3], b[1] / b[3], b[2] / b[3], b[3], b[4]] for b in bins.values()]
    # Low-population noise bins (under 0.1 % of pixels) merge into their nearest neighbour first.
    total = sum(opaque.values())

    def dist(a: list, b: list) -> float:
        # Weighted RGB distance, closer to perceived difference than plain RGB.
        dr, dg, db = a[0] - b[0], a[1] - b[1], a[2] - b[2]
        return 2 * dr * dr + 4 * dg * dg + 3 * db * db

    def cost(a: list, b: list) -> float:
        # Distance softened by population (square root of Ward's term): close rare shades merge with each other
        # before two well-populated body shades merge, yet a distinct rare colour still costs a lot to absorb.
        return dist(a, b) * math.sqrt(a[3] * b[3] / (a[3] + b[3]))

    def merge(i: int, j: int) -> None:
        a, b = clusters[i], clusters.pop(j)
        n = a[3] + b[3]
        clusters[i] = [(a[0] * a[3] + b[0] * b[3]) / n, (a[1] * a[3] + b[1] * b[3]) / n, (a[2] * a[3] + b[2] * b[3]) / n, n, a[4] + b[4]]

    while True:
        small = [k for k, c in enumerate(clusters) if c[3] < 0.001 * total]
        if not small or len(clusters) <= colors:
            break
        k = small[0]
        j = min((m for m in range(len(clusters)) if m != k), key=lambda m: dist(clusters[k], clusters[m]))
        i, j = (j, k) if j < k else (k, j)
        merge(i, j) if clusters[i][3] >= clusters[j][3] else merge(i, j)
    while len(clusters) > colors:
        best = min(((cost(clusters[i], clusters[j]), i, j) for i in range(len(clusters)) for j in range(i + 1, len(clusters))))
        merge(best[1], best[2])
    # Each cluster is drawn with its most frequent member colour (a real source colour, not an average).
    lut = {}
    for c in clusters:
        rep = max(c[4], key=lambda m: opaque[m])
        for m in c[4]:
            lut[m] = rep
    out = []
    for f in frames:
        g = f.copy()
        g.putdata([(*lut[p[:3]], 255) if p[3] else (0, 0, 0, 0) for p in pixels(f)])
        out.append(g)
    return out


def palette_crop(img: Image.Image, region: tuple[float, float, float, float], palette: list[tuple], threshold: int) -> Image.Image:
    """Source pixels inside `region` mapped to the nearest palette colour, binary alpha."""
    x0, y0 = max(0, math.floor(region[0])), max(0, math.floor(region[1]))
    x1, y1 = min(img.width, math.ceil(region[2])), min(img.height, math.ceil(region[3]))
    src = img.load()
    out = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    dst, cache = out.load(), {}
    for y in range(y0, y1):
        for x in range(x0, x1):
            p = src[x, y]
            if p[3] < threshold:
                continue
            c = cache.get(p[:3])
            if c is None:
                c = cache[p[:3]] = min(palette, key=lambda q: 2 * (q[0] - p[0]) ** 2 + 4 * (q[1] - p[1]) ** 2 + 3 * (q[2] - p[2]) ** 2)
            dst[x - x0, y - y0] = (*c, 255)
    return out


def boundary(img: Image.Image) -> list[tuple[int, int]]:
    """Opaque pixels with a transparent (or outside) 4-neighbour."""
    w, h = img.size
    a = img.getchannel("A").load()
    clear = lambda x, y: not (0 <= x < w and 0 <= y < h) or a[x, y] == 0
    return [(x, y) for y in range(h) for x in range(w) if a[x, y] and (clear(x - 1, y) or clear(x + 1, y) or clear(x, y - 1) or clear(x, y + 1))]


def outline_color(frames: list[Image.Image]) -> tuple | None:
    """The colour drawn around the silhouettes, when one colour holds most of their boundary."""
    edge = Counter(f.getpixel(p)[:3] for f in frames for p in boundary(f))
    if not edge:
        return None
    color, count = edge.most_common(1)[0]
    return color if count >= 0.4 * sum(edge.values()) else None


REDUCE_COVERAGE = 0.4  # thin parts (cables, tips) survive a whole-factor reduction; 0.5 would erase 1-px lines at 3x
RARE_SHARE, RARE_COVERAGE = 0.06, 0.25  # a colour under 6 % of the frame survives at the edge from 25 % coverage
RARITY = 0.3  # vote weight = coverage x (1 / colour share) ** RARITY: small bright details survive, the body is not speckled


def reduce_frame(img: Image.Image, factor: float, outline: tuple | None = None, detail: float = RARITY) -> Image.Image:
    """Pixel-art reduction by `factor` with no new colours and binary alpha:
    - an output pixel is opaque when at least REDUCE_COVERAGE of its source area is opaque,
    - its colour is the coverage vote weighted by rarity ((1 / share of the frame) ** RARITY), so small
      bright details such as eyes, cracks and vents are not outvoted by the large body colour,
    - an edge pixel below that coverage still takes a rare colour (under RARE_SHARE of the frame) covering at
      least RARE_COVERAGE, so thin bright edge lines are not erased,
    - the silhouette is re-outlined with the source's outline colour (1 px), which a vote would thin out,
      except where a rare detail colour sits on the edge,
    - small loose parts (particles) that would vanish keep one pixel at their centre."""
    if factor <= 1.0:
        return img
    w, h = max(1, math.ceil(img.width / factor - 1e-9)), max(1, math.ceil(img.height / factor - 1e-9))
    src, out = img.load(), Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()
    share = Counter(p[:3] for p in pixels(img) if p[3])
    total = sum(share.values()) or 1
    rarity = {c: (total / n) ** detail for c, n in share.items()}
    for v in range(h):
        for u in range(w):
            votes, cover, opaque, area = Counter(), Counter(), 0.0, 0.0
            fx0, fx1, fy0, fy1 = u * factor, (u + 1) * factor, v * factor, (v + 1) * factor
            for y in range(int(fy0), math.ceil(fy1)):
                wy = min(fy1, y + 1) - max(fy0, y)
                for x in range(int(fx0), math.ceil(fx1)):
                    wgt = wy * (min(fx1, x + 1) - max(fx0, x))
                    area += wgt
                    if x < img.width and y < img.height and src[x, y][3]:
                        c = src[x, y][:3]
                        opaque += wgt
                        cover[c] += wgt
                        votes[c] += wgt * rarity[c]
            if votes and opaque >= REDUCE_COVERAGE * area:
                dst[u, v] = (*votes.most_common(1)[0][0], 255)
            else:
                # A thin rare colour on the silhouette edge (an echo line, a glowing tip) keeps its pixel.
                rare = [c for c, a in cover.items() if share[c] < RARE_SHARE * total and a >= RARE_COVERAGE * area]
                if rare:
                    dst[u, v] = (*max(rare, key=lambda c: cover[c]), 255)
    if outline is not None:
        for p in boundary(out):
            # Rare details on the edge (glowing tips, echo lines) stay; only body colours become outline.
            if share[dst[p][:3]] >= RARE_SHARE * total:
                dst[p] = (*outline, 255)
    # Loose particles: keep one pixel for every small source part that left nothing behind.
    a = img.getchannel("A")
    mask = bytearray(1 if v else 0 for v in pixels(a))
    for part in components(mask, img.width, img.height):
        if part["area"] > 2 * factor * factor:
            continue
        x0, y0, x1, y1 = part["box"]
        u0, v0 = int(x0 / factor), int(y0 / factor)
        u1, v1 = min(w, math.ceil(x1 / factor)), min(h, math.ceil(y1 / factor))
        if any(dst[u, v][3] for v in range(v0, v1) for u in range(u0, u1)):
            continue
        cx, cy = min(w - 1, int((x0 + x1) / 2 / factor)), min(h - 1, int((y0 + y1) / 2 / factor))
        color = Counter(src[i % img.width, i // img.width][:3] for i in part["pixels"]).most_common(1)[0][0]
        dst[cx, cy] = (*color, 255)
    return out


def auto_prepare(img: Image.Image, row: int | None = None, target: tuple[int, int] | None = None, colors: int = 8,
                 merge: float | None = None, anchor: str = "center", factor: float | None = None, detail: float = RARITY, log=print) -> tuple[Image.Image, tuple[int, int], list[dict]]:
    img = img.convert("RGBA")
    keyed = 0
    if not has_real_alpha(img):
        img, keyed = key_magenta(img)
    threshold, stats = alpha_threshold(img)
    log(f"source {img.width}x{img.height}; magenta keyed pixels: {keyed}")
    log(f"alpha threshold {threshold}: halo population {stats['halo_pixels']} px (ceiling {stats['halo_ceiling']}, max {stats['halo_max']}), "
        f"{stats['edge_below']} of {stats['edge_pixels']} antialiased edge px fall below it")
    w, h = img.size
    a = img.getchannel("A").load()
    mask = bytearray(1 if a[i % w, i // w] >= threshold else 0 for i in range(w * h))
    parts = components(mask, w, h)
    # The pitch is shared, but every large part (a body, not a particle) may sit on its own grid offset.
    largest = max(p["area"] for p in parts)
    bodies = [p for p in parts if p["area"] >= 0.05 * largest]
    pitch, quality = estimate_pitch([run_boundaries(img, p["box"], threshold) for p in bodies])
    log(f"estimated art pixel: {pitch:.2f} px from {len(bodies)} bodies (boundary alignment {quality:.2f})")
    distance = merge if merge is not None else 4 * pitch
    noise = 0.25 * pitch * pitch
    sprites = [s for s in merge_sprites(parts, distance) if s["area"] >= noise]
    rows = group_rows(sprites)
    log(f"merge distance {distance:.0f} px: {len(parts)} parts -> {len(sprites)} sprites in {len(rows)} rows {[len(r) for r in rows]}")
    chosen = rows if row is None else [rows[row]]
    if row is not None and len(chosen[0]) == 0:
        raise SystemExit("row has no sprites")
    frames = [s for r in chosen for s in r]
    row_of = [i for i, r in enumerate(chosen) for _ in r]
    naturals = []
    for s in frames:
        sx, sy = run_boundaries(img, s["box"], threshold)
        _, ox = coherence(sx, pitch)
        _, oy = coherence(sy, pitch)
        nat, k0, j0 = sample_sprite(img, s["box"], pitch, ox, oy, threshold)
        s["grid"] = (ox, oy, k0, j0)
        # Main-body centre in the sampled sprite's coordinates.
        mb = s["main"]
        s["anchor"] = (((mb[0] + mb[2]) / 2 - ox) / pitch - k0, ((mb[1] + mb[3]) / 2 - oy) / pitch - j0, (mb[3] - oy) / pitch - j0)
        naturals.append(nat)
    # One palette per row: each row is one sprite type (an icon, a bug form), so --colors limits each type.
    for r in range(len(chosen)):
        idx = [i for i, ri in enumerate(row_of) if ri == r]
        for i, q in zip(idx, quantize([naturals[i] for i in idx], colors)):
            naturals[i] = q
    occupied = [n.getchannel("A").getbbox() for n in naturals]
    nat_w = max(b[2] - b[0] for b in occupied)
    nat_h = max(b[3] - b[1] for b in occupied)
    if factor is None:
        factor = 1.0
        if target and (nat_w > target[0] or nat_h > target[1]):
            # Smallest whole factor that fits: every output pixel then covers a whole block of art pixels.
            factor = float(math.ceil(max(nat_w / target[0], nat_h / target[1]) - 1e-9))
    if factor > 1:
        size = f"{math.ceil(nat_w / factor)}x{math.ceil(nat_h / factor)}"
        log(f"natural size {nat_w}x{nat_h}" + (f" exceeds target {target[0]}x{target[1]}" if target else "") + f": reducing by {factor:g} to about {size} (coverage vote)")
    else:
        log(f"natural size {nat_w}x{nat_h} fits" + (f" target {target[0]}x{target[1]}" if target else ""))
    # Each row (sprite type) keeps its own outline colour.
    outlines = {r: outline_color([n for k, n in enumerate(naturals) if row_of[k] == r]) if factor > 1 else None for r in range(len(chosen))}
    for r, c in outlines.items():
        if c:
            log(f"row {r}: outline colour #{c[0]:02x}{c[1]:02x}{c[2]:02x} is redrawn around the reduced silhouettes")
    reduced = []
    for i, (n, s, b) in enumerate(zip(naturals, frames, occupied)):
        crop = n.crop(b)
        ax, ay = s["anchor"][0] - b[0], s["anchor"][1] - b[1]
        if factor > 1:
            # The vote reads the source pixels themselves (mapped to the row palette), not the centre samples:
            # thin details that sit off the art grid (an echo line, a crack) still count with their real coverage.
            row_colors = sorted({p[:3] for k, q in enumerate(naturals) if row_of[k] == row_of[i] for p in pixels(q) if p[3]})
            ox, oy, k0, j0 = s["grid"]
            region = (ox + (k0 + b[0]) * pitch, oy + (j0 + b[1]) * pitch, ox + (k0 + b[2]) * pitch, oy + (j0 + b[3]) * pitch)
            r = reduce_frame(palette_crop(img, region, row_colors, threshold), pitch * factor, outlines[row_of[i]], detail)
        else:
            r = crop
        reduced.append((r, ax / factor, ay / factor, (s["anchor"][2] - b[1]) / factor))
    # Equal cells: target size, or the smallest cell holding every frame around the shared anchor.
    cell_w = target[0] if target else max(r.width for r, *_ in reduced)
    cell_h = target[1] if target else max(r.height for r, *_ in reduced)
    if not target:
        cell_w = max(cell_w, math.ceil(max(2 * max(ax, r.width - ax) for r, ax, _, _ in reduced)))
        cell_h = max(cell_h, math.ceil(max(2 * max(ay, r.height - ay) for r, _, ay, _ in reduced)))
    sheet = Image.new("RGBA", (cell_w * len(reduced), cell_h), (0, 0, 0, 0))
    report = []
    for i, (r, ax, ay, ab) in enumerate(reduced):
        px = round(cell_w / 2 - ax)
        py = round(cell_h / 2 - ay) if anchor == "center" else round(cell_h - ab)
        # Keep the frame inside its cell when the anchor would push it out (only possible for lopsided frames).
        px = min(max(px, 0), cell_w - r.width) if r.width <= cell_w else (cell_w - r.width) // 2
        py = min(max(py, 0), cell_h - r.height) if r.height <= cell_h else (cell_h - r.height) // 2
        tile = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        tile.alpha_composite(r, (max(0, px), max(0, py)), (max(0, -px), max(0, -py)))
        sheet.alpha_composite(tile, (i * cell_w, 0))
        bounds = tile.getchannel("A").getbbox()
        colors_used = len({p[:3] for p in pixels(tile) if p[3]})
        lost = r.width > cell_w or r.height > cell_h
        src = frames[i]["box"]
        report.append({"frame": i, "source": src, "bounds": bounds, "colors": colors_used, "cropped": lost,
                       "scale": pitch * factor})
        touches = [side for side, hit in (("left", bounds[0] == 0), ("top", bounds[1] == 0), ("right", bounds[2] == cell_w), ("bottom", bounds[3] == cell_h)) if hit] if bounds else []
        note = (" WARNING cropped" if lost else "") + (f" touches {'/'.join(touches)}" if touches else "")
        log(f"frame {i}: source box {tuple(src)} -> occupied {bounds} in {cell_w}x{cell_h}, "
            f"scale {pitch * factor:.2f} src px/px, colors {colors_used}{note}")
    total = len({p[:3] for p in pixels(sheet) if p[3]})
    log(f"sheet {sheet.width}x{sheet.height}: {len(reduced)} frames of {cell_w}x{cell_h}, {total} opaque colors")
    return sheet, (cell_w, cell_h), report


# ---------------------------------------------------------------- self-test
def self_test(verbose: bool = False) -> int:
    """A synthetic sheet with uneven gaps, a loose particle, a soft halo and no exact cell grid round-trips."""
    rng = random.Random(7)
    palette = [(36, 22, 49), (135, 89, 173), (201, 133, 239), (241, 229, 197)]
    arts = []
    for f in range(3):
        art = Image.new("RGBA", (10, 9), (0, 0, 0, 0))
        p = art.load()
        for y in range(1, 8):
            for x in range(1 + (y % 2), 9 - (y % 3 == 0)):
                p[x, y] = (*palette[(x + y + f) % 3 + (1 if (x, y) == (4, 3) else 0)], 255)
        p[2 + f, 0] = (*palette[0], 255)          # a frame-specific detail
        arts.append(art)
    # Loose particle two art pixels below frame 1 must join it, not become a sprite.
    scale, origin_x, gaps = 7, 13, [0, 23, 41]
    sheet = Image.new("RGBA", (330, 120), (10, 30, 20, 0))
    x = origin_x
    placed = []
    for f, art in enumerate(arts):
        x += gaps[f]
        y = 20 + 5 * f
        big = art.resize((art.width * scale, art.height * scale), Image.NEAREST)
        sheet.alpha_composite(big, (x, y))
        placed.append((x, y))
        x += big.width
    px, py = placed[1]
    sheet.alpha_composite(Image.new("RGBA", (scale, scale), (*palette[1], 255)), (px + 4 * scale, py + 11 * scale))
    # Soft halo: faint dark alpha around everything, which the threshold must drop.
    s = sheet.load()
    for yy in range(sheet.height):
        for xx in range(sheet.width):
            if s[xx, yy][3] == 0 and rng.random() < 0.6:
                s[xx, yy] = (5, 20, 15, rng.randint(1, 18))
    out, cell, report = auto_prepare(sheet, colors=8, log=print if verbose else (lambda *_: None))
    failures = []
    if len(report) != 3:
        failures.append(f"expected 3 frames, got {len(report)}")
    for f, art in enumerate(arts):
        if f >= len(report):
            break
        tile = out.crop((f * cell[0], 0, (f + 1) * cell[0], cell[1]))
        b = tile.getchannel("A").getbbox()
        got = tile.crop(b)
        full = Image.new("RGBA", (art.width, art.height + 4), (0, 0, 0, 0))
        full.alpha_composite(art)
        if f == 1:
            full.putpixel((4, 11), (*palette[1], 255))
        want = full.crop(full.getchannel("A").getbbox())
        if got.size != want.size or list(pixels(got)) != list(pixels(want)):
            failures.append(f"frame {f} differs: got {got.size}, want {want.size}")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "sheet.png"
        out.save(path)
        if Image.open(path).size != out.size:
            failures.append("saved sheet size changed")
    if failures:
        print("SELF-TEST FAILED")
        for line in failures:
            print(" ", line)
        return 1
    print(f"self-test passed: 3 frames round-trip exactly in {cell[0]}x{cell[1]} cells (halo dropped, particle merged)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", nargs="?")
    parser.add_argument("output", nargs="?")
    parser.add_argument("--frame", help="grid mode: native frame size WxH, e.g. 16x16")
    parser.add_argument("--cols", type=int, default=1)
    parser.add_argument("--rows", type=int, default=1)
    parser.add_argument("--auto", action="store_true", help="split by transparent gaps and estimate the art-pixel grid")
    parser.add_argument("--row", type=int, help="auto mode: only this sprite row (0 = top)")
    parser.add_argument("--target", help="auto mode: native cell WxH; larger natural art is reduced to fit")
    parser.add_argument("--colors", type=int, default=8, help="auto mode: maximum opaque colors per sprite row")
    parser.add_argument("--merge", type=float, help="auto mode: merge distance in source px (default 4 art pixels)")
    parser.add_argument("--factor", type=float, help="auto mode: explicit reduction factor (default: smallest whole factor that fits --target)")
    parser.add_argument("--detail", type=float, default=RARITY, help="auto mode: rarity exponent of the reduction vote (higher keeps thin bright details)")
    parser.add_argument("--anchor", choices=("center", "bottom"), default="center")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        return self_test()
    if not args.input or not args.output:
        parser.error("INPUT and OUTPUT are required")
    if args.auto:
        target = tuple(int(v) for v in args.target.lower().split("x")) if args.target else None
        sheet, _, _ = auto_prepare(Image.open(args.input), args.row, target, args.colors, args.merge, args.anchor, args.factor, args.detail)
        sheet.save(args.output)
        return 0
    if not args.frame:
        parser.error("--frame is required in grid mode")

    fw, fh = (int(v) for v in args.frame.lower().split("x"))
    img = Image.open(args.input).convert("RGBA")
    keyed = 0
    if not has_real_alpha(img):
        img, keyed = key_magenta(img)
    native = sample(img, fw * args.cols, fh * args.rows)
    native.save(args.output)

    colors = {p[:3] for p in pixels(native) if p[3]}
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
