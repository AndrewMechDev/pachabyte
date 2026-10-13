import { describe, expect, it } from 'vitest';
import {
  BUGS, BUG_STATS, corruptorCharge, corruptorFireTimes, corruptorLifetime, corruptorScreen, corruptorShotsDue, dodgeStage, dropsFragment, linedUpShot,
  orbExpired, orbVelocity, shadowPosition, sombraTravelMs, sombraWorldX, splitCount, startSombra, stepSombra,
} from '../src/game/bugRules';
import { FRAGMENT_SMALL, ORB } from '../src/game/bugArt';
import { ROUTE } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

describe('bug roster (canon values, tentative until playtest)', () => {
  it('keeps the approved toughness and score of every bug', () => {
    expect(BUG_STATS).toEqual({
      glitchling: { hp: 2, score: 75 }, corruptor: { hp: 4, score: 150 }, sombra: { hp: 3, score: 100 }, shadow: { hp: 1, score: 40 },
    });
  });
  it('caps what can share the screen: 2 Corruptors, 3 shadow units', () => {
    expect(BUGS.caps.corruptors).toBe(2);
    expect(BUGS.caps.shadows).toBe(3);
  });
});

describe('Corruptor', () => {
  it('enters from the right and only hovers in the right third of the screen', () => {
    const third = GAME.width * 2 / 3;
    for (let age = 0; age < corruptorLifetime(); age += 25) {
      const p = corruptorScreen(age, 70);
      if (p.gone) break;
      expect(p.x, `x at ${age}`).toBeGreaterThanOrEqual(third);
      expect(p.y).toBeGreaterThanOrEqual(GAME.playTop + 8);
      expect(p.y).toBeLessThanOrEqual(GAME.playBottom - 8);
    }
    expect(corruptorScreen(0, 70).x).toBeGreaterThan(GAME.width);
    expect(corruptorScreen(corruptorLifetime(), 70).gone).toBe(true);
    expect(corruptorLifetime()).toBeLessThan(9000);
  });
  it('drifts slowly while hovering', () => {
    const a = corruptorScreen(BUGS.corruptor.enterMs + 1000, 90), b = corruptorScreen(BUGS.corruptor.enterMs + 1100, 90);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(10);
  });
  it('fires one slow orb about every 2.4 s, each telegraphed by a 600 ms charge', () => {
    const times = corruptorFireTimes();
    expect(times.length).toBeGreaterThanOrEqual(2);
    times.slice(1).forEach((t, i) => expect(t - times[i]).toBe(2400));
    for (const t of times) {
      expect(corruptorCharge(t - 601)).toBe(0);
      expect(corruptorCharge(t - 300)).toBeGreaterThan(0);
      expect(corruptorCharge(t - 1)).toBeGreaterThan(corruptorCharge(t - 300));
      expect(corruptorShotsDue(t - 1)).toBe(times.indexOf(t));
      expect(corruptorShotsDue(t)).toBe(times.indexOf(t) + 1);
      expect(t).toBeLessThan(BUGS.corruptor.stayMs);
    }
    expect(BUGS.corruptor.chargeMs).toBe(600);
  });
  it('aims its orb at Kipu at a slow screen speed, carried by the scroll', () => {
    const v = orbVelocity({ x: 260, y: 90 }, { x: 60, y: 90 });
    expect(v.vx - ROUTE.scrollSpeed).toBeCloseTo(-BUGS.corruptor.orbSpeed);
    expect(v.vy).toBeCloseTo(0);
    const diagonal = orbVelocity({ x: 200, y: 50 }, { x: 100, y: 150 });
    expect(Math.hypot(diagonal.vx - ROUTE.scrollSpeed, diagonal.vy)).toBeCloseTo(BUGS.corruptor.orbSpeed);
    expect(BUGS.corruptor.orbSpeed).toBeLessThan(GAME.bulletSpeed / 3);
  });
  it('lets an orb expire by age or once it leaves the play area', () => {
    expect(orbExpired(100, 150, 90)).toBe(false);
    expect(orbExpired(BUGS.corruptor.orbTtl, 150, 90)).toBe(true);
    expect(orbExpired(100, -10, 90)).toBe(true);
    expect(orbExpired(100, 150, GAME.playBottom + 6)).toBe(true);
  });
});

describe('Sombra de Error', () => {
  it('sees only a shot in front of it, close and in its lane', () => {
    const s = { x: 200, y: 90 };
    expect(linedUpShot(s, [{ x: 150, y: 93 }])).toBe(93);
    expect(linedUpShot(s, [{ x: 150, y: 90 + BUGS.sombra.dodge.lane + 1 }])).toBeNull();
    expect(linedUpShot(s, [{ x: 210, y: 90 }])).toBeNull();
    expect(linedUpShot(s, [{ x: 200 - BUGS.sombra.dodge.range - 1, y: 90 }])).toBeNull();
    expect(linedUpShot(s, [{ x: 120, y: 90 }, { x: 170, y: 88 }])).toBe(88);
  });
  it('telegraphs, then dodges sideways away from the shot by a bounded distance', () => {
    const d = BUGS.sombra.dodge;
    let m = stepSombra(startSombra(90), 1000, 0.016, 90, 92);
    expect(dodgeStage(m, 1000)).toBe('telegraph');
    m = stepSombra(m, 1000 + d.telegraphMs - 1, 0.016, 90, null);
    expect(m.y).toBe(90);
    m = stepSombra(m, 1000 + d.telegraphMs + d.moveMs / 2, 0.016, 90, null);
    expect(dodgeStage(m, 1000 + d.telegraphMs + d.moveMs / 2)).toBe('move');
    expect(m.y).toBeLessThan(90);
    m = stepSombra(m, 1000 + d.telegraphMs + d.moveMs + 1, 0, 90, null);
    expect(m.y).toBe(90 - d.distance);
    expect(d.distance).toBeLessThanOrEqual(20);
  });
  it('dodges at most once per second', () => {
    const d = BUGS.sombra.dodge;
    let m = stepSombra(startSombra(90), 1000, 0, 90, 90);
    const first = m.dodgeAt;
    for (let t = 1000 + d.telegraphMs + d.moveMs + 1; t < 1000 + d.cooldownMs; t += 50) m = stepSombra(m, t, 0, m.y, m.y);
    expect(m.dodgeAt).toBe(first);
    m = stepSombra(m, 1000 + d.cooldownMs, 0, m.y, m.y);
    expect(m.dodgeAt).toBe(1000 + d.cooldownMs);
    expect(d.cooldownMs).toBeGreaterThanOrEqual(1000);
  });
  it('never dodges out of the play band', () => {
    const top = GAME.playTop + 12;
    let m = stepSombra(startSombra(top), 0, 0, top, top + 2);
    m = stepSombra(m, 5000, 0, top, null);
    expect(m.y).toBeGreaterThanOrEqual(GAME.playTop + 4);
    expect(m.y).toBe(top + BUGS.sombra.dodge.distance);
  });
  it('drifts left across the screen and gently follows Kipu between dodges', () => {
    const x0 = sombraWorldX(1000, 0), x1 = sombraWorldX(1000, 1000);
    expect(x1 - x0 - ROUTE.scrollSpeed).toBeCloseTo(-BUGS.sombra.drift);
    const m = stepSombra(startSombra(60), 0, 1, 160, null);
    expect(m.y - 60).toBeCloseTo(BUGS.sombra.chase);
    expect(sombraTravelMs()).toBeLessThan(10000);
  });
  it('splits into two small, faster shadows that spread apart and never split again', () => {
    expect([splitCount(3), splitCount(2), splitCount(1), splitCount(0)]).toEqual([2, 2, 1, 0]);
    const origin = { x: 500, y: 90 };
    const up = shadowPosition(origin, -1, BUGS.shadow.spreadMs * 2), down = shadowPosition(origin, 1, BUGS.shadow.spreadMs * 2);
    expect(up.y).toBe(90 - BUGS.shadow.spread);
    expect(down.y).toBe(90 + BUGS.shadow.spread);
    const later = shadowPosition(origin, 1, 1000);
    expect(later.x - origin.x - ROUTE.scrollSpeed).toBeCloseTo(-BUGS.shadow.drift);
    expect(BUGS.shadow.drift).toBeGreaterThan(BUGS.sombra.drift);
    expect(shadowPosition({ x: 0, y: GAME.playBottom - 4 }, 1, 9999).y).toBeLessThanOrEqual(GAME.playBottom - 8);
  });
});

describe('reparar, no exterminar', () => {
  it('drops one small fragment for every 4th debugged bug', () => {
    expect(Array.from({ length: 12 }, (_, i) => i + 1).filter(dropsFragment)).toEqual([4, 8, 12]);
    expect(dropsFragment(0)).toBe(false);
  });
});

describe('placeholder projectile art', () => {
  const size = (rows: readonly string[]) => [rows[0].length, rows.length];
  it('keeps the round orb and the small fragment small and rectangular', () => {
    expect(size(ORB)).toEqual([5, 5]);
    for (const r of ORB) expect(r).toHaveLength(5);
    expect(size(FRAGMENT_SMALL)[0]).toBeLessThan(9);
  });
});
