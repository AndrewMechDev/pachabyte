import { describe, expect, it } from 'vitest';
import { Motion } from '../src/game/motion';
import { ParticlePool, bossAngle } from '../src/game/animation';
import { KipuAnimator } from '../src/game/kipuAnimator';

describe('Motion preference', () => {
  it('starts from the system preference and can be overridden both ways', () => {
    const m = new Motion(() => true);
    expect(m.reduced).toBe(true);
    m.set(false); expect(m.reduced).toBe(false);
    expect(new Motion(() => false).reduced).toBe(false);
  });
  it('defaults to full motion when matchMedia is unavailable', () => {
    expect(new Motion().reduced).toBe(false);
  });
});

describe('reduced motion gates decorative effects only', () => {
  it('suppresses particle emission while the predicate holds', () => {
    let reduced = true;
    const pool = new ParticlePool(4, () => reduced);
    expect(pool.emit({ x: 0, y: 0, vx: 0, vy: 0, ttl: 100, slot: 'light', size: 1 }, 0)).toBe(false);
    reduced = false;
    expect(pool.emit({ x: 0, y: 0, vx: 0, vy: 0, ttl: 100, slot: 'light', size: 1 }, 0)).toBe(true);
  });
  it('keeps Kipu on the neutral frame when reduced', () => {
    const s = { texture: { key: 'kipu-evaluation' }, setTexture(key: string) { s.texture.key = key; } };
    const a = new KipuAnimator(s);
    a.update({ now: 450, velocityY: -110, nokia: false, reduced: true });
    expect(s.texture.key).toBe('kipu-evaluation');
  });
  it('lets the boss angle callers zero rotation; the pure function itself stays bounded', () => {
    expect(Math.abs(bossAngle('anticipation', 800, 0))).toBeLessThanOrEqual(12);
  });
});
