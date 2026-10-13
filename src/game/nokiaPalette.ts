export const NOKIA = [0x0f380f, 0x306230, 0x8bac0f, 0x9bbc0f] as const;
// Desfase corruption ramp (dark to light purple) for derived "corrupted" textures; Canvas ignores tint.
export const CORRUPTED = [0x2a1438, 0x5b2a7a, 0x9b5ccc, 0xd9a6f5] as const;
type Ramp = readonly [number, number, number, number];
export function paletteColor(r: number, g: number, b: number, palette: Ramp = NOKIA): number { return palette[Math.min(3, Math.floor((0.2126 * r + 0.7152 * g + 0.0722 * b) / 64))]; }
export function convertPixels(pixels: Uint8ClampedArray, palette: Ramp = NOKIA): Uint8ClampedArray { const out = pixels.slice();
  for (let i = 0; i < out.length; i += 4) {
    const c = paletteColor(out[i], out[i + 1], out[i + 2], palette);
    out[i] = c >> 16; out[i + 1] = (c >> 8) & 255; out[i + 2] = c & 255;
  }
  return out; }
// Desfase corruption that keeps identity: cool pixels (turquoise scales, dark outline) take the purple ramp,
// warm pixels (gold horns and ornaments) stay as they are. Alpha is untouched.
export function corruptPixels(pixels: Uint8ClampedArray): Uint8ClampedArray { const out = pixels.slice();
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 2] < out[i]) continue;
    const c = paletteColor(out[i], out[i + 1], out[i + 2], CORRUPTED);
    out[i] = c >> 16; out[i + 1] = (c >> 8) & 255; out[i + 2] = c & 255;
  }
  return out; }
// Mix every pixel toward one color (amount clamped to 0..1); used for the dimmed purple arena.
export function tintPixels(pixels: Uint8ClampedArray, color: number, amount: number): Uint8ClampedArray { const out = pixels.slice();
  const k = Math.min(1, Math.max(0, amount)), rgb = [color >> 16, (color >> 8) & 255, color & 255];
  for (let i = 0; i < out.length; i += 4) for (let c = 0; c < 3; c++) out[i + c] = Math.round(out[i + c] * (1 - k) + rgb[c] * k);
  return out; }
