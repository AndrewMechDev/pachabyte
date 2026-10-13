import { describe, expect, it } from 'vitest';
import { SHIELD_ICON } from '../src/game/pickupArt';

// The pickup icons are the user's sprites now; their shape checks live in tests/spriteSheets.test.ts.
describe('HUD shield icon', () => {
  it('is a small closed outline that fits between the hearts and the meter label', () => {
    expect(SHIELD_ICON[0].length).toBeLessThanOrEqual(6);
    expect(SHIELD_ICON.length).toBeLessThanOrEqual(6);
    expect(SHIELD_ICON[Math.floor(SHIELD_ICON.length / 2)][Math.floor(SHIELD_ICON[0].length / 2)]).toBe('0');
  });
});
