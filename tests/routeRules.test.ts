import { describe, expect, it } from 'vitest';
import {
  ROUTE, SEGMENTS, SPAWNS, WALLS, addMeter, cameraScroll, captionAt, directEntry, finalScore, glitchlingVelocity, mareaFront,
  mareaTouches, overlaps, pickupFragment, readRunState, runningScore, segmentAt, spawnsDue, takeHit, wallRects, wallScreenX, wallTelegraph,
} from '../src/game/routeRules';
import { GAME } from '../src/game/rules';
import { TEXT } from '../src/game/text';

describe('route timeline', () => {
  it('lists every Ruta 01 step in order with the approved boundaries', () => {
    expect(SEGMENTS.map(s => [s.name, s.start, s.end])).toEqual([
      ['arrival', 0, 8000], ['firstBug', 8000, 16000], ['fragments', 16000, 26000], ['firewall', 26000, 38000],
      ['swarm', 38000, 48000], ['marea', 48000, 62000], ['threshold', 62000, 70000],
    ]);
    expect(ROUTE.transitionMs).toBe(70000);
  });
  it('resolves segments with inclusive starts and exclusive ends', () => {
    expect(segmentAt(0)).toBe('arrival');
    expect(segmentAt(7999)).toBe('arrival');
    expect(segmentAt(8000)).toBe('firstBug');
    expect(segmentAt(61999)).toBe('marea');
    expect(segmentAt(62000)).toBe('threshold');
    expect(segmentAt(70000)).toBe('transition');
  });
  it('scrolls the camera at a constant speed and stops at the end of the world', () => {
    expect(cameraScroll(0)).toBe(0);
    expect(cameraScroll(1000)).toBeCloseTo(ROUTE.scrollSpeed);
    expect(cameraScroll(10_000_000)).toBe(ROUTE.worldWidth - GAME.width);
    expect(ROUTE.worldWidth).toBeGreaterThanOrEqual(GAME.width + ROUTE.scrollSpeed * ROUTE.transitionMs / 1000);
  });
  it('captions every teaching step in Spanish at its segment', () => {
    expect(captionAt(500)).toBe(TEXT.intro);
    expect([captionAt(4000), captionAt(7000)]).toEqual([TEXT.moveHint, TEXT.fireHint]);
    expect(captionAt(16500)).toBe(TEXT.fragments);
    expect(captionAt(26500)).toBe(TEXT.firewall);
    expect(captionAt(48500)).toBe(TEXT.marea);
    expect(captionAt(64000)).toBe(TEXT.threshold);
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
      expect(s.at).toBeLessThan(62000);
    }
  });
  it('introduce one bug first, then fragments, a swarm, and tempting fragments during the Marea', () => {
    const inSegment = (name: string, kind: string) => SPAWNS.filter(s => segmentAt(s.at) === name && s.kind === kind).length;
    expect(SPAWNS.filter(s => s.at < 8000)).toHaveLength(0);
    expect(SPAWNS.find(s => s.kind === 'glitchling')!.at).toBeGreaterThanOrEqual(8000);
    expect(inSegment('firstBug', 'fragment')).toBe(0);
    expect(inSegment('fragments', 'fragment')).toBeGreaterThanOrEqual(6);
    expect(inSegment('swarm', 'glitchling')).toBeGreaterThan(inSegment('firstBug', 'glitchling'));
    expect(inSegment('marea', 'fragment')).toBeGreaterThanOrEqual(4);
  });
  it('places fragments on a safe line and on risky lines', () => {
    const ys = new Set(SPAWNS.filter(s => segmentAt(s.at) === 'fragments' && s.kind === 'fragment').map(s => s.y));
    expect(ys.size).toBeGreaterThanOrEqual(3);
  });
  it('releases each spawn exactly once as the clock advances', () => {
    let cursor = 0; const seen: number[] = [];
    for (let t = 0; t <= 70000; t += 16) { const step = spawnsDue(cursor, t); cursor = step.next; seen.push(...step.due.map(s => s.at)); }
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
    for (const wall of WALLS) expect(segmentAt(wall.at)).toBe('firewall');
    expect(new Set(WALLS.map(w => w.gapY)).size).toBe(WALLS.length);
  });
  it('detects rectangle overlap with touching edges excluded', () => {
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
  });
});

describe('Marea del Desfase', () => {
  it('is absent outside its segment, advances, holds and recedes before the threshold', () => {
    expect(mareaFront(47999)).toBe(0);
    expect(mareaFront(48000)).toBe(0);
    expect(mareaFront(52000)).toBeGreaterThan(0);
    expect(mareaFront(52000)).toBeLessThan(mareaFront(ROUTE.marea.peakAt));
    expect(mareaFront(ROUTE.marea.peakAt)).toBe(ROUTE.marea.maxFront);
    expect(mareaFront(ROUTE.marea.holdUntil)).toBe(ROUTE.marea.maxFront);
    expect(mareaFront(61000)).toBeLessThan(ROUTE.marea.maxFront);
    expect(mareaFront(62000)).toBe(0);
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
    expect(directEntry()).toEqual({ hp: 4, score: 0, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0 });
    expect(readRunState(undefined)).toEqual(directEntry());
    expect(readRunState({ hp: 'x' })).toEqual(directEntry());
  });
  it('accepts a carried state and clamps out-of-range values', () => {
    expect(readRunState({ hp: 2, score: 900, fragments: 5, bugs: 4, meter: 140, routeSeconds: 70 }))
      .toEqual({ hp: 2, score: 900, fragments: 5, bugs: 4, meter: 100, routeSeconds: 70 });
    expect(readRunState({ hp: 9, score: -1, fragments: 0, bugs: 0, meter: 0, routeSeconds: 0 }).hp).toBe(4);
  });
});
