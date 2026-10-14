import { GAME, clamp } from './rules';
import { TEXT } from './text';
import { comboPoints } from './comboRules';

// Ruta 01 (Santuario de la Trama / Arequipa) as data. Times are milliseconds of the owned route clock.
// Values come from odd/tasks/ruta01-flight-mvp.md and stay tentative until playtested.
const SCROLL_SPEED = 32;
// A2 (2026-10-13): about 98 s, so the route changes beyond walls and the Marea (odd/tasks/ruta01-flight-mvp.md).
const TRANSITION_MS = 98000;

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
  marea: { start: 72000, peakAt: 78000, holdUntil: 80000, end: 82000, maxFront: 120 },
});

export type SegmentName =
  | 'arrival' | 'firstBug' | 'fragments' | 'firewall' | 'packetLoss' | 'eruption' | 'swarm' | 'memoryLeak' | 'marea' | 'loop' | 'threshold';
export interface Segment { name: SegmentName; start: number; end: number }

export const SEGMENTS: readonly Segment[] = Object.freeze([
  { name: 'arrival', start: 0, end: 8000 },
  { name: 'firstBug', start: 8000, end: 16000 },
  { name: 'fragments', start: 16000, end: 26000 },
  { name: 'firewall', start: 26000, end: 36000 },
  { name: 'packetLoss', start: 36000, end: 46000 },
  { name: 'eruption', start: 46000, end: 56000 },
  { name: 'swarm', start: 56000, end: 64000 },
  { name: 'memoryLeak', start: 64000, end: 72000 },
  { name: 'marea', start: 72000, end: 82000 },
  { name: 'loop', start: 82000, end: 90000 },
  { name: 'threshold', start: 90000, end: TRANSITION_MS },
]);

export const segmentStart = (name: SegmentName): number => SEGMENTS.find(s => s.name === name)?.start ?? 0;
export function segmentAt(ms: number): SegmentName | 'transition' {
  return SEGMENTS.find(s => ms >= s.start && ms < s.end)?.name ?? 'transition';
}

// The camera advances at a constant speed through a world sized to the route.
export function cameraScroll(ms: number): number {
  return Math.min(ROUTE.worldWidth - GAME.width, Math.max(0, ms) * ROUTE.scrollSpeed / 1000);
}

// Each hazard is captioned once, the first time it appears (A2: the Packet Loss line waits for the last wall to go).
export interface Caption { readonly start: number; readonly end: number; readonly text: string }
export const CAPTIONS: readonly Caption[] = [
  { start: 0, end: 1000, text: TEXT.intro },
  { start: 1000, end: 2000, text: TEXT.moveHint },
  { start: 2000, end: 8000, text: TEXT.fireHint },
  { start: 16000, end: 19500, text: TEXT.fragments },
  { start: 26000, end: 29500, text: TEXT.firewall },
  { start: 37000, end: 40500, text: TEXT.packetLoss },
  { start: 46000, end: 49500, text: TEXT.eruption },
  { start: 64000, end: 67500, text: TEXT.memoryLeak },
  { start: 72000, end: 75500, text: TEXT.marea },
  { start: 82000, end: 85500, text: TEXT.loop },
  // Round 2 (playtest 2026-10-13): the threshold first announces the restoration, then the pattern line.
  { start: 90000, end: 92000, text: TEXT.umbral },
  { start: 92000, end: TRANSITION_MS, text: TEXT.threshold },
];
export function captionAt(ms: number): string {
  return CAPTIONS.find(c => ms >= c.start && ms < c.end)?.text ?? '';
}

export type SpawnKind = 'glitchling' | 'fragment' | 'corruptor' | 'sombra';
// y is the spawn height; x is always just past the right edge of the visible area.
export interface Spawn { at: number; kind: SpawnKind; y: number }
const bug = (at: number, y: number): Spawn => ({ at, kind: 'glitchling', y });
const knot = (at: number, y: number): Spawn => ({ at, kind: 'fragment', y });
const corruptor = (at: number, y: number): Spawn => ({ at, kind: 'corruptor', y });
const sombra = (at: number, y: number): Spawn => ({ at, kind: 'sombra', y });

// The Firewall gap, the new hazards that need Kipu's full attention (Packet Loss, the eruption, the Bucle) and the
// threshold stay free of Corruptors, Sombras and their orbs; the scene also purges any leftover on entering them, so a
// slow player can never meet a ranged bug inside a hazard. Memory Leak costs no hearts, so a Sombra may linger there.
const QUIET: readonly SegmentName[] = ['firewall', 'packetLoss', 'eruption', 'loop', 'threshold'];
export const quietSegment = (name: SegmentName | 'transition'): boolean => (QUIET as readonly string[]).includes(name);

// Deterministic script: no randomness, so every run teaches the same lesson in the same order.
// Corruptors and Sombras (2026-10-13) are spaced so at most 2 Corruptors and one large Sombra share the screen.
// A2 re-placed everything after the fragments for the 98 s route; the Memory Leak fragments and the Bucle formation
// belong to their hazard modules (memoryLeakRules.ts, loopRules.ts).
export const SPAWNS: readonly Spawn[] = Object.freeze([
  // Opening: hints first, then unchanged Glitchlings at3s/5s; the first Sombra still arrives at12.5s.
  bug(3000, 96), bug(5000, 60), sombra(12500, 104), bug(14500, 132),
  // Fragments: a safe middle line, then risky lines hugging the edges and guarded by bugs and one Corruptor.
  knot(16500, 97), corruptor(17000, 70), knot(17200, 97), knot(17900, 97),
  bug(19600, 40), knot(20000, 28), knot(20700, 28), knot(21400, 28),
  bug(22800, 150), knot(23200, 166), knot(23900, 166), knot(24600, 166),
  // Firewall: each fragment sits at the height of the gap of the wall that will overtake it.
  knot(29700, 132), knot(32300, 96),
  // Packet Loss: single Glitchlings slip between the columns; a calm fragment after the last one.
  bug(38500, 60), bug(40300, 136), bug(42100, 96), knot(43800, 97),
  // Eruption: a fragment high and one low make the player cross the ember field.
  knot(47600, 44), knot(51200, 146), bug(53400, 100),
  // Mixed swarm: the two Corruptors arrive together, a Sombra follows, then staggered Glitchling waves.
  corruptor(56000, 60), corruptor(56300, 126), sombra(56700, 96),
  bug(57200, 36), bug(57200, 156), bug(58900, 76), bug(58900, 122),
  bug(60700, 40), bug(60700, 97), bug(60700, 152), bug(62500, 64), bug(62500, 132),
  // Memory Leak: a couple of Glitchlings between the zones.
  bug(65600, 150), bug(67600, 40),
  // Marea: fragments drift toward the advancing front as a temptation.
  sombra(72400, 120), knot(73000, 40), bug(74000, 70), knot(74500, 150), knot(76000, 96), bug(77000, 120),
  knot(78000, 30), knot(79500, 160), bug(80000, 50),
].sort((a, b) => a.at - b.at));

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

// bugPoints is the sum of each defeated bug's own value (75 Glitchling, 150 Corruptor, 100 Sombra, 40 small shadow);
// comboBonus is what the racha multiplier added on top. Both default for older call sites that only count bugs.
// pickups counts the rare pickups collected (B3) and pickupBonus the +100 of each Corazón taken at full hearts.
export interface Tally { fragments: number; bugs: number; returns: number; bugPoints?: number; comboBonus?: number; pickups?: number; pickupBonus?: number }
const bugPointsOf = (t: Tally): number => t.bugPoints ?? ROUTE.glitchling.score * t.bugs;

export const addMeter = (meter: number, amount: number): number => clamp(meter + amount, 0, ROUTE.meterMax);

export function pickupFragment(meter: number, tally: Tally): { meter: number; tally: Tally } {
  return { meter: addMeter(meter, ROUTE.fragment.meter), tally: { ...tally, fragments: tally.fragments + 1 } };
}

// One debugged bug: its base value at the racha multiplier for `comboHits` (multiplier from comboRules.ts).
export function defeatBug(t: Tally, base: number, comboHits: number): { tally: Tally; points: number } {
  const { points, bonus } = comboPoints(base, comboHits);
  return { tally: { ...t, bugs: t.bugs + 1, bugPoints: bugPointsOf(t) + base, comboBonus: (t.comboBonus ?? 0) + bonus }, points };
}

// PROVISIONAL score formula (illustrative in docs/design/GDD.md, not approved):
// 100 x fragments + bug points (75 per Glitchling) + 200 x returns + 10 x max(0, 300 - seconds), plus the racha bonus
// and the full-heart Corazón bonus.
export function runningScore(t: Tally): number {
  return ROUTE.fragment.score * t.fragments + bugPointsOf(t) + ROUTE.returnScore * t.returns + (t.comboBonus ?? 0) + (t.pickupBonus ?? 0);
}
export interface ScoreBreakdown { fragments: number; bugs: number; returns: number; combo: number; pickups: number; time: number; total: number }
export function scoreBreakdown(t: Tally, seconds: number): ScoreBreakdown {
  const fragments = ROUTE.fragment.score * t.fragments, bugs = bugPointsOf(t), returns = ROUTE.returnScore * t.returns, combo = t.comboBonus ?? 0;
  const pickups = t.pickupBonus ?? 0, time = 10 * Math.max(0, Math.floor(300 - seconds));
  return { fragments, bugs, returns, combo, pickups, time, total: fragments + bugs + returns + combo + pickups + time };
}
export function finalScore(t: Tally, seconds: number): number {
  return scoreBreakdown(t, seconds).total;
}

export interface Rect { x: number; y: number; width: number; height: number }
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Firewall: vertical barrier columns with one gap (gapY is its center).
export interface Wall { at: number; gapY: number }
export const WALLS: readonly Wall[] = Object.freeze([
  { at: 27500, gapY: 60 }, { at: 30200, gapY: 132 }, { at: 32900, gapY: 96 },
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

// From the first right-edge telegraph until the last column has left the screen.
export function firewallWindow(): [number, number] {
  const f = ROUTE.firewall, last = WALLS[WALLS.length - 1];
  return [WALLS[0].at - f.telegraphMs, last.at + Math.ceil((GAME.width + 4 + f.width) / f.screenSpeed * 1000)];
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

// Carried from the route into the guardian through the Phaser registry ('run'). The racha (comboHits) carries too, and
// so do the pickup count and bonus for the result screen. Active power-ups (Ráfaga, Escudo) stay in their scene.
export interface RunState {
  hp: number; score: number; fragments: number; bugs: number; meter: number; routeSeconds: number;
  bugPoints: number; comboBonus: number; comboHits: number; pickups: number; pickupBonus: number;
}
export const RUN_KEY = 'run';
export const directEntry = (): RunState => ({ hp: ROUTE.maxHp, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0, bugPoints: 0, comboBonus: 0, comboHits: 0, pickups: 0, pickupBonus: 0 });

export function readRunState(value: unknown): RunState {
  const fields = ['hp', 'score', 'fragments', 'bugs', 'meter', 'routeSeconds'] as const;
  if (typeof value !== 'object' || value === null) return directEntry();
  const record = value as Record<string, unknown>;
  if (!fields.every(key => typeof record[key] === 'number' && Number.isFinite(record[key]))) return directEntry();
  const n = (key: (typeof fields)[number]) => record[key] as number;
  // Newer fields are optional: a missing or invalid one falls back to what the base formula implies.
  const count = (key: string, fallback: number) => {
    const v = record[key];
    return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;
  };
  const bugs = Math.max(0, Math.floor(n('bugs')));
  return {
    hp: clamp(Math.round(n('hp')), 1, ROUTE.maxHp),
    score: Math.max(0, Math.floor(n('score'))),
    fragments: Math.max(0, Math.floor(n('fragments'))),
    bugs,
    meter: addMeter(n('meter'), 0),
    routeSeconds: Math.max(0, n('routeSeconds')),
    bugPoints: count('bugPoints', ROUTE.glitchling.score * bugs),
    comboBonus: count('comboBonus', 0),
    comboHits: count('comboHits', 0),
    pickups: count('pickups', 0),
    pickupBonus: count('pickupBonus', 0),
  };
}
