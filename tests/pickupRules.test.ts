import { describe, expect, it } from 'vitest';
import {
  GUARDIAN_DROPS, PICKUPS, PICKUP_KINDS, ROUTE_PICKUPS, absorbHit, bobOffset, canSpawnPickup, collectPickup, countCollected, dropGone, dropOrigin, dropPosition,
  guardianDrops, RAFAGA_DROP, guardianRafagaDrop, initialPower, pickupsDue, rafagaActive, rafagaLevel, rafagaRemaining, routePickupScreenX, shotCooldown,
  shotDamage, volleyAngles, type PickupKind,
} from '../src/game/pickupRules';
import { AMARU, hitBoss, initialBoss, phaseFor, type Boss } from '../src/game/amaruRules';
import { ROUTE, SEGMENTS, WALLS, overlaps, segmentAt, wallRects, wallScreenX } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';
import { PACKET_LOSS, packetLossColumns, packetLossWindow } from '../src/game/packetLossRules';
import { ERUPTION, eruptionWindow } from '../src/game/eruptionRules';
import { MEMORY_LEAK, leakWindow, leakZones } from '../src/game/memoryLeakRules';
import { BALANCE } from '../src/game/balanceRules';

// Balance round 2 (playtest 2026-10-13): the Ráfaga lasts 9 s (was 6 s) and each of its shots deals 2 damage (was 1).
describe('Ráfaga de la Trama (approved 2026-10-13, round 2 values)', () => {
  it('lasts 9 s of real time with a triple spread and a 120 ms cooldown, then reverts', () => {
    const p = collectPickup('rafaga', initialPower(), 4, 1000).power;
    expect(rafagaActive(p, 1000)).toBe(true);
    expect(rafagaRemaining(p, 1000)).toBe(9000);
    expect(rafagaLevel(p, 5500)).toBeCloseTo(0.5);
    expect(shotCooldown(p, 9999)).toBe(120);
    expect(volleyAngles(p, 9999)).toEqual([0, -0.15, 0.15]);
    expect(rafagaActive(p, 10000)).toBe(false);
    expect(shotCooldown(p, 10000)).toBe(GAME.shotCooldownMs);
    expect(volleyAngles(p, 10000)).toEqual([0]);
    expect(rafagaLevel(p, 12000)).toBe(0);
  });
  it('refreshes the timer when another one is collected while active (no stacking)', () => {
    const first = collectPickup('rafaga', initialPower(), 4, 0);
    const second = collectPickup('rafaga', first.power, 4, 4000);
    expect(second.result).toBe('rafagaRefresh');
    expect(rafagaRemaining(second.power, 4000)).toBe(9000);
    expect(second.power.rafagaUntil).toBe(13000);
    expect(volleyAngles(second.power, 12000)).toHaveLength(3);
    expect(collectPickup('rafaga', first.power, 4, 9500).result).toBe('rafaga');
  });
  it('deals 2 damage per Ráfaga shot and 1 otherwise; the spread only adds shots', () => {
    const p = collectPickup('rafaga', initialPower(), 4, 0).power;
    expect(PICKUPS.rafaga.damage).toBe(2);
    expect(shotDamage(p, 8999)).toBe(2);
    expect(shotDamage(p, 9000)).toBe(1);
    expect(shotDamage(initialPower(), 0)).toBe(1);
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
  it('is rare and deterministic: 2 Ráfaga, 1 Escudo, 2 Corazón, sorted, inside the play band and before the threshold', () => {
    expect([count('rafaga'), count('escudo'), count('corazon')]).toEqual([2, 1, 2]);
    const times = ROUTE_PICKUPS.map(p => p.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const p of ROUTE_PICKUPS) {
      expect(p.y).toBeGreaterThanOrEqual(GAME.playTop + 8);
      expect(p.y).toBeLessThanOrEqual(GAME.playBottom - 8);
      expect(segmentAt(p.at)).not.toBe('threshold');
    }
  });
  it('places the Escudo before the eruption, the Corazón after the Packet Loss and a Ráfaga in the eruption (A2)', () => {
    const eruption = SEGMENTS.find(s => s.name === 'eruption')!, swarm = SEGMENTS.find(s => s.name === 'swarm')!;
    const shield = ROUTE_PICKUPS.find(p => p.kind === 'escudo')!;
    expect(segmentAt(shield.at)).toBe('packetLoss');
    // Spawned behind the last column, so the columns can never take it.
    expect(shield.at).toBeGreaterThan(Math.max(...PACKET_LOSS.columns));
    // It drifts in at scroll speed and reaches Kipu's usual spot only as the embers begin.
    expect(shield.at + (routePickupScreenX(shield, shield.at) - 56) / ROUTE.scrollSpeed * 1000).toBeLessThan(ERUPTION.embers[0].at + 3000);
    const heart = ROUTE_PICKUPS.find(p => p.kind === 'corazon')!;
    expect(heart.at).toBeGreaterThanOrEqual(eruption.start);
    expect(heart.at).toBeGreaterThan(packetLossWindow()[0]);
    expect(ROUTE_PICKUPS.some(p => p.kind === 'rafaga' && segmentAt(p.at) === 'eruption' && p.at < swarm.start)).toBe(true);
  });
  it('adds a second Corazón once the Memory Leak window is over (round 2), with at most 2 on screen at any time', () => {
    const hearts = ROUTE_PICKUPS.filter(p => p.kind === 'corazon');
    const late = hearts[1];
    expect(late.at).toBeGreaterThanOrEqual(leakWindow()[1]);
    expect(late.at).toBeLessThanOrEqual(73000);
    expect(late.at).toBeGreaterThanOrEqual(eruptionWindow()[1]);
    expect(hearts[0].at).toBeLessThan(packetLossWindow()[1] + 2000);
    const [w] = PICKUPS.drawn;
    for (let t = 0; t <= ROUTE.transitionMs; t += 100) {
      const onScreen = hearts.filter(p => t >= p.at && routePickupScreenX(p, t) > -w).length;
      expect(onScreen, `${t} ms`).toBeLessThanOrEqual(BALANCE.corazonOnScreen);
    }
  });
  it('never puts a pickup inside a Memory Leak zone while both are on screen (bob included)', () => {
    const [w, h] = PICKUPS.drawn;
    for (const p of ROUTE_PICKUPS) {
      for (let t = p.at; routePickupScreenX(p, t) > -w; t += 20) {
        const x = routePickupScreenX(p, t);
        const rect = { x: x - w / 2, y: p.y - h / 2 - PICKUPS.bob.px, width: w, height: h + 2 * PICKUPS.bob.px };
        for (const z of leakZones(t)) expect(overlaps(rect, z.rect), `${p.kind} at ${t} ms vs zone ${z.index}`).toBe(false);
      }
    }
    expect(MEMORY_LEAK.zones.length).toBeGreaterThan(0);
  });
  it('never puts a pickup inside a solid Packet Loss block column while both are on screen', () => {
    const [w, h] = PICKUPS.drawn;
    for (const p of ROUTE_PICKUPS) {
      for (let t = p.at; routePickupScreenX(p, t) > -w; t += 20) {
        const x = routePickupScreenX(p, t);
        const rect = { x: x - w / 2, y: p.y - h / 2 - PICKUPS.bob.px, width: w, height: h + 2 * PICKUPS.bob.px };
        for (const column of packetLossColumns(t)) expect(overlaps(rect, { x: column.x, y: GAME.playTop, width: PACKET_LOSS.width, height: GAME.playBottom - GAME.playTop }), `${p.kind} at ${t} ms`).toBe(false);
      }
    }
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
    for (let t = 0; t <= 98000; t += 16) { const step = pickupsDue(cursor, t); cursor = step.next; seen.push(...step.due.map(p => p.at)); }
    expect(seen).toEqual(ROUTE_PICKUPS.map(p => p.at));
  });
});

describe('guardian drops', () => {
  it('drops a Corazón when phase 2 starts and an Escudo plus an extra Corazón when phase 3 starts (round 2)', () => {
    expect(guardianDrops(1)).toEqual([]);
    expect(guardianDrops(2)).toEqual(['corazon']);
    expect(guardianDrops(3)).toEqual(['escudo', 'corazon']);
    expect(GUARDIAN_DROPS).toEqual({ 2: ['corazon'], 3: ['escudo', 'corazon'] });
  });
  it('keeps at most 2 Corazón on screen and no other pickup is capped', () => {
    expect(canSpawnPickup('corazon', [])).toBe(true);
    expect(canSpawnPickup('corazon', ['corazon'])).toBe(true);
    expect(canSpawnPickup('corazon', ['corazon', 'rafaga', 'corazon'])).toBe(false);
    expect(canSpawnPickup('escudo', ['corazon', 'corazon', 'escudo'])).toBe(true);
    expect(canSpawnPickup('rafaga', ['corazon', 'corazon'])).toBe(true);
  });
  it('spreads two drops of the same moment apart vertically inside the drop band', () => {
    const { minY, maxY } = PICKUPS.drop;
    for (const mouthY of [60, 94, 120, 139, 150, 5, 200]) {
      const [first, second] = [dropOrigin(mouthY, 0), dropOrigin(mouthY, 1)];
      expect(first).toBeGreaterThanOrEqual(minY);
      expect(first).toBeLessThanOrEqual(maxY);
      expect(second).toBeGreaterThanOrEqual(minY);
      expect(second).toBeLessThanOrEqual(maxY);
      expect(Math.abs(first - second), `mouth ${mouthY}`).toBeGreaterThanOrEqual(PICKUPS.drawn[1]);
    }
    expect(dropOrigin(100, 0)).toBe(100);
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
    expect(mid).toBe(67);
    expect(guardianRafagaDrop(boss(mid + 1), boss(mid), 'damage', false)).toBe(true);
    expect(guardianRafagaDrop(boss(mid + 2), boss(mid + 1), 'damage', false)).toBe(false);
    expect(guardianRafagaDrop(boss(mid), boss(mid - 1), 'damage', false)).toBe(false);
    // A returned bolt (3 damage) that jumps over the mark still drops it.
    expect(guardianRafagaDrop(boss(mid + 2), boss(mid - 1), 'damage', false)).toBe(true);
  });
  it('drops each time the shield breaks in phase 2, never in phase 3', () => {
    const before = boss(40, { shield: 3 }), after = boss(40, { shield: 0, vulnerableUntil: 9000 });
    expect(guardianRafagaDrop(before, after, 'shieldBreak', false)).toBe(true);
    expect(guardianRafagaDrop(before, after, 'shieldHit', false)).toBe(false);
    expect(guardianRafagaDrop(boss(20, { shield: 3 }), boss(20, { shield: 0 }), 'shieldBreak', false)).toBe(false);
  });
  it('never puts a second Ráfaga on screen', () => {
    expect(guardianRafagaDrop(boss(RAFAGA_DROP.phase1Hp + 1), boss(RAFAGA_DROP.phase1Hp), 'damage', true)).toBe(false);
    expect(guardianRafagaDrop(boss(40, { shield: 3 }), boss(40, { shield: 0 }), 'shieldBreak', true)).toBe(false);
  });
  it('keeps the shield identity: Ráfaga shots are normal shots and are deflected by the shield', () => {
    const shielded = boss(40);
    expect(hitBoss(shielded, 'normal', 0).result).toBe('deflect');
    expect(hitBoss(shielded, 'normal', 0, shotDamage(collectPickup('rafaga', initialPower(), 4, 0).power, 10)).result).toBe('deflect');
    expect(volleyAngles(collectPickup('rafaga', initialPower(), 4, 0).power, 10)).toHaveLength(3);
  });
});
