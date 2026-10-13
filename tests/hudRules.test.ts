import { describe, expect, it } from 'vitest';
import { HEART, formatScore, heartStates, meterFill } from '../src/game/hudRules';

describe('HUD helpers', () => {
  it('formats scores as six zero-padded digits and clamps the range', () => {
    expect(formatScore(0)).toBe('000000');
    expect(formatScore(1275)).toBe('001275');
    expect(formatScore(12.9)).toBe('000012');
    expect(formatScore(-40)).toBe('000000');
    expect(formatScore(5_000_000)).toBe('999999');
  });
  it('fills one heart per remaining HP', () => {
    expect(heartStates(4, 4)).toEqual([true, true, true, true]);
    expect(heartStates(1, 4)).toEqual([true, false, false, false]);
    expect(heartStates(-2, 4)).toEqual([false, false, false, false]);
  });
  it('scales the energy meter into whole pixels', () => {
    expect(meterFill(0, 40)).toBe(0);
    expect(meterFill(50, 40)).toBe(20);
    expect(meterFill(100, 40)).toBe(40);
    expect(meterFill(250, 40)).toBe(40);
    expect(meterFill(-5, 40)).toBe(0);
  });
  it('draws hearts as small binary pixel masks', () => {
    expect(HEART.length).toBeLessThanOrEqual(7);
    for (const row of HEART) expect(row).toMatch(/^[01]{7}$/);
  });
});
