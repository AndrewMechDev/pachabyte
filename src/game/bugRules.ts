import { GAME, clamp } from './rules';
import { ROUTE } from './routeRules';

// Route bugs beyond the Glitchling, added after the first playtest (docs/design/DECISIONS.md, 2026-10-13) from the
// CHARACTERS.md roster. Every value is tentative until playtested. All motion is a pure function of the WORLD clock
// (age = world ms since spawn), so a hit-stop or a pause freezes it exactly. Positions are screen-space unless named
// "world"; screen x + camera x = world x.
export type EnemyType = 'glitchling' | 'corruptor' | 'sombra' | 'shadow';

export const BUGS = Object.freeze({
  corruptor: {
    hp: 4, score: 150,
    // Enters from past the right edge, hovers around hoverX, then backs out to the right.
    enterFromX: 334, hoverX: 266, enterMs: 1100, stayMs: 6800, exitSpeed: 90, goneX: 344,
    swayX: 8, swayXMs: 3400, swayY: 14, swayYMs: 2600,
    // Fires a slow, round, non-capturable orb from the vent on its left; each shot is telegraphed by a charge.
    firstShotMs: 1500, fireEveryMs: 2400, chargeMs: 600, orbSpeed: 52, orbTtl: 6500, ventDx: -11, ventDy: 0,
  },
  sombra: {
    hp: 3, score: 100, drift: 38, chase: 16, chaseGain: 1.2, spawnX: 330, band: { top: GAME.playTop + 10, bottom: GAME.playBottom - 10 },
    // Sideways dodge when one of Kipu's shots lines up: telegraphed, bounded, at most once per cooldown.
    dodge: { range: 96, lane: 7, telegraphMs: 150, moveMs: 170, distance: 16, cooldownMs: 1000 },
  },
  // The two small shadows a Sombra splits into: faster, 1 HP, never split again.
  shadow: { hp: 1, score: 40, drift: 72, spread: 14, spreadMs: 360, band: { top: GAME.playTop + 8, bottom: GAME.playBottom - 8 } },
  caps: { corruptors: 2, shadows: 3, orbs: 6 },
  debugDropEvery: 4,
});

export const BUG_STATS: Readonly<Record<EnemyType, { hp: number; score: number }>> = Object.freeze({
  glitchling: { hp: ROUTE.glitchling.hp, score: ROUTE.glitchling.score },
  corruptor: { hp: BUGS.corruptor.hp, score: BUGS.corruptor.score },
  sombra: { hp: BUGS.sombra.hp, score: BUGS.sombra.score },
  shadow: { hp: BUGS.shadow.hp, score: BUGS.shadow.score },
});

export interface Point { x: number; y: number }

// ---------------------------------------------------------------- Corruptor
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

function hover(age: number, baseY: number): Point {
  const c = BUGS.corruptor, t = age - c.enterMs;
  return { x: c.hoverX + c.swayX * Math.sin(2 * Math.PI * t / c.swayXMs), y: baseY + c.swayY * Math.sin(2 * Math.PI * t / c.swayYMs) };
}

export function corruptorScreen(age: number, baseY: number): { x: number; y: number; gone: boolean } {
  const c = BUGS.corruptor;
  if (age < c.enterMs) return { x: c.enterFromX + (c.hoverX - c.enterFromX) * easeOut(Math.max(0, age) / c.enterMs), y: baseY, gone: false };
  if (age < c.stayMs) return { ...hover(age, baseY), gone: false };
  const last = hover(c.stayMs, baseY), x = last.x + (age - c.stayMs) * c.exitSpeed / 1000;
  return { x, y: last.y, gone: x >= c.goneX };
}

// World ms from spawn until the Corruptor has backed out of view (worst case of the sway).
export function corruptorLifetime(): number {
  const c = BUGS.corruptor;
  return c.stayMs + Math.ceil((c.goneX - (c.hoverX - c.swayX)) / c.exitSpeed * 1000);
}

export function corruptorFireTimes(): number[] {
  const c = BUGS.corruptor, times: number[] = [];
  for (let t = c.firstShotMs; t < c.stayMs; t += c.fireEveryMs) times.push(t);
  return times;
}
const FIRE_TIMES = Object.freeze(corruptorFireTimes());

export const corruptorShotsDue = (age: number): number => FIRE_TIMES.filter(t => t <= age).length;

// 0 when idle, rising to 1 through the 600 ms before each shot: the telegraph.
export function corruptorCharge(age: number): number {
  const next = FIRE_TIMES.find(t => t > age);
  if (next === undefined) return 0;
  const left = next - age;
  return left <= BUGS.corruptor.chargeMs ? 1 - left / BUGS.corruptor.chargeMs : 0;
}

// Aimed at Kipu at a slow screen speed; the returned velocity is in WORLD space (scroll carry added).
export function orbVelocity(from: Point, to: Point): { vx: number; vy: number } {
  const angle = Math.atan2(to.y - from.y, to.x - from.x), speed = BUGS.corruptor.orbSpeed;
  return { vx: Math.cos(angle) * speed + ROUTE.scrollSpeed, vy: Math.sin(angle) * speed };
}

export function orbExpired(age: number, screenX: number, y: number): boolean {
  return age >= BUGS.corruptor.orbTtl || screenX < -8 || screenX > GAME.width + 12 || y < GAME.playTop - 6 || y > GAME.playBottom + 4;
}

// ---------------------------------------------------------------- Sombra de Error
export interface SombraMotion { readonly y: number; readonly dodgeAt: number; readonly dir: -1 | 0 | 1; readonly fromY: number; readonly nextDodgeAt: number }
export const startSombra = (y: number): SombraMotion => ({ y, dodgeAt: -Infinity, dir: 0, fromY: y, nextDodgeAt: 0 });

export type DodgeStage = 'none' | 'telegraph' | 'move';
export function dodgeStage(m: SombraMotion, now: number): DodgeStage {
  const d = BUGS.sombra.dodge;
  if (now < m.dodgeAt + d.telegraphMs) return 'telegraph';
  return now < m.dodgeAt + d.telegraphMs + d.moveMs ? 'move' : 'none';
}

// The nearest of Kipu's shots flying at it from the left, close and in its lane; null when none.
export function linedUpShot(sombra: Point, shots: readonly Point[]): number | null {
  const d = BUGS.sombra.dodge;
  let best: Point | null = null;
  for (const s of shots) {
    const ahead = sombra.x - s.x;
    if (ahead <= 0 || ahead > d.range || Math.abs(s.y - sombra.y) > d.lane) continue;
    if (!best || s.x > best.x) best = s;
  }
  return best ? best.y : null;
}

// One world step. dt is world seconds; targetY is Kipu's height; shotY comes from linedUpShot.
export function stepSombra(m: SombraMotion, now: number, dt: number, targetY: number, shotY: number | null): SombraMotion {
  const s = BUGS.sombra, d = s.dodge, stage = dodgeStage(m, now);
  if (stage === 'telegraph') return m.y === m.fromY ? m : { ...m, y: m.fromY };
  if (stage === 'move') {
    const p = (now - m.dodgeAt - d.telegraphMs) / d.moveMs;
    return { ...m, y: m.fromY + m.dir * d.distance * easeOut(p) };
  }
  const y = m.dir !== 0 ? m.fromY + m.dir * d.distance : m.y;
  if (shotY !== null && now >= m.nextDodgeAt) {
    // Away from the shot; if that would leave the band, the other way (it still clears the lane).
    let dir: -1 | 1 = shotY >= y ? -1 : 1;
    if (y + dir * d.distance < s.band.top || y + dir * d.distance > s.band.bottom) dir = dir === 1 ? -1 : 1;
    return { y, dodgeAt: now, dir, fromY: y, nextDodgeAt: now + d.cooldownMs };
  }
  const chased = clamp(y + clamp((targetY - y) * s.chaseGain, -s.chase, s.chase) * Math.max(0, dt), s.band.top, s.band.bottom);
  return { ...m, y: chased, dir: 0, fromY: chased };
}

export const sombraWorldX = (spawnWorldX: number, age: number): number => spawnWorldX + (ROUTE.scrollSpeed - BUGS.sombra.drift) * age / 1000;
export const sombraTravelMs = (): number => Math.ceil((BUGS.sombra.spawnX + 12) / BUGS.sombra.drift * 1000);

// ---------------------------------------------------------------- small shadows
export function shadowPosition(origin: Point, dir: -1 | 1, age: number): Point {
  const s = BUGS.shadow, spread = s.spread * Math.min(1, Math.max(0, age) / s.spreadMs);
  return { x: origin.x + (ROUTE.scrollSpeed - s.drift) * age / 1000, y: clamp(origin.y + dir * spread, s.band.top, s.band.bottom) };
}

// How many small shadows a split may create with the free slots of the bounded shadow pool.
export const splitCount = (free: number): number => Math.min(2, Math.max(0, Math.floor(free)));

// "Reparar, no exterminar": every 4th debugged bug leaves one small fragment behind.
export const dropsFragment = (defeated: number): boolean => defeated > 0 && defeated % BUGS.debugDropEvery === 0;
