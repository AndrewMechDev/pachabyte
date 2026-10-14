import { describe, expect, it } from 'vitest';
import {
  ROUTE, SEGMENTS, SPAWNS, WALLS, CAPTIONS, addMeter, cameraScroll, captionAt, defeatBug, directEntry, finalScore, glitchlingVelocity, mareaFront,
  mareaTouches, overlaps, pickupFragment, quietSegment, firewallWindow, readRunState, runningScore, scoreBreakdown, segmentAt, spawnsDue, takeHit, wallRects, wallScreenX, wallTelegraph, type Tally,
} from '../src/game/routeRules';
import { BUGS, corruptorLifetime, sombraTravelMs } from '../src/game/bugRules';
import { GAME } from '../src/game/rules';
import { TEXT } from '../src/game/text';

describe('route timeline', () => {
  it('lists every Ruta 01 step in order with the approved boundaries', () => {
    // A2 (2026-10-13): about 98 s with Packet Loss, the eruption, a mixed swarm, Memory Leak and the Bucle.
    expect(SEGMENTS.map(s => [s.name, s.start, s.end])).toEqual([
      ['arrival', 0, 8000], ['firstBug', 8000, 16000], ['fragments', 16000, 26000], ['firewall', 26000, 36000],
      ['packetLoss', 36000, 46000], ['eruption', 46000, 56000], ['swarm', 56000, 64000], ['memoryLeak', 64000, 72000],
      ['marea', 72000, 82000], ['loop', 82000, 90000], ['threshold', 90000, 98000],
    ]);
    expect(ROUTE.transitionMs).toBe(98000);
  });
  it('resolves segments with inclusive starts and exclusive ends', () => {
    expect(segmentAt(0)).toBe('arrival');
    expect(segmentAt(7999)).toBe('arrival');
    expect(segmentAt(8000)).toBe('firstBug');
    expect(segmentAt(81999)).toBe('marea');
    expect(segmentAt(82000)).toBe('loop');
    expect(segmentAt(90000)).toBe('threshold');
    expect(segmentAt(98000)).toBe('transition');
  });
  it('scrolls the camera at a constant speed and stops at the end of the world', () => {
    expect(cameraScroll(0)).toBe(0);
    expect(cameraScroll(1000)).toBeCloseTo(ROUTE.scrollSpeed);
    expect(cameraScroll(10_000_000)).toBe(ROUTE.worldWidth - GAME.width);
    expect(ROUTE.worldWidth).toBeGreaterThanOrEqual(GAME.width + ROUTE.scrollSpeed * ROUTE.transitionMs / 1000);
  });
  it('captions every teaching step in Spanish at its segment', () => {
    expect(captionAt(500)).toBe(TEXT.intro);
    expect([captionAt(1500), captionAt(2500)]).toEqual([TEXT.moveHint, TEXT.fireHint]);
    expect(captionAt(16500)).toBe(TEXT.fragments);
    expect(captionAt(26500)).toBe(TEXT.firewall);
    expect(captionAt(37500)).toBe(TEXT.packetLoss);
    expect(captionAt(46500)).toBe(TEXT.eruption);
    expect(captionAt(64500)).toBe(TEXT.memoryLeak);
    expect(captionAt(72500)).toBe(TEXT.marea);
    expect(captionAt(82500)).toBe(TEXT.loop);
    // Round 2 (playtest 2026-10-13): the first 2 s of the threshold announce the restoration, then the pattern line.
    expect(captionAt(90500)).toBe(TEXT.umbral);
    expect(TEXT.umbral).toBe('EL UMBRAL TE RESTAURA');
    expect(captionAt(91999)).toBe(TEXT.umbral);
    expect(captionAt(92000)).toBe(TEXT.threshold);
    expect(captionAt(13000)).toBe('');
  });
});

describe('scripted spawns', () => {
  it('are deterministic, sorted, inside the play band and before the threshold', () => {
    const times = SPAWNS.map(s => s.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const s of SPAWNS) {
      expect(s.y).toBeGreaterThanOrEqual(GAME.playTop + 4);
      expect(s.y).toBeLessThanOrEqual(GAME.playBottom - 4);
      expect(s.at).toBeLessThan(90000);
    }
  });
  it('introduce one bug first, then fragments, a swarm, and tempting fragments during the Marea', () => {
    const inSegment = (name: string, kind: string) => SPAWNS.filter(s => segmentAt(s.at) === name && s.kind === kind).length;
    expect(SPAWNS.filter(s => s.at < 8000).map(s => [s.kind, s.at, s.y])).toEqual([['glitchling', 3000, 96], ['glitchling', 5000, 60]]);
    expect(SPAWNS.find(s => s.kind === 'glitchling')!.at).toBe(3000);
    expect(inSegment('firstBug', 'fragment')).toBe(0);
    expect(inSegment('fragments', 'fragment')).toBeGreaterThanOrEqual(6);
    expect(inSegment('swarm', 'glitchling')).toBeGreaterThan(inSegment('firstBug', 'glitchling'));
    expect(inSegment('marea', 'fragment')).toBeGreaterThanOrEqual(4);
  });
  it('places fragments on a safe line and on risky lines', () => {
    const ys = new Set(SPAWNS.filter(s => segmentAt(s.at) === 'fragments' && s.kind === 'fragment').map(s => s.y));
    expect(ys.size).toBeGreaterThanOrEqual(3);
  });
  it('adds Corruptors and Sombras de Error to the script, never inside the Firewall, the new hazards or the threshold', () => {
    const corruptors = SPAWNS.filter(s => s.kind === 'corruptor'), sombras = SPAWNS.filter(s => s.kind === 'sombra');
    expect(corruptors.length).toBeGreaterThanOrEqual(2);
    expect(sombras.length).toBeGreaterThanOrEqual(2);
    expect(quietSegment('firewall')).toBe(true);
    expect(quietSegment('threshold')).toBe(true);
    for (const name of ['packetLoss', 'eruption', 'loop'] as const) expect(quietSegment(name), name).toBe(true);
    for (const name of ['swarm', 'memoryLeak', 'marea'] as const) expect(quietSegment(name), name).toBe(false);
    const quiet = SEGMENTS.filter(s => quietSegment(s.name));
    const windows = [...corruptors.map(s => [s.at, s.at + corruptorLifetime()]), ...sombras.map(s => [s.at, s.at + sombraTravelMs()])];
    for (const [from, to] of windows) for (const q of quiet) expect(from >= q.end || to <= q.start, `${from}-${to} overlaps ${q.name}`).toBe(true);
    // The Corruptor sways 14 px around its spawn height and must stay inside the band.
    for (const s of corruptors) { expect(s.y).toBeGreaterThanOrEqual(GAME.playTop + 26); expect(s.y).toBeLessThanOrEqual(GAME.playBottom - 26); }
  });
  it('never schedules more than 2 Corruptors or more than one large Sombra on screen at once', () => {
    const alive = (kind: string, life: number, t: number) => SPAWNS.filter(s => s.kind === kind && t >= s.at && t < s.at + life).length;
    for (let t = 0; t < ROUTE.transitionMs; t += 100) {
      expect(alive('corruptor', corruptorLifetime(), t), `corruptors at ${t}`).toBeLessThanOrEqual(BUGS.caps.corruptors);
      expect(alive('sombra', sombraTravelMs(), t), `sombras at ${t}`).toBeLessThanOrEqual(1);
    }
    expect(SPAWNS.filter(s => s.kind === 'corruptor').some(a => SPAWNS.some(b => b !== a && b.kind === 'corruptor' && Math.abs(b.at - a.at) < corruptorLifetime()))).toBe(true);
  });
  it('sends the mixed swarm as waves of Corruptors and Sombras within the caps', () => {
    const swarm = SPAWNS.filter(s => segmentAt(s.at) === 'swarm');
    expect(swarm.filter(s => s.kind === 'corruptor')).toHaveLength(BUGS.caps.corruptors);
    expect(swarm.filter(s => s.kind === 'sombra').length).toBeGreaterThanOrEqual(1);
    expect(new Set(swarm.filter(s => s.kind === 'glitchling').map(s => s.at)).size).toBeGreaterThanOrEqual(3);
  });
  it('lets a few Glitchlings slip between the Packet Loss columns', () => {
    expect(SPAWNS.filter(s => segmentAt(s.at) === 'packetLoss' && s.kind === 'glitchling').length).toBeGreaterThanOrEqual(2);
  });
  it('releases each spawn exactly once as the clock advances', () => {
    let cursor = 0; const seen: number[] = [];
    for (let t = 0; t <= 98000; t += 16) { const step = spawnsDue(cursor, t); cursor = step.next; seen.push(...step.due.map(s => s.at)); }
    expect(seen).toEqual(SPAWNS.map(s => s.at));
    expect(spawnsDue(cursor, 99999).due).toHaveLength(0);
  });
});

describe('Glitchling chase', () => {
  it('drifts left relative to the screen at 45 px/s while carried by the scroll', () => {
    expect(glitchlingVelocity(90, 90).vx).toBe(ROUTE.scrollSpeed - 45);
    expect(glitchlingVelocity(90, 90).vy).toBe(0);
  });
  it('chases the player vertically at no more than 40 px/s', () => {
    expect(glitchlingVelocity(30, 170).vy).toBe(40);
    expect(glitchlingVelocity(170, 30).vy).toBe(-40);
    const near = glitchlingVelocity(90, 92).vy;
    expect(near).toBeGreaterThan(0); expect(near).toBeLessThan(40);
  });
  it('keeps the approved toughness and score', () => {
    expect(ROUTE.glitchling.hp).toBe(2);
    expect(ROUTE.glitchling.score).toBe(75);
  });
});

describe('fragments, meter and score', () => {
  it('a fragment adds 100 points and 20 energy, clamped at 100', () => {
    const tally = { fragments: 0, bugs: 0, returns: 0 };
    const first = pickupFragment(0, tally);
    expect(first.meter).toBe(20);
    expect(runningScore(first.tally) - runningScore(tally)).toBe(100);
    expect(pickupFragment(95, tally).meter).toBe(100);
    expect(tally.fragments).toBe(0);
  });
  it('clamps the meter on both ends', () => {
    expect(addMeter(50, 10)).toBe(60);
    expect(addMeter(99, 10)).toBe(100);
    expect(addMeter(5, -10)).toBe(0);
  });
  it('uses the provisional formula with a non-negative time bonus', () => {
    const tally = { fragments: 3, bugs: 4, returns: 2 };
    expect(runningScore(tally)).toBe(300 + 300 + 400);
    expect(finalScore(tally, 100)).toBe(1000 + 2000);
    expect(finalScore(tally, 400)).toBe(1000);
  });
  it('scores each defeated bug by its own value and keeps the racha bonus as a separate line', () => {
    let tally: Tally = { fragments: 0, bugs: 0, returns: 0, bugPoints: 0, comboBonus: 0 };
    let step = defeatBug(tally, 75, 0);
    expect(step.points).toBe(75);
    tally = step.tally;
    step = defeatBug(tally, 150, 12);
    expect(step.points).toBe(450);
    expect(step.tally).toEqual({ fragments: 0, bugs: 2, returns: 0, bugPoints: 225, comboBonus: 300 });
    expect(runningScore(step.tally)).toBe(525);
    expect(scoreBreakdown(step.tally, 300)).toEqual({ fragments: 0, bugs: 225, returns: 0, combo: 300, pickups: 0, time: 0, total: 525 });
  });
  it('adds the full-heart Corazón bonus as its own score part (B3 pickups)', () => {
    const tally: Tally = { fragments: 1, bugs: 0, returns: 0, pickups: 3, pickupBonus: 100 };
    expect(runningScore(tally)).toBe(200);
    expect(scoreBreakdown(tally, 300)).toMatchObject({ fragments: 100, pickups: 100, total: 200 });
  });
});

describe('Firewall', () => {
  it('scrolls each wall in from the right edge toward the left', () => {
    const wall = WALLS[0];
    expect(wallScreenX(wall.at, wall)).toBeGreaterThanOrEqual(GAME.width);
    expect(wallScreenX(wall.at + 1000, wall)).toBeCloseTo(wallScreenX(wall.at, wall) - ROUTE.firewall.screenSpeed);
  });
  it('blocks the whole band except one gap the Kipu body fits through', () => {
    for (const wall of WALLS) {
      const [top, bottom] = wallRects(wall, 100);
      expect(top.y).toBe(GAME.playTop);
      expect(bottom.y + bottom.height).toBe(GAME.playBottom);
      const gap = bottom.y - (top.y + top.height);
      expect(gap).toBe(ROUTE.firewall.gap);
      expect(gap).toBeGreaterThan(18 + 12);
    }
  });
  it('telegraphs the gap before the wall enters and stops once it is visible', () => {
    const wall = WALLS[1];
    expect(wallTelegraph(wall.at - ROUTE.firewall.telegraphMs - 1, wall)).toBe(false);
    expect(wallTelegraph(wall.at - 10, wall)).toBe(true);
    expect(wallTelegraph(wall.at, wall)).toBe(false);
  });
  it('happens inside its segment with varying gaps', () => {
    for (const wall of WALLS) expect(segmentAt(wall.at - ROUTE.firewall.telegraphMs)).toBe('firewall');
    const [start, end] = firewallWindow();
    expect(start).toBe(WALLS[0].at - ROUTE.firewall.telegraphMs);
    expect(wallScreenX(end, WALLS.at(-1)!)).toBeLessThanOrEqual(-ROUTE.firewall.width);
    expect(new Set(WALLS.map(w => w.gapY)).size).toBe(WALLS.length);
  });
  it('detects rectangle overlap with touching edges excluded', () => {
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
  });
});

describe('Marea del Desfase', () => {
  it('is absent outside its segment, advances, holds and recedes before the threshold', () => {
    expect(mareaFront(71999)).toBe(0);
    expect(mareaFront(72000)).toBe(0);
    expect(mareaFront(75000)).toBeGreaterThan(0);
    expect(mareaFront(75000)).toBeLessThan(mareaFront(ROUTE.marea.peakAt));
    expect(mareaFront(ROUTE.marea.peakAt)).toBe(ROUTE.marea.maxFront);
    expect(mareaFront(ROUTE.marea.holdUntil)).toBe(ROUTE.marea.maxFront);
    expect(mareaFront(81000)).toBeLessThan(ROUTE.marea.maxFront);
    expect(mareaFront(82000)).toBe(0);
    expect(ROUTE.marea.start).toBe(72000);
    expect(ROUTE.marea.maxFront).toBeLessThan(GAME.width / 2);
  });
  it('touches only what lies left of the front', () => {
    expect(mareaTouches(60, 59)).toBe(true);
    expect(mareaTouches(60, 60)).toBe(false);
    expect(mareaTouches(0, -5)).toBe(false);
  });
});

describe('Kipu health', () => {
  it('starts at 4 HP and grants 1100 ms of invulnerability after each hit', () => {
    const start = { hp: ROUTE.maxHp, invulnerableUntil: 0 };
    expect(ROUTE.maxHp).toBe(4);
    const hit = takeHit(start, 500);
    expect(hit).toEqual({ hp: 3, invulnerableUntil: 1600 });
    expect(takeHit(hit, 1599)).toBe(hit);
    expect(takeHit(hit, 1600).hp).toBe(2);
    expect(takeHit({ hp: 0, invulnerableUntil: 0 }, 5000).hp).toBe(0);
  });
});

describe('run state carried into the guardian', () => {
  it('defaults to a fresh direct entry with 4 HP and an empty meter', () => {
    expect(directEntry()).toEqual({ hp: 4, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0, bugPoints: 0, comboBonus: 0, comboHits: 0, pickups: 0, pickupBonus: 0 });
    expect(readRunState(undefined)).toEqual(directEntry());
    expect(readRunState({ hp: 'x' })).toEqual(directEntry());
  });
  it('accepts a carried state and clamps out-of-range values', () => {
    expect(readRunState({ hp: 2, score: 900, fragments: 5, bugs: 4, meter: 140, routeSeconds: 70 }))
      .toEqual({ hp: 2, score: 900, fragments: 5, bugs: 4, meter: 100, routeSeconds: 70, bugPoints: 300, comboBonus: 0, comboHits: 0, pickups: 0, pickupBonus: 0 });
    expect(readRunState({ hp: 9, score: -1, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0 }).hp).toBe(4);
  });
  it('carries the racha, the bug points and the racha bonus', () => {
    const carried = readRunState({ hp: 3, score: 1600, fragments: 4, bugs: 5, meter: 60, routeSeconds: 70, bugPoints: 640, comboBonus: 560, comboHits: 14.6 });
    expect(carried).toMatchObject({ bugPoints: 640, comboBonus: 560, comboHits: 14 });
    expect(readRunState({ hp: 3, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0, comboHits: -5, comboBonus: 'x' })).toMatchObject({ comboHits: 0, comboBonus: 0 });
  });
  it('carries the pickups collected and the full-heart bonus', () => {
    expect(readRunState({ hp: 3, score: 100, fragments: 0, bugs: 0, meter: 0, routeSeconds: 70, pickups: 4, pickupBonus: 100 })).toMatchObject({ pickups: 4, pickupBonus: 100 });
    expect(readRunState({ hp: 3, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0, pickups: 'x', pickupBonus: -3 })).toMatchObject({ pickups: 0, pickupBonus: 0 });
  });
});

it('exposes unchanged instructional windows for instruction-first narrative scheduling', () => {
  expect(CAPTIONS).toHaveLength(12);
  for (const c of CAPTIONS) { expect(captionAt(c.start)).toBe(c.text); expect(c.end).toBeGreaterThan(c.start); }
  expect(CAPTIONS.slice(0, 3).map(c => [c.start, c.end])).toEqual([[0, 1000], [1000, 2000], [2000, 8000]]);
});
