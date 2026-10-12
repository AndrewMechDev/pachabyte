import { expect, it } from 'vitest';
import { COMBAT, damage, canTakeDamage, outcome, patternAt, attackStage, initialShift, activateShift, shiftActive, capture, release, boltExpired } from '../src/game/combatRules';
it('clamps HP and grants damage only at the invulnerability deadline', () => {
  expect(damage(3, 1)).toBe(2); expect(damage(2, 3)).toBe(0);
  expect(canTakeDamage(899, 900)).toBe(false); expect(canTakeDamage(900, 900)).toBe(true);
  expect(COMBAT.invulnerability).toBe(900);
});
it('defeat wins ties, victory otherwise ends play', () => {
  expect(outcome(0, 0)).toBe('defeat'); expect(outcome(3, 0)).toBe('victory'); expect(outcome(3, 12)).toBe('playing');
});
it('alternates readable patterns with anticipation, action and recovery', () => {
  expect([patternAt(0), patternAt(1), patternAt(2)]).toEqual(['pulse', 'rune', 'pulse']);
  expect(attackStage(799)).toBe('anticipation'); expect(attackStage(800)).toBe('action'); expect(attackStage(1300)).toBe('recovery');
});
it('captures only while active, within radius and capacity, and releases once', () => {
  let s = activateShift(initialShift(), 100);
  expect(shiftActive(s, 2099)).toBe(true); expect(shiftActive(s, 2100)).toBe(false);
  expect(capture(s, 200, 53)).toEqual(s);
  for (let i = 0; i < 4; i++) s = capture(s, 200, 52);
  expect(s.captured).toBe(3);
  expect(release(s, 2099).count).toBe(0);
  const result = release(s, 2100); expect(result.count).toBe(3);
  expect(release(result.state, 2101).count).toBe(0);
  expect(activateShift(result.state, 6099)).toEqual(result.state);
  expect(shiftActive(activateShift(result.state, 6100), 6100)).toBe(true);
  expect(COMBAT.slow).toBe(0.35);
});
it('expires bolts at deadline or any arena boundary', () => {
  expect(boltExpired(99, 100, 100, 100)).toBe(false);
  for (const [n,x,y] of [[100,100,100],[0,-1,100],[0,321,100],[0,100,-1],[0,100,181]]) expect(boltExpired(n,100,x,y)).toBe(true);
});

it('rejects capture after active expiry and rejects reactivation during active time', () => {
  const active = activateShift(initialShift(), 0);
  expect(capture(active, 2000, 0)).toEqual(active);
  expect(activateShift(active, 1000)).toEqual(active);
  expect(capture(active, 1000, 0).captured).toBe(1);
});
it('preserves unreleased energy until expiry, while an empty release stays empty', () => {
  const state = capture(activateShift(initialShift(), 0), 1, 0);
  expect(release(state, 1999).state.captured).toBe(1);
  expect(release(initialShift(), 1).count).toBe(0);
});
it('uses exact timing boundaries and clamps negative damage to zero', () => {
  expect(damage(3, -1)).toBe(3);
  expect(attackStage(1299)).toBe('action');
  expect(attackStage(1300)).toBe('recovery');
  expect(COMBAT.active).toBe(2000); expect(COMBAT.cooldown).toBe(4000);
});
