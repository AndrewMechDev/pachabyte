// Pure pixel generators for the Amaru-01 fight placeholders (no Phaser, unit-tested).
// Integer pixels, binary alpha, original drawings.
// AMARU_SEGMENT, AMARU_TAIL and AMARU_CORE are PLACEHOLDERS pending the asset requests in
// docs/design/ASSET_REQUESTS.md; swap these generators for the delivered PNGs when they are approved.
// Bolts: rhombus = capturable, round orb = dangerous. They differ by silhouette, not only by color.

export interface Pixels { width: number; height: number; data: Uint8ClampedArray }
type Pick = (x: number, y: number) => number | null;

function draw(width: number, height: number, pick: Pick): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const color = pick(x, y);
    if (color === null) continue;
    data.set([color >> 16, (color >> 8) & 255, color & 255, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}

const OUTLINE = 0x173d32, TEAL = 0x35b9ae, TEAL_DARK = 0x1f7f78, TEAL_LIGHT = 0x7fe0d3, GOLD = 0xe7bd67, GOLD_DARK = 0x9a7434;
const GEM = 0x8759ad, GEM_LIGHT = 0xd9a6f5, IVORY = 0xf1e5c5, MINT = 0xa5d6b0, GLOW = 0x59d3c4;

// PLACEHOLDER AMARU_SEGMENT (24x24): round scaled segment, vertical gold ring and a purple gem.
export function segmentPixels(): Pixels {
  return draw(24, 24, (x, y) => {
    const d = Math.hypot(x - 11.5, y - 11.5);
    if (d > 11) return null;
    if (d > 9.8) return OUTLINE;
    if (d < 1.6) return GEM_LIGHT;
    if (d < 3.4) return GEM;
    if (Math.abs(x - 11.5) < 1.6) return GOLD;
    if (y < 5) return TEAL_LIGHT;
    return (x + 2 * y) % 6 === 0 ? TEAL_DARK : TEAL;
  });
}

// PLACEHOLDER AMARU_TAIL (32x32): tapering tail pointing right, gold bands and a gold tip.
export function tailPixels(): Pixels {
  return draw(32, 32, (x, y) => {
    const half = 9.5 * (1 - x / 34) + 1.2, dy = Math.abs(y - 15.5);
    if (dy > half) return null;
    if (dy > half - 1.2 || x === 31) return OUTLINE;
    if (x >= 27) return GOLD;
    if (x % 7 === 3) return GOLD_DARK;
    return (x + 2 * y) % 6 === 0 ? TEAL_DARK : TEAL;
  });
}

// PLACEHOLDER AMARU_CORE (16x16): glowing core; its cool glow turns purple in the corrupted variant.
export function corePixels(): Pixels {
  return draw(16, 16, (x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 7.2) return null;
    if (d > 6.1) return OUTLINE;
    if (d < 2) return IVORY;
    return d < 4 ? MINT : GLOW;
  });
}

// Dangerous, non-capturable round orb (7x7).
export function orbPixels(): Pixels {
  return draw(7, 7, (x, y) => {
    const d = Math.hypot(x - 3, y - 3);
    if (d > 3.4) return null;
    if (d > 2.4) return 0x5b2a7a;
    return d < 1.2 ? IVORY : 0xc985ef;
  });
}

// Capturable rhombus bolt (7x11): tall diamond with a bright core.
export function rhombusPixels(): Pixels {
  return draw(7, 11, (x, y) => {
    const r = Math.abs(x - 3) / 3.5 + Math.abs(y - 5) / 5.5;
    if (r > 1) return null;
    if (r > 0.72) return 0x1f5f5a;
    return r < 0.3 ? IVORY : MINT;
  });
}

// Allied returned bolt (9x7): horizontal gold diamond flying back to Amaru.
export function returnPixels(): Pixels {
  return draw(9, 7, (x, y) => {
    const r = Math.abs(x - 4) / 4.5 + Math.abs(y - 3) / 3.5;
    if (r > 1) return null;
    if (r > 0.7) return GOLD_DARK;
    return r < 0.3 ? IVORY : GOLD;
  });
}
