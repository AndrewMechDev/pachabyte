export const COMBAT = Object.freeze({ heroHP: 4, bossHP: 12, invulnerability: 900, active: 2000, cooldown: 4000, radius: 52, capacity: 3, slow: 0.35 });
export type Outcome = 'playing' | 'victory' | 'defeat';
export type Pattern = 'pulse' | 'rune';
export interface Shift { activeUntil: number; readyAt: number; captured: number }
export const initialShift = (): Shift => ({ activeUntil: 0, readyAt: 0, captured: 0 });
export function damage(hp: number, amount: number): number { return Math.max(0, hp - Math.max(0, amount)); }
export function canTakeDamage(now: number, invulnerableUntil: number): boolean { return now >= invulnerableUntil; }
export function outcome(heroHP: number, bossHP: number): Outcome { return heroHP <= 0 ? 'defeat' : bossHP <= 0 ? 'victory' : 'playing'; }
export function patternAt(index: number): Pattern { return index % 2 === 0 ? 'pulse' : 'rune'; }
export function attackStage(elapsed: number): 'anticipation' | 'action' | 'recovery' { return elapsed < 800 ? 'anticipation' : elapsed < 1300 ? 'action' : 'recovery'; }
export function activateShift(s: Shift, now: number): Shift { return now >= s.readyAt ? { activeUntil: now + COMBAT.active, readyAt: now + COMBAT.active + COMBAT.cooldown, captured: 0 } : s; }
export function shiftActive(s: Shift, now: number): boolean { return s.activeUntil > now; }
export function capture(s: Shift, now: number, distance: number): Shift { return shiftActive(s, now) && distance <= COMBAT.radius && s.captured < COMBAT.capacity ? { ...s, captured: s.captured + 1 } : s; }
export function release(s: Shift, now: number): { state: Shift; count: number } { return now >= s.activeUntil && s.captured > 0 ? { state: { ...s, captured: 0 }, count: s.captured } : { state: s, count: 0 }; }
export function boltExpired(now: number, expires: number, x: number, y: number): boolean { return now >= expires || x < 0 || x > 320 || y < 0 || y > 180; }
