import { describe, expect, it } from 'vitest';
import { COMBO, breakCombo, comboMultiplier, comboPoints, initialCombo, readComboHits, registerHit } from '../src/game/comboRules';

describe('racha (combo) multiplier', () => {
  it('climbs x1 -> x2 -> x3 -> x4 at 5, 12 and 20 consecutive hits and stops at x4', () => {
    expect(COMBO.thresholds).toEqual([5, 12, 20]);
    expect([0, 4, 5, 11, 12, 19, 20, 500].map(comboMultiplier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(COMBO.maxMultiplier).toBe(4);
  });
  it('counts one hit at a time and reports only the hit that reaches a new tier', () => {
    let combo = initialCombo();
    const tiers: number[] = [];
    for (let i = 1; i <= 21; i++) {
      const step = registerHit(combo);
      combo = step.combo;
      if (step.tierUp) tiers.push(i);
    }
    expect(tiers).toEqual([5, 12, 20]);
    expect(combo).toEqual({ hits: 21, best: 21 });
  });
  it('resets to x1 when Kipu takes damage but remembers the best run', () => {
    const hot = { hits: 13, best: 13 };
    expect(breakCombo(hot)).toEqual({ hits: 0, best: 13 });
    const cold = initialCombo();
    expect(breakCombo(cold)).toBe(cold);
  });
  it('multiplies a base score and reports the bonus above the provisional formula separately', () => {
    expect(comboPoints(75, 0)).toEqual({ points: 75, bonus: 0 });
    expect(comboPoints(150, 5)).toEqual({ points: 300, bonus: 150 });
    expect(comboPoints(200, 25)).toEqual({ points: 800, bonus: 600 });
  });
  it('carries a sanitized hit count from the route into the guardian', () => {
    expect(initialCombo(7)).toEqual({ hits: 7, best: 7 });
    expect(readComboHits(9.7)).toBe(9);
    expect(readComboHits(-3)).toBe(0);
    expect(readComboHits('x')).toBe(0);
    expect(readComboHits(Number.NaN)).toBe(0);
  });
});
