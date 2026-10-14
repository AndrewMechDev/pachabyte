import { describe, expect, it } from 'vitest';
import { INTRO, entryScene, initialIntro, stepIntro, visibleCharacters } from '../src/game/introRules';

describe('once-per-session intro routing', () => {
  it('routes the first map route entry through the intro but never direct Amaru', () => {
    expect(entryScene('route', false)).toBe('IntroScene');
    expect(entryScene('route', true)).toBe('RouteScene');
    expect(entryScene('guardian', false)).toBe('GuardianScene');
    expect(entryScene('guardian', true)).toBe('GuardianScene');
  });
});

describe('intro timing and fresh actions', () => {
  it('shows four cards for 3 seconds each and completes at exactly 12 active seconds', () => {
    expect(INTRO.cards).toBe(4); expect(INTRO.cardMs).toBe(3000); expect(INTRO.charMs).toBe(30);
    let s = initialIntro();
    for (let card = 0; card < 4; card++) {
      s = stepIntro(s, 2999, false);
      expect(s.card).toBe(card); expect(s.done).toBe(false);
      s = stepIntro(s, 1, false);
      expect(s.done).toBe(card === 3);
      if (card < 3) expect(s).toEqual({ card: card + 1, elapsed: 0, done: false });
    }
  });
  it('handles a delayed frame without stretching the total intro duration', () => {
    expect(stepIntro(initialIntro(), 12000, false).done).toBe(true);
    expect(stepIntro(initialIntro(), 6500, false)).toEqual({ card: 2, elapsed: 500, done: false });
  });
  it('advances one card with Enter or Space and lets Esc skip everything', () => {
    let s = stepIntro(initialIntro(), 400, false, 'advance');
    expect(s).toEqual({ card: 1, elapsed: 0, done: false });
    s = stepIntro(s, 0, false, 'advance'); expect(s.card).toBe(2);
    expect(stepIntro(s, 0, false, 'skip').done).toBe(true);
  });
  it('freezes text and auto-advance on focus loss, ignoring actions while paused', () => {
    const s = stepIntro(initialIntro(), 700, false);
    expect(stepIntro(s, 8000, true, 'advance')).toBe(s);
    expect(stepIntro(s, 8000, true, 'skip')).toBe(s);
    expect(stepIntro(s, -20, false)).toEqual(s);
    expect(stepIntro(s, 2300, false).card).toBe(1);
  });
  it('types every 30 ms and presents the complete card under reduced motion', () => {
    expect(visibleCharacters(55, 29, false)).toBe(0);
    expect(visibleCharacters(55, 30, false)).toBe(1);
    expect(visibleCharacters(55, 3000, false)).toBe(55);
    expect(visibleCharacters(55, 0, true)).toBe(55);
    expect(visibleCharacters(55, -30, false)).toBe(0);
  });
  it('keeps completed state terminal for late inputs or frames', () => {
    const s = stepIntro(initialIntro(), 0, false, 'skip');
    expect(stepIntro(s, 9000, false, 'advance')).toBe(s);
  });
});
