import { describe, expect, it } from 'vitest';
import {
  GUARDIAN_DROPS, PICKUPS, PICKUP_KINDS, ROUTE_PICKUPS, absorbHit, bobOffset, collectPickup, countCollected, dropGone, dropPosition, guardianDrop,
  RAFAGA_DROP, guardianRafagaDrop, initialPower, pickupsDue, rafagaActive, rafagaLevel, rafagaRemaining, routePickupScreenX, shotCooldown, volleyAngles,
  type PickupKind,
} from '../src/game/pickupRules';
import { AMARU, hitBoss, initialBoss, phaseFor, type Boss } from '../src/game/amaruRules';
import { ROUTE, SEGMENTS, WALLS, overlaps, segmentAt, wallRects, wallScreenX } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

describe('Ráfaga de la Trama (approved 2026-10-13)', () => {
  it('lasts 6 s of real time with a triple spread and a 120 ms cooldown, then reverts', () => {
    const p = collectPickup('rafaga', initialPower(), 4, 1000).power;
    expect(rafagaActive(p, 1000)).toBe(true);
    expect(rafagaRemaining(p, 1000)).toBe(6000);
    expect(rafagaLevel(p, 4000)).toBeCloseTo(0.5);
    expect(shotCooldown(p, 6999)).toBe(120);
    expect(volleyAngles(p, 6999)).toEqual([0, -0.15, 0.15]);
    expect(rafagaActive(p, 7000)).toBe(false);
    expect(shotCooldown(p, 7000)).toBe(GAME.shotCooldownMs);
    expect(volleyAngles(p, 7000)).toEqual([0]);
    expect(rafagaLevel(p, 9000)).toBe(0);
  });
  it('refreshes the timer when another one is collected while active (no stacking)', () => {
    const first = collectPickup('rafaga', initialPower(), 4, 0);
    const second = collectPickup('rafaga', first.power, 4, 4000);
    expect(second.result).toBe('rafagaRefresh');
    expect(rafagaRemaining(second.power, 4000)).toBe(6000);
    expect(second.power.rafagaUntil).toBe(10000);
    expect(volleyAngles(second.power, 9000)).toHaveLength(3);
    expect(collectPickup('rafaga', first.power, 4, 8000).result).toBe('rafaga');
  });
  it('keeps the same per-shot damage: the spread only adds shots, all at the normal angle range', () => {
    expect(PICKUPS.rafaga.spread).toBe(0.15);
    expect(PICKUPS.shotPool).toBeGreaterThanOrEqual(30);
  });
});

describe('Escudo', () => {
  it('absorbs exactly the next hit: no heart lost, invulnerability still starts, the shield is gone', () => {
    const power = collectPickup('escudo', initialPower(), 3, 0).power;
    expect(power.shield).toBe(true);
    const absorbed = absorbHit({ hp: 3, invulnerableUntil: 0 }, power, 5000);
    expect(absorbed.result).toBe('absorbed');
    expect(absorbed.health).toEqual({ hp: 3, invulnerableUntil: 5000 + ROUTE.invulnerabilityMs });
    expect(absorbed.power.shield).toBe(false);
    const next = absorbHit(absorbed.health, absorbed.power, 5000 + ROUTE.invulnerabilityMs);
    expect(next.result).toBe('damage');
    expect(next.health.hp).toBe(2);
  });
  it('is not consumed by a hit ignored during invulnerability or after defeat', () => {
    const power = { ...initialPower(), shield: true };
    const health = { hp: 3, invulnerableUntil: 2000 };
    const ignored = absorbHit(health, power, 1000);
    expect(ignored.result).toBe('ignored');
    expect(ignored.health).toBe(health);
    expect(ignored.power).toBe(power);
    expect(absorbHit({ hp: 0, invulnerableUntil: 0 }, power, 1000).result).toBe('ignored');
  });
  it('holds at most one at a time', () => {
    const one = collectPickup('escudo', initialPower(), 4, 0);
    const two = collectPickup('escudo', one.power, 4, 10);
    expect(two.result).toBe('shieldKept');
    expect(two.power.shield).toBe(true);
    expect(two.bonus).toBe(0);
  });
});

describe('Corazón', () => {
  it('heals one heart up to the max of 4', () => {
    const heal = collectPickup('corazon', initialPower(), 2, 0);
    expect(heal).toMatchObject({ hp: 3, bonus: 0, result: 'heal' });
    expect(collectPickup('corazon', initialPower(), 3, 0).hp).toBe(4);
  });
  it('gives +100 score instead when the hearts are already full', () => {
    const full = collectPickup('corazon', initialPower(), 4, 0);
    expect(full).toMatchObject({ hp: 4, bonus: PICKUPS.fullHeartScore, result: 'fullBonus' });
    expect(PICKUPS.fullHeartScore).toBe(100);
  });
  it('never changes the power-ups and other pickups never change the hearts', () => {
    const power = initialPower();
    expect(collectPickup('corazon', power, 2, 0).power).toBe(power);
    expect(collectPickup('rafaga', power, 2, 0).hp).toBe(2);
    expect(collectPickup('escudo', power, 2, 0).hp).toBe(2);
  });
});

describe('route placement', () => {
  const count = (kind: PickupKind) => ROUTE_PICKUPS.filter(p => p.kind === kind).length;
  it('is rare and deterministic: 2 Ráfaga, 1 Escudo, 1 Corazón, sorted, inside the play band and before the threshold', () => {
    expect([count('rafaga'), count('escudo'), count('corazon')]).toEqual([2, 1, 1]);
    const times = ROUTE_PICKUPS.map(p => p.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const p of ROUTE_PICKUPS) {
      expect(p.y).toBeGreaterThanOrEqual(GAME.playTop + 8);
      expect(p.y).toBeLessThanOrEqual(GAME.playBottom - 8);
      expect(segmentAt(p.at)).not.toBe('threshold');
    }
  });
  it('places a Ráfaga before the swarm, the Corazón after the Firewall and the Escudo before the Marea', () => {
    const swarm = SEGMENTS.find(s => s.name === 'swarm')!, marea = SEGMENTS.find(s => s.name === 'marea')!;
    const lastWall = Math.max(...WALLS.map(w => w.at));
    expect(ROUTE_PICKUPS.some(p => p.kind === 'rafaga' && p.at < swarm.start && p.at > lastWall)).toBe(true);
    const heart = ROUTE_PICKUPS.find(p => p.kind === 'corazon')!;
    expect(heart.at).toBeGreaterThan(lastWall);
    const shield = ROUTE_PICKUPS.find(p => p.kind === 'escudo')!;
    expect(shield.at).toBeLessThan(marea.start);
    expect(shield.at).toBeGreaterThan(swarm.start);
  });
  it('never puts a pickup inside a Firewall column while both are on screen (bob included)', () => {
    const [w, h] = PICKUPS.drawn;
    for (const p of ROUTE_PICKUPS) {
      for (let t = p.at; routePickupScreenX(p, t) > -w; t += 20) {
        const x = routePickupScreenX(p, t);
        const rect = { x: x - w / 2, y: p.y - h / 2 - PICKUPS.bob.px, width: w, height: h + 2 * PICKUPS.bob.px };
        for (const wall of WALLS) {
          if (t < wall.at) continue;
          for (const column of wallRects(wall, wallScreenX(t, wall))) expect(overlaps(rect, column), `${p.kind} at ${t} ms`).toBe(false);
        }
      }
    }
  });
  it('enters at the right edge and stays still in the world like a fragment', () => {
    const p = ROUTE_PICKUPS[0];
    expect(routePickupScreenX(p, p.at)).toBe(GAME.width + 10);
    expect(routePickupScreenX(p, p.at + 1000)).toBeCloseTo(GAME.width + 10 - ROUTE.scrollSpeed);
  });
  it('releases each pickup exactly once as the clock advances', () => {
    let cursor = 0; const seen: number[] = [];
    for (let t = 0; t <= 70000; t += 16) { const step = pickupsDue(cursor, t); cursor = step.next; seen.push(...step.due.map(p => p.at)); }
    expect(seen).toEqual(ROUTE_PICKUPS.map(p => p.at));
  });
});

describe('guardian drops', () => {
  it('drops one Corazón when phase 2 starts and one Escudo when phase 3 starts', () => {
    expect(guardianDrop(1)).toBeNull();
    expect(guardianDrop(2)).toBe('corazon');
    expect(guardianDrop(3)).toBe('escudo');
    expect(GUARDIAN_DROPS).toEqual({ 2: 'corazon', 3: 'escudo' });
  });
  it('flies slowly to the left from inside Kipu\'s reach and leaves past the left edge', () => {
    const origin = { x: 224, y: 100 };
    expect(dropPosition(origin, 0)).toEqual(origin);
    const later = dropPosition(origin, 1000);
    expect(later.y).toBe(100);
    expect(origin.x - later.x).toBe(PICKUPS.drop.speed);
    expect(PICKUPS.drop.speed).toBeLessThanOrEqual(30);
    expect(dropGone(dropPosition(origin, 1000 * (origin.x + 20) / PICKUPS.drop.speed).x)).toBe(true);
    expect(dropGone(40)).toBe(false);
  });
});

describe('readability helpers', () => {
  it('bobs gently by whole pixels and stays still under reduced motion', () => {
    const values = Array.from({ length: 50 }, (_, i) => bobOffset(i * 37, false));
    expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(PICKUPS.bob.px);
    expect(values.every(Number.isInteger)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(1);
    expect(Array.from({ length: 20 }, (_, i) => bobOffset(i * 91, true)).every(v => v === 0)).toBe(true);
  });
  it('counts collected pickups per type', () => {
    expect(PICKUP_KINDS).toEqual(['rafaga', 'escudo', 'corazon']);
    expect(countCollected(undefined, 'rafaga')).toEqual({ rafaga: 1, escudo: 0, corazon: 0 });
    expect(countCollected({ rafaga: 1, escudo: 0, corazon: 2 }, 'corazon')).toEqual({ rafaga: 1, escudo: 0, corazon: 3 });
  });
});

describe('Ráfaga drops in the guardian fight (user request 2026-10-13: defeat Amaru faster)', () => {
  const boss = (hp: number, extra: Partial<Boss> = {}): Boss => ({ ...initialBoss(), hp, phase: phaseFor(hp), shield: phaseFor(hp) >= 2 ? AMARU.shieldMax : 0, ...extra });
  it('drops once when phase 1 reaches the half of its HP range', () => {
    const mid = RAFAGA_DROP.phase1Hp;
    expect(mid).toBe(83);
    expect(guardianRafagaDrop(boss(mid + 1), boss(mid), 'damage', false)).toBe(true);
    expect(guardianRafagaDrop(boss(mid + 2), boss(mid + 1), 'damage', false)).toBe(false);
    expect(guardianRafagaDrop(boss(mid), boss(mid - 1), 'damage', false)).toBe(false);
    // A returned bolt (3 damage) that jumps over the mark still drops it.
    expect(guardianRafagaDrop(boss(mid + 2), boss(mid - 1), 'damage', false)).toBe(true);
  });
  it('drops each time the shield breaks in phase 2, never in phase 3', () => {
    const before = boss(50, { shield: 3 }), after = boss(50, { shield: 0, vulnerableUntil: 9000 });
    expect(guardianRafagaDrop(before, after, 'shieldBreak', false)).toBe(true);
    expect(guardianRafagaDrop(before, after, 'shieldHit', false)).toBe(false);
    expect(guardianRafagaDrop(boss(20, { shield: 3 }), boss(20, { shield: 0 }), 'shieldBreak', false)).toBe(false);
  });
  it('never puts a second Ráfaga on screen', () => {
    expect(guardianRafagaDrop(boss(RAFAGA_DROP.phase1Hp + 1), boss(RAFAGA_DROP.phase1Hp), 'damage', true)).toBe(false);
    expect(guardianRafagaDrop(boss(50, { shield: 3 }), boss(50, { shield: 0 }), 'shieldBreak', true)).toBe(false);
  });
  it('keeps the shield identity: Ráfaga shots are normal shots and are deflected by the shield', () => {
    const shielded = boss(50);
    expect(hitBoss(shielded, 'normal', 0).result).toBe('deflect');
    expect(volleyAngles(collectPickup('rafaga', initialPower(), 4, 0).power, 10)).toHaveLength(3);
  });
});
