import { describe, expect, it } from 'vitest';
import { SEGMENTS, CAPTIONS, captionAt } from '../src/game/routeRules';
import { NARRATIVE, scheduleNarrative, initialNarrative, stepNarrative } from '../src/game/narrativeRules';
import { NARRATIVE_LINES } from '../src/game/narrativeText';

describe('instruction-first narrative schedule', () => {
  it('uses four compatible 2.8 second windows inside their own segments', () => {
    expect(NARRATIVE.map(c => [c.segment, c.start, c.end])).toEqual([
      ['firstBug', 8000, 10800], ['packetLoss', 40500, 43300],
      ['eruption', 49500, 52300], ['memoryLeak', 67500, 70300],
    ]);
    for (const cue of NARRATIVE) {
      const segment = SEGMENTS.find(s => s.name === cue.segment)!;
      expect(cue.start).toBeGreaterThanOrEqual(segment.start);
      expect(cue.end).toBeLessThanOrEqual(segment.end);
      expect(cue.end - cue.start).toBe(2800);
      for (let t = cue.start; t < cue.end; t += 10) expect(captionAt(t), `${cue.segment}/${t}`).toBe('');
      for (const hint of CAPTIONS) expect(cue.end <= hint.start || cue.start >= hint.end).toBe(true);
    }
  });
  it('queues at a segment start, after all intersecting instruction windows', () => {
    expect(scheduleNarrative([{ segment: 'arrival', text: 'TRAMA' }], [
      { start: 0, end: 1000, text: 'A' }, { start: 2000, end: 3000, text: 'B' },
    ], 2800)).toEqual([{ segment: 'arrival', text: 'TRAMA', start: 3000, end: 5800 }]);
  });
  it('drops a line when the segment has no full free interval', () => {
    expect(scheduleNarrative([{ segment: 'arrival', text: 'TRAMA' }], CAPTIONS)).toEqual([]);
    expect(scheduleNarrative([{ segment: 'threshold', text: 'TRAMA' }], CAPTIONS)).toEqual([]);
    expect(NARRATIVE_LINES.some(line => line.segment === 'loop')).toBe(false);
  });
});

describe('owned-world-clock narrative queue', () => {
  it('starts once, stays visible until its exclusive end, then expires', () => {
    let s = stepNarrative(initialNarrative(), 7999, ''); expect(s.active).toBeNull();
    s = stepNarrative(s, 8000, ''); expect(s.active?.text).toBe(NARRATIVE[0].text);
    expect(stepNarrative(s, 10799, '').active).toBe(s.active);
    expect(stepNarrative(s, 10800, '').active).toBeNull();
  });
  it('gives runtime instructions absolute priority and never resumes an interrupted line', () => {
    const s = stepNarrative(initialNarrative(), 8000, '');
    const blocked = stepNarrative(s, 8100, 'TEACHING CUE'); expect(blocked.active).toBeNull();
    expect(stepNarrative(blocked, 8200, '').active).toBeNull();
    expect(stepNarrative(initialNarrative(), 8000, 'TEACHING CUE').active).toBeNull();
  });
  it('freezes queue state while paused and uses no independent wall clock', () => {
    const s = stepNarrative(initialNarrative(), 8100, '');
    expect(stepNarrative(s, 50000, '', true)).toBe(s);
    expect(stepNarrative(s, 8100, '').active).toBe(s.active);
  });
  it('consumes missed windows instead of showing late text outside its segment', () => {
    const s = stepNarrative(initialNarrative(), 44000, '');
    expect(s.active).toBeNull(); expect(s.cursor).toBe(2);
  });
  it('never duplicates a consumed line on a rewind; fresh route state resets the queue', () => {
    const done = stepNarrative(stepNarrative(initialNarrative(), 8000, ''), 10800, '');
    expect(stepNarrative(done, 8000, '').active).toBeNull();
    expect(stepNarrative(initialNarrative(), 8000, '').active?.text).toBe(NARRATIVE[0].text);
  });
  it('keeps every selected line on the schedule exactly once', () => {
    expect(NARRATIVE.map(c => c.text)).toEqual(NARRATIVE_LINES.map(c => c.text));
    expect(new Set(NARRATIVE.map(c => c.segment)).size).toBe(NARRATIVE.length);
  });
});
