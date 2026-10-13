import { describe, expect, it } from 'vitest';
import { coach, initialCoach } from '../src/game/coachRules';
import { TEXT } from '../src/game/text';

describe('contextual coaching (first human playtest, 2026-10-13)', () => {
  it('uses short Spanish lines', () => {
    expect(TEXT.coachFlyToRhombi).toBe('VUELA HACIA LOS ROMBOS');
    expect(TEXT.coachCloser).toBe('ACÉRCATE MÁS A LOS ROMBOS');
    expect(TEXT.shieldBroken).toBe('¡ESCUDO ROTO! ¡DISPARA!');
  });
  it('teaches "fly into the rhombi" on the first SLOW of phase 2 only', () => {
    expect(coach(initialCoach(), 'slowStart', 1)).toEqual({ coach: initialCoach(), line: null });
    const first = coach(initialCoach(), 'slowStart', 2);
    expect(first.line).toBe(TEXT.coachFlyToRhombi);
    expect(coach(first.coach, 'slowStart', 2).line).toBeNull();
    expect(coach(initialCoach(), 'slowStart', 3).line).toBeNull();
  });
  it('asks to get closer after every empty activation once rhombi exist (phase 2 and 3)', () => {
    expect(coach(initialCoach(), 'emptySlow', 1).line).toBeNull();
    expect(coach(initialCoach(), 'emptySlow', 2).line).toBe(TEXT.coachCloser);
    const taught = coach(initialCoach(), 'slowStart', 2).coach;
    expect(coach(taught, 'emptySlow', 2).line).toBe(TEXT.coachCloser);
    expect(coach(taught, 'emptySlow', 3).line).toBe(TEXT.coachCloser);
  });
  it('calls the punish window when the shield breaks', () => {
    for (const phase of [2, 3] as const) expect(coach(initialCoach(), 'shieldBreak', phase).line).toBe(TEXT.shieldBroken);
  });
});
