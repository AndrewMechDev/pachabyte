import { describe, expect, it } from 'vitest';
import { AMBIENT, backdropCopies, bandAlpha, cloudOffset, emberAlpha, plumePuffs, summitsX, transitionBand } from '../src/game/ambientRules';
import { SEGMENTS } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

const start = (name: string) => SEGMENTS.find(s => s.name === name)!.start;

describe('route backdrop tiling', () => {
  it('mirrors every other copy of the arena art so its edges always meet', () => {
    expect(backdropCopies(700)).toEqual([{ x: 0, flip: false }, { x: 320, flip: true }, { x: 640, flip: false }]);
  });
  it('puts the Misti summit at its crater in plain and mirrored copies', () => {
    expect(summitsX(backdropCopies(700))).toEqual([AMBIENT.summit.x, 320 + (319 - AMBIENT.summit.x), 640 + AMBIENT.summit.x]);
  });
});

describe('living Misti (visual only)', () => {
  it('keeps a bounded plume of puffs that rise, drift with the wind and fade', () => {
    const puffs = plumePuffs(5000, false);
    expect(puffs).toHaveLength(AMBIENT.plume.puffs);
    for (const p of puffs) {
      expect(p.y).toBeLessThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(-AMBIENT.plume.rise);
      expect(p.alpha).toBeGreaterThanOrEqual(0);
      expect(p.alpha).toBeLessThanOrEqual(AMBIENT.plume.alpha);
      expect(Number.isInteger(p.x) && Number.isInteger(p.y) && Number.isInteger(p.size)).toBe(true);
    }
    // Older puffs are higher and larger.
    const sorted = [...puffs].sort((a, b) => a.y - b.y);
    expect(sorted[0].size).toBeGreaterThanOrEqual(sorted[sorted.length - 1].size);
  });
  it('is static under reduced motion', () => {
    expect(plumePuffs(0, true)).toEqual(plumePuffs(9000, true));
    expect(emberAlpha(AMBIENT.ember.offset + AMBIENT.ember.ms / 2, true)).toBe(0);
  });
  it('glows its ember faintly and slowly, never as a flash', () => {
    let max = 0, steepest = 0, prev = emberAlpha(0, false), lit = 0;
    for (let t = 16; t < AMBIENT.ember.everyMs * 3; t += 16) {
      const a = emberAlpha(t, false);
      max = Math.max(max, a); steepest = Math.max(steepest, Math.abs(a - prev)); prev = a;
      if (a > 0) lit++;
    }
    expect(max).toBeGreaterThan(0.15);
    expect(max).toBeLessThanOrEqual(AMBIENT.ember.alpha);
    // At most ~0.01 alpha per frame: a full rise takes several hundred milliseconds.
    expect(steepest).toBeLessThan(0.012);
    expect(lit * 16).toBeLessThan(AMBIENT.ember.everyMs * 3 * 0.25);
  });
});

describe('drifting clouds and transition mist (visual only)', () => {
  it('keeps every cloud layer out of the central play band', () => {
    for (const layer of AMBIENT.clouds) {
      expect(layer.y + layer.height <= AMBIENT.calm.top || layer.y >= AMBIENT.calm.bottom, `layer at ${layer.y}`).toBe(true);
    }
    expect(new Set(AMBIENT.clouds.map(l => l.factor)).size).toBe(AMBIENT.clouds.length);
  });
  it('drifts each layer at its own parallax speed, and only with the camera under reduced motion', () => {
    const [far, , near] = AMBIENT.clouds;
    expect(cloudOffset(near, 100, 0, false)).not.toBe(cloudOffset(far, 100, 0, false));
    expect(cloudOffset(far, 0, 4000, false)).not.toBe(cloudOffset(far, 0, 0, false));
    expect(cloudOffset(far, 0, 4000, true)).toBe(cloudOffset(far, 0, 0, true));
    expect(cloudOffset(far, 0, 0, false)).toBeGreaterThanOrEqual(0);
    expect(cloudOffset(far, 0, 0, false)).toBeLessThan(AMBIENT.cloudTile);
  });
  it('sweeps a denser mist band across the screen as the Firewall, the Marea and the threshold begin', () => {
    for (const name of AMBIENT.bands.segments) {
      const at = start(name);
      expect(transitionBand(at - 1, false)).toBeNull();
      const early = transitionBand(at + 100, false)!, late = transitionBand(at + AMBIENT.bands.ms - 100, false)!;
      expect(early.x).toBeGreaterThan(GAME.width);
      expect(late.x).toBeLessThan(0);
      expect(transitionBand(at + AMBIENT.bands.ms + 1, false)).toBeNull();
      expect(transitionBand(at + 500, true)).toBeNull();
    }
    expect(transitionBand(start('swarm') + 200, false)).toBeNull();
  });
  it('stays faint inside the central play band so bugs, bolts and pickups read', () => {
    for (let y = GAME.playTop; y < GAME.playBottom; y++) {
      const a = bandAlpha(y);
      expect(a).toBeLessThanOrEqual(AMBIENT.bands.edgeAlpha);
      if (y >= AMBIENT.calm.top && y < AMBIENT.calm.bottom) expect(a).toBeLessThanOrEqual(AMBIENT.bands.calmAlpha);
    }
  });
});
