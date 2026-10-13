import { BALANCE } from './balanceRules';

// PachaShift REVERSE as a pure state machine: CHARGING -> READY -> SLOW -> RELEASE -> RECOVERY -> CHARGING.
// Every timer here runs on the REAL clock (player/UI). Only the world clock is scaled while SLOW.
// Canon starts from docs/design/COMBAT_DESIGN.md; perHit, slowMs, captureRadius and the empty-activation refund come
// from the first human playtest (2026-10-13: phase 2 was too hard to learn). Keep tuning by playtest, not by inertia.
export const REVERSE = Object.freeze({
  meterMax: 100,
  perHit: 15,          // each Kipu shot that hits Amaru (shield deflections included); playtest: was 10
  perHitRacha: BALANCE.racha.bossHitMeter, // playtest 2026-10-13 round 2: the same hit at racha x3 or x4
  rachaFrom: BALANCE.racha.fromMultiplier, // playtest 2026-10-13 round 2: the racha multiplier that earns it
  perFragment: 20,     // fragments collected on the route; the carried meter is honoured on entry
  slowMs: 1200,        // real milliseconds of SLOW; playtest: was 800
  worldScale: 0.2,     // world speed while SLOW; Kipu keeps full speed
  captureRadius: 40,   // px from Kipu's position; playtest: was 28
  maxCaptures: 6,      // per activation
  recoveryMs: 1500,    // real milliseconds that block re-entry after the release resolves
  emptyRefund: 60,     // playtest: an activation with zero captures gives back this much meter (a fair retry)
  emptyRecoveryMs: 600, // playtest: and recovers this fast instead of recoveryMs
  releaseTimeoutMs: 2500, // safety net: a RELEASE never waits longer than this for its shots
  returnDamage: 3,     // per returned bolt (the only damage that cracks Amaru's shield)
  cueRadius: 72,       // px: "¡SHIFT!" appears when READY and a capturable bolt is this close
});

export type ReverseState = 'CHARGING' | 'READY' | 'SLOW' | 'RELEASE' | 'RECOVERY';
export interface Reverse {
  readonly state: ReverseState;
  readonly meter: number;
  readonly captured: number;     // bolts orbiting Kipu during SLOW
  readonly pending: number;      // returned shots still in flight during RELEASE
  readonly until: number;        // real-clock deadline of SLOW, RELEASE (timeout) or RECOVERY
  readonly activations: number;
  readonly returnsTotal: number; // returned shots that hit Amaru (scored)
}

const clampMeter = (meter: number): number => Math.min(REVERSE.meterMax, Math.max(0, meter));

export function initialReverse(meter = 0): Reverse {
  const value = clampMeter(meter);
  return { state: value >= REVERSE.meterMax ? 'READY' : 'CHARGING', meter: value, captured: 0, pending: 0, until: 0, activations: 0, returnsTotal: 0 };
}

// Meter charged by one Kipu shot that reaches Amaru, from the racha multiplier at the moment of the hit.
export const bossHitCharge = (multiplier: number): number => (multiplier >= REVERSE.rachaFrom ? REVERSE.perHitRacha : REVERSE.perHit);

// Hits refill the meter in any state; only CHARGING turns READY. Taking damage never touches it.
export function chargeReverse(r: Reverse, amount: number): Reverse {
  const meter = clampMeter(r.meter + amount);
  return { ...r, meter, state: r.state === 'CHARGING' && meter >= REVERSE.meterMax ? 'READY' : r.state };
}

// Returns the same object when the request is rejected, so callers detect "no activation" by identity.
export function activateReverse(r: Reverse, now: number): Reverse {
  if (r.state !== 'READY') return r;
  return { ...r, state: 'SLOW', meter: 0, captured: 0, pending: 0, until: now + REVERSE.slowMs, activations: r.activations + 1 };
}

export function captureBolt(r: Reverse, distance: number, capturable: boolean): Reverse {
  if (r.state !== 'SLOW' || !capturable || distance > REVERSE.captureRadius || r.captured >= REVERSE.maxCaptures) return r;
  return { ...r, captured: r.captured + 1 };
}

const recovery = (r: Reverse, now: number, ms: number = REVERSE.recoveryMs): Reverse => ({ ...r, state: 'RECOVERY', captured: 0, pending: 0, until: now + ms });

// Time-driven transitions. `released` is how many allied shots the scene must fire this tick.
export function tickReverse(r: Reverse, now: number): { reverse: Reverse; released: number } {
  if (r.state === 'SLOW' && now >= r.until) {
    // An empty activation has nothing to return: it refunds part of the meter and takes a short RECOVERY,
    // so a missed capture costs a moment, not the whole charge (the "no captures" signal).
    if (r.captured === 0) return { reverse: recovery({ ...r, meter: clampMeter(r.meter + REVERSE.emptyRefund) }, now, REVERSE.emptyRecoveryMs), released: 0 };
    return { reverse: { ...r, state: 'RELEASE', captured: 0, pending: r.captured, until: now + REVERSE.releaseTimeoutMs }, released: r.captured };
  }
  if (r.state === 'RELEASE' && (r.pending <= 0 || now >= r.until)) return { reverse: recovery(r, now), released: 0 };
  if (r.state === 'RECOVERY' && now >= r.until) {
    return { reverse: { ...r, state: r.meter >= REVERSE.meterMax ? 'READY' : 'CHARGING', until: 0 }, released: 0 };
  }
  return { reverse: r, released: 0 };
}

// One released shot resolved (hit Amaru, or expired). RECOVERY starts when the last one resolves.
export function resolveReturn(r: Reverse, now: number, hit: boolean): Reverse {
  if (r.state !== 'RELEASE') return r;
  const next = { ...r, pending: Math.max(0, r.pending - 1), returnsTotal: r.returnsTotal + (hit ? 1 : 0) };
  return next.pending === 0 ? recovery(next, now) : next;
}

// Phase 2 entry: Kipu's core awakens once and fills the meter.
export function awakenCore(r: Reverse): Reverse {
  return { ...r, meter: REVERSE.meterMax, state: r.state === 'CHARGING' ? 'READY' : r.state };
}

export const isSlow = (r: Reverse): boolean => r.state === 'SLOW';
export const worldScale = (r: Reverse): number => (isSlow(r) ? REVERSE.worldScale : 1);

export function shiftCue(r: Reverse, capturableDistances: readonly number[]): boolean {
  return r.state === 'READY' && capturableDistances.some(d => d <= REVERSE.cueRadius);
}

export interface Clocks { real: number; world: number }
// Real clock: player, UI and REVERSE timers. World clock: boss AI, patterns and enemy bolts.
export function advanceClocks(c: Clocks, delta: number, scale: number): Clocks {
  const step = Math.max(0, delta);
  return { real: c.real + step, world: c.world + step * scale };
}
