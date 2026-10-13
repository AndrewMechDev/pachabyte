import type { Reverse } from './reverseRules';
import { REVERSE } from './reverseRules';
import { GAME } from './rules';
import type { Rect } from './routeRules';

// Amaru-01 as pure rules: health-based phases, shield, vulnerability windows, attack patterns, the wave
// and the head/body path. Times are WORLD-clock milliseconds (scaled to 20 % while REVERSE is SLOW).
// Every value is tentative canon (docs/design/COMBAT_DESIGN.md) aimed at a 2-3 minute casual fight.
export const AMARU = Object.freeze({
  maxHP: 100,
  phase2From: 66,       // phase 2 covers HP 66..34
  phase3From: 33,       // phase 3 covers HP 33..0
  normalDamage: 1,
  returnDamage: REVERSE.returnDamage,
  finalMultiplier: 2,   // normal shots inside the scripted phase 3 window (after the wave)
  shieldMax: 6,
  shieldWindowMs: 4000, // vulnerability after the shield breaks; then it regenerates
  finalWindowMs: 2600,  // scripted phase 3 window after the wave
  firstAttackMs: 1500,  // calm opening before the first telegraph
  phaseIntroMs: 2200,   // pause on entering a phase so its message reads before the next attack
  orbSpeed: 105,
  rhombusSpeed: 85,
  burstOrbSpeed: 115,
  burstRhombusSpeed: 92,
  wave: { speed: 80, width: 6, gap: 40, startX: 236, endX: -8, gaps: [70, 130, 100] as readonly number[] },
  head: { x: 264, swayX: 3, swayMs: 1300, centerY: 94, amplitude: 34, periodMs: 7000 },
  mouth: { dx: -31, dy: 11 },
  body: { count: 5, lagMs: 200, dx: 18, spacing: 9, dropY: 16, stepY: 2 },
});

export type Phase = 1 | 2 | 3;
export function phaseFor(hp: number): Phase {
  return hp > AMARU.phase2From ? 1 : hp > AMARU.phase3From ? 2 : 3;
}

// doubleDamage marks the scripted phase 3 window; a shield-break window keeps single damage.
export interface Boss { readonly hp: number; readonly phase: Phase; readonly shield: number; readonly vulnerableUntil: number; readonly doubleDamage: boolean }
export const initialBoss = (): Boss => ({ hp: AMARU.maxHP, phase: 1, shield: 0, vulnerableUntil: 0, doubleDamage: false });

export const isVulnerable = (b: Boss, now: number): boolean => now < b.vulnerableUntil;
// The shield exists from phase 2 on and blocks normal shots unless a vulnerability window is open.
export const shieldBlocks = (b: Boss, now: number): boolean => b.phase >= 2 && b.shield > 0 && !isVulnerable(b, now);

export type HitKind = 'normal' | 'returned';
export type HitResult = 'damage' | 'deflect' | 'shieldHit' | 'shieldBreak';
export interface Hit { boss: Boss; result: HitResult; amount: number; phaseChanged: boolean }

// Phase changes come only from HP events. Entering phase 2 raises the full shield.
export function hitBoss(b: Boss, kind: HitKind, now: number): Hit {
  if (shieldBlocks(b, now)) {
    if (kind === 'normal') return { boss: b, result: 'deflect', amount: 0, phaseChanged: false };
    const amount = Math.min(b.shield, AMARU.returnDamage), shield = b.shield - amount;
    if (shield > 0) return { boss: { ...b, shield }, result: 'shieldHit', amount, phaseChanged: false };
    return { boss: { ...b, shield: 0, vulnerableUntil: now + AMARU.shieldWindowMs, doubleDamage: false }, result: 'shieldBreak', amount, phaseChanged: false };
  }
  const amount = kind === 'returned' ? AMARU.returnDamage
    : AMARU.normalDamage * (b.phase === 3 && b.doubleDamage && isVulnerable(b, now) ? AMARU.finalMultiplier : 1);
  const hp = Math.max(0, b.hp - amount), phase = phaseFor(hp);
  if (phase === b.phase) return { boss: { ...b, hp }, result: 'damage', amount, phaseChanged: false };
  const raised = b.phase === 1 ? { shield: AMARU.shieldMax, vulnerableUntil: 0 } : {};
  return { boss: { ...b, hp, phase, ...raised }, result: 'damage', amount, phaseChanged: true };
}

export function openWindow(b: Boss, now: number, ms: number, doubleDamage = false): Boss {
  return { ...b, vulnerableUntil: Math.max(b.vulnerableUntil, now + ms), doubleDamage: b.doubleDamage || doubleDamage };
}

// Closes an ended window; a broken shield regenerates in full. Same object when nothing changes.
export function tickBoss(b: Boss, now: number): Boss {
  if (b.vulnerableUntil === 0 || now < b.vulnerableUntil) return b;
  return { ...b, vulnerableUntil: 0, doubleDamage: false, shield: b.phase >= 2 && b.shield === 0 ? AMARU.shieldMax : b.shield };
}

// If Amaru reaches 0 HP while REVERSE is still SLOW or releasing, the returned shots resolve first.
export function victoryReady(b: Boss, r: Reverse): boolean {
  return b.hp <= 0 && r.state !== 'SLOW' && r.state !== 'RELEASE';
}

// ---------------------------------------------------------------- attack patterns
export type Shape = 'orb' | 'rhombus';
// Capturable bolts are rhombus-shaped; round orbs and the wave are never capturable (silhouette, not color).
export const capturable = (shape: Shape): boolean => shape === 'rhombus';

// at: ms after the action stage starts. aimed: angle is an offset from the direction to Kipu; else absolute radians.
export interface Emission { at: number; shape: Shape; aimed: boolean; angle: number; speed: number }
export type AttackKind = 'triplePulse' | 'loopDown' | 'loopUp' | 'burst' | 'wave' | 'window';
export interface Attack { kind: AttackKind; anticipation: number; action: number; recovery: number; emissions: readonly Emission[] }

const orb = (at: number, speed: number = AMARU.orbSpeed, angle = 0): Emission => ({ at, shape: 'orb', aimed: true, angle, speed });
const rhombus = (at: number, angle: number, speed: number = AMARU.rhombusSpeed): Emission => ({ at, shape: 'rhombus', aimed: false, angle, speed });
const byTime = (list: Emission[]): readonly Emission[] => Object.freeze(list.sort((a, b) => a.at - b.at));

// A fan of seven rhombi sweeping across the left side (the "loop"), plus two aimed orbs to keep Kipu moving.
function loop(direction: 1 | -1): readonly Emission[] {
  const fan = Array.from({ length: 7 }, (_, i) => rhombus(i * 180, Math.PI + direction * (0.55 - i * 1.1 / 6)));
  return byTime([...fan, orb(300, 100), orb(900, 100)]);
}
function burst(): readonly Emission[] {
  const list: Emission[] = [];
  for (const at of [0, 400, 800]) {
    for (const offset of [-0.6, -0.22, 0.22, 0.6]) list.push(rhombus(at, Math.PI + offset, AMARU.burstRhombusSpeed));
    list.push(orb(at + 100, AMARU.burstOrbSpeed));
  }
  return byTime(list);
}

const waveAction = Math.ceil((AMARU.wave.startX - AMARU.wave.endX) / AMARU.wave.speed * 1000 / 100) * 100;
export const ATTACKS: Readonly<Record<AttackKind, Attack>> = Object.freeze({
  triplePulse: { kind: 'triplePulse', anticipation: 900, action: 600, recovery: 1300, emissions: byTime([orb(0), orb(220), orb(440)]) },
  loopDown: { kind: 'loopDown', anticipation: 1000, action: 1400, recovery: 1500, emissions: loop(1) },
  loopUp: { kind: 'loopUp', anticipation: 1000, action: 1400, recovery: 1500, emissions: loop(-1) },
  burst: { kind: 'burst', anticipation: 800, action: 1000, recovery: 700, emissions: burst() },
  wave: { kind: 'wave', anticipation: 1400, action: waveAction, recovery: 400, emissions: Object.freeze([]) },
  window: { kind: 'window', anticipation: 400, action: AMARU.finalWindowMs, recovery: 500, emissions: Object.freeze([]) },
});

export const PHASE_PATTERNS: Readonly<Record<Phase, readonly AttackKind[]>> = Object.freeze({
  1: ['triplePulse'], 2: ['loopDown', 'loopUp'], 3: ['burst', 'wave', 'window'],
});
export function attackFor(phase: Phase, cycle: number): Attack {
  const list = PHASE_PATTERNS[phase];
  return ATTACKS[list[((cycle % list.length) + list.length) % list.length]];
}

export type Stage = 'anticipation' | 'action' | 'recovery' | 'done';
export function attackStage(a: Attack, elapsed: number): Stage {
  if (elapsed < a.anticipation) return 'anticipation';
  if (elapsed < a.anticipation + a.action) return 'action';
  return elapsed < a.anticipation + a.action + a.recovery ? 'recovery' : 'done';
}
// How many emissions are due by actionElapsed; the scene fires from its own counter up to this.
export function emissionsDue(a: Attack, actionElapsed: number): number {
  let due = 0;
  while (due < a.emissions.length && a.emissions[due].at <= actionElapsed) due++;
  return due;
}

export interface Point { x: number; y: number }
export function emissionVelocity(e: Emission, origin: Point, target: Point): { vx: number; vy: number } {
  const angle = e.aimed ? Math.atan2(target.y - origin.y, target.x - origin.x) + e.angle : e.angle;
  return { vx: Math.cos(angle) * e.speed, vy: Math.sin(angle) * e.speed };
}

// ---------------------------------------------------------------- the wave (non-capturable)
export function waveX(actionElapsed: number): number {
  const w = AMARU.wave;
  return Math.max(w.endX, w.startX - Math.max(0, actionElapsed) * w.speed / 1000);
}
export function waveGapY(cycle: number): number {
  const gaps = AMARU.wave.gaps;
  return gaps[Math.floor(Math.max(0, cycle) / PHASE_PATTERNS[3].length) % gaps.length];
}
const ARENA_FLOOR = 164;
// The column spans the play area except its telegraphed gap; only bodies fully inside the gap are spared.
export function waveHits(x: number, gapY: number, body: Rect): boolean {
  const w = AMARU.wave;
  if (body.x >= x + w.width || body.x + body.width <= x) return false;
  if (body.y + body.height <= GAME.playTop || body.y >= ARENA_FLOOR) return false;
  return body.y < gapY - w.gap / 2 || body.y + body.height > gapY + w.gap / 2;
}

// ---------------------------------------------------------------- head and modular body path
export function headPosition(worldNow: number): Point {
  const h = AMARU.head;
  return { x: h.x + h.swayX * Math.sin(worldNow / h.swayMs), y: h.centerY + h.amplitude * Math.sin(2 * Math.PI * worldNow / h.periodMs) };
}
export const mouthOf = (head: Point): Point => ({ x: head.x + AMARU.mouth.dx, y: head.y + AMARU.mouth.dy });

// Each segment replays the head's path with a growing delay, so the body ripples behind the head.
export function bodyPositions(worldNow: number, count: number = AMARU.body.count): Point[] {
  const b = AMARU.body;
  return Array.from({ length: count }, (_, i) => {
    const p = headPosition(worldNow - (i + 1) * b.lagMs);
    return { x: p.x + b.dx + i * b.spacing, y: p.y + b.dropY + i * b.stepY };
  });
}

// ---------------------------------------------------------------- shield ring geometry
// Integer pixel offsets of a 1 px ring. Each lost shield point opens one crack, spread by the golden angle.
export function shieldRing(radius: number, hp: number, max: number): Array<[number, number]> {
  if (hp <= 0) return [];
  const cracks = Array.from({ length: Math.max(0, max - hp) }, (_, k) => (k * 2.39996 + 0.7) % (Math.PI * 2));
  const seen = new Set<string>(), out: Array<[number, number]> = [];
  const steps = Math.ceil(radius * Math.PI * 2 * 1.5);
  for (let i = 0; i < steps; i++) {
    const angle = i / steps * Math.PI * 2;
    if (cracks.some(c => Math.abs(Math.atan2(Math.sin(angle - c), Math.cos(angle - c))) < 0.16)) continue;
    const x = Math.round(Math.cos(angle) * radius), y = Math.round(Math.sin(angle) * radius), key = `${x},${y}`;
    if (!seen.has(key)) { seen.add(key); out.push([x, y]); }
  }
  return out;
}
