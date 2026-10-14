import { GAME } from './rules';
import { ROUTE, SEGMENTS, SPAWNS, WALLS, quietSegment, mareaFront, type Spawn } from './routeRules';
import { BUGS, corruptorLifetime, corruptorScreen } from './bugRules';
import { ROUTE_ENTRY_X, ROUTE_PICKUPS } from './pickupRules';
import { SHEETS } from './spriteFrames';
import { PACKET_LOSS } from './packetLossRules';
import { ERUPTION } from './eruptionRules';
import { MEMORY_LEAK } from './memoryLeakRules';
import { LOOP, loopEnd } from './loopRules';

export type ActivityKind = 'enemy' | 'fragment' | 'pickup' | 'hazard' | 'target';
export interface Activity { readonly kind: ActivityKind; readonly label: string; readonly start: number; readonly end: number }
// Native drawn cell widths, not physics hitboxes. Procedural Glitchling/fragment grids are12/9 in textures.ts.
export const PACING_VISUAL = Object.freeze({ glitchlingWidth: 12, fragmentWidth: 9, spawnX: GAME.width + 10 });
export const PACING_END = SEGMENTS.find(s => s.name === 'threshold')!.start;

// A centered image drifting left: count only the interval whose native frame intersects the screen.
export function driftWindow(at: number, x: number, width: number, speed: number): readonly [number, number] {
  return [at + Math.max(0, (x - width / 2 - GAME.width) / speed * 1000), at + (x + width / 2) / speed * 1000];
}
// First true boundary of a monotone crossing. Bisection retains fractional-ms geometry without arbitrary residence time.
function crossing(lo: number, hi: number, predicate: (ms: number) => boolean): number {
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (predicate(mid)) hi = mid; else lo = mid; }
  return hi;
}
function swallowed(at: number, end: number, x: (ms: number) => number): number {
  let prev = Math.max(at, ROUTE.marea.start);
  // The Marea may recede, so bracket its FIRST crossing before applying monotone bisection locally.
  for (let t = prev; t <= Math.min(end, ROUTE.marea.end); t += 10) {
    if (mareaFront(t) > 0 && x(t) < mareaFront(t)) return crossing(prev, t, ms => mareaFront(ms) > 0 && x(ms) < mareaFront(ms));
    prev = t;
  }
  return end;
}
function spawnWindow(s: Spawn): readonly [number, number] {
  const p = PACING_VISUAL;
  if (s.kind === 'corruptor') {
    const life = corruptorLifetime(), half = SHEETS.corruptor.frame[0] / 2;
    const entry = crossing(0, BUGS.corruptor.enterMs, age => corruptorScreen(age, s.y).x - half < GAME.width);
    const exit = crossing(BUGS.corruptor.stayMs, life, age => corruptorScreen(age, s.y).x - half >= GAME.width);
    return [s.at + entry, s.at + exit];
  }
  if (s.kind === 'sombra') return driftWindow(s.at, BUGS.sombra.spawnX, SHEETS.sombra.frame[0], BUGS.sombra.drift);
  if (s.kind === 'glitchling') return driftWindow(s.at, p.spawnX, p.glitchlingWidth, ROUTE.glitchling.drift);
  const [start, end] = driftWindow(s.at, p.spawnX, p.fragmentWidth, ROUTE.scrollSpeed);
  return [start, swallowed(s.at, end, ms => p.spawnX - (ms - s.at) * ROUTE.scrollSpeed / 1000)];
}

// Nominal un-killed/uncollected scripted occupancy. Player actions can remove targets earlier; this is NOT a
// guarantee that every possible run stays busy. Decorative scenery, HUD, lore, shots and kill-dependent drops do not count.
export function scriptedActivity(spawns: readonly Spawn[] = SPAWNS): readonly Activity[] {
  const out: Activity[] = [];
  const add = (kind: ActivityKind, label: string, start: number, end: number): void => {
    const clippedEnd = Math.min(end, PACING_END);
    if (clippedEnd > start) out.push({ kind, label, start, end: clippedEnd });
  };
  for (const s of spawns) {
    let [start, end] = spawnWindow(s);
    if (s.kind === 'corruptor' || s.kind === 'sombra') {
      const purge = SEGMENTS.find(segment => segment.start > s.at && quietSegment(segment.name));
      end = Math.min(end, purge?.start ?? PACING_END);
    }
    add(s.kind === 'fragment' ? 'fragment' : 'enemy', `${s.kind}@${s.at}`, start, end);
  }
  for (const p of ROUTE_PICKUPS) {
    const [start, end] = driftWindow(p.at, ROUTE_ENTRY_X, SHEETS.pickups.frame[0], ROUTE.scrollSpeed);
    add('pickup', `${p.kind}@${p.at}`, start, swallowed(p.at, end, ms => ROUTE_ENTRY_X - ROUTE.scrollSpeed * (ms - p.at) / 1000));
  }
  for (const w of WALLS) {
    // Actual right-edge telegraph, followed by the scrolling column; no decorative sky is counted.
    add('hazard', `firewall@${w.at}`, w.at - ROUTE.firewall.telegraphMs, w.at + (GAME.width + 4 + ROUTE.firewall.width) / ROUTE.firewall.screenSpeed * 1000);
  }
  for (const at of PACKET_LOSS.columns) add('hazard', `packet@${at}`, at + (PACKET_LOSS.enterX - GAME.width) / PACKET_LOSS.screenSpeed * 1000, at + (PACKET_LOSS.enterX + PACKET_LOSS.width) / PACKET_LOSS.screenSpeed * 1000);
  for (const e of ERUPTION.embers) add('hazard', `ember@${e.at}`, e.at - ERUPTION.markerMs, e.at + ERUPTION.impactMs);
  for (const z of MEMORY_LEAK.zones) {
    add('hazard', `leak@${z.at}`, z.at + (MEMORY_LEAK.enterX - GAME.width) / MEMORY_LEAK.screenSpeed * 1000, z.at + (MEMORY_LEAK.enterX + z.width) / MEMORY_LEAK.screenSpeed * 1000);
  }
  for (const f of MEMORY_LEAK.fragments) {
    const z = MEMORY_LEAK.zones[f.zone], x = MEMORY_LEAK.enterX + f.dx;
    const [start, end] = driftWindow(z.at, x, PACING_VISUAL.fragmentWidth, MEMORY_LEAK.screenSpeed);
    add('fragment', `leak-fragment@${z.at}/${f.dx}`, start, Math.min(end, z.at + (MEMORY_LEAK.enterX + z.width) / MEMORY_LEAK.screenSpeed * 1000));
  }
  add('hazard', 'marea', ROUTE.marea.start, ROUTE.marea.end);
  // The eye is a real shootable, visible target until shot or nominal timeout, not a decorative marker.
  add('target', 'loop-eye', LOOP.start, loopEnd());
  // Each loop formation is removed on the next reset; timeout leaves the final formation until threshold.
  for (let k = 0; k <= LOOP.maxRepeats; k++) for (const f of LOOP.formation) {
    const at = LOOP.start + k * LOOP.iterationMs + f.dt;
    const [start, end] = driftWindow(at, PACING_VISUAL.spawnX, PACING_VISUAL.glitchlingWidth, ROUTE.glitchling.drift);
    add('enemy', `loop-glitchling@${at}`, start, Math.min(end, k < LOOP.maxRepeats ? LOOP.start + (k + 1) * LOOP.iterationMs : PACING_END));
  }
  return out.sort((a, b) => a.start - b.start);
}
export interface QuietGap { readonly start: number; readonly end: number; readonly ms: number }
export function inactiveGaps(activity: readonly Activity[], end = PACING_END): readonly QuietGap[] {
  const gaps: QuietGap[] = []; let cursor = 0;
  for (const interval of [...activity].sort((a, b) => a.start - b.start)) {
    const start = Math.min(end, interval.start);
    if (start > cursor) gaps.push({ start: cursor, end: start, ms: start - cursor });
    cursor = Math.max(cursor, Math.min(end, interval.end));
  }
  if (cursor < end) gaps.push({ start: cursor, end, ms: end - cursor });
  return gaps;
}
export const activityCountsAt = (activity: readonly Activity[], now: number): Record<ActivityKind, number> => {
  const counts = { enemy: 0, fragment: 0, pickup: 0, hazard: 0, target: 0 };
  for (const item of activity) if (now >= item.start && now < item.end) counts[item.kind]++;
  return counts;
};
