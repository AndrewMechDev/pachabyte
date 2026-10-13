import { describe, expect, it } from 'vitest';
import {
  ERUPTION, emberHits, emberLanding, emberPosition, emberStage, embersDue, eruptionLevel, eruptionWindow, markerSize, skyDim,
} from '../src/game/eruptionRules';
import { SEGMENTS } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

const segment = (name: string) => SEGMENTS.find(s => s.name === name)!;

describe('Erupción del Misti: embers with marked landing points', () => {
  it('shows the landing marker 700 ms before each impact and hurts only during a short impact window', () => {
    expect(ERUPTION.markerMs).toBe(700);
    const at = ERUPTION.embers[0].at;
    expect(emberStage(at - 701, at)).toBe('pending');
    expect(emberStage(at - 700, at)).toBe('marker');
    expect(emberStage(at - 1, at)).toBe('marker');
    expect(emberStage(at, at)).toBe('impact');
    expect(emberStage(at + ERUPTION.impactMs - 1, at)).toBe('impact');
    expect(emberStage(at + ERUPTION.impactMs, at)).toBe('done');
  });
  it('releases each marker exactly once, 700 ms ahead, as the clock advances', () => {
    let cursor = 0; const seen: number[] = [];
    for (let t = 40000; t <= 60000; t += 16) {
      const step = embersDue(cursor, t);
      cursor = step.next;
      for (const e of step.due) { expect(t).toBeGreaterThanOrEqual(e.at - ERUPTION.markerMs); expect(t - (e.at - ERUPTION.markerMs)).toBeLessThan(16); seen.push(e.at); }
    }
    expect(seen).toEqual(ERUPTION.embers.map(e => e.at));
  });
  it('falls from the top to its landing point, arriving exactly at impact', () => {
    const landing = { x: 120, y: 140 }, at = 50000;
    const start = emberPosition(at - ERUPTION.markerMs, at, landing), end = emberPosition(at, at, landing);
    expect(start.y).toBeLessThan(GAME.playTop);
    expect(end).toEqual(landing);
    let previous = start.y;
    for (let t = at - ERUPTION.markerMs; t <= at; t += 50) { const y = emberPosition(t, at, landing).y; expect(y).toBeGreaterThanOrEqual(previous); previous = y; }
  });
  it('marks a landing point that closes in as the impact nears', () => {
    const at = 50000;
    expect(markerSize(at - ERUPTION.markerMs, at)).toBeGreaterThan(markerSize(at - 100, at));
    expect(markerSize(at - 100, at)).toBeGreaterThanOrEqual(ERUPTION.radius);
  });
  it('lands at scripted points or aimed where Kipu was when the marker appeared, inside the play area', () => {
    const fixed = ERUPTION.embers.find(e => e.x !== undefined)!;
    expect(emberLanding(fixed, { x: 10, y: 10 })).toEqual({ x: fixed.x, y: fixed.y });
    const aimed = ERUPTION.embers.find(e => e.x === undefined)!;
    expect(emberLanding(aimed, { x: 80, y: 90 })).toEqual({ x: 80, y: 90 });
    const clamped = emberLanding(aimed, { x: -40, y: 400 });
    expect(clamped.x).toBeGreaterThanOrEqual(ERUPTION.bounds.left);
    expect(clamped.y).toBeLessThanOrEqual(ERUPTION.bounds.bottom);
    expect(ERUPTION.embers.filter(e => e.x === undefined).length).toBeGreaterThanOrEqual(4);
  });
  it('hurts in a small radius around the landing point', () => {
    const landing = { x: 100, y: 100 }, r = ERUPTION.radius;
    expect(r).toBeLessThanOrEqual(14);
    expect(emberHits(landing, { x: 95, y: 92, width: 12, height: 18 })).toBe(true);
    expect(emberHits(landing, { x: 100 + r + 1, y: 92, width: 12, height: 18 })).toBe(false);
    expect(emberHits(landing, { x: 80, y: 100 - r - 19, width: 12, height: 18 })).toBe(false);
    // A corner just outside the circle does not count.
    expect(emberHits(landing, { x: 100 + r * 0.8, y: 100 + r * 0.8, width: 12, height: 18 })).toBe(false);
  });
  it('keeps the pool bounded and the embers inside the eruption segment', () => {
    const [start, end] = eruptionWindow();
    expect(start).toBeGreaterThanOrEqual(segment('eruption').start);
    expect(end).toBeLessThanOrEqual(segment('eruption').end);
    let most = 0;
    for (let t = start; t < end; t += 20) most = Math.max(most, ERUPTION.embers.filter(e => emberStage(t, e.at) === 'marker' || emberStage(t, e.at) === 'impact').length);
    expect(most).toBeLessThanOrEqual(ERUPTION.pool);
    const times = ERUPTION.embers.map(e => e.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    // Gaps between impacts leave time to react to each marker.
    expect(Math.min(...times.slice(1).map((t, i) => t - times[i]))).toBeGreaterThanOrEqual(400);
  });
  it('intensifies the Misti and dims the sky only slightly during the segment (visual only)', () => {
    expect(eruptionLevel(segment('eruption').start - 1)).toBe(0);
    expect(eruptionLevel(ERUPTION.embers[0].at)).toBe(1);
    expect(eruptionLevel(segment('swarm').start)).toBe(0);
    let previous = 0, steepest = 0;
    for (let t = 40000; t < 60000; t += 16) { const l = eruptionLevel(t); steepest = Math.max(steepest, Math.abs(l - previous)); previous = l; }
    expect(steepest).toBeLessThan(0.02);
    expect(skyDim(1)).toBeGreaterThan(0);
    expect(skyDim(1)).toBeLessThanOrEqual(0.25);
    expect(skyDim(0)).toBe(0);
  });
});
