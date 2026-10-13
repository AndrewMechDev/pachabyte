import { describe, expect, it } from 'vitest';
import { BALANCE, guardianEntry, umbralRestore } from '../src/game/balanceRules';
import { AMARU, phaseFor, phaseForMax, phaseThresholds } from '../src/game/amaruRules';
import { PICKUPS } from '../src/game/pickupRules';
import { REVERSE } from '../src/game/reverseRules';
import { ROUTE, readRunState } from '../src/game/routeRules';

// Balance round 2 (playtest 2026-10-13): every new value lives in one frozen config.
describe('balance round 2 config', () => {
  it('holds the round 2 values in one frozen config and feeds the rule modules from it', () => {
    expect(BALANCE).toEqual({
      umbral: { heal: 1, meterFloor: 60 },
      rafaga: { ms: 9000, damage: 2 },
      amaru: { maxHP: 80, entryHearts: 3 },
      racha: { bossHitMeter: 25, fromMultiplier: 3 },
      corazonOnScreen: 2,
      dropSpread: 24,
    });
    expect(Object.isFrozen(BALANCE)).toBe(true);
    for (const group of Object.values(BALANCE)) if (typeof group === 'object') expect(Object.isFrozen(group)).toBe(true);
    expect(AMARU.maxHP).toBe(BALANCE.amaru.maxHP);
    expect(PICKUPS.rafaga).toMatchObject({ ms: BALANCE.rafaga.ms, damage: BALANCE.rafaga.damage });
    expect(REVERSE).toMatchObject({ perHitRacha: BALANCE.racha.bossHitMeter, rachaFrom: BALANCE.racha.fromMultiplier });
  });
});

describe('the Umbral restores Kipu', () => {
  it('heals one heart and raises the REVERSE meter to at least 60', () => {
    expect(umbralRestore(1, 0)).toEqual({ hp: 2, meter: 60 });
    expect(umbralRestore(2, 35)).toEqual({ hp: 3, meter: 60 });
  });
  it('never lowers a higher meter and never exceeds the 4 hearts', () => {
    expect(umbralRestore(3, 85)).toEqual({ hp: 4, meter: 85 });
    expect(umbralRestore(4, 100)).toEqual({ hp: 4, meter: 100 });
    expect(umbralRestore(4, 10)).toEqual({ hp: 4, meter: 60 });
    expect(umbralRestore(1, 0, 2)).toEqual({ hp: 2, meter: 60 });
  });
  it('is carried into the guardian through the run state (hearts and meter survive readRunState)', () => {
    const restored = umbralRestore(2, 20);
    const run = readRunState({ hp: restored.hp, score: 0, fragments: 0, bugs: 0, meter: restored.meter, routeSeconds: 98 });
    expect(run).toMatchObject({ hp: 3, meter: 60 });
  });
});

describe('Kipu enters the Amaru fight protected', () => {
  it('has at least 3 hearts (a floor, never a cap) and one Escudo already active', () => {
    expect(guardianEntry(1)).toEqual({ hp: 3, shield: true });
    expect(guardianEntry(2)).toEqual({ hp: 3, shield: true });
    expect(guardianEntry(3)).toEqual({ hp: 3, shield: true });
    expect(guardianEntry(4)).toEqual({ hp: 4, shield: true });
  });
  it('holds one Escudo at most: a shield carried from the route does not add a second', () => {
    const carried = guardianEntry(4, ROUTE.maxHp, true), none = guardianEntry(4, ROUTE.maxHp, false);
    expect(carried).toEqual(none);
    expect(carried.shield).toBe(true);
  });
  it('never exceeds the heart maximum', () => {
    expect(guardianEntry(9, 4).hp).toBe(4);
    expect(guardianEntry(1, 2).hp).toBe(2);
  });
});

describe('Amaru phase thresholds are fractions of his maximum HP', () => {
  it('derives phase 2 at 2/3 and phase 3 at 1/3 of any maximum', () => {
    expect(phaseThresholds(100)).toEqual({ phase2From: 66, phase3From: 33 });
    expect(phaseThresholds(80)).toEqual({ phase2From: 53, phase3From: 26 });
    expect(phaseThresholds(60)).toEqual({ phase2From: 40, phase3From: 20 });
    expect(phaseThresholds(90)).toEqual({ phase2From: 60, phase3From: 30 });
    expect({ phase2From: AMARU.phase2From, phase3From: AMARU.phase3From }).toEqual(phaseThresholds(AMARU.maxHP));
  });
  it('maps every HP of the current maximum to a phase without gaps or reversals', () => {
    const phases = Array.from({ length: AMARU.maxHP + 1 }, (_, i) => phaseFor(AMARU.maxHP - i));
    expect(phases[0]).toBe(1);
    expect(phases[phases.length - 1]).toBe(3);
    for (let i = 1; i < phases.length; i++) expect(phases[i]).toBeGreaterThanOrEqual(phases[i - 1]);
    expect(new Set(phases)).toEqual(new Set([1, 2, 3]));
    expect(phaseFor(54)).toBe(1);
    expect(phaseFor(53)).toBe(2);
    expect(phaseFor(27)).toBe(2);
    expect(phaseFor(26)).toBe(3);
    expect(phaseForMax(66, 100)).toBe(2);
    expect(phaseForMax(67, 100)).toBe(1);
    expect(phaseForMax(40, 60)).toBe(2);
    expect(phaseForMax(41, 60)).toBe(1);
    expect([80, 54, 53, 27, 26, 0].map(phaseFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});
