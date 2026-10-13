// PLACEHOLDER pixel art for the three rare pickups approved on 2026-10-13, pending asset requests
// (PICKUP_RAFAGA, PICKUP_ESCUDO, PICKUP_CORAZON). Pure rows ('.' is transparent) so dimensions and silhouettes are
// unit-tested without Phaser. Each one reads by SILHOUETTE, never by color alone:
// fragments are gold rings with a knot, capturable boss bolts are filled rhombi, round orbs are dangerous.
// Ráfaga = three chevrons pointing right, Escudo = hollow hexagon outline, Corazón = pixel heart.
export type PixelRows = readonly string[];

export const PICKUP_COLORS: Readonly<Record<string, number>> = Object.freeze({
  d: 0x16343c, // dark outline that separates the shape from any backdrop
  l: 0xfff1c3, // light highlight
  o: 0xf2a65a, // Ráfaga orange
  b: 0x7fb8ff, // Escudo blue (kept apart from the mint capturable rhombus)
  r: 0xe86a5a, // Corazón red, the HUD heart color
});

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
// Pads by one pixel and outlines every transparent pixel that touches the shape on a side.
function outlined(core: Grid): PixelRows {
  const g = grid(core[0].length + 2, core.length + 2);
  core.forEach((row, y) => row.forEach((c, x) => { g[y + 1][x + 1] = c; }));
  const solid = (x: number, y: number) => !['.', 'd'].includes(g[y]?.[x] ?? '.');
  const marks: Array<[number, number]> = [];
  g.forEach((row, y) => row.forEach((c, x) => { if (c === '.' && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) marks.push([x, y]); }));
  for (const [x, y] of marks) g[y][x] = 'd';
  return Object.freeze(g.map(r => r.join('')));
}

// Three 2 px chevrons, 7 rows tall, 4 px apart; the tip pixel of each is light.
function rafaga(): PixelRows {
  const g = grid(13, 7);
  for (const ox of [0, 4, 8]) for (let r = 0; r < 7; r++) {
    const k = r <= 3 ? r : 6 - r;
    g[r][ox + k] = 'o'; g[r][ox + k + 1] = r === 3 ? 'l' : 'o';
  }
  return outlined(g);
}

const HEXAGON = ['..bblllbb..', '.bb.....bb.', 'bb.......bb', 'b.........b', 'bb.......bb', '.bb.....bb.', '..bbbbbbb..'];
const HEART = ['.rr.rr.', 'rlrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];

export const RAFAGA: PixelRows = rafaga();
export const ESCUDO: PixelRows = outlined(HEXAGON.map(row => [...row]));
export const CORAZON: PixelRows = outlined(HEART.map(row => [...row]));

// 5x6 shield icon for the HUD, drawn next to the hearts ('1' = pixel), same binary mask format as HEART.
export const SHIELD_ICON: PixelRows = Object.freeze(['01110', '10001', '10001', '10001', '10001', '01110']);
