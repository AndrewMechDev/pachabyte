import { describe, expect, it } from 'vitest';
import {
  IMPACT, ImpactPool, SHOT_ART, SHOT_BODY, SHOT_FLICKER_MS, SHOT_KINDS, drawImpacts, impactFrame, impactPixels, shotFrame, shotKindFor, shotOrigin, shotTextureKey,
} from '../src/game/shotFx';
import { NOKIA } from '../src/game/nokiaPalette';
import { fxColor } from '../src/game/animation';

describe('animated bolt art (placeholder for the SHOTS asset)', () => {
  it('keeps the tuned 6x3 physics body: only the drawn bolt changed', () => {
    expect(SHOT_BODY).toEqual({ width: 6, height: 3 });
    expect(SHOT_KINDS).toEqual(['normal', 'rafaga']);
  });
  it('gives each kind 2-3 equally sized frames with only declared colors and a transparent margin', () => {
    for (const kind of SHOT_KINDS) {
      const art = SHOT_ART[kind];
      expect(art.frames.length).toBeGreaterThanOrEqual(2);
      expect(art.frames.length).toBeLessThanOrEqual(3);
      const [w, h] = [art.frames[0][0].length, art.frames[0].length];
      for (const rows of art.frames) {
        expect(rows.length).toBe(h);
        for (const row of rows) {
          expect(row.length).toBe(w);
          for (const char of row) if (char !== '.') expect(art.colors[char]).toBeDefined();
        }
      }
      // The first row and the last column keep clear pixels, so scaling or rotating never clips the art.
      expect(art.frames.every(rows => rows[0].split('').every(char => char === '.'))).toBe(true);
    }
  });
  it('tells the Ráfaga from the normal bolt by color AND shape', () => {
    const size = (kind: 'normal' | 'rafaga') => [SHOT_ART[kind].frames[0][0].length, SHOT_ART[kind].frames[0].length];
    const [nw, nh] = size('normal'), [rw, rh] = size('rafaga');
    expect(rw).toBeGreaterThanOrEqual(nw + 5);
    expect(rh).toBeGreaterThan(nh);
    const palette = (kind: 'normal' | 'rafaga') => new Set(SHOT_ART[kind].frames.flatMap(rows => rows.join('').split('')).filter(char => char !== '.').map(char => SHOT_ART[kind].colors[char]));
    const normal = palette('normal'), rafaga = palette('rafaga');
    // Golden bolt with an ivory core; turquoise-and-gold arrow.
    expect(normal.has(0xedc76c)).toBe(true);
    expect([...normal].some(c => ((c >> 8) & 255) > 0xb0 && (c & 255) < 0x80 && (c >> 16) > 0xd0)).toBe(true);
    expect([...rafaga].some(c => (c >> 16) < 0x60 && ((c >> 8) & 255) > 0xa0 && (c & 255) > 0x90)).toBe(true);
    expect(rafaga.has(0xedc76c)).toBe(true);
    expect([...normal].filter(c => (c >> 16) < 0x60).length).toBe(0);
  });
  it('never uses a rhombus silhouette, which is reserved for capturable boss bolts', () => {
    // A rhombus is symmetric top to bottom, starts and ends on a single pixel and widens strictly to its middle row.
    const isRhombus = (rows: readonly string[]): boolean => {
      const counts = rows.map(row => row.split('').filter(char => char !== '.').length).filter(count => count > 0);
      const mid = counts.indexOf(Math.max(...counts));
      return counts[0] === 1 && counts[counts.length - 1] === 1 && counts.every((count, i) => count === counts[counts.length - 1 - i])
        && counts.slice(0, mid + 1).every((count, i, all) => i === 0 || count > all[i - 1]);
    };
    for (const kind of SHOT_KINDS) for (const rows of SHOT_ART[kind].frames) expect(isRhombus(rows)).toBe(false);
  });
  it('anchors the physics body inside the drawn art and derives the sprite origin from it', () => {
    for (const kind of SHOT_KINDS) {
      const art = SHOT_ART[kind], [w, h] = [art.frames[0][0].length, art.frames[0].length], origin = shotOrigin(kind);
      expect(art.anchor[0]).toBeGreaterThanOrEqual(SHOT_BODY.width / 2);
      expect(art.anchor[0]).toBeLessThanOrEqual(w - SHOT_BODY.width / 2);
      expect(origin.x).toBeCloseTo(art.anchor[0] / w);
      expect(origin.y).toBeCloseTo(art.anchor[1] / h);
    }
  });
  it('flickers the tail through its frames every few milliseconds and stays on the first frame when motion is reduced', () => {
    for (const kind of SHOT_KINDS) {
      const count = SHOT_ART[kind].frames.length;
      expect(shotFrame(kind, 0, false)).toBe(0);
      expect(shotFrame(kind, SHOT_FLICKER_MS, false)).toBe(1);
      expect(shotFrame(kind, SHOT_FLICKER_MS * count, false)).toBe(0);
      expect(new Set(Array.from({ length: count * 3 }, (_, i) => shotFrame(kind, i * SHOT_FLICKER_MS, false))).size).toBe(count);
      for (const age of [-5, 0, 61, 500, 4000]) expect(shotFrame(kind, age, true)).toBe(0);
      expect(shotFrame(kind, -40, false)).toBe(0);
    }
  });
  it('names one texture per kind, frame and palette, so the two kinds never share a bolt texture', () => {
    expect(shotTextureKey('normal', 1, false)).toBe('shot-normal-1');
    expect(shotTextureKey('rafaga', 2, true)).toBe('shot-rafaga-2-nokia');
    const keys = new Set<string>();
    for (const kind of SHOT_KINDS) for (let f = 0; f < SHOT_ART[kind].frames.length; f++) for (const nokia of [false, true]) keys.add(shotTextureKey(kind, f, nokia));
    expect(keys.size).toBe((SHOT_ART.normal.frames.length + SHOT_ART.rafaga.frames.length) * 2);
  });
  it('picks the kind from the Ráfaga state', () => {
    expect(shotKindFor(false)).toBe('normal');
    expect(shotKindFor(true)).toBe('rafaga');
  });
});

describe('impact star burst', () => {
  it('has four frames over a short time and ends', () => {
    expect(IMPACT.frames).toBe(4);
    expect(IMPACT.ms).toBeLessThanOrEqual(220);
    expect([0, IMPACT.ms / 4 - 1, IMPACT.ms / 4, IMPACT.ms / 2, IMPACT.ms * 0.75, IMPACT.ms - 1].map(age => impactFrame(age, false))).toEqual([0, 0, 1, 2, 3, 3]);
    expect(impactFrame(IMPACT.ms, false)).toBe(-1);
    expect(impactFrame(-1, false)).toBe(-1);
  });
  it('shows one static frame briefly under reduced motion', () => {
    for (const age of [0, 20, IMPACT.reducedMs - 1]) expect(impactFrame(age, true)).toBe(IMPACT.reducedFrame);
    expect(impactFrame(IMPACT.reducedMs, true)).toBe(-1);
    expect(IMPACT.reducedMs).toBeLessThanOrEqual(IMPACT.ms);
  });
  it('goes ivory, then gold, then terracotta, as a four-fold symmetric star of whole pixels', () => {
    const slots = (frame: number) => new Set(impactPixels(frame, 'normal').map(p => p.slot));
    expect([...slots(0)]).toEqual(['light']);
    expect(slots(1).has('gold')).toBe(true);
    expect(slots(2).has('terracotta')).toBe(true);
    expect([...slots(3)]).toEqual(['terracotta']);
    for (const kind of ['normal', 'rafaga'] as const) for (let frame = 0; frame < IMPACT.frames; frame++) {
      const pixels = impactPixels(frame, kind), has = (dx: number, dy: number) => pixels.some(p => p.dx === dx && p.dy === dy);
      expect(pixels.length).toBeGreaterThan(0);
      for (const p of pixels) {
        expect(Number.isInteger(p.dx) && Number.isInteger(p.dy)).toBe(true);
        expect(has(-p.dx, p.dy) && has(p.dx, -p.dy)).toBe(true);
      }
    }
  });
  it('grows the star for a Ráfaga hit and keeps it small for a normal hit', () => {
    const radius = (kind: 'normal' | 'rafaga') => Math.max(...Array.from({ length: IMPACT.frames }, (_, f) => impactPixels(f, kind)).flat().map(p => Math.max(Math.abs(p.dx), Math.abs(p.dy))));
    expect(radius('normal')).toBeLessThanOrEqual(4);
    expect(radius('rafaga')).toBeGreaterThan(radius('normal'));
  });
  it('uses a bounded pool that recycles its oldest burst and expires them', () => {
    const pool = new ImpactPool(3);
    expect(pool.items.length).toBe(3);
    pool.spawn(1, 1, 'normal', 0); pool.spawn(2, 2, 'rafaga', 10); pool.spawn(3, 3, 'normal', 20);
    expect(pool.activeCount).toBe(3);
    pool.spawn(4, 4, 'normal', 30);
    expect(pool.items.length).toBe(3);
    expect(pool.items.map(i => i.x).sort()).toEqual([2, 3, 4]);
    expect(pool.spawned).toBe(4);
    pool.step(IMPACT.ms + 25, false);
    expect(pool.items.filter(i => i.active).map(i => i.x)).toEqual([4]);
    pool.step(IMPACT.ms + 40, false);
    expect(pool.activeCount).toBe(0);
    pool.spawn(9, 9, 'normal', 1000); pool.step(1000 + IMPACT.reducedMs, true);
    expect(pool.activeCount).toBe(0);
    pool.spawn(9, 9, 'normal', 2000); pool.clear();
    expect(pool.activeCount).toBe(0);
  });
  it('draws hard-pixel squares in exact four-green colors during REVERSE and a static frame under reduced motion', () => {
    const calls: Array<[number, number, number, number, number]> = [];
    let color = 0;
    const painter = { fillStyle(c: number) { color = c; }, fillRect(x: number, y: number, w: number, h: number) { calls.push([color, x, y, w, h]); } };
    const pool = new ImpactPool(4);
    pool.spawn(100.4, 50.6, 'normal', 0);
    drawImpacts(painter, pool, 0, true, false);
    expect(calls.length).toBeGreaterThan(0);
    for (const [c, x, y, w, h] of calls) { expect(NOKIA).toContain(c); expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true); expect([w, h]).toEqual([1, 1]); }
    calls.length = 0;
    drawImpacts(painter, pool, 0, false, false);
    expect(new Set(calls.map(c => c[0]))).toEqual(new Set([fxColor('light', false)]));
    calls.length = 0;
    drawImpacts(painter, pool, 20, false, true);
    const staticA = calls.map(c => c.join()).join('|');
    expect(staticA.length).toBeGreaterThan(0);
    calls.length = 0;
    drawImpacts(painter, pool, 90, false, true);
    expect(calls.map(c => c.join()).join('|')).toBe(staticA);
    calls.length = 0;
    drawImpacts(painter, pool, IMPACT.ms + 5, false, false);
    expect(calls.length).toBe(0);
  });
});
