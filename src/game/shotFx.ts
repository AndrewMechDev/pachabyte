import { SHOT_SHEETS, type SpritePixel } from './shotSheets';

// Kipu's animated bolts (normal and Ráfaga) and the impact burst, drawn from the prepared SHOTS sheets
// (assets/prepared/shots-v1-*.png, 4 frames per kind, sliced by shotSheets.ts and registered by fxTextures.ts).
// Pure data and decisions, no Phaser. The physics body is unchanged (SHOT_BODY, set by the scenes): the bolts are drawn by
// separate display images that follow the pooled physics sprites, so no physics sprite is ever resized or scaled.

export type ShotKind = 'normal' | 'rafaga';
export const SHOT_KINDS: readonly ShotKind[] = Object.freeze(['normal', 'rafaga'] as const);
export const SHOT_BODY = Object.freeze({ width: 6, height: 3 });
export const shotKindFor = (rafagaActive: boolean): ShotKind => (rafagaActive ? 'rafaga' : 'normal');

// How long each tail frame lasts. Under reduced motion the bolt keeps its first frame: no tail flicker.
export const SHOT_FLICKER_MS = 60;
export function shotFrame(kind: ShotKind, age: number, reduced: boolean): number {
  if (reduced || age < 0) return 0;
  return Math.floor(age / SHOT_FLICKER_MS) % SHOT_SHEETS[kind].frames;
}

export const shotTextureKey = (kind: ShotKind, frame: number, nokia: boolean): string => `shot-${kind}-${frame}${nokia ? '-nokia' : ''}`;

// Sprite origin (0..1) that puts the physics-body centre at the shot's position: the anchor (see shotSheets.ts) is the pixel
// of the cell whose tip sits on the body's front edge, so the visible tip meets what the body hits.
export function shotOrigin(kind: ShotKind): { x: number; y: number } {
  const { cell, anchor } = SHOT_SHEETS[kind];
  return { x: anchor[0] / cell[0], y: anchor[1] / cell[1] };
}

// ------------------------------------------------------------------ impact burst
// A short four-frame burst (prepared sheet: flash, star, wide star, fragments) where a bolt lands on an enemy, a shield or
// Amaru. Drawn as whole hard pixels in the shared particle graphics (no antialiasing, alpha 1), so the four-green REVERSE
// frame stays exact: each pixel carries its own color and its precomputed Nokia green. The decoded frames are registered once
// per game by fxTextures.ts (setImpactFrames); the scenes keep calling drawImpacts unchanged.
export const IMPACT = Object.freeze({ ms: 180, frames: 4, reducedMs: 110, reducedFrame: 1, capacity: 12 });

// -1 once the burst is over. Reduced motion shows one static frame (the mid-size star) instead of the expansion.
export function impactFrame(age: number, reduced: boolean): number {
  if (age < 0) return -1;
  if (reduced) return age < IMPACT.reducedMs ? IMPACT.reducedFrame : -1;
  return age < IMPACT.ms ? Math.floor(age / (IMPACT.ms / IMPACT.frames)) : -1;
}

let burst: { frames: readonly (readonly SpritePixel[])[]; center: readonly [number, number] } = { frames: [], center: [0, 0] };
// Registers the decoded burst frames (pixels relative to the cell) and the cell pixel that sits on the hit point.
export function setImpactFrames(frames: readonly (readonly SpritePixel[])[], center: readonly [number, number]): void { burst = { frames, center }; }

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
    if (frame < 0 || frame >= burst.frames.length) continue;
    const x = Math.round(impact.x) - burst.center[0], y = Math.round(impact.y) - burst.center[1];
    for (const p of burst.frames[frame]) { painter.fillStyle(nokia ? p.nokia : p.color); painter.fillRect(x + p.x, y + p.y, 1, 1); }
  }
}
