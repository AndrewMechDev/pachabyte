import { TEXT } from './text';
import type { ScoreBreakdown, Tally } from './routeRules';

// Liberation after Amaru reaches 0 HP (and any REVERSE release resolved). REAL-clock milliseconds.
// recede: corruption crossfades off Amaru; restore: color wave over the arena; then dialogue, Codex and result.
export const LIBERATION = Object.freeze({ recedeMs: 1500, restoreMs: 1500, dialogueMs: 4000, codexMs: 6000, minShowMs: 350, dialogueLines: 2 });

export type LiberationStage = 'recede' | 'restore' | 'dialogue' | 'codex' | 'result';
export interface Liberation { readonly stage: LiberationStage; readonly stageStart: number; readonly dialogueIndex: number; readonly codexShown: boolean }

export const startLiberation = (now: number): Liberation => ({ stage: 'recede', stageStart: now, dialogueIndex: 0, codexShown: false });

// 0..1 progress of the timed visual stages (crossfades); 1 for the others.
export function stageProgress(l: Liberation, now: number): number {
  const length = l.stage === 'recede' ? LIBERATION.recedeMs : l.stage === 'restore' ? LIBERATION.restoreMs : 0;
  return length ? Math.min(1, Math.max(0, (now - l.stageStart) / length)) : 1;
}

function next(l: Liberation, now: number): Liberation {
  switch (l.stage) {
    case 'recede': return { ...l, stage: 'restore', stageStart: now };
    case 'restore': return { ...l, stage: 'dialogue', stageStart: now, dialogueIndex: 0 };
    case 'dialogue': return l.dialogueIndex + 1 < LIBERATION.dialogueLines
      ? { ...l, stageStart: now, dialogueIndex: l.dialogueIndex + 1 }
      : { ...l, stage: 'codex', stageStart: now, codexShown: true };
    case 'codex': return { ...l, stage: 'result', stageStart: now };
    case 'result': return l;
  }
}

// Auto-advance. Returns the same object when nothing changes.
export function tickLiberation(l: Liberation, now: number): Liberation {
  const length = { recede: LIBERATION.recedeMs, restore: LIBERATION.restoreMs, dialogue: LIBERATION.dialogueMs, codex: LIBERATION.codexMs, result: Infinity }[l.stage];
  return now - l.stageStart >= length ? next(l, now) : l;
}

// Enter/Space: only dialogue lines and the Codex card can be skipped, after a short minimum so a held key cannot race through.
export function advanceLiberation(l: Liberation, now: number): Liberation {
  if ((l.stage !== 'dialogue' && l.stage !== 'codex') || now - l.stageStart < LIBERATION.minShowMs) return l;
  return next(l, now);
}

// Derived texture keys: corrupted (purple Desfase) and four-green (REVERSE) variants of one base.
export function variantKey(base: string, corrupt: boolean, nokia: boolean): string {
  return base + (corrupt ? '-corrupt' : '') + (nokia ? '-nokia' : '');
}

// Monospace columns for the 6 px bitmap font: label, count, points.
export function resultLines(b: ScoreBreakdown, t: Tally, seconds: number): string[] {
  const row = (label: string, count: string, points: number) => label.padEnd(16) + count.padStart(7) + String(points).padStart(8);
  return [
    TEXT.resultTitle,
    '',
    row(TEXT.resultFragments, String(t.fragments), b.fragments),
    row(TEXT.resultBugs, String(t.bugs), b.bugs),
    row(TEXT.resultReturns, String(t.returns), b.returns),
    row(TEXT.resultCombo, '', b.combo),
    // A spaced unit: in the 5x7 font a bare "47S" reads as "475".
    row(TEXT.resultTime, `${Math.floor(seconds)} ${TEXT.secondsUnit}`, b.time),
    row(TEXT.resultTotal, '', b.total),
    '',
    TEXT.resultHelp,
  ];
}
