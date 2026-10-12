import { describe, expect, it } from 'vitest';
import { ParticlePool, kipuTextureKey } from '../src/game/animation';
import { KIPU_BAND, KipuAnimator, deriveKipuTextureData } from '../src/game/kipuAnimator';

const sprite = () => { const s = { texture: { key: 'kipu-evaluation' }, swaps: 0, setTexture(key: string) { s.texture.key = key; s.swaps++; } }; return s; };
const tick = (over: Partial<Parameters<KipuAnimator['update']>[0]> = {}) => ({ now: 0, grounded: true, velocityX: 0, velocityY: 0, facing: 1 as const, footX: 50, footY: 155, nokia: false, ...over });

describe('KipuAnimator', () => {
  it('uses the stretch frame on takeoff and emits dust once', () => {
    const s = sprite(), fx = new ParticlePool(32), a = new KipuAnimator(s, fx);
    a.update(tick());
    a.update(tick({ now: 16, grounded: false, velocityY: -250 }));
    expect(s.texture.key).toBe('kipu-evaluation-stretch');
    const after = fx.activeCount;
    expect(after).toBeGreaterThan(0);
    a.update(tick({ now: 32, grounded: false, velocityY: -240 }));
    expect(fx.activeCount).toBe(after);
  });
  it('reports one-shot land and takeoff events for the audio layer', () => {
    const a = new KipuAnimator(sprite(), new ParticlePool(32));
    a.update(tick());
    a.update(tick({ now: 16, grounded: false, velocityY: -250 }));
    expect(a.event).toBe('takeoff');
    a.update(tick({ now: 32, grounded: false, velocityY: 100 }));
    expect(a.event).toBeNull();
    a.update(tick({ now: 48 }));
    expect(a.event).toBe('land');
    a.update(tick({ now: 64 }));
    expect(a.event).toBeNull();
  });
  it('squashes on a hard landing but not after a soft one', () => {
    const s = sprite(), a = new KipuAnimator(s, new ParticlePool(32));
    a.update(tick({ grounded: false, velocityY: 200 }));
    a.update(tick({ now: 16 }));
    expect(s.texture.key).toBe('kipu-evaluation-squash');
    const soft = sprite(), b = new KipuAnimator(soft, new ParticlePool(32));
    b.update(tick({ grounded: false, velocityY: 20 }));
    b.update(tick({ now: 16 }));
    expect(soft.texture.key).not.toBe('kipu-evaluation-squash');
  });
  it('selects the four-green variant and avoids redundant texture swaps', () => {
    const s = sprite(), a = new KipuAnimator(s, new ParticlePool(8));
    a.update(tick({ nokia: true }));
    expect(s.texture.key).toBe('kipu-evaluation-nokia');
    const swaps = s.swaps;
    a.update(tick({ now: 5, nokia: true }));
    expect(s.swaps).toBe(swaps);
  });
  it('emits bounded run dust at a steady cadence and none while idle', () => {
    const fx = new ParticlePool(64), a = new KipuAnimator(sprite(), fx);
    for (let t = 0; t < 1000; t += 16) a.update(tick({ now: t, velocityX: 100 }));
    expect(fx.activeCount).toBeGreaterThan(0);
    expect(fx.activeCount).toBeLessThanOrEqual(10);
    const idle = new ParticlePool(8), b = new KipuAnimator(sprite(), idle);
    for (let t = 0; t < 1000; t += 16) b.update(tick({ now: t }));
    expect(idle.activeCount).toBe(0);
  });
  it('holds a requested frame regardless of motion', () => {
    const s = sprite(), a = new KipuAnimator(s, new ParticlePool(4));
    a.hold('squash', true);
    expect(s.texture.key).toBe(kipuTextureKey('squash', true));
  });
});

describe('deriveKipuTextureData', () => {
  const width = 32, height = 40;
  const base = new Uint8ClampedArray(width * height * 4);
  for (let y = KIPU_BAND.top; y < KIPU_BAND.bottom; y++) for (let x = 6; x < 26; x++) base.set([y * 5, 10, 20, 255], (y * width + x) * 4);
  const derived = deriveKipuTextureData(base, width, height);
  const bottomRow = (d: Uint8ClampedArray) => d.slice((KIPU_BAND.bottom - 1) * width * 4, KIPU_BAND.bottom * width * 4);
  it('creates exactly the three non-idle frames with identical dimensions and a fixed bottom row', () => {
    expect(Object.keys(derived).sort()).toEqual(['kipu-evaluation-bob', 'kipu-evaluation-squash', 'kipu-evaluation-stretch']);
    for (const data of Object.values(derived)) {
      expect(data.length).toBe(base.length);
      expect(bottomRow(data)).toEqual(bottomRow(base));
    }
  });
  it('introduces no new colors and keeps alpha binary', () => {
    const colors = new Set<string>();
    for (let i = 0; i < base.length; i += 4) if (base[i + 3]) colors.add(`${base[i]},${base[i + 1]},${base[i + 2]}`);
    for (const data of Object.values(derived)) for (let i = 0; i < data.length; i += 4) {
      expect([0, 255]).toContain(data[i + 3]);
      if (data[i + 3]) expect(colors.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)).toBe(true);
    }
  });
});
