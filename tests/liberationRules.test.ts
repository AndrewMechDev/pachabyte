import { describe, expect, it } from 'vitest';
import { LIBERATION, type Liberation, advanceLiberation, resultLines, stageProgress, startLiberation, tickLiberation, variantKey } from '../src/game/liberationRules';
import { scoreBreakdown } from '../src/game/routeRules';
import { TEXT } from '../src/game/text';
import { missingGlyphs } from '../src/game/retroFont';

describe('liberation sequence', () => {
  it('recedes the corruption, restores the arena, then opens the dialogue', () => {
    let l = startLiberation(1000);
    expect(l).toEqual({ stage: 'recede', stageStart: 1000, dialogueIndex: 0, codexShown: false });
    expect(stageProgress(l, 1000 + LIBERATION.recedeMs / 2)).toBeCloseTo(0.5);
    expect(LIBERATION.recedeMs).toBe(1500);
    l = tickLiberation(l, 1000 + LIBERATION.recedeMs);
    expect(l.stage).toBe('restore');
    l = tickLiberation(l, l.stageStart + LIBERATION.restoreMs);
    expect(l).toMatchObject({ stage: 'dialogue', dialogueIndex: 0 });
  });
  it('advances dialogue lines by input or after about 4 s, then shows the codex and the result', () => {
    let l: Liberation = { ...startLiberation(0), stage: 'dialogue', stageStart: 0 };
    expect(advanceLiberation(l, LIBERATION.minShowMs - 1)).toBe(l);
    l = advanceLiberation(l, LIBERATION.minShowMs);
    expect(l).toMatchObject({ stage: 'dialogue', dialogueIndex: 1 });
    l = tickLiberation(l, l.stageStart + LIBERATION.dialogueMs);
    expect(l).toMatchObject({ stage: 'codex', codexShown: true });
    expect(LIBERATION.dialogueMs).toBe(4000);
    const result = advanceLiberation(l, l.stageStart + LIBERATION.minShowMs);
    expect(result.stage).toBe('result');
    expect(tickLiberation(l, l.stageStart + LIBERATION.codexMs).stage).toBe('result');
    expect(advanceLiberation(result, 1e9)).toBe(result);
    expect(tickLiberation(result, 1e9)).toBe(result);
  });
  it('ignores advance input before the dialogue starts', () => {
    const l = startLiberation(0);
    expect(advanceLiberation(l, 5000)).toBe(l);
  });
  it('builds texture keys for corrupted and four-green variants', () => {
    expect(variantKey('amaru-head', false, false)).toBe('amaru-head');
    expect(variantKey('amaru-head', true, false)).toBe('amaru-head-corrupt');
    expect(variantKey('amaru-head', true, true)).toBe('amaru-head-corrupt-nokia');
    expect(variantKey('orb', false, true)).toBe('orb-nokia');
  });
});

describe('result screen', () => {
  it('shows the racha bonus on its own line and adds it to the total', () => {
    const tally = { fragments: 2, bugs: 3, returns: 1, bugPoints: 325, comboBonus: 450 };
    const breakdown = scoreBreakdown(tally, 300);
    expect(breakdown.total).toBe(200 + 325 + 200 + 450);
    const combo = resultLines(breakdown, tally, 300).find(line => line.startsWith(TEXT.resultCombo))!;
    expect(combo.trim().endsWith('450')).toBe(true);
  });
  it('shows the pickups collected and the full-heart bonus on their own line', () => {
    const tally = { fragments: 0, bugs: 0, returns: 0, pickups: 5, pickupBonus: 200 };
    const breakdown = scoreBreakdown(tally, 300);
    expect(breakdown.total).toBe(200);
    const line = resultLines(breakdown, tally, 300).find(row => row.startsWith(TEXT.resultPickups))!;
    expect(line.slice(16).trim().split(/\s+/)).toEqual(['5', '200']);
  });
  it('lists the provisional score breakdown with a total and the retry/map help', () => {
    const tally = { fragments: 3, bugs: 4, returns: 5 };
    const breakdown = scoreBreakdown(tally, 150.6);
    expect(breakdown).toEqual({ fragments: 300, bugs: 300, returns: 1000, combo: 0, pickups: 0, time: 1490, total: 3090 });
    const lines = resultLines(breakdown, tally, 150.6);
    expect(lines[0]).toBe(TEXT.resultTitle);
    expect(lines.join('\n')).toContain('3090');
    expect(lines.join('\n')).toContain(TEXT.resultTotal);
    expect(lines.join('\n')).toContain(`150 ${TEXT.secondsUnit}`);
    expect(lines.at(-1)).toBe(TEXT.resultHelp);
    expect(lines.some(line => line.startsWith(TEXT.resultCombo))).toBe(true);
    for (const line of lines) {
      expect(line.length * 6).toBeLessThanOrEqual(300);
      expect(missingGlyphs(line)).toEqual([]);
    }
  });
});
