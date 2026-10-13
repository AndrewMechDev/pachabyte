// Shared hero/combat helpers. REVERSE lives in reverseRules.ts and Amaru in amaruRules.ts.
export const COMBAT = Object.freeze({ heroHP: 4, invulnerability: 1100 });
export type Outcome = 'playing' | 'victory' | 'defeat';
export function damage(hp: number, amount: number): number { return Math.max(0, hp - Math.max(0, amount)); }
export function canTakeDamage(now: number, invulnerableUntil: number): boolean { return now >= invulnerableUntil; }
export function outcome(heroHP: number, bossHP: number): Outcome { return heroHP <= 0 ? 'defeat' : bossHP <= 0 ? 'victory' : 'playing'; }
export function boltExpired(now: number, expires: number, x: number, y: number): boolean { return now >= expires || x < 0 || x > 320 || y < 0 || y > 180; }
