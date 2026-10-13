import { describe, expect, it } from 'vitest';
import {
  AMARU, ATTACKS, PHASE_PATTERNS, attackFor, attackStage, bodyPositions, capturable, emissionVelocity, emissionsDue, headPosition,
  checkpointAt, hitBoss, initialBoss, isVulnerable, openWindow, phaseFor, resumeFrom, shieldBlocks, shieldRing, tickBoss, victoryReady,
  waveGapY, waveHits, waveX, type Boss,
} from '../src/game/amaruRules';
import { REVERSE, activateReverse, captureBolt, initialReverse, tickReverse } from '../src/game/reverseRules';

const at = (hp: number, extra: Partial<Boss> = {}): Boss => ({ ...initialBoss(), hp, phase: phaseFor(hp), ...extra });

describe('Amaru phases', () => {
  it('starts at 100 HP in phase 1 with no shield', () => {
    expect(initialBoss()).toEqual({ hp: 100, phase: 1, shield: 0, vulnerableUntil: 0, doubleDamage: false });
    expect(AMARU.maxHP).toBe(100);
  });
  it('maps HP to phases: 100-67, 66-34, 33-0', () => {
    expect([100, 67, 66, 34, 33, 0].map(phaseFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });
  it('changes phase only through HP events and raises the 6 HP shield on entering phase 2', () => {
    const step = hitBoss(at(67), 'normal', 5000);
    expect(step).toMatchObject({ result: 'damage', amount: 1, phaseChanged: true });
    expect(step.boss).toMatchObject({ hp: 66, phase: 2, shield: AMARU.shieldMax });
    expect(AMARU.shieldMax).toBe(6);
    expect(hitBoss(at(68), 'normal', 0).phaseChanged).toBe(false);
  });
});

describe('Amaru damage and shield', () => {
  it('takes 1 per normal shot and 3 per returned bolt in phase 1', () => {
    expect(hitBoss(at(100), 'normal', 0)).toMatchObject({ result: 'damage', amount: 1, boss: { hp: 99 } });
    expect(hitBoss(at(100), 'returned', 0)).toMatchObject({ result: 'damage', amount: 3, boss: { hp: 97 } });
  });
  it('deflects normal shots while the shield is up; only returned bolts damage it', () => {
    const shielded = at(60, { shield: 6 });
    expect(shieldBlocks(shielded, 0)).toBe(true);
    expect(hitBoss(shielded, 'normal', 0)).toMatchObject({ result: 'deflect', amount: 0, boss: shielded });
    const cracked = hitBoss(shielded, 'returned', 0);
    expect(cracked).toMatchObject({ result: 'shieldHit', amount: 3, boss: { hp: 60, shield: 3 } });
    const broken = hitBoss(cracked.boss, 'returned', 1000);
    expect(broken).toMatchObject({ result: 'shieldBreak', boss: { hp: 60, shield: 0, vulnerableUntil: 1000 + AMARU.shieldWindowMs } });
    expect(AMARU.shieldWindowMs).toBe(6500);
  });
  it('lets normal shots through during the 6.5 s window and regenerates the shield to full only afterwards', () => {
    const broken = hitBoss(at(60, { shield: 3 }), 'returned', 1000).boss;
    expect(broken).toMatchObject({ shield: 0, vulnerableUntil: 7500 });
    expect(tickBoss(broken, 7499)).toBe(broken);
    expect(shieldBlocks(broken, 7499)).toBe(false);
    expect(tickBoss(broken, 7500)).toMatchObject({ shield: AMARU.shieldMax, vulnerableUntil: 0 });
    const open = at(60, { shield: 0, vulnerableUntil: 5000 });
    expect(isVulnerable(open, 4999)).toBe(true);
    expect(hitBoss(open, 'normal', 4000)).toMatchObject({ result: 'damage', amount: 1, boss: { hp: 59 } });
    expect(hitBoss(open, 'returned', 4000)).toMatchObject({ result: 'damage', amount: 3, boss: { hp: 57 } });
    expect(tickBoss(open, 4999)).toBe(open);
    expect(tickBoss(open, 5000)).toMatchObject({ shield: 6, vulnerableUntil: 0 });
    expect(tickBoss(at(80), 99999)).toEqual(at(80));
  });
  it('doubles normal damage inside a phase 3 vulnerability window', () => {
    const final = openWindow(at(30, { shield: 6 }), 1000, AMARU.finalWindowMs, true);
    expect(isVulnerable(final, 1000)).toBe(true);
    expect(hitBoss(final, 'normal', 1500)).toMatchObject({ result: 'damage', amount: 2, boss: { hp: 28 } });
    expect(hitBoss(at(30, { shield: 6 }), 'normal', 0).result).toBe('deflect');
    // A window that ends with the shield intact leaves it untouched.
    expect(tickBoss(final, 1000 + AMARU.finalWindowMs)).toMatchObject({ shield: 6, vulnerableUntil: 0, doubleDamage: false });
  });
  it('keeps single damage in a phase 3 shield-break window (double is only for the scripted final window)', () => {
    const broken = hitBoss(at(30, { shield: 3 }), 'returned', 0);
    expect(broken.result).toBe('shieldBreak');
    expect(broken.boss.doubleDamage).toBe(false);
    expect(hitBoss(broken.boss, 'normal', 100).amount).toBe(1);
  });
  it('never drops below 0 HP', () => {
    expect(hitBoss(at(2), 'returned', 0).boss.hp).toBe(0);
  });
});

describe('victory waits for REVERSE to resolve', () => {
  it('declares victory at 0 HP only when no SLOW or RELEASE is running', () => {
    const slow = captureBolt(activateReverse(initialReverse(100), 0), 1, true);
    expect(victoryReady(at(0), slow)).toBe(false);
    const release = tickReverse(slow, REVERSE.slowMs).reverse;
    expect(release.state).toBe('RELEASE');
    expect(victoryReady(at(0), release)).toBe(false);
    expect(victoryReady(at(0), initialReverse())).toBe(true);
    expect(victoryReady(at(1), initialReverse())).toBe(false);
  });
});

describe('attack patterns', () => {
  it('assigns readable loops per phase', () => {
    expect(PHASE_PATTERNS[1]).toEqual(['triplePulse']);
    expect(PHASE_PATTERNS[2]).toEqual(['loopDown', 'loopUp']);
    expect(PHASE_PATTERNS[3]).toEqual(['burst', 'wave', 'window']);
    expect([0, 1, 2, 3].map(c => attackFor(2, c).kind)).toEqual(['loopDown', 'loopUp', 'loopDown', 'loopUp']);
    expect([0, 1, 2, 3].map(c => attackFor(3, c).kind)).toEqual(['burst', 'wave', 'window', 'burst']);
  });
  it('phase 1 is a triple pulse of three aimed, non-capturable round orbs with a clear telegraph', () => {
    const pulse = ATTACKS.triplePulse;
    expect(pulse.emissions).toHaveLength(3);
    expect(pulse.emissions.every(e => e.shape === 'orb' && e.aimed)).toBe(true);
    expect(pulse.anticipation).toBeGreaterThanOrEqual(700);
    expect(pulse.recovery).toBeGreaterThan(0);
    expect(capturable('orb')).toBe(false);
  });
  it('phase 2 loops are mostly capturable rhombus bolts plus one sparse orb', () => {
    for (const kind of ['loopDown', 'loopUp'] as const) {
      const shapes = ATTACKS[kind].emissions.map(e => e.shape);
      const rhombi = shapes.filter(s => s === 'rhombus').length;
      expect(rhombi).toBeGreaterThanOrEqual(6);
      expect(shapes.filter(s => s === 'orb').length).toBe(1);
      expect(rhombi).toBeGreaterThan(shapes.length / 2);
    }
    expect(capturable('rhombus')).toBe(true);
  });
  it('phase 2 loops aim their rhombi at or near Kipu so a capture is always within reach', () => {
    const mouths = [{ x: 233, y: 70 }, { x: 233, y: 105 }, { x: 233, y: 139 }];
    const kipus = [{ x: 30, y: 30 }, { x: 80, y: 94 }, { x: 140, y: 150 }, { x: 200, y: 40 }, { x: 60, y: 160 }];
    for (const kind of ['loopDown', 'loopUp'] as const) {
      const rhombi = ATTACKS[kind].emissions.filter(e => e.shape === 'rhombus');
      expect(rhombi.every(e => e.aimed && Math.abs(e.angle) <= 0.35)).toBe(true);
      for (const mouth of mouths) for (const kipu of kipus) {
        // Closest approach of each rhombus ray to where Kipu was when it fired.
        const reach = rhombi.filter(e => {
          const v = emissionVelocity(e, mouth, kipu), speed = Math.hypot(v.vx, v.vy);
          const dx = kipu.x - mouth.x, dy = kipu.y - mouth.y, along = (dx * v.vx + dy * v.vy) / speed;
          return along > 0 && Math.abs(dx * v.vy - dy * v.vx) / speed <= REVERSE.captureRadius;
        }).length;
        expect(reach, `${kind} from ${mouth.y} to (${kipu.x}, ${kipu.y})`).toBeGreaterThanOrEqual(2);
      }
    }
    // The two loops sweep in opposite orders, keeping the loop motif readable.
    const sweep = (kind: 'loopDown' | 'loopUp') => ATTACKS[kind].emissions.filter(e => e.shape === 'rhombus').map(e => e.angle);
    expect(sweep('loopUp')).toEqual(sweep('loopDown').map(a => -a));
    // The one orb trails the rhombi instead of hiding among them.
    for (const kind of ['loopDown', 'loopUp'] as const) {
      const list = ATTACKS[kind].emissions, orbAt = list.find(e => e.shape === 'orb')!.at;
      expect(list.filter(e => e.shape === 'rhombus').every(e => e.at < orbAt)).toBe(true);
      expect(orbAt).toBeLessThan(ATTACKS[kind].action);
    }
  });
  it('phase 3 mixes rhombus and orbs in bursts, then a wave, then a window', () => {
    const shapes = new Set(ATTACKS.burst.emissions.map(e => e.shape));
    expect(shapes).toEqual(new Set(['orb', 'rhombus']));
    expect(ATTACKS.wave.emissions).toHaveLength(0);
    expect(ATTACKS.wave.anticipation).toBeGreaterThanOrEqual(1000);
    expect(ATTACKS.window.action).toBe(AMARU.finalWindowMs);
  });
  it('splits each attack into anticipation, action, recovery and done', () => {
    const a = ATTACKS.triplePulse;
    expect(attackStage(a, 0)).toBe('anticipation');
    expect(attackStage(a, a.anticipation)).toBe('action');
    expect(attackStage(a, a.anticipation + a.action)).toBe('recovery');
    expect(attackStage(a, a.anticipation + a.action + a.recovery)).toBe('done');
  });
  it('schedules emissions deterministically by action time', () => {
    const a = ATTACKS.triplePulse;
    expect(emissionsDue(a, -1)).toBe(0);
    expect(emissionsDue(a, 0)).toBe(1);
    expect(emissionsDue(a, a.emissions[2].at)).toBe(3);
    expect(emissionsDue(a, 99999)).toBe(3);
  });
  it('aims at the target or fires at a fixed angle', () => {
    const aimed = emissionVelocity({ at: 0, shape: 'orb', aimed: true, angle: 0, speed: 100 }, { x: 200, y: 100 }, { x: 100, y: 100 });
    expect(aimed.vx).toBeCloseTo(-100); expect(aimed.vy).toBeCloseTo(0);
    const fixed = emissionVelocity({ at: 0, shape: 'rhombus', aimed: false, angle: Math.PI / 2, speed: 50 }, { x: 0, y: 0 }, { x: 999, y: 0 });
    expect(fixed.vx).toBeCloseTo(0); expect(fixed.vy).toBeCloseTo(50);
  });
});

describe('the non-capturable wave', () => {
  it('sweeps from right to left over its action time', () => {
    expect(waveX(0)).toBe(AMARU.wave.startX);
    expect(waveX(1000)).toBeCloseTo(AMARU.wave.startX - AMARU.wave.speed);
    expect(waveX(1e6)).toBe(AMARU.wave.endX);
    expect(ATTACKS.wave.action).toBeGreaterThanOrEqual((AMARU.wave.startX - AMARU.wave.endX) / AMARU.wave.speed * 1000);
  });
  it('rotates its telegraphed gap and only spares bodies fully inside it', () => {
    expect(new Set([0, 1, 2].map(i => waveGapY(i * 3 + 1))).size).toBe(3);
    const gapY = 100, half = AMARU.wave.gap / 2;
    const body = (y: number) => ({ x: 98, y, width: 12, height: 18 });
    expect(waveHits(100, gapY, body(gapY - 9))).toBe(false);
    expect(waveHits(100, gapY, body(gapY - half - 2))).toBe(true);
    expect(waveHits(100, gapY, body(gapY + half - 10))).toBe(true);
    expect(waveHits(200, gapY, body(20))).toBe(false);
  });
});

describe('boss body path', () => {
  it('moves the head along a smooth vertical path on the right side', () => {
    const ys = Array.from({ length: 80 }, (_, i) => headPosition(i * 100).y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(40);
    for (let i = 0; i < 80; i++) expect(headPosition(i * 100).x).toBeGreaterThan(240);
    for (let i = 1; i < ys.length; i++) expect(Math.abs(ys[i] - ys[i - 1])).toBeLessThan(6);
  });
  it('trails segments behind the head with a time lag', () => {
    const now = 3000, body = bodyPositions(now, 4);
    expect(body).toHaveLength(4);
    expect(body[0].x).toBeGreaterThan(headPosition(now).x);
    for (let i = 1; i < body.length; i++) expect(body[i].x).toBeGreaterThan(body[i - 1].x);
    expect(body[0].y - headPosition(now - AMARU.body.lagMs).y).toBeCloseTo(AMARU.body.dropY);
  });
});

describe('shield ring', () => {
  it('loses pixels as the shield cracks and vanishes when broken', () => {
    const full = shieldRing(30, 6, 6), cracked = shieldRing(30, 3, 6);
    expect(full.length).toBeGreaterThan(100);
    expect(cracked.length).toBeLessThan(full.length);
    expect(shieldRing(30, 0, 6)).toEqual([]);
    for (const [x, y] of full) { expect(Number.isInteger(x)).toBe(true); expect(Number.isInteger(y)).toBe(true); }
  });
});

describe('phase checkpoints (first human playtest, 2026-10-13)', () => {
  it('offers a checkpoint only for a defeat in phase 2 or 3', () => {
    expect(checkpointAt(1, 0, 20000)).toBeNull();
    expect(checkpointAt(2, 3, 41000)).toEqual({ phase: 2, returnsTotal: 3, elapsedMs: 41000, comboBonus: 0 });
    expect(checkpointAt(3, 7, 90000)).toEqual({ phase: 3, returnsTotal: 7, elapsedMs: 90000, comboBonus: 0 });
  });
  it('keeps the racha bonus already scored in the fight, so a resume keeps the score', () => {
    expect(checkpointAt(2, 4, 50000, 600)).toEqual({ phase: 2, returnsTotal: 4, elapsedMs: 50000, comboBonus: 600 });
    expect(checkpointAt(2, 4, 50000, -5)!.comboBonus).toBe(0);
  });
  it('resumes at the phase start HP with full hearts, a full meter and the shield up, keeping the returns scored', () => {
    const two = resumeFrom({ phase: 2, returnsTotal: 3, elapsedMs: 41000, comboBonus: 0 });
    expect(two.boss).toEqual({ hp: AMARU.phase2From, phase: 2, shield: AMARU.shieldMax, vulnerableUntil: 0, doubleDamage: false });
    expect(two.boss.hp).toBe(66);
    expect(two.heroHp).toBe(4);
    expect(two.reverse).toMatchObject({ state: 'READY', meter: 100, captured: 0, pending: 0, activations: 0, returnsTotal: 3 });
    const three = resumeFrom({ phase: 3, returnsTotal: 7, elapsedMs: 90000, comboBonus: 0 });
    expect(three.boss).toMatchObject({ hp: 33, phase: 3, shield: AMARU.shieldMax });
    expect(phaseFor(three.boss.hp)).toBe(3);
    expect(phaseFor(two.boss.hp)).toBe(2);
  });
});
