import { describe, expect, it } from 'vitest';
import { FREED, FREED_KINDS, creatureAngle, freedSparks, freedStage, freedTotalMs, freedView } from '../src/game/liberationFx';
import { LIBERATION } from '../src/game/liberationRules';

const distance = (i: number, age: number) => { const v = freedView(i, age, false); return Math.hypot(v.x, v.y); };

describe('Amaru liberation burst', () => {
  it('releases 8 to 12 creatures of the three corrupted kinds, from a bounded pool', () => {
    expect(FREED.count).toBeGreaterThanOrEqual(8);
    expect(FREED.count).toBeLessThanOrEqual(12);
    expect(FREED_KINDS.length).toBe(FREED.count);
    expect(new Set(FREED_KINDS)).toEqual(new Set(['glitchling', 'corruptor', 'sombra']));
    expect(FREED.capacity).toBeGreaterThanOrEqual(FREED.count);
  });
  it('uses deterministic, distinct, evenly spread angles (no randomness)', () => {
    const angles = Array.from({ length: FREED.count }, (_, i) => creatureAngle(i));
    expect(angles).toEqual(Array.from({ length: FREED.count }, (_, i) => creatureAngle(i)));
    expect(new Set(angles).size).toBe(FREED.count);
    const gaps = angles.slice(1).map((a, i) => a - angles[i]);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]);
    expect(Math.abs(gaps[0]) * FREED.count).toBeCloseTo(Math.PI * 2);
  });
  it('fits inside the recede stage so every creature is gone before the restore, dialogue and codex', () => {
    expect(freedTotalMs()).toBeLessThanOrEqual(LIBERATION.recedeMs);
    expect(FREED.reducedMs).toBeLessThanOrEqual(LIBERATION.recedeMs);
    for (let i = 0; i < FREED.count; i++) expect(freedView(i, freedTotalMs(), false).visible).toBe(false);
  });
  it('walks each creature through big, small and sparkle stages, staggered by index', () => {
    expect(freedStage(0, -1)).toBe('wait');
    expect(freedStage(3, 3 * FREED.spawnGapMs - 1)).toBe('wait');
    expect(freedStage(3, 3 * FREED.spawnGapMs)).toBe('big');
    const start = 2 * FREED.spawnGapMs;
    expect([0, FREED.bigMs - 1, FREED.bigMs, FREED.bigMs + FREED.smallMs - 1, FREED.bigMs + FREED.smallMs, FREED.bigMs + FREED.smallMs + FREED.sparkMs - 1, FREED.bigMs + FREED.smallMs + FREED.sparkMs]
      .map(dt => freedStage(2, start + dt))).toEqual(['big', 'big', 'small', 'small', 'spark', 'spark', 'gone']);
  });
  it('shows the real sprite frames big, then smaller shadow frames, then nothing (sparkles take over)', () => {
    const big = freedView(1, FREED.spawnGapMs + 10, false), small = freedView(1, FREED.spawnGapMs + FREED.bigMs + 10, false), spark = freedView(1, FREED.spawnGapMs + FREED.bigMs + FREED.smallMs + 10, false);
    expect(big).toMatchObject({ visible: true, stage: 'big' });
    expect(['glitchling', 'glitchling-b', 'corruptor', 'corruptor-b', 'sombra', 'sombra-b', 'sombra-c']).toContain(big.texture);
    expect(small).toMatchObject({ visible: true, stage: 'small' });
    expect(['shadow', 'shadow-b']).toContain(small.texture);
    expect(spark.visible).toBe(false);
    // Only whole-pixel positions and no scale field: the art is shown by its own texture frame, never scaled.
    expect(Object.keys(big).sort()).toEqual(['alpha', 'stage', 'texture', 'visible', 'x', 'y']);
    expect(Number.isInteger(big.x) && Number.isInteger(big.y)).toBe(true);
  });
  it('flies each creature outward from Amaru along an arc, away from where it started', () => {
    for (let i = 0; i < FREED.count; i++) {
      const start = i * FREED.spawnGapMs, flight = FREED.bigMs + FREED.smallMs;
      const samples = [10, flight * 0.3, flight * 0.6, flight - 5].map(dt => distance(i, start + dt));
      for (let k = 1; k < samples.length; k++) expect(samples[k]).toBeGreaterThan(samples[k - 1]);
      expect(samples[samples.length - 1]).toBeGreaterThan(40);
    }
    // An arc, not a straight line: the path bends away from the straight direction of the creature's angle.
    const mid = FREED.spawnGapMs + (FREED.bigMs + FREED.smallMs) / 2, v = freedView(1, mid, false), a = creatureAngle(1);
    expect(Math.abs(-Math.sin(a) * v.x + Math.cos(a) * v.y)).toBeGreaterThan(2);
  });
  it('is fully deterministic', () => {
    for (let i = 0; i < FREED.count; i++) for (const age of [0, 100, 333, 700, 1100]) expect(freedView(i, age, false)).toEqual(freedView(i, age, false));
  });
  it('under reduced motion shows a brief static fade instead of the burst', () => {
    for (let i = 0; i < FREED.count; i++) {
      const first = freedView(i, 1, true), later = freedView(i, FREED.reducedMs - 50, true);
      expect(first.visible && later.visible).toBe(true);
      expect([later.x, later.y, later.texture]).toEqual([first.x, first.y, first.texture]);
      expect(later.alpha).toBeLessThan(first.alpha);
      expect(first.alpha).toBeLessThanOrEqual(1);
      expect(freedView(i, FREED.reducedMs, true).visible).toBe(false);
      expect(freedView(i, -1, true).visible).toBe(false);
      expect(['glitchling', 'corruptor', 'sombra']).toContain(first.texture);
    }
  });
  it('turns the end of each flight into a few turquoise and gold sparkles', () => {
    const sparks = freedSparks(4, 120, 60);
    expect(sparks.length).toBeGreaterThanOrEqual(3);
    expect(sparks).toEqual(freedSparks(4, 120, 60));
    for (const s of sparks) {
      expect(['teal', 'gold']).toContain(s.slot);
      expect(s.ttl).toBeGreaterThan(200);
      expect(s.ttl).toBeLessThanOrEqual(500);
      expect(Math.abs(s.x - 120)).toBeLessThanOrEqual(3);
    }
    expect(new Set(sparks.map(s => s.slot)).size).toBe(2);
  });
});
