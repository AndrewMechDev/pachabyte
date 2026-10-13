import { GAME } from './rules';
import { ROUTE, takeHit, type Health } from './routeRules';
import { AMARU, type Boss, type HitResult, type Phase } from './amaruRules';

// Rare pickups approved by the user on 2026-10-13 (docs/design/DECISIONS.md), new mechanics outside the canon:
// Ráfaga de la Trama (6 s of triple, faster fire), Escudo (absorbs the next hit) and Corazón (+1 heart).
// Power-up timers use the REAL clock (Kipu's clock), so they ignore hit-stops and REVERSE and freeze on pause.
// Values are tentative until playtested.
export type PickupKind = 'rafaga' | 'escudo' | 'corazon';
export const PICKUP_KINDS: readonly PickupKind[] = Object.freeze(['rafaga', 'escudo', 'corazon']);

export const PICKUPS = Object.freeze({
  rafaga: { ms: 6000, cooldownMs: 120, spread: 0.15 },
  fullHeartScore: 100,
  // Bounded shot pool sized for a full Ráfaga: 3 shots every 120 ms live about 1.1 s on screen.
  shotPool: 36,
  // Shared drawn box of the three sprites (Ráfaga 15x9, Escudo 12x15, Corazón 13x11 in 16x16 cells) and a forgiving
  // square body, unchanged from the placeholders.
  drawn: [15, 15] as readonly [number, number],
  body: 9,
  bob: { px: 2, periodMs: 1400 },
  // Guardian drops leave Amaru's mouth inside Kipu's reach and fly left on the WORLD clock.
  drop: { x: 224, speed: 20, minY: GAME.playTop + 10, maxY: 154 },
});

export interface Power { readonly rafagaUntil: number; readonly shield: boolean }
export const initialPower = (): Power => ({ rafagaUntil: 0, shield: false });

export const rafagaActive = (p: Power, now: number): boolean => now < p.rafagaUntil;
export const rafagaRemaining = (p: Power, now: number): number => Math.max(0, p.rafagaUntil - now);
// 0..1 fill of the draining HUD bar.
export const rafagaLevel = (p: Power, now: number): number => Math.min(1, rafagaRemaining(p, now) / PICKUPS.rafaga.ms);
export const shotCooldown = (p: Power, now: number): number => (rafagaActive(p, now) ? PICKUPS.rafaga.cooldownMs : GAME.shotCooldownMs);
// Radians from the facing direction, centre first. Each shot keeps the normal damage; the spread only adds shots.
const TRIPLE: readonly number[] = Object.freeze([0, -PICKUPS.rafaga.spread, PICKUPS.rafaga.spread]);
const SINGLE: readonly number[] = Object.freeze([0]);
export const volleyAngles = (p: Power, now: number): readonly number[] => (rafagaActive(p, now) ? TRIPLE : SINGLE);

export type CollectResult = 'rafaga' | 'rafagaRefresh' | 'shield' | 'shieldKept' | 'heal' | 'fullBonus';
export interface Collect { power: Power; hp: number; bonus: number; result: CollectResult }

// One collected pickup. A Ráfaga while active refreshes the timer (no stacking); a second Escudo while one is up
// changes nothing (at most one); a Corazón at full hearts scores +100 instead of healing.
export function collectPickup(kind: PickupKind, p: Power, hp: number, now: number, maxHp: number = ROUTE.maxHp): Collect {
  switch (kind) {
    case 'rafaga':
      return { power: { ...p, rafagaUntil: now + PICKUPS.rafaga.ms }, hp, bonus: 0, result: rafagaActive(p, now) ? 'rafagaRefresh' : 'rafaga' };
    case 'escudo':
      return p.shield ? { power: p, hp, bonus: 0, result: 'shieldKept' } : { power: { ...p, shield: true }, hp, bonus: 0, result: 'shield' };
    case 'corazon':
      return hp >= maxHp ? { power: p, hp, bonus: PICKUPS.fullHeartScore, result: 'fullBonus' } : { power: p, hp: hp + 1, bonus: 0, result: 'heal' };
  }
}

export interface Absorb { health: Health; power: Power; result: 'ignored' | 'absorbed' | 'damage' }
// A hit while the Escudo is up costs no heart but still starts the normal invulnerability. A hit that takeHit would
// ignore (invulnerable or already defeated) never consumes the shield. Same objects back when nothing changes.
export function absorbHit(h: Health, p: Power, now: number): Absorb {
  const hit = takeHit(h, now);
  if (hit === h) return { health: h, power: p, result: 'ignored' };
  if (!p.shield) return { health: hit, power: p, result: 'damage' };
  return { health: { hp: h.hp, invulnerableUntil: hit.invulnerableUntil }, power: { ...p, shield: false }, result: 'absorbed' };
}

// ---------------------------------------------------------------- route placement
// Deterministic, rare and scripted at sensible moments. Pickups stay still in the world like fragments, so they
// enter at the right edge and drift left with the scroll. Each one spawns after every Firewall column that could
// overtake it, so it is never inside a column (the walls scroll faster than the world).
export interface PickupSpawn { at: number; kind: PickupKind; y: number }
export const ROUTE_PICKUPS: readonly PickupSpawn[] = Object.freeze([
  // First bug segment: a low Ráfaga to try the spread on the first Sombra and the fragment guards.
  { at: 11500, kind: 'rafaga', y: 128 },
  // A2: behind the last Packet Loss column, drifting in as the embers begin: one ember hit can be shrugged off.
  { at: 41500, kind: 'escudo', y: 100 },
  // After the Packet Loss: the hearts the solid blocks took can come back.
  { at: 46600, kind: 'corazon', y: 128 },
  // In the eruption, ready for the mixed swarm that follows.
  { at: 50200, kind: 'rafaga', y: 64 },
]);

export function pickupsDue(cursor: number, now: number): { due: PickupSpawn[]; next: number } {
  let next = cursor;
  while (next < ROUTE_PICKUPS.length && ROUTE_PICKUPS[next].at <= now) next++;
  return { due: ROUTE_PICKUPS.slice(cursor, next), next };
}

export const ROUTE_ENTRY_X = GAME.width + 10;
export const routePickupScreenX = (p: PickupSpawn, now: number): number => ROUTE_ENTRY_X - ROUTE.scrollSpeed * (now - p.at) / 1000;

// ---------------------------------------------------------------- guardian drops
// Amaru drops one Corazón when phase 2 starts and one Escudo when phase 3 starts (not on a checkpoint resume).
export const GUARDIAN_DROPS: Readonly<Partial<Record<Phase, PickupKind>>> = Object.freeze({ 2: 'corazon', 3: 'escudo' });
export const guardianDrop = (phase: Phase): PickupKind | null => GUARDIAN_DROPS[phase] ?? null;
// Ráfaga drops (user request 2026-10-13, to defeat Amaru faster): one when phase 1 reaches the half of its HP range
// (100..67, so at 83) and one every time the phase 2 shield breaks. Never a second Ráfaga on screen; collecting one
// while active refreshes the timer (collectPickup). Ráfaga shots stay normal shots, so the shield still deflects them.
export const RAFAGA_DROP = Object.freeze({ phase1Hp: Math.round((AMARU.maxHP + AMARU.phase2From) / 2) });
export function guardianRafagaDrop(before: Boss, after: Boss, result: HitResult, rafagaOnScreen: boolean): boolean {
  if (rafagaOnScreen) return false;
  if (before.phase === 1 && before.hp > RAFAGA_DROP.phase1Hp && after.hp <= RAFAGA_DROP.phase1Hp) return true;
  return result === 'shieldBreak' && before.phase === 2;
}
export function dropPosition(origin: { x: number; y: number }, worldAge: number): { x: number; y: number } {
  return { x: origin.x - PICKUPS.drop.speed * Math.max(0, worldAge) / 1000, y: origin.y };
}
export const dropGone = (x: number): boolean => x < -PICKUPS.drawn[0];

// ---------------------------------------------------------------- readability
// Gentle whole-pixel bob; still under reduced motion.
export function bobOffset(now: number, reduced: boolean): number {
  return reduced ? 0 : Math.round(PICKUPS.bob.px * Math.sin(2 * Math.PI * now / PICKUPS.bob.periodMs));
}

export type PickupCounts = Readonly<Record<PickupKind, number>>;
export const noPickups = (): PickupCounts => ({ rafaga: 0, escudo: 0, corazon: 0 });
export function countCollected(c: PickupCounts | undefined, kind: PickupKind): PickupCounts {
  const base = c ?? noPickups();
  return { ...base, [kind]: base[kind] + 1 };
}
