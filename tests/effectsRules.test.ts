import { describe, expect, it } from 'vitest';
import { FLOATER, FloaterPool, HIT_STOP, floaterView, hitStopActive, initialHitStop, stoppedPart, triggerHitStop, worldStep } from '../src/game/effectsRules';

describe('hit-stop on the world clock', () => {
  it('lasts 50 ms of real time from the heavy hit', () => {
    expect(HIT_STOP.ms).toBe(50);
    const h = triggerHitStop(initialHitStop(), 1000);
    expect(h).toEqual({ from: 1000, until: 1050, count: 1, totalMs: 50 });
    expect(hitStopActive(h, 999)).toBe(false);
    expect(hitStopActive(h, 1049)).toBe(true);
    expect(hitStopActive(h, 1050)).toBe(false);
  });
  it('merges overlapping heavy hits instead of stacking them', () => {
    const first = triggerHitStop(initialHitStop(), 1000);
    const second = triggerHitStop(first, 1030);
    expect(second).toEqual({ from: 1000, until: 1080, count: 2, totalMs: 80 });
    const later = triggerHitStop(second, 5000);
    expect(later).toMatchObject({ from: 5000, until: 5050, totalMs: 130 });
  });
  it('removes only the stopped part of a real step from the world step', () => {
    const h = triggerHitStop(initialHitStop(), 1000);
    expect(stoppedPart(h, 990, 16)).toBe(6);
    expect(worldStep(h, 990, 16, 1)).toBe(10);
    expect(worldStep(h, 1000, 16, 1)).toBe(0);
    expect(worldStep(h, 1040, 16, 1)).toBe(6);
    expect(worldStep(h, 1050, 16, 1)).toBe(16);
    expect(worldStep(h, 1060, 16, 0.2)).toBeCloseTo(3.2);
    expect(worldStep(initialHitStop(), 0, 16, 1)).toBe(16);
  });
  it('never steps the world clock backwards on a fully stopped frame (float rounding, A2 Marea smoke flake)', () => {
    // (r + d) - r is 3.6e-12 larger than d here, which used to make the world step slightly negative.
    const r = 57549.42859116429, d = 16.780959471045275, h = triggerHitStop(initialHitStop(), r);
    expect(worldStep(h, r, d, 1)).toBe(0);
    expect(worldStep(h, r, d, 0.2)).toBe(0);
    for (let i = 0; i < 2000; i++) {
      const real = 40000 + i * 7.31, delta = 16 + (i % 7) * 0.37, stop = triggerHitStop(initialHitStop(), real - (i % 3));
      const w = worldStep(stop, real, delta, 1);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(delta);
    }
  });
  it('costs the world exactly 50 ms over a stretch of frames', () => {
    let h = initialHitStop(), real = 0, world = 0;
    for (let frame = 0; frame < 120; frame++) {
      if (frame === 30) h = triggerHitStop(h, real);
      world += worldStep(h, real, 16.7, 1);
      real += 16.7;
    }
    expect(real - world).toBeCloseTo(50, 6);
  });
});

describe('floating numbers', () => {
  it('rise and fade over a short life, and stay put under reduced motion', () => {
    const pool = new FloaterPool(4);
    const f = pool.spawn('3', 100, 80, 'damage', 0);
    expect(floaterView(f, 0, false)).toEqual({ x: 100, y: 80, alpha: 1 });
    const late = floaterView(f, FLOATER.ttl * 0.9, false);
    expect(late.y).toBeLessThan(80);
    expect(80 - late.y).toBeLessThanOrEqual(FLOATER.rise);
    expect(late.alpha).toBeGreaterThan(0);
    expect(late.alpha).toBeLessThan(1);
    expect(floaterView(f, FLOATER.ttl * 0.9, true).y).toBe(80);
    expect(Number.isInteger(late.y)).toBe(true);
  });
  it('are pooled: a full pool recycles the oldest number and expired ones go inactive', () => {
    const pool = new FloaterPool(2);
    const a = pool.spawn('1', 0, 0, 'damage', 0);
    pool.spawn('2', 0, 0, 'damage', 10);
    const c = pool.spawn('+75', 0, 0, 'points', 20);
    expect(pool.items).toHaveLength(2);
    expect(c).toBe(a);
    expect(c.text).toBe('+75');
    expect(pool.activeCount).toBe(2);
    pool.step(10 + FLOATER.ttl);
    expect(pool.activeCount).toBe(1);
    pool.clear();
    expect(pool.activeCount).toBe(0);
  });
});
