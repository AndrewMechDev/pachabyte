import { describe, expect, it } from 'vitest';
import { CORAZON, ESCUDO, PICKUP_COLORS, RAFAGA, SHIELD_ICON } from '../src/game/pickupArt';
import { PICKUPS } from '../src/game/pickupRules';

const solid = (rows: readonly string[], x: number, y: number) => (rows[y]?.[x] ?? '.') !== '.';
// Opaque pixels of one color class, ignoring the dark outline.
const core = (rows: readonly string[]) => rows.flatMap((row, y) => [...row].map((c, x) => [c, x, y] as const)).filter(([c]) => c !== '.' && c !== 'd');
function components(rows: readonly string[], keep: (c: string) => boolean): number {
  const seen = new Set<string>(); let count = 0;
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (!keep(c) || seen.has(`${x},${y}`)) return;
    count++;
    const stack = [[x, y]];
    while (stack.length) {
      const [px, py] = stack.pop()!;
      const key = `${px},${py}`;
      if (seen.has(key) || !keep(rows[py]?.[px] ?? '.')) continue;
      seen.add(key);
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
  }));
  return count;
}

describe('pickup placeholders (pending asset requests)', () => {
  it('are rectangular pixel rows with only known colors', () => {
    for (const rows of [RAFAGA, ESCUDO, CORAZON]) {
      expect(new Set(rows.map(r => r.length)).size).toBe(1);
      for (const c of rows.join('')) if (c !== '.') expect(PICKUP_COLORS[c], c).toBeTypeOf('number');
    }
  });
  it('fit inside the shared drawn box used for placement', () => {
    const [w, h] = PICKUPS.drawn;
    for (const rows of [RAFAGA, ESCUDO, CORAZON]) { expect(rows[0].length).toBeLessThanOrEqual(w); expect(rows.length).toBeLessThanOrEqual(h); }
  });
  it('Ráfaga reads as three separate chevrons pointing right', () => {
    expect(components(RAFAGA, c => c !== '.' && c !== 'd')).toBe(3);
    // The tips sit on the middle row, right of the arms: the rightmost pixel of the middle row beats the top and bottom ones.
    const pixels = core(RAFAGA), right = (y: number) => Math.max(...pixels.filter(([, , py]) => py === y).map(([, x]) => x));
    const ys = pixels.map(([, , y]) => y), top = Math.min(...ys), bottom = Math.max(...ys), mid = (top + bottom) / 2;
    expect(right(mid)).toBeGreaterThan(right(top));
    expect(right(mid)).toBeGreaterThan(right(bottom));
  });
  it('Escudo is a hollow hexagon outline (not a filled rhombus, not a round ring)', () => {
    const cx = Math.floor(ESCUDO[0].length / 2), cy = Math.floor(ESCUDO.length / 2);
    expect(solid(ESCUDO, cx, cy)).toBe(false);
    expect(components(ESCUDO, c => c !== '.' && c !== 'd')).toBe(1);
    // Flat top and bottom edges at least 4 px long: a hexagon, never a pointed diamond.
    const line = (row: string) => [...row].filter(c => c !== '.' && c !== 'd').length;
    expect(line(ESCUDO[1])).toBeGreaterThanOrEqual(4);
    expect(line(ESCUDO[ESCUDO.length - 2])).toBeGreaterThanOrEqual(4);
    expect(ESCUDO[0].length).toBeGreaterThan(ESCUDO.length);
  });
  it('Corazón is a pixel heart with two lobes on top and a single point below', () => {
    const top = [...CORAZON[1]].map(c => c !== '.' && c !== 'd');
    const runs = top.reduce((n, on, i) => n + (on && !top[i - 1] ? 1 : 0), 0);
    expect(runs).toBe(2);
    const bottom = CORAZON.slice().reverse().find(row => [...row].some(c => c !== '.' && c !== 'd'))!;
    expect([...bottom].filter(c => c !== '.' && c !== 'd')).toHaveLength(1);
  });
  it('the HUD shield icon is a small closed outline that fits between the hearts and the meter label', () => {
    expect(SHIELD_ICON[0].length).toBeLessThanOrEqual(6);
    expect(SHIELD_ICON.length).toBeLessThanOrEqual(6);
    expect(SHIELD_ICON[Math.floor(SHIELD_ICON.length / 2)][Math.floor(SHIELD_ICON[0].length / 2)]).toBe('0');
  });
});
