import { GAME } from './rules';
import { ROUTE, segmentStart, type Rect } from './routeRules';

// Bucle / Infinite Loop (A2, 2026-10-13; GDD obstacle library: "sección que se repite hasta cambiar regla"). A short
// stretch repeats: a loop marker sweeps the screen once per iteration and, when it reaches the left edge, the stretch
// resets (its Glitchling formation vanishes and comes back at the right, and the clouds jump back). Shooting the
// highlighted loop node (5 HP) breaks the loop: score, a "BUCLE ROTO" cue and no more repeats. After at most 2
// repeats it breaks by itself, so nobody softlocks. It foreshadows Amaru, guardian of loops. WORLD clock, pure.
export const LOOP = Object.freeze({
  start: segmentStart('loop'),
  iterationMs: 2600, maxRepeats: 2, hp: 5,
  // Breaking it debugs a bug worth 250 (scored like a bug, at the racha multiplier).
  score: 250,
  // Screen-space node on the right side, bobbing gently once per iteration.
  node: { x: 262, y: 97, bob: 14, size: 13, body: { width: 18, height: 20 } },
  // The repeated stretch: three Glitchlings entering at the same moments of every iteration.
  formation: Object.freeze([{ dt: 200, y: 56 }, { dt: 200, y: 138 }, { dt: 900, y: 97 }]) as ReadonlyArray<{ dt: number; y: number }>,
  cueMs: 1400,
});

export const loopEnd = (): number => LOOP.start + (LOOP.maxRepeats + 1) * LOOP.iterationMs;

export type LoopBreak = 'shot' | 'timeout' | null;
export interface LoopState { readonly hp: number; readonly iteration: number; readonly brokenAt: number | null; readonly brokenBy: LoopBreak; readonly resets: number }
export const initialLoop = (): LoopState => ({ hp: LOOP.hp, iteration: 0, brokenAt: null, brokenBy: null, resets: 0 });

export const loopActive = (s: LoopState, now: number): boolean => s.brokenAt === null && now >= LOOP.start && now < loopEnd();
const iterationAt = (now: number): number => Math.min(LOOP.maxRepeats, Math.max(0, Math.floor((now - LOOP.start) / LOOP.iterationMs)));

// One world step: `reset` when a new iteration begins, `broke` when the loop gives up by itself.
export function stepLoop(s: LoopState, now: number): { state: LoopState; reset: boolean; broke: boolean } {
  if (s.brokenAt !== null || now < LOOP.start) return { state: s, reset: false, broke: false };
  if (now >= loopEnd()) return { state: { ...s, brokenAt: now, brokenBy: 'timeout' }, reset: false, broke: true };
  const iteration = iterationAt(now);
  if (iteration <= s.iteration) return { state: s, reset: false, broke: false };
  return { state: { ...s, iteration, resets: s.resets + iteration - s.iteration }, reset: true, broke: false };
}

// A shot on the node while the loop runs; the same object back when ignored.
export function hitLoopNode(s: LoopState, now: number): { state: LoopState; broke: boolean } {
  if (!loopActive(s, now)) return { state: s, broke: false };
  const hp = s.hp - 1;
  if (hp > 0) return { state: { ...s, hp }, broke: false };
  return { state: { ...s, hp: 0, brokenAt: now, brokenBy: 'shot' }, broke: true };
}

export function nodePosition(now: number): { x: number; y: number } {
  const n = LOOP.node;
  return { x: n.x, y: Math.round(n.y + n.bob * Math.sin(2 * Math.PI * (now - LOOP.start) / LOOP.iterationMs)) };
}

// Manual screen-space shot target, centered independently of the rendered eye frame and its visual anchor.
export function nodeHitbox(now: number): Rect {
  const p = nodePosition(now), { width, height } = LOOP.node.body;
  return { x: p.x - width / 2, y: p.y - height / 2, width, height };
}

// Formation entries whose time falls in (prev, now], for every iteration up to the break.
export function formationDue(prev: number, now: number, s: LoopState): Array<{ y: number; at: number }> {
  const out: Array<{ y: number; at: number }> = [];
  for (let k = 0; k <= LOOP.maxRepeats; k++) {
    for (const f of LOOP.formation) {
      const at = LOOP.start + k * LOOP.iterationMs + f.dt;
      if (at > prev && at <= now && (s.brokenAt === null || at < s.brokenAt)) out.push({ y: f.y, at });
    }
  }
  return out;
}

// The loop marker enters at the right edge as each iteration starts and reaches the left edge as it ends.
export function loopMarkerX(now: number): number {
  const local = ((now - LOOP.start) % LOOP.iterationMs + LOOP.iterationMs) % LOOP.iterationMs;
  return Math.round(GAME.width - local / LOOP.iterationMs * (GAME.width + 4));
}

// Visual only: how far the clouds jump back after `resets` repeats ("the scenery visibly repeats").
export const sceneryRewind = (resets: number): number => resets * LOOP.iterationMs * ROUTE.scrollSpeed / 1000;

export const cueVisible = (s: LoopState, now: number): boolean => s.brokenAt !== null && now >= s.brokenAt && now - s.brokenAt < LOOP.cueMs;
