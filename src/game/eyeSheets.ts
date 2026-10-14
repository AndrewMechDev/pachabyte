import { paletteColor } from './nokiaPalette';
import type { Bounds, Rect, Rgba, SpritePixel } from './shotSheets';

// Pure slicing and anchor math for the prepared LOOP_NODE_EYE sheet (assets/prepared/loop-node-eye-v1-40x56.png, B1/B5).
// No Phaser, no DOM: the Phaser side (fxTextures.ts) and the tests read the same numbers. One row of seven equal cells:
// 0-3 idle (the pupil dilates, the cables sway), 4 hit (ivory flash), 5 cracked (HP 2), 6 breaking (HP 1, the last frame
// before the programmatic shatter burst).
export interface EyeSheet {
  readonly cell: readonly [number, number];
  readonly frames: number;
  // Pixel of the cell (edge coordinates: x=20 is the line between columns 19 and 20) that sits on the node position.
  readonly anchor: readonly [number, number];
}

// The anchor comes from the real alpha, not from the prepared JSON: the JSON origin (20,28) is the centre of the largest
// connected body (disc plus tentacles), which sits 7 px below the visual eye. The gold frame of the idle frames spans
// x 7..33 and y 8..34, so its centre is (20, 21); the same point for all seven frames, so the relic never jitters
// (eyeDiscCenter() re-measures it per frame and the tests compare). The cables hang below it, as with the placeholder.
export const EYE_SHEET: EyeSheet = Object.freeze({ cell: [40, 56] as const, frames: 7, anchor: [20, 21] as const });

export function eyeFrameRect(frame: number): Rect {
  const [w, h] = EYE_SHEET.cell;
  return { x: frame * w, y: 0, w, h };
}

// Alpha is binary in the prepared sheet; anything below half is treated as transparent.
const OPAQUE = 128;

export function eyePixels(img: Rgba, frame: number): SpritePixel[] {
  const r = eyeFrameRect(frame), out: SpritePixel[] = [];
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const i = ((r.y + y) * img.width + r.x + x) * 4;
    if (img.data[i + 3] < OPAQUE) continue;
    const [red, green, blue] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    out.push({ x, y, color: (red << 16) | (green << 8) | blue, nokia: paletteColor(red, green, blue) });
  }
  return out;
}

// Occupied box of a frame in cell coordinates (x1/y1 exclusive), or null when the frame is empty.
export function eyeBounds(img: Rgba, frame: number): Bounds | null {
  const pixels = eyePixels(img, frame);
  if (pixels.length === 0) return null;
  return {
    x0: Math.min(...pixels.map(p => p.x)), y0: Math.min(...pixels.map(p => p.y)),
    x1: Math.max(...pixels.map(p => p.x)) + 1, y1: Math.max(...pixels.map(p => p.y)) + 1,
  };
}

// Visual centre of the eye disc of one frame, in the same edge coordinates as the anchor: x is the middle of the occupied
// box (the cables never reach past the disc sideways); y is the mean centre of the widest rows (within one pixel of the
// maximum width), which are the equator of the disc, below which the cables narrow into the tentacles.
export function eyeDiscCenter(img: Rgba, frame: number): [number, number] {
  const pixels = eyePixels(img, frame), b = eyeBounds(img, frame);
  if (!b) return [0, 0];
  const width = new Map<number, number>();
  for (const p of pixels) width.set(p.y, (width.get(p.y) ?? 0) + 1);
  const widest = Math.max(...width.values()), rows = [...width].filter(([, w]) => w >= widest - 1).map(([y]) => y + 0.5);
  return [(b.x0 + b.x1) / 2, rows.reduce((s, y) => s + y, 0) / rows.length];
}
