import { GAME, clamp } from './rules';
import { TEXT } from './text';

// Ruta 01 (Santuario de la Trama / Arequipa) as data. Times are milliseconds of the owned route clock.
// Values come from odd/tasks/ruta01-flight-mvp.md and stay tentative until playtested.
const SCROLL_SPEED = 32;
const TRANSITION_MS = 70000;

export const ROUTE = Object.freeze({
  scrollSpeed: SCROLL_SPEED,
  transitionMs: TRANSITION_MS,
  worldWidth: GAME.width + SCROLL_SPEED * TRANSITION_MS / 1000,
  maxHp: 4,
  invulnerabilityMs: 1100,
  meterMax: 100,
  meterPerHit: 10,
  glitchling: { drift: 45, chase: 40, chaseGain: 2.5, hp: 2, score: 75, contactDamage: 1 },
  fragment: { score: 100, meter: 20 },
  returnScore: 200,
  firewall: { width: 8, gap: 40, screenSpeed: 72, telegraphMs: 1500 },
  marea: { start: 48000, peakAt: 56000, holdUntil: 60000, end: 62000, maxFront: 120 },
});

export type SegmentName = 'arrival' | 'firstBug' | 'fragments' | 'firewall' | 'swarm' | 'marea' | 'threshold';
export interface Segment { name: SegmentName; start: number; end: number }

export const SEGMENTS: readonly Segment[] = Object.freeze([
  { name: 'arrival', start: 0, end: 8000 },
  { name: 'firstBug', start: 8000, end: 16000 },
  { name: 'fragments', start: 16000, end: 26000 },
  { name: 'firewall', start: 26000, end: 38000 },
  { name: 'swarm', start: 38000, end: 48000 },
  { name: 'marea', start: 48000, end: 62000 },
  { name: 'threshold', start: 62000, end: TRANSITION_MS },
]);

export function segmentAt(ms: number): SegmentName | 'transition' {
  return SEGMENTS.find(s => ms >= s.start && ms < s.end)?.name ?? 'transition';
}

// The camera advances at a constant speed through a world sized to the route.
export function cameraScroll(ms: number): number {
  return Math.min(ROUTE.worldWidth - GAME.width, Math.max(0, ms) * ROUTE.scrollSpeed / 1000);
}

interface Caption { start: number; end: number; text: string }
const CAPTIONS: readonly Caption[] = [
  { start: 0, end: 3500, text: TEXT.intro },
  { start: 3500, end: 5800, text: TEXT.moveHint },
  { start: 5800, end: 8000, text: TEXT.fireHint },
  { start: 16000, end: 19500, text: TEXT.fragments },
  { start: 26000, end: 29500, text: TEXT.firewall },
  { start: 48000, end: 51500, text: TEXT.marea },
  { start: 63000, end: TRANSITION_MS, text: TEXT.threshold },
];
export function captionAt(ms: number): string {
  return CAPTIONS.find(c => ms >= c.start && ms < c.end)?.text ?? '';
}

export type SpawnKind = 'glitchling' | 'fragment';
// y is the spawn height; x is always just past the right edge of the visible area.
export interface Spawn { at: number; kind: SpawnKind; y: number }
const bug = (at: number, y: number): Spawn => ({ at, kind: 'glitchling', y });
const knot = (at: number, y: number): Spawn => ({ at, kind: 'fragment', y });

// Deterministic script: no randomness, so every run teaches the same lesson in the same order.
export const SPAWNS: readonly Spawn[] = Object.freeze([
  // First bug: one Glitchling at a time teaches dodge and shoot.
  bug(9000, 96), bug(12000, 60), bug(14500, 132),
  // Fragments: a safe middle line, then risky lines hugging the edges and guarded by bugs.
  knot(16500, 97), knot(17200, 97), knot(17900, 97),
  bug(19600, 40), knot(20000, 28), knot(20700, 28), knot(21400, 28),
  bug(22800, 150), knot(23200, 166), knot(23900, 166), knot(24600, 166),
  // Firewall: each fragment sits at the height of the gap of the wall that will overtake it.
  knot(29800, 132), knot(33800, 96),
  // Swarm: groups of Glitchlings in staggered formations.
  bug(39000, 50), bug(39000, 90), bug(39000, 130),
  bug(41500, 40), bug(41500, 75), bug(41500, 110), bug(41500, 145),
  bug(44500, 60), bug(44500, 100), bug(44500, 140),
  bug(46500, 30), bug(46500, 160),
  // Marea: fragments drift toward the advancing front as a temptation.
  knot(49000, 40), bug(50000, 70), knot(50500, 150), knot(52000, 96), bug(53000, 120),
  knot(54000, 30), knot(55500, 160), bug(56000, 50), knot(57000, 96),
]);

// Returns spawns with at <= now starting from cursor; the caller keeps the returned cursor.
export function spawnsDue(cursor: number, now: number): { due: Spawn[]; next: number } {
  let next = cursor;
  while (next < SPAWNS.length && SPAWNS[next].at <= now) next++;
  return { due: SPAWNS.slice(cursor, next), next };
}

// World velocity. The drift is screen-relative, so the scroll speed is added back.
export function glitchlingVelocity(y: number, targetY: number): { vx: number; vy: number } {
  const g = ROUTE.glitchling;
  return { vx: ROUTE.scrollSpeed - g.drift, vy: clamp((targetY - y) * g.chaseGain, -g.chase, g.chase) };
}

export interface Tally { fragments: number; bugs: number; returns: number }

export const addMeter = (meter: number, amount: number): number => clamp(meter + amount, 0, ROUTE.meterMax);

export function pickupFragment(meter: number, tally: Tally): { meter: number; tally: Tally } {
  return { meter: addMeter(meter, ROUTE.fragment.meter), tally: { ...tally, fragments: tally.fragments + 1 } };
}

// PROVISIONAL score formula (illustrative in docs/design/GDD.md, not approved):
// 100 x fragments + 75 x bugs + 200 x returns + 10 x max(0, 300 - seconds).
export function runningScore(t: Tally): number {
  return ROUTE.fragment.score * t.fragments + ROUTE.glitchling.score * t.bugs + ROUTE.returnScore * t.returns;
}
export function finalScore(t: Tally, seconds: number): number {
  return runningScore(t) + 10 * Math.max(0, Math.floor(300 - seconds));
}

export interface Rect { x: number; y: number; width: number; height: number }
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Firewall: vertical barrier columns with one gap (gapY is its center).
export interface Wall { at: number; gapY: number }
export const WALLS: readonly Wall[] = Object.freeze([
  { at: 27500, gapY: 60 }, { at: 31500, gapY: 132 }, { at: 35500, gapY: 96 },
]);

// Screen-space left edge: enters just past the right edge, then scrolls left faster than the world.
export function wallScreenX(now: number, wall: Wall): number {
  return GAME.width + 4 - (now - wall.at) * ROUTE.firewall.screenSpeed / 1000;
}

export function wallRects(wall: Wall, x: number): [Rect, Rect] {
  const { width, gap } = ROUTE.firewall;
  const gapTop = wall.gapY - gap / 2, gapBottom = wall.gapY + gap / 2;
  return [
    { x, y: GAME.playTop, width, height: gapTop - GAME.playTop },
    { x, y: gapBottom, width, height: GAME.playBottom - gapBottom },
  ];
}

export function wallTelegraph(now: number, wall: Wall): boolean {
  return now >= wall.at - ROUTE.firewall.telegraphMs && now < wall.at;
}

// Marea del Desfase: screen-space front measured from the left edge; 0 means inactive.
export function mareaFront(now: number): number {
  const m = ROUTE.marea;
  if (now <= m.start || now >= m.end) return 0;
  if (now < m.peakAt) return m.maxFront * (now - m.start) / (m.peakAt - m.start);
  if (now <= m.holdUntil) return m.maxFront;
  return m.maxFront * (m.end - now) / (m.end - m.holdUntil);
}

export function mareaTouches(front: number, left: number): boolean {
  return front > 0 && left < front;
}

export interface Health { hp: number; invulnerableUntil: number }
// Returns the same object when the hit is ignored, so callers can detect "no damage" by identity.
export function takeHit(h: Health, now: number, amount = 1): Health {
  if (h.hp <= 0 || now < h.invulnerableUntil) return h;
  return { hp: Math.max(0, h.hp - Math.max(0, amount)), invulnerableUntil: now + ROUTE.invulnerabilityMs };
}

// Carried from the route into the guardian through the Phaser registry ('run').
export interface RunState { hp: number; score: number; fragments: number; bugs: number; meter: number; routeSeconds: number }
export const RUN_KEY = 'run';
export const directEntry = (): RunState => ({ hp: ROUTE.maxHp, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0 });

export function readRunState(value: unknown): RunState {
  const fields: (keyof RunState)[] = ['hp', 'score', 'fragments', 'bugs', 'meter', 'routeSeconds'];
  if (typeof value !== 'object' || value === null) return directEntry();
  const record = value as Record<string, unknown>;
  if (!fields.every(key => typeof record[key] === 'number' && Number.isFinite(record[key]))) return directEntry();
  const n = (key: keyof RunState) => record[key] as number;
  return {
    hp: clamp(Math.round(n('hp')), 1, ROUTE.maxHp),
    score: Math.max(0, Math.floor(n('score'))),
    fragments: Math.max(0, Math.floor(n('fragments'))),
    bugs: Math.max(0, Math.floor(n('bugs'))),
    meter: addMeter(n('meter'), 0),
    routeSeconds: Math.max(0, n('routeSeconds')),
  };
}
