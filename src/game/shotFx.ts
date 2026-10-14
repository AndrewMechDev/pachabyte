import { fxColor, type FxSlot } from './animation';

// P2 juice (2026-10-13): animated bolts for Kipu's normal shot and the Ráfaga shot, plus the impact star burst.
// Pure data and decisions, no Phaser. The art below is a PLACEHOLDER pending the `SHOTS` asset
// (docs/design/ASSET_REQUESTS_V2.md item 4): when the spritesheet arrives, replace each `frames` list by slices of
// it (3 normal + 3 Ráfaga frames, same anchors) in fxTextures.ts; shotFrame/shotTextureKey/shotOrigin stay as they are.
// The physics body is unchanged (SHOT_BODY, set by the scenes): the bolts are drawn by separate display images that
// follow the pooled physics sprites, so no physics sprite is ever resized or scaled.

export type ShotKind = 'normal' | 'rafaga';
export const SHOT_KINDS: readonly ShotKind[] = Object.freeze(['normal', 'rafaga'] as const);
export const SHOT_BODY = Object.freeze({ width: 6, height: 3 });
export const shotKindFor = (rafagaActive: boolean): ShotKind => (rafagaActive ? 'rafaga' : 'normal');

export interface ShotArt {
  // '.' is transparent; every other character names one opaque color. Row 0 is always clear (rotation never clips).
  readonly frames: readonly (readonly string[])[];
  readonly colors: Readonly<Record<string, number>>;
  // Pixel of the drawn art where the centre of the physics body sits (the bolt's head).
  readonly anchor: readonly [number, number];
}

// Normal shot: a golden bolt with an ivory core and a flickering 2-3 px orange tail (9x5, head on the right).
const NORMAL_COLORS = Object.freeze({ g: 0xedc76c, d: 0xa27c52, w: 0xfff3bf, t: 0xf2a65a });
const NORMAL_FRAMES: readonly (readonly string[])[] = Object.freeze([
  Object.freeze(['.........', '...dgggg.', '.ttgwwwww', '...dgggg.', '.........']),
  Object.freeze(['.........', '..tdgggg.', 'tttgwwwww', '.t.dgggg.', '.........']),
  Object.freeze(['.........', '.t.dgggg.', '..tgwwwww', '...dgggg.', '.........']),
]);

// Ráfaga shot: a longer turquoise-and-gold arrow (15x9) with a gold tip and a small spiral of sparks that alternates
// above and below its tail. Not a rhombus: those are reserved for capturable boss bolts.
const RAFAGA_COLORS = Object.freeze({ U: 0x1f7f78, T: 0x59d3c4, L: 0x9be8dd, g: 0xedc76c, w: 0xfff3bf });
const RAFAGA_BODY = ['.........gU....', '.........gTTU..', '....UTTTTLLLLU.', '...UTTLLwwwwwwg', '....UTTTTLLLLU.', '.........gTTU..', '.........gU....'];
const BLANK = '...............';
const rafagaFrame = (sparks: readonly (readonly [number, number, string])[]): readonly string[] => {
  const rows = [BLANK, ...RAFAGA_BODY, BLANK].map(row => row.split(''));
  for (const [x, y, char] of sparks) rows[y][x] = char;
  return Object.freeze(rows.map(row => row.join('')));
};
const RAFAGA_FRAMES: readonly (readonly string[])[] = Object.freeze([
  rafagaFrame([[3, 2, 'g'], [2, 3, 'L'], [1, 5, 'L'], [0, 6, 'g']]),
  rafagaFrame([[3, 6, 'g'], [2, 5, 'L'], [1, 3, 'L'], [0, 2, 'g']]),
  rafagaFrame([[2, 2, 'w'], [3, 6, 'w'], [1, 4, 'g'], [0, 4, 'L']]),
]);

export const SHOT_ART: Readonly<Record<ShotKind, ShotArt>> = Object.freeze({
  normal: { frames: NORMAL_FRAMES, colors: NORMAL_COLORS, anchor: [6, 2.5] as const },
  rafaga: { frames: RAFAGA_FRAMES, colors: RAFAGA_COLORS, anchor: [12, 4.5] as const },
});

// How long each tail frame lasts. Under reduced motion the bolt keeps its first frame: no tail flicker.
export const SHOT_FLICKER_MS = 60;
export function shotFrame(kind: ShotKind, age: number, reduced: boolean): number {
  if (reduced || age < 0) return 0;
  return Math.floor(age / SHOT_FLICKER_MS) % SHOT_ART[kind].frames.length;
}

export const shotTextureKey = (kind: ShotKind, frame: number, nokia: boolean): string => `shot-${kind}-${frame}${nokia ? '-nokia' : ''}`;

// Sprite origin (0..1) that puts the physics-body centre at the shot's position.
export function shotOrigin(kind: ShotKind): { x: number; y: number } {
  const art = SHOT_ART[kind], rows = art.frames[0];
  return { x: art.anchor[0] / rows[0].length, y: art.anchor[1] / rows.length };
}

// ------------------------------------------------------------------ impact star burst
// A short four-frame star (ivory, then gold, then terracotta) where a bolt lands on an enemy, a shield or Amaru. Drawn as
// whole hard pixels in the shared particle graphics so the four-green REVERSE frame stays exact (fxColor maps the slots).
export const IMPACT = Object.freeze({ ms: 180, frames: 4, reducedMs: 110, reducedFrame: 1, capacity: 12, arm: { normal: 3, rafaga: 4 } });

// -1 once the burst is over. Reduced motion shows one static frame (the gold star) instead of the expansion.
export function impactFrame(age: number, reduced: boolean): number {
  if (age < 0) return -1;
  if (reduced) return age < IMPACT.reducedMs ? IMPACT.reducedFrame : -1;
  return age < IMPACT.ms ? Math.floor(age / (IMPACT.ms / IMPACT.frames)) : -1;
}

export interface ImpactPixel { dx: number; dy: number; slot: FxSlot }
const ARMS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const, DIAGONALS = [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const;

// Pixel offsets from the impact point; four-fold symmetric. `arm` is the arm length of the full star.
export function impactPixels(frame: number, kind: ShotKind): ImpactPixel[] {
  const arm = IMPACT.arm[kind], out: ImpactPixel[] = [];
  const cross = (d: number, slot: FxSlot) => { for (const [x, y] of ARMS) out.push({ dx: x * d, dy: y * d, slot }); };
  const diagonal = (d: number, slot: FxSlot) => { for (const [x, y] of DIAGONALS) out.push({ dx: x * d, dy: y * d, slot }); };
  switch (frame) {
    case 0: out.push({ dx: 0, dy: 0, slot: 'light' }); cross(1, 'light'); break;
    case 1: out.push({ dx: 0, dy: 0, slot: 'light' }); cross(1, 'light'); cross(2, 'gold'); diagonal(1, 'gold'); break;
    case 2: for (let d = 1; d < arm; d++) cross(d, 'gold'); cross(arm, 'terracotta'); diagonal(2, 'terracotta'); break;
    default: cross(arm + 1, 'terracotta'); diagonal(3, 'terracotta'); break;
  }
  return out;
}

export interface Impact { x: number; y: number; born: number; kind: ShotKind; active: boolean }

// Fixed capacity, no allocation after construction. A full pool recycles its oldest burst, so the newest hit always reads.
export class ImpactPool {
  readonly items: Impact[];
  private total = 0;
  constructor(capacity: number = IMPACT.capacity) {
    this.items = Array.from({ length: capacity }, () => ({ x: 0, y: 0, born: 0, kind: 'normal' as ShotKind, active: false }));
  }
  get activeCount(): number { return this.items.reduce((n, i) => n + (i.active ? 1 : 0), 0); }
  // Every burst ever spawned (debug and smoke tests read it to prove impacts happen).
  get spawned(): number { return this.total; }
  spawn(x: number, y: number, kind: ShotKind, now: number): Impact {
    const free = this.items.find(i => !i.active) ?? this.items.reduce((oldest, i) => (i.born < oldest.born ? i : oldest));
    this.total += 1;
    return Object.assign(free, { x, y, kind, born: now, active: true });
  }
  step(now: number, reduced: boolean): void { for (const i of this.items) if (i.active && impactFrame(now - i.born, reduced) < 0) i.active = false; }
  clear(): void { for (const i of this.items) i.active = false; this.total = 0; }
}

interface RectPainter { fillStyle(color: number): unknown; fillRect(x: number, y: number, width: number, height: number): unknown }
export function drawImpacts(painter: RectPainter, pool: ImpactPool, now: number, nokia: boolean, reduced: boolean): void {
  for (const impact of pool.items) {
    if (!impact.active) continue;
    const frame = impactFrame(now - impact.born, reduced);
    if (frame < 0) continue;
    const x = Math.round(impact.x), y = Math.round(impact.y);
    for (const p of impactPixels(frame, impact.kind)) { painter.fillStyle(fxColor(p.slot, nokia)); painter.fillRect(x + p.dx, y + p.dy, 1, 1); }
  }
}
