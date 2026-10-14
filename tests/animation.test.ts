import { describe, expect, it } from 'vitest';
import { ANIM, KIPU_EDITS, ParticlePool, bossAngle, burst, chargeLevel, dissolve, flightTilt, fxColor, kipuFrame, reshapeRows } from '../src/game/animation';
import { NOKIA } from '../src/game/nokiaPalette';

describe('kipuFrame (free flight)', () => {
  it('stretches while rising fast and never while hovering or diving', () => {
    expect(kipuFrame({ velocityY: -ANIM.riseSpeed - 1, now: 0 })).toBe('stretch');
    expect(kipuFrame({ velocityY: -110, now: ANIM.breatheMs })).toBe('stretch');
    expect(kipuFrame({ velocityY: 0, now: 0 })).not.toBe('stretch');
    expect(kipuFrame({ velocityY: 110, now: 0 })).not.toBe('stretch');
  });
  it('breathes between the neutral and bob frames while hovering, never squashing', () => {
    expect(kipuFrame({ velocityY: 0, now: 0 })).toBe('idle');
    expect(kipuFrame({ velocityY: 0, now: ANIM.breatheMs })).toBe('bob');
    expect(kipuFrame({ velocityY: 60, now: ANIM.breatheMs * 2 })).toBe('idle');
    for (let t = 0; t < 3000; t += 37) expect(kipuFrame({ velocityY: 0, now: t })).not.toBe('squash');
  });
});

describe('flightTilt', () => {
  it('is level at rest, noses up while rising and leans forward when moving right', () => {
    expect(flightTilt(0, 0)).toBe(0);
    expect(flightTilt(0, -110)).toBeLessThan(0);
    expect(flightTilt(0, 110)).toBeGreaterThan(0);
    expect(flightTilt(110, 0)).toBeGreaterThan(0);
  });
  it('stays within a small rotation-only range', () => {
    for (const vx of [-110, -78, 0, 78, 110]) for (const vy of [-110, -78, 0, 78, 110]) expect(Math.abs(flightTilt(vx, vy))).toBeLessThanOrEqual(ANIM.maxTilt);
  });
});

describe('reshapeRows', () => {
  // 4x10 image; occupied rows 2..7 (exclusive 8). Each row filled with its own index+1 in alpha-opaque red channel.
  const width = 4, height = 10, top = 2, bottom = 8;
  const make = () => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = top; y < bottom; y++) for (let x = 0; x < width; x++) data.set([y + 1, 0, 0, 255], (y * width + x) * 4);
    return data;
  };
  const rowValue = (data: Uint8ClampedArray, y: number) => data[(y * width) * 4];
  const rowAlpha = (data: Uint8ClampedArray, y: number) => data[(y * width) * 4 + 3];

  it('keeps the bottom occupied row fixed when compressing and shifts upper rows down', () => {
    const out = reshapeRows(make(), width, height, top, bottom, { remove: [4] });
    expect(rowValue(out, 7)).toBe(8);          // bottom row unchanged
    expect(rowAlpha(out, 8)).toBe(0);          // nothing leaks below
    expect(rowAlpha(out, 2)).toBe(0);          // old top cleared: one row shorter
    expect(rowValue(out, 3)).toBe(3);          // first source row now one lower
    expect([3, 4, 5, 6, 7].map(y => rowValue(out, y))).toEqual([3, 4, 6, 7, 8]); // source row 5 (value index 4) removed
  });
  it('extends upward when stretching without moving the bottom', () => {
    const out = reshapeRows(make(), width, height, top, bottom, { add: [4] });
    expect(rowValue(out, 7)).toBe(8);
    expect(rowAlpha(out, 1)).toBe(255);
    expect(rowAlpha(out, 0)).toBe(0);
  });
  it('does not mutate its input and never grows past the frame', () => {
    const input = make(); const copy = input.slice();
    reshapeRows(input, width, height, top, bottom, { remove: [3] });
    expect(input).toEqual(copy);
    expect(() => reshapeRows(make(), width, height, top, bottom, { add: [2, 3, 4] })).toThrow();
  });
  it('preserves the opaque pixel count of untouched rows exactly', () => {
    const out = reshapeRows(make(), width, height, top, bottom, { remove: [5] });
    let opaque = 0; for (let i = 3; i < out.length; i += 4) if (out[i] === 255) opaque++;
    expect(opaque).toBe((bottom - top - 1) * width);
  });
});

describe('Kipu derived frames respect the approved identity', () => {
  it('never edits the eye rows (19-20) or the bottom occupied row (31)', () => {
    for (const edit of Object.values(KIPU_EDITS)) {
      for (const row of [...(edit.remove ?? []), ...(edit.add ?? [])]) expect(row).toBeGreaterThanOrEqual(22);
      for (const row of [...(edit.remove ?? []), ...(edit.add ?? [])]) expect(row).toBeLessThan(31);
    }
  });
});

describe('bossAngle', () => {
  it('rears back through anticipation, lunges on action and droops in recovery', () => {
    expect(bossAngle('anticipation', 790, 0)).toBeLessThan(bossAngle('anticipation', 10, 0));
    expect(bossAngle('action', 0, 0)).toBeGreaterThan(0);
    expect(Math.abs(bossAngle('action', 500, 0))).toBeLessThan(Math.abs(bossAngle('action', 0, 0)));
    expect(bossAngle('recovery', 100, 0)).toBeGreaterThan(0);
  });
  it('stays within a small visual range so the forgiving body is not visually contradicted', () => {
    for (const stage of ['idle', 'anticipation', 'action', 'recovery'] as const) {
      for (let t = 0; t < 1500; t += 37) expect(Math.abs(bossAngle(stage, t, t * 3))).toBeLessThanOrEqual(12);
    }
  });
  it('charge ramps 0..1 only during anticipation', () => {
    expect(chargeLevel('anticipation', 0)).toBe(0);
    expect(chargeLevel('anticipation', 800)).toBe(1);
    expect(chargeLevel('action', 100)).toBe(0);
    expect(chargeLevel('idle', 100)).toBe(0);
  });
});

describe('ParticlePool', () => {
  it('is bounded, rejects emits when full and recycles expired particles', () => {
    const pool = new ParticlePool(3);
    for (let i = 0; i < 5; i++) pool.emit({ x: 0, y: 0, vx: 0, vy: 0, ttl: 100, slot: 'light', size: 1 }, 0);
    expect(pool.activeCount).toBe(3);
    pool.step(100, 0.1, 0);
    expect(pool.activeCount).toBe(0);
    expect(pool.emit({ x: 0, y: 0, vx: 0, vy: 0, ttl: 50, slot: 'gold', size: 2 }, 100)).toBe(true);
  });
  it('integrates velocity and gravity in seconds', () => {
    const pool = new ParticlePool(1);
    pool.emit({ x: 10, y: 10, vx: 20, vy: -10, ttl: 1000, slot: 'teal', size: 1 }, 0);
    pool.step(100, 0.1, 100);
    const p = pool.items[0];
    expect(p.x).toBeCloseTo(12); expect(p.y).toBeCloseTo(10 + (-10 + 100 * 0.1) * 0.1);
  });
  it('burst emits evenly spaced deterministic directions and respects capacity', () => {
    const a = new ParticlePool(8), b = new ParticlePool(8);
    burst(a, 5, 5, 6, 40, 300, 'gold', 0); burst(b, 5, 5, 6, 40, 300, 'gold', 0);
    expect(a.activeCount).toBe(6);
    expect(a.items.map(p => [p.vx, p.vy])).toEqual(b.items.map(p => [p.vx, p.vy]));
    const small = new ParticlePool(2); burst(small, 0, 0, 10, 10, 100, 'light', 0);
    expect(small.activeCount).toBe(2);
  });
});

describe('fxColor', () => {
  it('maps every effect slot to exactly one of the four Nokia greens when the palette is active', () => {
    for (const slot of ['light', 'gold', 'teal', 'violet', 'terracotta', 'plum'] as const) expect(NOKIA).toContain(fxColor(slot, true));
  });
  it('keeps the warm-gold and violet identities in the normal palette', () => {
    expect(fxColor('gold', false)).toBe(0xedc76c);
    expect(fxColor('violet', false)).toBe(0xc985ef);
    expect(fxColor('terracotta', false)).toBe(0xd8573f);
    expect(fxColor('plum', false)).toBe(0x4a2266);
  });
});

describe('debugged bugs dissolve ("se depuran")', () => {
  it('turn into rising turquoise and gold sparkles over the bug, never violet', () => {
    const pool = new ParticlePool(32);
    dissolve(pool, 100, 50, 12, 12, 0);
    const sparks = pool.items.filter(p => p.active);
    expect(sparks.length).toBe(9);
    expect(new Set(sparks.map(p => p.slot))).toEqual(new Set(['teal', 'gold']));
    for (const p of sparks) {
      expect(p.vy).toBeLessThan(0);
      expect(Math.abs(p.x - 100)).toBeLessThanOrEqual(6);
      expect(Math.abs(p.y - 50)).toBeLessThanOrEqual(6);
      expect(p.ttl).toBeLessThanOrEqual(520);
    }
    const again = new ParticlePool(32);
    dissolve(again, 100, 50, 12, 12, 0);
    expect(again.items.map(p => [p.x, p.y, p.vx, p.vy])).toEqual(pool.items.map(p => [p.x, p.y, p.vx, p.vy]));
  });
  it('emits nothing under reduced motion', () => {
    const pool = new ParticlePool(32, () => true);
    dissolve(pool, 0, 0, 12, 12, 0);
    expect(pool.activeCount).toBe(0);
  });
});
