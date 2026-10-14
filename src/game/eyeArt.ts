// P2 (2026-10-13): the Bucle node drawn as an ORIGINAL all-seeing eye relic. A gold stepped-chakana frame, a turquoise
// iris of concentric rings around a glowing violet core, a vertical slit pupil that dilates and four dark-purple
// cables with glowing tips hanging from the lower rim. Nothing here is taken from any film, comic or game: it is a
// round Andean pendant on cables, with no flame, no tower and no stalked eyes.
//
// PLACEHOLDER pending the `LOOP_NODE_EYE` spritesheet (docs/design/ASSET_REQUESTS_V2.md). Sheet frame mapping, one row of
// seven cells of EYE_CELL: 0-3 idle (the slit dilates and the cables sway), 4 hit (ivory flash), 5 cracked (HP 2),
// 6 breaking (HP 1, the last frame before the shatter). To swap in the sheet, slice those seven cells into the
// `loop-eye-<frame>` texture keys in fxTextures.ts; eyeRelic.ts (frame choice, origin, shatter) does not change.
//
// Pure rows of characters ('.' is transparent). Dependency free so it can be inspected anywhere.

export const EYE_CELL = Object.freeze([21, 28] as const);
export const EYE_CENTER = Object.freeze([10, 10] as const);
export type EyeFrameName = 'idle0' | 'idle1' | 'idle2' | 'idle3' | 'hit' | 'crack' | 'break';

export const EYE_FLASH = 0xfff1c3;
export const EYE_COLORS: Readonly<Record<string, number>> = Object.freeze({
  g: 0xedc76c, G: 0xa27c52, l: EYE_FLASH, // frame: gold, shaded gold, ivory highlight
  U: 0x1f7f78, T: 0x35b9ae, L: 0x7fe0d3, // iris rings: dark, mid, light turquoise
  v: 0x9b4fd0, V: 0xd9a6f5, w: 0xfff1c3, // glowing core, cable tips, the specular glint
  k: 0x1a0b24, x: 0x16343c, // slit pupil and cracks
  c: 0x4a2266, C: 0x7a3fa8, // dark-purple cables (lit enough to read against the dusk backdrop)
});

interface Spec { pupil: 0 | 1 | 2; sway: number; crack: 0 | 1 | 2 }
const SPECS: Readonly<Record<Exclude<EyeFrameName, 'hit'>, Spec>> = Object.freeze({
  idle0: { pupil: 0, sway: 0, crack: 0 }, idle1: { pupil: 1, sway: 1, crack: 0 }, idle2: { pupil: 2, sway: 2, crack: 0 }, idle3: { pupil: 1, sway: 3, crack: 0 },
  crack: { pupil: 1, sway: 1, crack: 1 }, break: { pupil: 2, sway: 3, crack: 2 },
});

const [W, H] = EYE_CELL, [CX, CY] = EYE_CENTER;
// Where each cable leaves the lower rim, and which way it curls.
const CABLES = Object.freeze([{ x: 6, y: 17, dir: -1 }, { x: 8, y: 18, dir: -1 }, { x: 12, y: 18, dir: 1 }, { x: 14, y: 17, dir: 1 }]);
const CRACKS: readonly (readonly (readonly [number, number])[])[] = Object.freeze([
  [[CX + 6, CY - 5], [CX + 5, CY - 4], [CX + 4, CY - 4], [CX + 4, CY - 3], [CX + 3, CY - 2]],
  [[CX - 6, CY + 4], [CX - 5, CY + 3], [CX - 4, CY + 3], [CX - 4, CY + 2], [CX - 3, CY + 1], [CX + 2, CY - 6], [CX + 1, CY - 5]],
]);

const half = (pupil: Spec['pupil'], dy: number): number => (pupil === 0 ? 0 : pupil === 1 ? (dy <= 2 ? 1 : 0) : dy <= 1 ? 2 : dy <= 3 ? 1 : 0);

function build(spec: Spec): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const put = (x: number, y: number, char: string) => { if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = char; };
  // Cables first, so the frame overlaps their roots. Each one leaves the rim, hangs, sways and ends in a glowing tip.
  CABLES.forEach((cable, k) => {
    const length = H - 1 - cable.y;
    for (let j = 1; j <= length; j++) {
      const sway = Math.round(1.3 * Math.sin(spec.sway * Math.PI / 2 + k * 1.3 + j * 0.55) * (j / length));
      const x = cable.x + cable.dir * (Math.floor(j * 0.22) + Math.floor(j * j / 70)) + sway;
      const tip = j === length;
      put(x, cable.y + j, tip ? 'V' : j % 3 === 0 ? 'C' : 'c');
      if (tip) { put(x - 1, cable.y + j, 'v'); put(x + 1, cable.y + j, 'v'); }
    }
  });
  // Chakana steps: two stepped tabs at each cardinal point (three pixels wide, then one).
  for (const [ux, uy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
    for (let side = -1; side <= 1; side++) put(CX + ux * 9 + (ux === 0 ? side : 0), CY + uy * 9 + (uy === 0 ? side : 0), 'g');
    put(CX + ux * 10, CY + uy * 10, 'g');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy), shade = dx + dy;
    if (d > 8.5) continue;
    if (d > 6.7) { put(x, y, shade >= 6 ? 'G' : shade <= -9 ? 'l' : 'g'); continue; }
    put(x, y, d > 5.7 ? 'U' : d > 4.7 ? 'T' : d > 3.7 ? 'L' : d > 2.9 ? 'T' : d > 1.5 ? 'v' : 'V');
  }
  // Vertical slit pupil, over the core: one pixel wide when narrow, a lozenge when dilated.
  for (let dy = -4; dy <= 4; dy++) for (let dx = -half(spec.pupil, Math.abs(dy)); dx <= half(spec.pupil, Math.abs(dy)); dx++) put(CX + dx, CY + dy, 'k');
  put(CX - 3, CY - 3, 'w');
  if (spec.crack >= 1) for (const [x, y] of CRACKS[0]) put(x, y, 'x');
  if (spec.crack >= 2) {
    for (const [x, y] of CRACKS[1]) put(x, y, 'x');
    // A chip knocked out of the frame, upper right.
    put(CX + 7, CY - 4, '.'); put(CX + 7, CY - 3, '.'); put(CX + 6, CY - 5, 'x');
  }
  return grid.map(row => row.join(''));
}

export function eyeRows(frame: EyeFrameName): string[] {
  if (frame !== 'hit') return build(SPECS[frame]);
  // Hit flash: the idle silhouette in one light color (Canvas ignores tint, so it is its own frame).
  return build(SPECS.idle1).map(row => row.replace(/[^.]/g, 'l'));
}
