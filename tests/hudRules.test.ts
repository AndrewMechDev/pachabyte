import { describe, expect, it } from 'vitest';
import { HEART, RAFAGA_BAR, comboLabel, formatScore, heartStates, meterDisplay, meterFill, phaseTicks, wrapLines } from '../src/game/hudRules';
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
  it('labels the Ráfaga bar in Spanish and keeps it between the racha and the score', () => {
    expect(TEXT.rafaga).toBe('RÁFAGA');
    expect(missingGlyphs(TEXT.rafaga)).toEqual([]);
    expect(RAFAGA_BAR.labelX).toBeGreaterThanOrEqual(142 + comboLabel(4).length * 6);
    expect(RAFAGA_BAR.x).toBeGreaterThanOrEqual(RAFAGA_BAR.labelX + TEXT.rafaga.length * 6);
    expect(RAFAGA_BAR.x + RAFAGA_BAR.width).toBeLessThan(320 - 4 - 6 * 6);
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
  // Round 2: Amaru's HP bar marks the phase boundaries from the maximum HP (2/3 and 1/3), not from fixed 66/33.
  it('places the phase ticks on the boss bar at 2/3 and 1/3 of the maximum HP', () => {
    expect(phaseTicks(48, 80)).toEqual([32, 16]);
    expect(phaseTicks(48, 100)).toEqual([32, 16]);
    expect(phaseTicks(60, 90)).toEqual([40, 20]);
  });
  it('wraps long canvas text on word boundaries', () => {
    expect(wrapLines('UN BUCLE REPITE INSTRUCCIONES', 12)).toEqual(['UN BUCLE', 'REPITE', 'INSTRUCCIONES']);
    expect(wrapLines('CORTO', 40)).toEqual(['CORTO']);
    for (const line of wrapLines('A BB CCC DDDD EEEEE', 7)) expect(line.length).toBeLessThanOrEqual(7);
  });
});
