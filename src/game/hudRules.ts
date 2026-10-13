// Pure HUD helpers shared by the route and the guardian arena.
import type { ReverseState } from './reverseRules';
import { TEXT } from './text';

export function formatScore(score: number): string {
  const value = Math.min(999999, Math.max(0, Math.floor(Number.isFinite(score) ? score : 0)));
  return String(value).padStart(6, '0');
}

export function heartStates(hp: number, max: number): boolean[] {
  return Array.from({ length: max }, (_, index) => index < hp);
}

export function meterFill(meter: number, width: number): number {
  return Math.round(Math.min(100, Math.max(0, meter)) / 100 * width);
}

// 7x6 pixel heart, drawn with filled integer rectangles (no antialiasing, exact palette).
export const HEART: readonly string[] = Object.freeze([
  '0110110',
  '1111111',
  '1111111',
  '0111110',
  '0011100',
  '0001000',
]);

export type MeterStyle = 'charging' | 'ready' | 'draining' | 'returning' | 'recovering';
// Energy meter for each REVERSE state. slowRemaining is the 0..1 fraction of SLOW still left.
export function meterDisplay(state: ReverseState, meter: number, slowRemaining: number): { fill: number; style: MeterStyle } {
  const level = Math.min(100, Math.max(0, meter)) / 100;
  switch (state) {
    case 'CHARGING': return { fill: level, style: 'charging' };
    case 'READY': return { fill: 1, style: 'ready' };
    case 'SLOW': return { fill: Math.min(1, Math.max(0, slowRemaining)), style: 'draining' };
    case 'RELEASE': return { fill: 0, style: 'returning' };
    case 'RECOVERY': return { fill: level, style: 'recovering' };
  }
}

// Greedy word wrap for the fixed-width bitmap font; a word longer than max stays on its own line.
export function wrapLines(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ').filter(Boolean)) {
    if (line && line.length + 1 + word.length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

// "RACHA ×N" in the top bar once the racha multiplies the score; hidden at ×1 so the bar stays quiet.
export function comboLabel(multiplier: number): string {
  return multiplier >= 2 ? `${TEXT.combo} ×${Math.floor(multiplier)}` : '';
}
