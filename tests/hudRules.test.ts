import { describe, expect, it } from 'vitest';
import { HEART, comboLabel, formatScore, heartStates, meterDisplay, meterFill, wrapLines } from '../src/game/hudRules';
import { TEXT } from '../src/game/text';
import { missingGlyphs } from '../src/game/retroFont';

describe('HUD helpers', () => {
  it('shows "RACHA xN" only once the multiplier is above x1', () => {
    expect(comboLabel(1)).toBe('');
    expect(comboLabel(2)).toBe(`${TEXT.combo} ×2`);
    expect(comboLabel(4)).toBe('RACHA ×4');
    expect(missingGlyphs(comboLabel(3))).toEqual([]);
    expect(comboLabel(4).length * 6).toBeLessThanOrEqual(130);
  });
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
  it('maps every REVERSE state to a distinct energy meter style', () => {
    expect(meterDisplay('CHARGING', 40, 0)).toEqual({ fill: 0.4, style: 'charging' });
    expect(meterDisplay('READY', 100, 0)).toEqual({ fill: 1, style: 'ready' });
    expect(meterDisplay('SLOW', 0, 0.25)).toEqual({ fill: 0.25, style: 'draining' });
    expect(meterDisplay('RELEASE', 0, 0)).toEqual({ fill: 0, style: 'returning' });
    expect(meterDisplay('RECOVERY', 30, 0.5)).toEqual({ fill: 0.3, style: 'recovering' });
    expect(meterDisplay('SLOW', 0, 3).fill).toBe(1);
  });
  it('wraps long canvas text on word boundaries', () => {
    expect(wrapLines('UN BUCLE REPITE INSTRUCCIONES', 12)).toEqual(['UN BUCLE', 'REPITE', 'INSTRUCCIONES']);
    expect(wrapLines('CORTO', 40)).toEqual(['CORTO']);
    for (const line of wrapLines('A BB CCC DDDD EEEEE', 7)) expect(line.length).toBeLessThanOrEqual(7);
  });
});
