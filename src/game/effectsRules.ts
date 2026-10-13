// Pure feedback effects shared by the route and the guardian: hit-stop and floating numbers.

// Hit-stop: a 50 ms freeze of the WORLD clock on heavy hits (bug debugged, shield break, returned-bolt impact).
// It is measured on the REAL clock and never touches it, so Kipu, input, invulnerability and every REVERSE timer
// keep running. Overlapping stops merge, so a volley of returned bolts never adds up to a long freeze.
export const HIT_STOP = Object.freeze({ ms: 50 });

// [from, until) is the current stop on the real clock.
export interface HitStop { readonly from: number; readonly until: number; readonly count: number; readonly totalMs: number }
export const initialHitStop = (): HitStop => ({ from: 0, until: 0, count: 0, totalMs: 0 });

export function triggerHitStop(h: HitStop, realNow: number, ms: number = HIT_STOP.ms): HitStop {
  const ongoing = realNow < h.until, until = Math.max(h.until, realNow + ms);
  return { from: ongoing ? h.from : realNow, until, count: h.count + 1, totalMs: h.totalMs + until - Math.max(h.until, realNow) };
}

export const hitStopActive = (h: HitStop, realNow: number): boolean => realNow >= h.from && realNow < h.until;

// Milliseconds of the real step [realBefore, realBefore + delta) that fall inside the stop.
export function stoppedPart(h: HitStop, realBefore: number, delta: number): number {
  const end = realBefore + Math.max(0, delta);
  return Math.max(0, Math.min(end, h.until) - Math.max(realBefore, h.from));
}

// World milliseconds for one real step: the stopped part does not advance, the rest advances at `scale`.
export function worldStep(h: HitStop, realBefore: number, delta: number, scale: number): number {
  return scale * (Math.max(0, delta) - stoppedPart(h, realBefore, delta));
}

// Floating numbers: damage and points rise a few pixels and fade. Bounded pool, no allocation after construction.
export const FLOATER = Object.freeze({ ttl: 650, rise: 10, fadeFrom: 0.55 });
export type FloaterSlot = 'damage' | 'points';
export interface Floater { text: string; x: number; y: number; born: number; slot: FloaterSlot; active: boolean }

export class FloaterPool {
  readonly items: Floater[];
  constructor(capacity: number) {
    this.items = Array.from({ length: capacity }, () => ({ text: '', x: 0, y: 0, born: 0, slot: 'damage' as FloaterSlot, active: false }));
  }
  get activeCount(): number { return this.items.reduce((n, f) => n + (f.active ? 1 : 0), 0); }
  // A full pool recycles its oldest number, so the newest hit always reads.
  spawn(text: string, x: number, y: number, slot: FloaterSlot, now: number): Floater {
    const free = this.items.find(f => !f.active) ?? this.items.reduce((oldest, f) => (f.born < oldest.born ? f : oldest));
    return Object.assign(free, { text, x, y, slot, born: now, active: true });
  }
  step(now: number): void { for (const f of this.items) if (f.active && now - f.born >= FLOATER.ttl) f.active = false; }
  clear(): void { for (const f of this.items) f.active = false; }
}

// Integer positions keep the bitmap font crisp; reduced motion keeps the fade but drops the rise.
export function floaterView(f: Floater, now: number, reduced: boolean): { x: number; y: number; alpha: number } {
  const t = Math.min(1, Math.max(0, (now - f.born) / FLOATER.ttl));
  const alpha = t <= FLOATER.fadeFrom ? 1 : 1 - (t - FLOATER.fadeFrom) / (1 - FLOATER.fadeFrom);
  return { x: Math.round(f.x), y: Math.round(f.y - (reduced ? 0 : FLOATER.rise * (1 - (1 - t) * (1 - t)))), alpha };
}
