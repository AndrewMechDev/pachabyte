import { describe, expect, it } from 'vitest';
import {
  LOOP, cueVisible, formationDue, hitLoopNode, initialLoop, loopActive, loopEnd, loopMarkerX, nodeHitbox, nodePosition, sceneryRewind, stepLoop, type LoopState,
} from '../src/game/loopRules';
import { ROUTE, SEGMENTS, overlaps, type Rect } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

const segment = (name: string) => SEGMENTS.find(s => s.name === name)!;
const run = (state: LoopState, from: number, to: number, step = 16) => {
  let s = state, resets = 0, broke = false;
  for (let t = from; t <= to; t += step) { const r = stepLoop(s, t); s = r.state; resets += Number(r.reset); broke ||= r.broke; }
  return { state: s, resets, broke };
};

describe('Bucle node manual collision', () => {
  it('uses an 18x20 rectangle centered on the unchanged bobbing node throughout every iteration', () => {
    expect(LOOP.node.body).toEqual({ width: 18, height: 20 });
    for (let t = LOOP.start; t < loopEnd(); t += 100) {
      const p = nodePosition(t), rect = nodeHitbox(t);
      expect(rect).toEqual({ x: p.x - 9, y: p.y - 10, width: 18, height: 20 });
      expect(rect.x + rect.width / 2).toBe(p.x);
      expect(rect.y + rect.height / 2).toBe(p.y);
    }
  });
  const edgeShots: Array<[string, number, number]> = [
    ['left', -13, -1], ['right', 7, -1], ['top', -3, -9], ['bottom', -3, 7],
  ];
  it.each(edgeShots)('admits a normal shot at the newly expanded %s edge, outside the old 12x12 box', (_edge, dx, dy) => {
    const p = nodePosition(LOOP.start + 650);
    const shot: Rect = { x: p.x + dx, y: p.y + dy, width: 6, height: 3 };
    expect(overlaps(shot, { x: p.x - 6, y: p.y - 6, width: 12, height: 12 })).toBe(false);
    expect(overlaps(shot, nodeHitbox(LOOP.start + 650))).toBe(true);
  });
  const outsideShots: Array<[string, number, number]> = [
    ['left', -15, -1], ['right', 9, -1], ['top', -3, -13], ['bottom', -3, 10],
  ];
  it.each(outsideShots)('still rejects a shot touching but not overlapping the %s edge', (_edge, dx, dy) => {
    const p = nodePosition(LOOP.start + 650);
    expect(overlaps({ x: p.x + dx, y: p.y + dy, width: 6, height: 3 }, nodeHitbox(LOOP.start + 650))).toBe(false);
  });
});

describe('Bucle (Infinite Loop): a stretch that repeats until its node breaks', () => {
  it('starts with the loop segment and ends by itself after at most 2 repeats, before the threshold', () => {
    expect(LOOP.start).toBe(segment('loop').start);
    expect(LOOP.maxRepeats).toBe(2);
    expect(loopEnd()).toBe(LOOP.start + 3 * LOOP.iterationMs);
    expect(loopEnd()).toBeLessThanOrEqual(segment('threshold').start);
  });
  it('resets the stretch at each iteration and breaks by itself so nobody softlocks', () => {
    const r = run(initialLoop(), LOOP.start - 500, loopEnd() + 500);
    expect(r.resets).toBe(LOOP.maxRepeats);
    expect(r.broke).toBe(true);
    expect(r.state).toMatchObject({ brokenBy: 'timeout', resets: 2, hp: LOOP.hp });
    expect(loopActive(r.state, loopEnd() + 100)).toBe(false);
  });
  it('breaks when its 5 HP node is shot, and never repeats after that', () => {
    expect(LOOP.hp).toBe(5);
    let s = run(initialLoop(), LOOP.start, LOOP.start + LOOP.iterationMs + 100).state;
    expect(s.resets).toBe(1);
    const t = LOOP.start + LOOP.iterationMs + 200;
    for (let i = 0; i < 4; i++) { const hit = hitLoopNode(s, t + i); expect(hit.broke).toBe(false); s = hit.state; }
    expect(s.hp).toBe(1);
    const last = hitLoopNode(s, t + 10);
    expect(last.broke).toBe(true);
    expect(last.state).toMatchObject({ hp: 0, brokenAt: t + 10, brokenBy: 'shot' });
    const after = run(last.state, t + 20, loopEnd() + 500);
    expect(after.resets).toBe(0);
    expect(after.state.brokenBy).toBe('shot');
    expect(hitLoopNode(last.state, t + 30).state).toBe(last.state);
  });
  it('ignores shots before the loop starts or after it broke by itself', () => {
    const s = initialLoop();
    expect(hitLoopNode(s, LOOP.start - 10).state).toBe(s);
    const timedOut = run(s, LOOP.start, loopEnd() + 50).state;
    expect(hitLoopNode(timedOut, loopEnd() + 60).state).toBe(timedOut);
  });
  it('respawns the same formation every iteration until it breaks', () => {
    const all = formationDue(LOOP.start - 1, loopEnd(), initialLoop());
    expect(all).toHaveLength(LOOP.formation.length * (LOOP.maxRepeats + 1));
    const ys = all.map(f => f.y);
    expect(ys.slice(0, LOOP.formation.length)).toEqual(ys.slice(LOOP.formation.length, 2 * LOOP.formation.length));
    const broken: LoopState = { ...initialLoop(), hp: 0, brokenAt: LOOP.start + LOOP.iterationMs + 100, brokenBy: 'shot', resets: 1, iteration: 1 };
    expect(formationDue(LOOP.start - 1, loopEnd(), broken).length).toBeLessThan(all.length);
    expect(formationDue(LOOP.start + 10, LOOP.start + 10, initialLoop())).toHaveLength(0);
  });
  it('keeps the node clearly reachable on the right side of the screen', () => {
    for (let t = LOOP.start; t < loopEnd(); t += 100) {
      const p = nodePosition(t);
      expect(p.x).toBeGreaterThan(GAME.width / 2);
      expect(p.x).toBeLessThan(GAME.width - 16);
      expect(p.y).toBeGreaterThanOrEqual(GAME.playTop + 16);
      expect(p.y).toBeLessThanOrEqual(GAME.playBottom - 16);
    }
  });
  it('sweeps a loop marker across the screen once per iteration and rewinds the scenery on each reset', () => {
    expect(loopMarkerX(LOOP.start)).toBeGreaterThanOrEqual(GAME.width);
    expect(loopMarkerX(LOOP.start + LOOP.iterationMs - 1)).toBeLessThan(8);
    expect(loopMarkerX(LOOP.start + LOOP.iterationMs)).toBeGreaterThanOrEqual(GAME.width);
    expect(sceneryRewind(0)).toBe(0);
    expect(sceneryRewind(2)).toBeCloseTo(2 * LOOP.iterationMs * ROUTE.scrollSpeed / 1000);
  });
  it('shows a short "BUCLE ROTO" cue after it breaks', () => {
    const broken: LoopState = { ...initialLoop(), brokenAt: 85000, brokenBy: 'shot', hp: 0 };
    expect(cueVisible(broken, 85000)).toBe(true);
    expect(cueVisible(broken, 85000 + LOOP.cueMs)).toBe(false);
    expect(cueVisible(initialLoop(), 85000)).toBe(false);
  });
});
