import { CAPTIONS, SEGMENTS, type Caption } from './routeRules';
import { NARRATIVE_LINES, type NarrativeLine } from './narrativeText';

export const NARRATIVE_MS = 2800;
export interface NarrativeCue extends NarrativeLine { readonly start: number; readonly end: number }

// Queue at the segment boundary, then reserve its earliest complete instruction-free interval.
// Drop rather than steal hint time or carry lore into a different segment.
export function scheduleNarrative(lines: readonly NarrativeLine[], hints: readonly Caption[], duration = NARRATIVE_MS): readonly NarrativeCue[] {
  const cues: NarrativeCue[] = [];
  for (const line of lines) {
    const segment = SEGMENTS.find(s => s.name === line.segment)!;
    let start = segment.start;
    const occupied = [...hints, ...cues].sort((a, b) => a.start - b.start);
    for (const window of occupied) {
      if (window.end > start && window.start < start + duration) start = window.end;
    }
    if (start + duration <= segment.end) cues.push({ ...line, start, end: start + duration });
  }
  return Object.freeze(cues.sort((a, b) => a.start - b.start));
}
export const NARRATIVE = scheduleNarrative(NARRATIVE_LINES, CAPTIONS);
export interface NarrativeState { readonly cursor: number; readonly active: NarrativeCue | null }
export const initialNarrative = (): NarrativeState => ({ cursor: 0, active: null });

// World-clock only; no timer, animation or wall-clock dependency. Cursor never rewinds with scenery.
export function stepNarrative(state: NarrativeState, now: number, instruction: string, paused = false): NarrativeState {
  if (paused) return state;
  let cursor = state.cursor;
  let active = state.active && now >= state.active.start && now < state.active.end ? state.active : null;
  while (cursor < NARRATIVE.length && NARRATIVE[cursor].start <= now) {
    const cue = NARRATIVE[cursor++];
    if (now < cue.end) active = cue;
  }
  // Defensive priority for a future dynamic teaching cue: consume, never reappear afterward.
  if (instruction) active = null;
  return { cursor, active };
}
