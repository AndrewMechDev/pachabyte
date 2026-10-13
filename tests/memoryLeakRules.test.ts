import { describe, expect, it } from 'vitest';
import { MEMORY_LEAK, drainMeter, insideLeak, leakFragmentPosition, leakWindow, leakZones, zoneRect } from '../src/game/memoryLeakRules';
import { SEGMENTS } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

const segment = (name: string) => SEGMENTS.find(s => s.name === name)!;

describe('Memory Leak: zones that drain the REVERSE meter', () => {
  it('drains 25 energy per second of world time while Kipu is inside, never below 0', () => {
    expect(MEMORY_LEAK.drainPerSecond).toBe(25);
    expect(drainMeter(100, 1000)).toBe(75);
    expect(drainMeter(60, 400)).toBeCloseTo(50);
    expect(drainMeter(5, 1000)).toBe(0);
    expect(drainMeter(0, 1000)).toBe(0);
    expect(drainMeter(40, 0)).toBe(40);
  });
  it('has 2 or 3 zones that enter from the right and scroll left', () => {
    expect(MEMORY_LEAK.zones.length).toBeGreaterThanOrEqual(2);
    expect(MEMORY_LEAK.zones.length).toBeLessThanOrEqual(3);
    const z = MEMORY_LEAK.zones[0];
    expect(zoneRect(z.at - 1, z)).toBeNull();
    const enter = zoneRect(z.at, z)!;
    expect(enter.x).toBeGreaterThanOrEqual(GAME.width);
    expect(zoneRect(z.at + 1000, z)!.x).toBeCloseTo(enter.x - MEMORY_LEAK.screenSpeed);
  });
  it('detects Kipu inside a zone by overlap', () => {
    const z = MEMORY_LEAK.zones[0], t = z.at + 3000, r = zoneRect(t, z)!;
    expect(insideLeak(t, { x: r.x + 4, y: r.y + 4, width: 12, height: 18 })).toBe(true);
    expect(insideLeak(t, { x: r.x + r.width + 1, y: r.y + 4, width: 12, height: 18 })).toBe(false);
    expect(leakZones(t).length).toBeGreaterThan(0);
  });
  it('never covers the whole band: zones stay apart and each leaves room to pass', () => {
    for (const z of MEMORY_LEAK.zones) {
      expect(z.y).toBeGreaterThanOrEqual(GAME.playTop);
      expect(z.y + z.height).toBeLessThanOrEqual(GAME.playBottom);
      expect(GAME.playBottom - GAME.playTop - z.height).toBeGreaterThanOrEqual(60);
    }
    for (let t = leakWindow()[0]; t < leakWindow()[1]; t += 50) {
      const rects = leakZones(t).map(z => z.rect);
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        expect(rects[i].x + rects[i].width <= rects[j].x || rects[j].x + rects[j].width <= rects[i].x, `${t}`).toBe(true);
      }
    }
  });
  it('places fragments inside the zones as a temptation, moving with them', () => {
    expect(MEMORY_LEAK.fragments.length).toBeGreaterThanOrEqual(3);
    for (const f of MEMORY_LEAK.fragments) {
      const z = MEMORY_LEAK.zones[f.zone], t = z.at + 2000, r = zoneRect(t, z)!, p = leakFragmentPosition(t, f)!;
      expect(p.x).toBeGreaterThan(r.x + 3); expect(p.x).toBeLessThan(r.x + r.width - 3);
      expect(p.y).toBeGreaterThan(r.y + 3); expect(p.y).toBeLessThan(r.y + r.height - 3);
    }
  });
  it('happens inside its segment and is gone before the Marea front builds up', () => {
    const [start, end] = leakWindow();
    expect(start).toBeGreaterThanOrEqual(segment('memoryLeak').start);
    expect(end).toBeLessThanOrEqual(segment('marea').start + 500);
    expect(leakZones(end)).toHaveLength(0);
  });
});
