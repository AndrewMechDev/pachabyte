import { describe, expect, it } from 'vitest';
import { kipuTextureKey } from '../src/game/animation';
import { KIPU_BAND, KipuAnimator, deriveKipuTextureData } from '../src/game/kipuAnimator';

const sprite = () => { const s = { texture: { key: 'kipu-evaluation' }, swaps: 0, setTexture(key: string) { s.texture.key = key; s.swaps++; } }; return s; };
const tick = (over: Partial<Parameters<KipuAnimator['update']>[0]> = {}) => ({ now: 0, velocityY: 0, nokia: false, ...over });

describe('KipuAnimator (free flight)', () => {
  it('uses the stretch frame while flying up fast', () => {
    const s = sprite(), a = new KipuAnimator(s);
    a.update(tick({ velocityY: -110 }));
    expect(s.texture.key).toBe('kipu-evaluation-stretch');
    expect(a.frame).toBe('stretch');
  });
  it('hovers with a slow breathing cycle', () => {
    const s = sprite(), a = new KipuAnimator(s);
    a.update(tick({ now: 0 }));
    expect(s.texture.key).toBe('kipu-evaluation');
    a.update(tick({ now: 450 }));
    expect(s.texture.key).toBe('kipu-evaluation-bob');
  });
  it('selects the four-green variant and avoids redundant texture swaps', () => {
    const s = sprite(), a = new KipuAnimator(s);
    a.update(tick({ nokia: true }));
    expect(s.texture.key).toBe('kipu-evaluation-nokia');
    const swaps = s.swaps;
    a.update(tick({ now: 5, nokia: true }));
    expect(s.swaps).toBe(swaps);
  });
  it('holds a requested frame regardless of motion', () => {
    const s = sprite(), a = new KipuAnimator(s);
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
