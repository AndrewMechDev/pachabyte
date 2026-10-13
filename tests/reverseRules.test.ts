import { describe, expect, it } from 'vitest';
import {
  REVERSE, activateReverse, advanceClocks, awakenCore, captureBolt, chargeReverse, initialReverse, isSlow,
  resolveReturn, shiftCue, tickReverse, worldScale, type Reverse,
} from '../src/game/reverseRules';

const ready = (): Reverse => initialReverse(100);

describe('REVERSE tuning', () => {
  it('uses the tentative canon values', () => {
    expect(REVERSE).toMatchObject({ meterMax: 100, perHit: 10, perFragment: 20, slowMs: 800, worldScale: 0.2, captureRadius: 28, maxCaptures: 6, recoveryMs: 1500, returnDamage: 3 });
    expect(Object.isFrozen(REVERSE)).toBe(true);
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
  it('charges +10 per hit and +20 per fragment, and becomes READY at 100', () => {
    let r = initialReverse(70);
    r = chargeReverse(r, REVERSE.perHit); expect(r).toMatchObject({ state: 'CHARGING', meter: 80 });
    r = chargeReverse(r, REVERSE.perFragment); expect(r).toMatchObject({ state: 'READY', meter: 100 });
    expect(chargeReverse(r, 10).meter).toBe(100);
  });
  it('activates only in READY: meter is consumed and SLOW lasts 800 ms of real time', () => {
    const charging = initialReverse(90);
    expect(activateReverse(charging, 0)).toBe(charging);
    const slow = activateReverse(ready(), 1000);
    expect(slow).toMatchObject({ state: 'SLOW', meter: 0, captured: 0, until: 1800, activations: 1 });
    expect(isSlow(slow)).toBe(true);
    expect(worldScale(slow)).toBe(0.2);
    expect(worldScale(ready())).toBe(1);
  });
  it('blocks re-entry while active and during RECOVERY', () => {
    const slow = activateReverse(ready(), 0);
    expect(activateReverse(chargeReverse(slow, 100), 100)).toEqual(chargeReverse(slow, 100));
    const recovering = tickReverse(chargeReverse(slow, 100), 800).reverse;
    expect(recovering.state).toBe('RECOVERY');
    expect(activateReverse(recovering, 1000)).toBe(recovering);
  });
  it('captures only capturable bolts within 28 px during SLOW, at most 6', () => {
    let r = activateReverse(ready(), 0);
    expect(captureBolt(r, 28.1, true)).toBe(r);
    expect(captureBolt(r, 10, false)).toBe(r);
    for (let i = 0; i < 9; i++) r = captureBolt(r, 28, true);
    expect(r.captured).toBe(6);
    const idle = ready();
    expect(captureBolt(idle, 0, true)).toBe(idle);
  });
  it('releases every captured bolt when SLOW ends and waits for them before RECOVERY', () => {
    let r = activateReverse(ready(), 0);
    r = captureBolt(captureBolt(captureBolt(r, 5, true), 5, true), 5, true);
    expect(tickReverse(r, 799)).toEqual({ reverse: r, released: 0 });
    const step = tickReverse(r, 800);
    expect(step.released).toBe(3);
    expect(step.reverse).toMatchObject({ state: 'RELEASE', captured: 0, pending: 3 });
    expect(worldScale(step.reverse)).toBe(1);
    let after = resolveReturn(step.reverse, 900, true);
    after = resolveReturn(after, 950, false);
    expect(after).toMatchObject({ state: 'RELEASE', pending: 1, returnsTotal: 1 });
    after = resolveReturn(after, 1000, true);
    expect(after).toMatchObject({ state: 'RECOVERY', pending: 0, returnsTotal: 2, until: 2500 });
  });
  it('goes straight to RECOVERY after an empty SLOW and times out a stuck RELEASE', () => {
    const empty = tickReverse(activateReverse(ready(), 0), 800);
    expect(empty).toMatchObject({ released: 0, reverse: { state: 'RECOVERY', until: 2300 } });
    const release = tickReverse(captureBolt(activateReverse(ready(), 0), 1, true), 800).reverse;
    expect(tickReverse(release, 800 + REVERSE.releaseTimeoutMs).reverse).toMatchObject({ state: 'RECOVERY', pending: 0 });
  });
  it('leaves RECOVERY after 1500 ms to CHARGING, or READY when hits refilled the meter', () => {
    const recovering = tickReverse(activateReverse(ready(), 0), 800).reverse;
    expect(tickReverse(recovering, 2299).reverse.state).toBe('RECOVERY');
    expect(tickReverse(recovering, 2300).reverse).toMatchObject({ state: 'CHARGING', meter: 0 });
    expect(tickReverse(chargeReverse(recovering, 100), 2300).reverse.state).toBe('READY');
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
