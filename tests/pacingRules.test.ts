import { BUGS, corruptorScreen } from '../src/game/bugRules';
import { LOOP } from '../src/game/loopRules';
import { scriptedActivity, inactiveGaps, driftWindow, activityCountsAt } from '../src/game/pacingRules';
import { expect, it } from 'vitest';
import { CAPTIONS, ROUTE, SPAWNS } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';
import { TEXT } from '../src/game/text';

it('ends the opening empty screen within five seconds using actual screen entry, not spawn time', () => {
  const first = SPAWNS.find(s => s.kind === 'glitchling')!;
  // Route spawn centre 330; procedural frame width12; screen-relative drift45 px/s.
  const visibleAt = first.at + (GAME.width + 10 - 6 - GAME.width) / ROUTE.glitchling.drift * 1000;
  expect(visibleAt).toBeLessThanOrEqual(5000);
});
it('offers the first two unchanged Glitchlings at 3 and 5 seconds', () => {
  expect(SPAWNS.filter(s => s.kind === 'glitchling').slice(0, 2).map(s => [s.at, s.y])).toEqual([[3000, 96], [5000, 60]]);
});
it('teaches movement and fire before the first shootable enemy, with continuous arrival hints', () => {
  const first = SPAWNS.find(s => s.kind === 'glitchling')!;
  expect(CAPTIONS.find(c => c.text === TEXT.moveHint)!.start).toBeLessThan(first.at);
  expect(CAPTIONS.find(c => c.text === TEXT.fireHint)!.start).toBeLessThan(first.at);
  expect(CAPTIONS.slice(0, 3).map(c => [c.start, c.end])).toEqual([[0, 1000], [1000, 2000], [2000, 8000]]);
});

it('measures the actual full plan, retaining an observable baseline opening-gap failure', () => {
  const current = scriptedActivity();
  const old = SPAWNS.map((s, i) => i === 0 ? { ...s, at: 9000 } : i === 1 ? { ...s, at: 12000 } : s);
  expect(Math.max(...inactiveGaps(scriptedActivity(old)).map(g => g.ms))).toBeCloseTo(9088.888889, 5);
  expect(Math.max(...inactiveGaps(current).map(g => g.ms))).toBeLessThanOrEqual(5000);
  console.log('PACING', JSON.stringify({ duration: ROUTE.transitionMs, gaps: inactiveGaps(current), counts: current.reduce((o, a) => ({ ...o, [a.kind]: (o[a.kind] ?? 0) + 1 }), {} as Record<string, number>) }));
});

it('derives entry and exit from rendered width and speed rather than pool lifetime', () => {
  expect(driftWindow(3000, 330, 12, 45)).toEqual([3000 + 4 / 45 * 1000, 3000 + 336 / 45 * 1000]);
  expect(driftWindow(16000, 330, 9, 32)).toEqual([16000 + 5.5 / 32 * 1000, 16000 + 334.5 / 32 * 1000]);
  const corruptor = scriptedActivity().find(a => a.label === 'corruptor@17000')!;
  expect(corruptorScreen(corruptor.start - 17000, 70).x - 12).toBeCloseTo(GAME.width, 6);
  expect(corruptorScreen(corruptor.end - 17000, 70).x - 12).toBeCloseTo(GAME.width, 6);
  const sombra = scriptedActivity().find(a => a.label === 'sombra@12500')!;
  expect(sombra.end - 12500).toBeCloseTo((BUGS.sombra.spawnX + 10) / BUGS.sombra.drift * 1000);
});
it('counts each real hazard, leak fragment, pickup and loop target, excluding decorative activity', () => {
  const plan = scriptedActivity();
  expect(plan.filter(a => a.kind === 'pickup')).toHaveLength(5);
  expect(plan.filter(a => a.label.startsWith('firewall'))).toHaveLength(3);
  expect(plan.filter(a => a.label.startsWith('packet'))).toHaveLength(3);
  expect(plan.filter(a => a.label.startsWith('ember'))).toHaveLength(14);
  expect(plan.filter(a => a.label.startsWith('leak@'))).toHaveLength(3);
  expect(plan.filter(a => a.label.startsWith('leak-fragment'))).toHaveLength(4);
  expect(plan.find(a => a.label === 'marea')).toMatchObject({ start: 72000, end: 82000 });
  expect(plan.find(a => a.label === 'loop-eye')).toMatchObject({ start: 82000, end: 89800 });
  expect(activityCountsAt(plan, 2000)).toEqual({ enemy: 0, fragment: 0, pickup: 0, hazard: 0, target: 0 });
  expect(activityCountsAt(plan, 83000).target).toBe(1);
  expect(plan.every(a => a.end <= 90000 && a.end > a.start)).toBe(true);
});
it('removes loop formations on actual resets and clips ranged enemies at quiet purges', () => {
  const plan = scriptedActivity();
  expect(plan.filter(a => a.label.startsWith('loop-glitchling'))).toHaveLength(9);
  for (const a of plan.filter(a => a.label.startsWith('loop-glitchling'))) {
    const born = Number(a.label.split('@')[1]), k = Math.floor((born - LOOP.start) / LOOP.iterationMs);
    expect(a.end).toBeLessThanOrEqual(k < 2 ? LOOP.start + (k + 1) * LOOP.iterationMs : 90000);
  }
  for (const a of plan.filter(a => a.label.startsWith('corruptor') || a.label.startsWith('sombra'))) expect(a.end).toBeLessThanOrEqual(90000);
});
it('merges actual intervals and includes both opening and trailing dead time', () => {
  expect(inactiveGaps([{ kind: 'enemy', label: 'a', start: 1000, end: 3000 }, { kind: 'fragment', label: 'b', start: 2500, end: 4000 }], 6000)).toEqual([
    { start: 0, end: 1000, ms: 1000 }, { start: 4000, end: 6000, ms: 2000 },
  ]);
});
