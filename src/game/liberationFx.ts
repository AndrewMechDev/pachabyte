import type { ParticleSpec } from './animation';

// P2 (2026-10-13): the creatures freed from Amaru. When he falls, 10 small corrupted creatures (the real Glitchling,
// Corruptor and Sombra frames) burst out of his head and body, fly outward along arcs, shrink by swapping to the small
// shadow frames and dissolve into turquoise and gold sparkles while the purple corruption recedes. Pure and REAL-clock:
// the scene feeds `age` (milliseconds since the liberation began) and draws plain non-physics images, one texture frame
// per stage, never scaling a sprite. Everything is deterministic (no randomness), and the whole burst fits inside the
// 'recede' stage (1500 ms), so the liberation order recede, restore, dialogue, codex, result is untouched.
export type CreatureKind = 'glitchling' | 'corruptor' | 'sombra';
export const FREED = Object.freeze({
  count: 10, capacity: 12, spawnGapMs: 45, bigMs: 360, smallMs: 360, sparkMs: 180,
  // Reduced motion: no flight, no sparkles; the creatures show where they would be and fade out.
  reducedMs: 800, reducedProgress: 0.45, frameMs: 140,
});
export const FREED_KINDS: readonly CreatureKind[] = Object.freeze(['glitchling', 'corruptor', 'sombra', 'glitchling', 'sombra', 'glitchling', 'corruptor', 'sombra', 'glitchling', 'sombra'] as const);

// Frame loops of the big stage (the same keys the route already loads) and the small stage's shadow frames.
const BIG_FRAMES: Readonly<Record<CreatureKind, readonly string[]>> = Object.freeze({
  glitchling: ['glitchling', 'glitchling-b'], corruptor: ['corruptor', 'corruptor-b'], sombra: ['sombra', 'sombra-b', 'sombra-c'],
});
// Texture keys the scene must load before showing the burst.
export const FREED_SHEETS = Object.freeze(['corruptor', 'sombra', 'shadow'] as const);

export const freedTotalMs = (): number => (FREED.count - 1) * FREED.spawnGapMs + FREED.bigMs + FREED.smallMs + FREED.sparkMs;
// Evenly spaced around Amaru, starting straight up.
export const creatureAngle = (i: number): number => -Math.PI / 2 + i * 2 * Math.PI / FREED.count;

export type FreedStage = 'wait' | 'big' | 'small' | 'spark' | 'gone';
export function freedStage(i: number, age: number): FreedStage {
  const local = age - i * FREED.spawnGapMs;
  if (local < 0) return 'wait';
  if (local < FREED.bigMs) return 'big';
  if (local < FREED.bigMs + FREED.smallMs) return 'small';
  return local < FREED.bigMs + FREED.smallMs + FREED.sparkMs ? 'spark' : 'gone';
}

export interface FreedView { stage: FreedStage; visible: boolean; x: number; y: number; alpha: number; texture: string }

// Offset from the burst origin (Amaru's centre) at flight progress p (0..1): an ease-out run along the creature's
// angle, bent sideways by a swirl that is strongest mid-flight.
function offset(i: number, p: number): { x: number; y: number } {
  const angle = creatureAngle(i), reach = 58 + (i % 3) * 16, curl = (i % 2 ? 1 : -1) * 12;
  const run = reach * (1 - (1 - p) * (1 - p)), bend = curl * Math.sin(Math.PI * p);
  return { x: Math.round(Math.cos(angle) * run - Math.sin(angle) * bend), y: Math.round(Math.sin(angle) * run + Math.cos(angle) * bend) };
}

export function freedView(i: number, age: number, reduced: boolean): FreedView {
  const kind = FREED_KINDS[i];
  if (reduced) {
    const visible = age >= 0 && age < FREED.reducedMs, at = offset(i, FREED.reducedProgress);
    return { stage: visible ? 'big' : age < 0 ? 'wait' : 'gone', visible, x: at.x, y: at.y, alpha: visible ? 0.9 * (1 - age / FREED.reducedMs) : 0, texture: BIG_FRAMES[kind][0] };
  }
  const stage = freedStage(i, age), local = age - i * FREED.spawnGapMs, flight = FREED.bigMs + FREED.smallMs;
  const at = offset(i, Math.min(1, Math.max(0, local / flight)));
  const frames = BIG_FRAMES[kind];
  const texture = stage === 'big' ? frames[Math.floor(local / FREED.frameMs) % frames.length] : stage === 'small' ? (i % 2 ? 'shadow-b' : 'shadow') : '';
  return { stage, visible: stage === 'big' || stage === 'small', x: at.x, y: at.y, alpha: 1, texture };
}

// The sparkles a creature dissolves into when its flight ends at (x, y): turquoise and gold, whole pixels, fixed spread.
export function freedSparks(i: number, x: number, y: number): ParticleSpec[] {
  return [0, 1, 2].map(k => {
    const angle = creatureAngle(i) + k * 2 * Math.PI / 3;
    return { x: x + Math.round(Math.cos(angle) * 2), y: y + Math.round(Math.sin(angle) * 2), vx: Math.cos(angle) * 22, vy: Math.sin(angle) * 22 - 10, ttl: 320 + k * 60, slot: k % 2 ? 'gold' : 'teal', size: k === 0 ? 2 : 1 };
  });
}
