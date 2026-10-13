import { ROUTE } from './routeRules';

// Balance round 2 (playtest 2026-10-13). The first live playtest found the route punishing and Amaru winnable but
// costly, so every new survivability value lives here, frozen, and feeds the rule modules (AMARU, PICKUPS, REVERSE).
// Tentative until the next human playtest; tune by playtest, not by inertia.
export const BALANCE = Object.freeze({
  // playtest 2026-10-13 round 2: the threshold restores Kipu before Amaru.
  umbral: Object.freeze({ heal: 1, meterFloor: 60 }),
  // playtest 2026-10-13 round 2: Ráfaga 6 s -> 9 s and each of its shots deals 2 damage (bugs and Amaru).
  rafaga: Object.freeze({ ms: 9000, damage: 2 }),
  // playtest 2026-10-13 round 2: maxHP 100 -> 80 (phase thresholds are fractions of it); Kipu enters with at least
  // 3 hearts and one Escudo already up.
  amaru: Object.freeze({ maxHP: 80, entryHearts: 3 }),
  // playtest 2026-10-13 round 2: while the racha is x3 or x4 each hit on Amaru charges REVERSE 25 instead of 15.
  racha: Object.freeze({ bossHitMeter: 25, fromMultiplier: 3 }),
  // playtest 2026-10-13 round 2: at most this many Corazón on screen (route and guardian drops).
  corazonOnScreen: 2,
  // playtest 2026-10-13 round 2: vertical distance between two guardian drops of the same moment.
  dropSpread: 24,
});

// The Umbral heals one heart (never above the maximum) and lifts the REVERSE meter to at least 60 (never lowers it).
export function umbralRestore(hp: number, meter: number, maxHp: number = ROUTE.maxHp): { hp: number; meter: number } {
  return { hp: Math.min(maxHp, hp + BALANCE.umbral.heal), meter: Math.min(ROUTE.meterMax, Math.max(meter, BALANCE.umbral.meterFloor)) };
}

// Entry into the Amaru fight: a floor of hearts (never a cap) and exactly one Escudo, whether or not the route
// already held one (a power holds one Escudo at most).
export function guardianEntry(hp: number, maxHp: number = ROUTE.maxHp, _carriedShield = false): { hp: number; shield: true } {
  return { hp: Math.min(maxHp, Math.max(hp, BALANCE.amaru.entryHearts)), shield: true };
}
