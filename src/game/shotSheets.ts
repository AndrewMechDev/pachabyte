import { paletteColor } from './nokiaPalette';

// Pure slicing and anchor math for the prepared SHOTS sheets (assets/prepared/shots-v1-*.png, B1/B4). No Phaser, no DOM:
// the Phaser side (fxTextures.ts) and the tests both read the same numbers. Each sheet is ONE row of equal cells.
export type ShotSheetName = 'normal' | 'rafaga' | 'impact';

export interface ShotSheet {
  readonly cell: readonly [number, number];
  readonly frames: number;
  // Pixel of the cell that sits on the shot position (bolts: the axis of the head, see headAnchor) or on the hit point (impact).
  readonly anchor: readonly [number, number];
}

// Anchors were computed from the real alpha of the PNGs with headAnchor() below (the test suite recomputes and compares):
//  - normal: the head ends at x=12 on every frame but the first (11), axis row 6 -> anchor (12-3, 6.5).
//  - rafaga: the arrow tip ends at x=18 on every frame, head rows average 10.9 -> anchor (18-3, 11).
//  - impact: the prepared JSON origin, the centre of the largest body of each frame (8, 8): the hit point.
// The prepared JSON origins of the bolts are the centre of the largest body, NOT the head, so they are not used.
export const SHOT_SHEETS: Readonly<Record<ShotSheetName, ShotSheet>> = Object.freeze({
  normal: { cell: [16, 12], frames: 4, anchor: [9, 6.5] },
  rafaga: { cell: [24, 20], frames: 4, anchor: [15, 11] },
  impact: { cell: [16, 16], frames: 4, anchor: [8, 8] },
});

export interface Rgba { readonly width: number; readonly height: number; readonly data: ArrayLike<number> }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Bounds { x0: number; y0: number; x1: number; y1: number }
// One opaque pixel of a frame, relative to its cell: its own color and its exact four-green twin (REVERSE).
export interface SpritePixel { x: number; y: number; color: number; nokia: number }

export function frameRect(name: ShotSheetName, frame: number): Rect {
  const [w, h] = SHOT_SHEETS[name].cell;
  return { x: frame * w, y: 0, w, h };
}

// Alpha is binary in the prepared sheets; anything below half is treated as transparent.
const OPAQUE = 128;

export function opaquePixels(img: Rgba, name: ShotSheetName, frame: number): SpritePixel[] {
  const r = frameRect(name, frame), out: SpritePixel[] = [];
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const i = ((r.y + y) * img.width + r.x + x) * 4;
    if (img.data[i + 3] < OPAQUE) continue;
    const [red, green, blue] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    out.push({ x, y, color: (red << 16) | (green << 8) | blue, nokia: paletteColor(red, green, blue) });
  }
  return out;
}

// Occupied box of a frame in cell coordinates (x1/y1 exclusive), or null when the frame is empty.
export function frameBounds(img: Rgba, name: ShotSheetName, frame: number): Bounds | null {
  const pixels = opaquePixels(img, name, frame);
  if (pixels.length === 0) return null;
  return {
    x0: Math.min(...pixels.map(p => p.x)), y0: Math.min(...pixels.map(p => p.y)),
    x1: Math.max(...pixels.map(p => p.x)) + 1, y1: Math.max(...pixels.map(p => p.y)) + 1,
  };
}

// Display anchor of a bolt, the same for every frame so the bolt never jitters: x puts the rightmost occupied edge of the
// sheet `halfBody` px ahead of the anchor (the tip lines up with the front edge of the physics body, where impacts spawn);
// y is the mean row centre of each frame's three rightmost columns (the head), rounded to a half pixel.
export function headAnchor(img: Rgba, name: ShotSheetName, halfBody: number): [number, number] {
  const count = Math.floor(img.width / SHOT_SHEETS[name].cell[0]);
  let right = 0, sum = 0, used = 0;
  for (let f = 0; f < count; f++) {
    const pixels = opaquePixels(img, name, f);
    if (pixels.length === 0) continue;
    const edge = Math.max(...pixels.map(p => p.x)) + 1, head = pixels.filter(p => p.x >= edge - 3);
    right = Math.max(right, edge);
    sum += head.reduce((s, p) => s + p.y + 0.5, 0) / head.length;
    used += 1;
  }
  return [right - halfBody, Math.round((sum / Math.max(1, used)) * 2) / 2];
}
