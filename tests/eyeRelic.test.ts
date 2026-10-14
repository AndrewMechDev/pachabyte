import { describe, expect, it } from 'vitest';
import { EYE, EYE_COLORS, EYE_FLASH, EYE_FRAMES, SHATTER, eyeFrameFor, eyeOrigin, eyeRows, eyeTextureKey, shatterPieces } from '../src/game/eyeRelic';
import { LOOP } from '../src/game/loopRules';

const count = (rows: readonly string[], chars: string): number => rows.join('').split('').filter(c => chars.includes(c)).length;
const frame = (hp: number, anim = 0, hitUntil = 0, reduced = false) => eyeFrameFor({ hp, anim, hitUntil, reduced });

describe('Bucle node as an eye relic (placeholder for LOOP_NODE_EYE)', () => {
  it('has the seven sheet frames: 4 idle, hit and 2 breaking', () => {
    expect(EYE.frames).toBe(7);
    expect(EYE_FRAMES).toEqual(['idle0', 'idle1', 'idle2', 'idle3', 'hit', 'crack', 'break']);
    expect(new Set(EYE_FRAMES.map(eyeTextureKey)).size).toBe(7);
    expect(eyeTextureKey('idle2')).toBe('loop-eye-idle2');
  });
  it('draws every frame on one cell with only declared colors', () => {
    for (const name of EYE_FRAMES) {
      const rows = eyeRows(name);
      expect(rows.length).toBe(EYE.cell[1]);
      for (const row of rows) { expect(row.length).toBe(EYE.cell[0]); for (const char of row) if (char !== '.') expect(EYE_COLORS[char]).toBeDefined(); }
    }
  });
  it('is a gold stepped frame around a turquoise iris, a glowing violet core and a vertical slit pupil', () => {
    const rows = eyeRows('idle0');
    expect(count(rows, 'gGl')).toBeGreaterThan(40);
    expect(count(rows, 'UTL')).toBeGreaterThan(30);
    expect(count(rows, 'vV')).toBeGreaterThan(6);
    const [cx, cy] = EYE.center;
    // Vertical slit through the centre: taller than wide.
    const slit = rows.map((row, y) => (row[cx] === 'k' ? y : -1)).filter(y => y >= 0);
    expect(slit.length).toBeGreaterThanOrEqual(7);
    expect(slit).toContain(cy);
    expect(rows[cy][cx - 3]).not.toBe('k');
    // Chakana steps: the frame sticks out at the four cardinal points by stepped tabs.
    for (const [x, y] of [[cx, cy - 10], [cx, cy + 10], [cx - 10, cy], [cx + 10, cy]]) expect('gGl').toContain(rows[y][x]);
    expect(rows[cy - 9][cx - 1]).not.toBe('.'); expect(rows[cy - 9][cx - 2]).toBe('.');
  });
  it('is symmetric left to right in its frame and iris so it reads as one relic', () => {
    const rows = eyeRows('idle0'), [cx, cy] = EYE.center;
    for (let y = cy - 9; y <= cy + 8; y++) {
      const solid = (x: number) => rows[y][x] !== '.';
      for (let dx = 1; dx <= 9; dx++) expect(solid(cx + dx)).toBe(solid(cx - dx));
    }
  });
  it('dilates the slit pupil across the four idle frames', () => {
    const widths = (['idle0', 'idle1', 'idle2', 'idle3'] as const).map(name => Math.max(...eyeRows(name).map(row => row.split('').filter(c => c === 'k').length)));
    expect(new Set(widths).size).toBeGreaterThanOrEqual(3);
    expect(widths[0]).toBe(1);
    expect(widths[2]).toBeGreaterThanOrEqual(3);
  });
  it('hangs 3 to 4 dark-purple cables with glowing tips from the lower half, swaying between frames', () => {
    const [, cy] = EYE.center;
    for (const name of ['idle0', 'idle1', 'idle2', 'idle3'] as const) {
      const rows = eyeRows(name);
      const upper = rows.slice(0, cy).join('');
      expect(upper.includes('c')).toBe(false);
      const lower = rows.slice(cy + 8);
      expect(count(lower, 'cC')).toBeGreaterThan(14);
      const tips = lower.flatMap((row, y) => row.split('').map((c, x) => (c === 'V' ? `${x},${y}` : ''))).filter(Boolean);
      expect(tips.length).toBeGreaterThanOrEqual(3);
      expect(tips.length).toBeLessThanOrEqual(8);
    }
    const lowerOf = (name: (typeof EYE_FRAMES)[number]) => eyeRows(name).slice(EYE.center[1] + 9).join('/');
    expect(new Set(['idle0', 'idle1', 'idle2', 'idle3'].map(name => lowerOf(name as never))).size).toBe(4);
  });
  it('flashes ivory in the hit frame and cracks as it weakens', () => {
    const hit = eyeRows('hit');
    expect(new Set(hit.join('').split('').filter(c => c !== '.'))).toEqual(new Set(['l']));
    expect(EYE_COLORS.l).toBe(EYE_FLASH);
    expect(hit.map(row => row.replace(/[^.]/g, 'x'))).toEqual(eyeRows('idle1').map(row => row.replace(/[^.]/g, 'x')));
    const cracks = (name: (typeof EYE_FRAMES)[number]) => count(eyeRows(name), 'x');
    expect(cracks('idle0')).toBe(0);
    expect(cracks('crack')).toBeGreaterThan(3);
    expect(cracks('break')).toBeGreaterThan(cracks('crack'));
  });
  it('is original: a cable-hung relic with no flame, no tower and no stalked eyes', () => {
    const rows = eyeRows('idle0');
    // One pixel of frame at the very top (a stepped tab, no flame), and no orange or red pixels at all.
    expect(count(rows.slice(0, 1), 'gGl')).toBe(1);
    for (const char of rows.join('')) if (char !== '.') { const c = EYE_COLORS[char]; expect((c >> 16) > 0xc0 && ((c >> 8) & 255) < 0x90).toBe(false); }
  });
  it('picks the frame from the HP, the hit window and the clock', () => {
    expect(new Set([0, 1, 2, 3].map(i => frame(5, i * EYE.idleMs))).size).toBe(4);
    expect(frame(5, 0)).toBe('idle0');
    expect(frame(5, EYE.idleMs * 4)).toBe('idle0');
    expect(frame(4, 0)).toBe('idle0');
    expect(frame(3, EYE.idleMs)).toBe('idle1');
    expect(frame(EYE.lowHp, 0)).toBe('crack');
    expect(frame(1, 0)).toBe('break');
    expect(frame(5, 0, 90)).toBe('hit');
    expect(frame(5, 90, 90)).toBe('idle0');
    expect(frame(1, 10, 90)).toBe('hit');
  });
  it('stays on the first idle frame (and keeps its cracks) under reduced motion', () => {
    for (const anim of [0, 300, 900, 5000]) expect(frame(5, anim, 0, true)).toBe('idle0');
    expect(frame(2, 700, 0, true)).toBe('crack');
    expect(frame(1, 700, 0, true)).toBe('break');
    expect(frame(5, 0, 90, true)).toBe('hit');
  });
  it('keeps the node HP and hitbox rules untouched', () => {
    expect(LOOP.hp).toBe(5);
    expect(LOOP.node).toMatchObject({ x: 262, y: 97, bob: 14, body: 12 });
    expect(EYE.lowHp).toBeLessThan(LOOP.hp);
  });
  it('aligns the eye centre with the node position through the sprite origin', () => {
    const o = eyeOrigin();
    expect(o.x).toBeCloseTo((EYE.center[0] + 0.5) / EYE.cell[0]);
    expect(o.y).toBeCloseTo((EYE.center[1] + 0.5) / EYE.cell[1]);
  });
});

describe('eye shatter burst', () => {
  it('releases shards and four loosened cables on fixed angles, then ends', () => {
    const pieces = shatterPieces(120, false);
    expect(pieces.filter(p => p.kind === 'shard').length).toBe(SHATTER.shards);
    expect(pieces.filter(p => p.kind === 'cable').length).toBe(SHATTER.cables);
    expect(SHATTER.shards).toBeGreaterThanOrEqual(8);
    expect(shatterPieces(120, false)).toEqual(pieces);
    expect(shatterPieces(-1, false)).toEqual([]);
    expect(shatterPieces(SHATTER.ms, false)).toEqual([]);
    for (const p of pieces) { expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true); expect(['light', 'gold', 'teal', 'plum']).toContain(p.slot); }
  });
  it('flies shards outward and lets the cables drift down', () => {
    const at = (age: number) => shatterPieces(age, false), spread = (age: number) => Math.max(...at(age).filter(p => p.kind === 'shard').map(p => Math.hypot(p.x, p.y)));
    expect(spread(300)).toBeGreaterThan(spread(60));
    const cableY = (age: number) => at(age).filter(p => p.kind === 'cable').map(p => p.y);
    cableY(400).forEach((y, i) => expect(y).toBeGreaterThan(cableY(60)[i]));
  });
  it('shows a short static frame under reduced motion', () => {
    const a = shatterPieces(10, true), b = shatterPieces(SHATTER.reducedMs - 10, true);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
    expect(shatterPieces(SHATTER.reducedMs, true)).toEqual([]);
    expect(SHATTER.reducedMs).toBeLessThan(SHATTER.ms);
  });
});
