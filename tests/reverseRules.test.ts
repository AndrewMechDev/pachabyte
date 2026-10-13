import { describe, expect, it } from 'vitest';
import {
  REVERSE, activateReverse, advanceClocks, awakenCore, bossHitCharge, captureBolt, chargeReverse, initialReverse, isSlow,
  resolveReturn, shiftCue, tickReverse, worldScale, type Reverse,
} from '../src/game/reverseRules';

const ready = (): Reverse => initialReverse(100);

describe('REVERSE tuning', () => {
  it('uses the values tuned by the first human playtest (2026-10-13)', () => {
    expect(REVERSE).toMatchObject({
      meterMax: 100, perHit: 15, perFragment: 20, slowMs: 1200, worldScale: 0.2, captureRadius: 40, maxCaptures: 6,
      recoveryMs: 1500, emptyRefund: 60, emptyRecoveryMs: 600, returnDamage: 3,
    });
    expect(Object.isFrozen(REVERSE)).toBe(true);
  });
  // Balance round 2 (playtest 2026-10-13): while the racha is x3 or x4 each hit on Amaru charges the meter 25 instead of 15.
  it('charges 25 per boss hit while the racha multiplier is x3 or x4, 15 otherwise', () => {
    expect(REVERSE).toMatchObject({ perHitRacha: 25, rachaFrom: 3 });
    expect([1, 2].map(bossHitCharge)).toEqual([15, 15]);
    expect([3, 4].map(bossHitCharge)).toEqual([25, 25]);
    expect(bossHitCharge(0)).toBe(15);
  });
  it('refills READY faster at a high racha: 4 hits instead of 7', () => {
    const hitsToReady = (multiplier: number) => {
      let r = initialReverse(0), hits = 0;
      while (r.state !== 'READY') { r = chargeReverse(r, bossHitCharge(multiplier)); hits++; }
      return hits;
    };
    expect(hitsToReady(2)).toBe(7);
    expect(hitsToReady(3)).toBe(4);
    expect(hitsToReady(4)).toBe(4);
  });
});

describe('REVERSE state machine', () => {
  it('starts CHARGING, or READY when the route carried a full meter', () => {
    expect(initialReverse()).toMatchObject({ state: 'CHARGING', meter: 0, captured: 0, returnsTotal: 0 });
    expect(initialReverse(40).state).toBe('CHARGING');
    expect(initialReverse(100).state).toBe('READY');
    expect(initialReverse(250).meter).toBe(100);
    expect(initialReverse(-5).meter).toBe(0);
  });
  it('charges +15 per hit and +20 per fragment, and becomes READY at 100', () => {
    let r = initialReverse(65);
    r = chargeReverse(r, REVERSE.perHit); expect(r).toMatchObject({ state: 'CHARGING', meter: 80 });
    r = chargeReverse(r, REVERSE.perFragment); expect(r).toMatchObject({ state: 'READY', meter: 100 });
    expect(chargeReverse(r, 10).meter).toBe(100);
  });
  it('activates only in READY: meter is consumed and SLOW lasts 1200 ms of real time', () => {
    const charging = initialReverse(90);
    expect(activateReverse(charging, 0)).toBe(charging);
    const slow = activateReverse(ready(), 1000);
    expect(slow).toMatchObject({ state: 'SLOW', meter: 0, captured: 0, until: 2200, activations: 1 });
    expect(isSlow(slow)).toBe(true);
    expect(worldScale(slow)).toBe(0.2);
    expect(worldScale(ready())).toBe(1);
  });
  it('blocks re-entry while active and during RECOVERY', () => {
    const slow = activateReverse(ready(), 0);
    expect(activateReverse(chargeReverse(slow, 100), 100)).toEqual(chargeReverse(slow, 100));
    const recovering = tickReverse(chargeReverse(slow, 100), 1200).reverse;
    expect(recovering.state).toBe('RECOVERY');
    expect(activateReverse(recovering, 1400)).toBe(recovering);
  });
  it('captures only capturable bolts within 40 px during SLOW, at most 6', () => {
    let r = activateReverse(ready(), 0);
    expect(captureBolt(r, 40.1, true)).toBe(r);
    expect(captureBolt(r, 10, false)).toBe(r);
    for (let i = 0; i < 9; i++) r = captureBolt(r, 40, true);
    expect(r.captured).toBe(6);
    const idle = ready();
    expect(captureBolt(idle, 0, true)).toBe(idle);
  });
  it('releases every captured bolt when SLOW ends and waits for them before RECOVERY', () => {
    let r = activateReverse(ready(), 0);
    r = captureBolt(captureBolt(captureBolt(r, 5, true), 5, true), 5, true);
    expect(tickReverse(r, 1199)).toEqual({ reverse: r, released: 0 });
    const step = tickReverse(r, 1200);
    expect(step.released).toBe(3);
    expect(step.reverse).toMatchObject({ state: 'RELEASE', captured: 0, pending: 3 });
    expect(worldScale(step.reverse)).toBe(1);
    let after = resolveReturn(step.reverse, 1300, true);
    after = resolveReturn(after, 1350, false);
    expect(after).toMatchObject({ state: 'RELEASE', pending: 1, returnsTotal: 1 });
    after = resolveReturn(after, 1400, true);
    // A release that returned bolts keeps the full 1500 ms recovery and refunds nothing.
    expect(after).toMatchObject({ state: 'RECOVERY', pending: 0, returnsTotal: 2, until: 2900, meter: 0 });
  });
  it('refunds 60 meter after an empty SLOW and uses the short 600 ms recovery (a fair retry)', () => {
    const empty = tickReverse(activateReverse(ready(), 0), 1200);
    expect(empty).toMatchObject({ released: 0, reverse: { state: 'RECOVERY', until: 1800, meter: 60 } });
    // Hits landed during the empty SLOW are kept; the refund never overfills the meter.
    const charged = tickReverse(chargeReverse(activateReverse(ready(), 0), 2 * REVERSE.perHit), 1200).reverse;
    expect(charged.meter).toBe(90);
    expect(tickReverse(chargeReverse(activateReverse(ready(), 0), 50), 1200).reverse.meter).toBe(100);
  });
  it('times out a stuck RELEASE into the full recovery', () => {
    const release = tickReverse(captureBolt(activateReverse(ready(), 0), 1, true), 1200).reverse;
    const timedOut = tickReverse(release, 1200 + REVERSE.releaseTimeoutMs).reverse;
    expect(timedOut).toMatchObject({ state: 'RECOVERY', pending: 0, until: 1200 + REVERSE.releaseTimeoutMs + REVERSE.recoveryMs });
  });
  it('leaves RECOVERY to CHARGING, or READY when hits refilled the meter', () => {
    const recovering = tickReverse(activateReverse(ready(), 0), 1200).reverse;
    expect(tickReverse(recovering, 1799).reverse.state).toBe('RECOVERY');
    expect(tickReverse(recovering, 1800).reverse).toMatchObject({ state: 'CHARGING', meter: 60 });
    // Three hits after the refund are enough to be READY again.
    expect(tickReverse(chargeReverse(recovering, 3 * REVERSE.perHit), 1800).reverse.state).toBe('READY');
  });
  it('ignores stray returns outside RELEASE', () => {
    const r = ready();
    expect(resolveReturn(r, 0, true)).toBe(r);
  });
  it('awakens the core once: meter full, READY unless an activation is running', () => {
    expect(awakenCore(initialReverse(0))).toMatchObject({ state: 'READY', meter: 100 });
    const slow = activateReverse(ready(), 0);
    expect(awakenCore(slow)).toMatchObject({ state: 'SLOW', meter: 100 });
  });
  it('shows the SHIFT cue only when READY and a capturable bolt is near', () => {
    expect(shiftCue(ready(), [REVERSE.cueRadius + 1])).toBe(false);
    expect(shiftCue(ready(), [REVERSE.cueRadius])).toBe(true);
    expect(shiftCue(initialReverse(50), [0])).toBe(false);
    expect(shiftCue(activateReverse(ready(), 0), [0])).toBe(false);
  });
});

describe('two clocks', () => {
  it('advances the real clock fully and the world clock by the world scale', () => {
    expect(advanceClocks({ real: 0, world: 0 }, 100, 1)).toEqual({ real: 100, world: 100 });
    expect(advanceClocks({ real: 100, world: 100 }, 100, 0.2)).toEqual({ real: 200, world: 120 });
    expect(advanceClocks({ real: 5, world: 5 }, -10, 1)).toEqual({ real: 5, world: 5 });
  });
});
