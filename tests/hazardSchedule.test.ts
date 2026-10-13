import { describe, expect, it } from 'vitest';
import { ROUTE, SEGMENTS, captionAt, firewallWindow, segmentAt } from '../src/game/routeRules';
import { packetLossWindow } from '../src/game/packetLossRules';
import { eruptionWindow } from '../src/game/eruptionRules';
import { leakWindow } from '../src/game/memoryLeakRules';
import { LOOP, loopEnd } from '../src/game/loopRules';
import { TEXT } from '../src/game/text';

// A2 fairness: every hazard type lives in its own stretch of the route, so two of them are never active at once.
const WINDOWS: Record<string, readonly [number, number]> = {
  firewall: firewallWindow(),
  packetLoss: packetLossWindow(),
  eruption: eruptionWindow(),
  memoryLeak: leakWindow(),
  marea: [ROUTE.marea.start, ROUTE.marea.end],
  loop: [LOOP.start, loopEnd()],
};

describe('A2 hazard schedule', () => {
  it('never overlaps two hazard types', () => {
    const list = Object.entries(WINDOWS).sort((a, b) => a[1][0] - b[1][0]);
    for (let i = 1; i < list.length; i++) expect(list[i][1][0], `${list[i - 1][0]} -> ${list[i][0]}`).toBeGreaterThanOrEqual(list[i - 1][1][1]);
  });
  it('starts each hazard inside the segment of the same name', () => {
    for (const [name, [start]] of Object.entries(WINDOWS)) expect(segmentAt(start + 1), name).toBe(name);
  });
  it('keeps the threshold quiet: no hazard reaches it', () => {
    const threshold = SEGMENTS.find(s => s.name === 'threshold')!;
    for (const [name, [, end]] of Object.entries(WINDOWS)) expect(end, name).toBeLessThanOrEqual(threshold.start);
  });
  it('captions each new hazard once, in Spanish, as its segment begins', () => {
    const captions = { packetLoss: TEXT.packetLoss, eruption: TEXT.eruption, memoryLeak: TEXT.memoryLeak, loop: TEXT.loop } as const;
    expect([TEXT.packetLoss, TEXT.eruption, TEXT.memoryLeak, TEXT.loop]).toEqual([
      'PACKET LOSS: CRUZA CUANDO SE PIERDAN', '¡EL MISTI DESPIERTA!', 'MEMORY LEAK: DRENA TU ENERGÍA', 'BUCLE: ROMPE EL NODO',
    ]);
    expect(TEXT.loopBroken).toBe('BUCLE ROTO');
    for (const [name, text] of Object.entries(captions)) {
      let shows = 0, previous = '', first = -1;
      for (let t = 0; t < ROUTE.transitionMs; t += 50) {
        const c = captionAt(t);
        if (c === text && previous !== text) { shows++; if (first < 0) first = t; }
        previous = c;
      }
      expect(shows, name).toBe(1);
      expect(Math.abs(first - WINDOWS[name][0]), name).toBeLessThanOrEqual(1500);
    }
  });
});
