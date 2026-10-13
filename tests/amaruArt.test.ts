import { describe, expect, it } from 'vitest';
import { corePixels, orbPixels, returnPixels, rhombusPixels, segmentPixels, tailPixels, type Pixels } from '../src/game/amaruArt';

const mask = (p: Pixels): string => Array.from({ length: p.width * p.height }, (_, i) => (p.data[i * 4 + 3] ? '1' : '0')).join('');

describe('Amaru placeholder art', () => {
  it('uses the tentative module sizes from the Art Bible and asset requests', () => {
    expect([segmentPixels(), tailPixels(), corePixels()].map(p => [p.width, p.height])).toEqual([[24, 24], [32, 32], [16, 16]]);
  });
  it('keeps alpha binary and leaves transparent margins', () => {
    for (const p of [segmentPixels(), tailPixels(), corePixels(), orbPixels(), rhombusPixels(), returnPixels()]) {
      for (let i = 3; i < p.data.length; i += 4) expect([0, 255]).toContain(p.data[i]);
      expect(p.data[3]).toBe(0);
    }
  });
  it('tells capturable rhombus bolts from dangerous orbs by silhouette', () => {
    const orb = orbPixels(), rhombus = rhombusPixels();
    expect(rhombus.height).toBeGreaterThan(orb.height);
    // The rhombus narrows to a single pixel at its tips; the orb's top row is several pixels wide.
    const row = (p: Pixels, y: number) => mask(p).slice(y * p.width, (y + 1) * p.width).split('').filter(c => c === '1').length;
    expect(row(rhombus, 0)).toBe(1);
    expect(row(orb, 0)).toBeGreaterThanOrEqual(3);
  });
});
