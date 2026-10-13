import { expect, it } from 'vitest';
import { COMBAT, damage, canTakeDamage, outcome, boltExpired } from '../src/game/combatRules';
// The cooldown-based Shift was replaced by the REVERSE state machine (tests/reverseRules.test.ts);
// Amaru phases, shield and patterns live in tests/amaruRules.test.ts.
it('clamps HP and grants damage only at the invulnerability deadline', () => {
  expect(damage(3, 1)).toBe(2); expect(damage(2, 3)).toBe(0);
  expect(canTakeDamage(1099, 1100)).toBe(false); expect(canTakeDamage(1100, 1100)).toBe(true);
});
it('uses the canon hero values: 4 HP and 1.1 s of invulnerability', () => {
  expect(COMBAT).toEqual({ heroHP: 4, invulnerability: 1100 });
  expect(Object.isFrozen(COMBAT)).toBe(true);
});
it('defeat wins ties, victory otherwise ends play', () => {
  expect(outcome(0, 0)).toBe('defeat'); expect(outcome(3, 0)).toBe('victory'); expect(outcome(3, 12)).toBe('playing');
});
it('expires bolts at deadline or any arena boundary', () => {
  expect(boltExpired(99, 100, 100, 100)).toBe(false);
  for (const [n,x,y] of [[100,100,100],[0,-1,100],[0,321,100],[0,100,-1],[0,100,181]]) expect(boltExpired(n,100,x,y)).toBe(true);
});
it('clamps negative damage to zero', () => {
  expect(damage(3, -1)).toBe(3);
});
