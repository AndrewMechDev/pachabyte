// PLACEHOLDER pixel art for the route bugs added on 2026-10-13, pending the requested assets
// (docs/design/ASSET_REQUESTS.md): BUG_CORRUPTOR (24x24) and BUG_SOMBRA_DE_ERROR (20x20 large, 12x12 small).
// Pure rows of characters ('.' is transparent) so dimensions and silhouettes are unit-tested without Phaser.
// Both face LEFT, toward Kipu, and read by shape alone: a boxy block with a vent versus a hooded wisp with an echo.
export type PixelRows = readonly string[];

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
const rows = (g: Grid): PixelRows => Object.freeze(g.map(r => r.join('')));
const put = (g: Grid, x: number, y: number, c: string): void => { if (g[y]?.[x] !== undefined) g[y][x] = c; };
const fill = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string): void => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, c);
};
// 1 px outline on every transparent pixel that touches the shape on a side.
function outline(g: Grid, c: string): void {
  const solid = (x: number, y: number) => (g[y]?.[x] ?? '.') !== '.';
  const marks: Array<[number, number]> = [];
  g.forEach((row, y) => row.forEach((p, x) => { if (p === '.' && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) marks.push([x, y]); }));
  for (const [x, y] of marks) g[y][x] = c;
}
// Solid "duplicate" echo: the silhouette shifted by `shift` pixels, kept only where it clears the shape by one pixel.
function echo(g: Grid, shift: 2 | -2, c: string): void {
  const solid = (x: number, y: number) => (g[y]?.[x] ?? '.') !== '.';
  const step = Math.sign(shift), marks: Array<[number, number]> = [];
  g.forEach((row, y) => row.forEach((_, x) => { if (solid(x - shift, y) && !solid(x, y) && !solid(x - step, y)) marks.push([x, y]); }));
  for (const [x, y] of marks) g[y][x] = c;
}

// ---------------------------------------------------------------- Corruptor (24x24)
export const CORRUPTOR_COLORS = Object.freeze({ o: 0x241631, b: 0x4a2e63, p: 0x8759ad, v: 0xc985ef, i: 0xf1e5c5, w: 0xfff1c3 });

function corruptor(frame: 'idle' | 'sway' | 'charge'): PixelRows {
  const g = grid(24, 24);
  fill(g, 4, 3, 21, 17, 'b');
  for (const [x, y] of [[4, 3], [21, 3], [4, 17], [21, 17]]) put(g, x, y, '.');
  // Data-block plates in a 3x3 grid, two of them cracked by the Desfase.
  for (const px of [7, 11, 15]) for (const py of [5, 9, 13]) fill(g, px, py, px + 2, py + 2, 'p');
  put(g, 12, 10, 'v'); put(g, 16, 6, 'v');
  // The vent on its LEFT side: dim while idle, bright (and wider) through the charge telegraph.
  fill(g, 1, 8, 4, 12, 'b');
  if (frame === 'charge') { fill(g, 1, 9, 3, 11, 'w'); put(g, 1, 9, 'v'); put(g, 1, 11, 'v'); } else fill(g, 2, 9, 3, 11, 'v');
  // Infected sillar-like stone tiles stuck to its back (right side).
  for (const [x, y] of [[18, 4], [19, 10], [17, 15]]) { fill(g, x, y, x + 1, y + 1, 'i'); put(g, x + 1, y + 1, 'v'); }
  outline(g, 'o');
  // Two hanging cables; the second idle frame swings their tips the other way.
  const swing = frame === 'sway' ? 1 : -1;
  for (const cx of [8, 16]) {
    for (let y = 18; y <= 21; y++) put(g, cx, y, 'p');
    put(g, cx + swing, 22, 'p'); put(g, cx + swing, 23, 'v');
  }
  return rows(g);
}
export const CORRUPTOR_FRAMES = Object.freeze({ idle: corruptor('idle'), sway: corruptor('sway'), charge: corruptor('charge') });

// ---------------------------------------------------------------- Sombra de Error (20x20) and small shadow (12x12)
export const SOMBRA_COLORS = Object.freeze({ o: 0x5b2a7a, k: 0x241631, d: 0x4a2e63, y: 0xc985ef, e: 0xc985ef });

type Span = readonly [number, number];
interface Hood { size: number; body: ReadonlyArray<readonly [number, Span]>; shade: ReadonlyArray<readonly [number, Span]>; eyes: ReadonlyArray<readonly [number, number]>; ragged: ReadonlyArray<readonly [number, readonly number[]]> }
function hood(h: Hood, loose: ReadonlyArray<readonly [number, number]>, echoSide: 2 | -2): PixelRows {
  const g = grid(h.size, h.size);
  for (const [y, [x0, x1]] of h.body) fill(g, x0, y, x1, y, 'k');
  for (const [y, [x0, x1]] of h.shade) fill(g, x0, y, x1, y, 'd');
  for (const [x, y] of h.eyes) put(g, x, y, 'y');
  for (const [y, xs] of h.ragged) for (const x of xs) put(g, x, y, 'k');
  outline(g, 'o');
  for (const [x, y] of loose) put(g, x, y, 'd');
  echo(g, echoSide, 'e');
  return rows(g);
}
const SOMBRA: Hood = {
  size: 20,
  body: [[2, [8, 11]], [3, [6, 13]], [4, [5, 14]], [5, [4, 14]], ...[6, 7, 8, 9, 10, 11, 12].map(y => [y, [4, 14]] as const), [13, [5, 14]], [14, [5, 14]]],
  shade: [[6, [5, 9]], [7, [5, 10]], [8, [5, 10]], [9, [5, 9]], [10, [6, 8]]],
  eyes: [[6, 7], [6, 8], [9, 7], [9, 8]],
  ragged: [[15, [5, 6, 8, 9, 10, 12, 13]]],
};
const SHADOW: Hood = {
  size: 12,
  body: [[1, [4, 7]], [2, [3, 8]], [3, [3, 8]], [4, [3, 8]], [5, [3, 8]], [6, [3, 8]], [7, [3, 8]]],
  shade: [[3, [3, 6]], [4, [3, 6]]],
  eyes: [[4, 3], [6, 3]],
  ragged: [[8, [3, 5, 6, 8]]],
};
export const SOMBRA_FRAMES = Object.freeze({
  drift: hood(SOMBRA, [[6, 17], [13, 17], [10, 18]], 2),
  driftB: hood(SOMBRA, [[5, 17], [11, 17], [8, 18]], 2),
  // Dodge telegraph: the echo jumps to the left side, a glitch blink before the sideways move.
  blink: hood(SOMBRA, [[6, 17], [13, 17], [10, 18]], -2),
});
export const SHADOW_FRAMES = Object.freeze({ drift: hood(SHADOW, [[4, 10], [7, 10]], 2), driftB: hood(SHADOW, [[5, 10], [8, 10]], 2) });

// ---------------------------------------------------------------- projectiles and drops
// Round corrupted orb: never a rhombus, because rhombus silhouettes are reserved for capturable boss bolts.
export const ORB_COLORS = Object.freeze({ p: 0x8759ad, v: 0xc985ef, w: 0xf1e5c5 });
export const ORB: PixelRows = Object.freeze(['.ppp.', 'pvvvp', 'pvwvp', 'pvvvp', '.ppp.']);
// Small fragment left by every 4th debugged bug: the gold ring of the route fragment, reduced.
export const FRAGMENT_SMALL: PixelRows = Object.freeze(['.gg.', 'gl.g', 'g..g', '.gg.', '.o..']);

// Same alpha mask in one flat color: hit flashes as derived textures (Canvas ignores sprite tint).
export const silhouette = (r: PixelRows): PixelRows => Object.freeze(r.map(row => row.replace(/[^.]/g, 'h')));
export const mask = (r: PixelRows): string[] => r.map(row => row.replace(/[^.]/g, '1').replace(/\./g, '0'));
