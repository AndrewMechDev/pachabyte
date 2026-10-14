/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from 'vitest';
import { EYE, EYE_FRAMES, SHATTER, eyeFrameFor, eyeOrigin, eyeTextureKey, shatterPieces } from '../src/game/eyeRelic';
import { EYE_SHEET, eyeBounds, eyeDiscCenter, eyeFrameRect, eyePixels } from '../src/game/eyeSheets';
import { LOOP } from '../src/game/loopRules';
import { GAME } from '../src/game/rules';
import { NOKIA, convertPixels } from '../src/game/nokiaPalette';
import eyePng from '../assets/prepared/loop-node-eye-v1-40x56.png?inline';
import { decodePng } from './pngDecode';
import type { Rgba } from '../src/game/shotSheets';

// The prepared LOOP_NODE_EYE sheet (B1, assets/prepared) is decoded once; every art check below reads the real bytes.
let png: Rgba;
beforeAll(async () => { png = await decodePng(eyePng); });
const frame = (hp: number, anim = 0, hitUntil = 0, reduced = false) => eyeFrameFor({ hp, anim, hitUntil, reduced });
type Name = (typeof EYE_FRAMES)[number];
const index = (name: Name) => EYE_FRAMES.indexOf(name);
// Prepared palette (8 shared opaque colors), named by what they draw.
const COLOR = Object.freeze({ outline: 0x000000, gold: 0xf0c649, tentacle: 0x321766, teal: 0x18c9b3, ivory: 0xffffff, shade: 0x46484a, deepTeal: 0x124e5e, violet: 0x954dd6 });
const count = (name: Name, colors: number[], below = 0, above = 99) =>
  eyePixels(png, index(name)).filter(p => colors.includes(p.color) && p.y >= below && p.y < above).length;
// Row of the sheet where the disc ends and the tentacles hang alone (the disc spans rows 7-34 in the idle frames).
const TENTACLES_FROM = 36;
const IDLE = ['idle0', 'idle1', 'idle2', 'idle3'] as const;

describe('Bucle node as an eye relic (prepared LOOP_NODE_EYE sheet)', () => {
  it('has the seven sheet frames: 4 idle, hit and 2 breaking', () => {
    expect(EYE.frames).toBe(7);
    expect(EYE_SHEET.frames).toBe(7);
    expect(EYE_FRAMES).toEqual(['idle0', 'idle1', 'idle2', 'idle3', 'hit', 'crack', 'break']);
    expect(new Set(EYE_FRAMES.map(eyeTextureKey)).size).toBe(7);
    expect(eyeTextureKey('idle2')).toBe('loop-eye-idle2');
    expect(eyeTextureKey('hit')).toBe('loop-eye-hit');
    expect(eyeTextureKey('crack')).toBe('loop-eye-crack');
    expect(eyeTextureKey('break')).toBe('loop-eye-break');
  });
  it('cuts each cell at its own x offset on one row', () => {
    expect(EYE_SHEET.cell).toEqual([40, 56]);
    expect(eyeFrameRect(0)).toEqual({ x: 0, y: 0, w: 40, h: 56 });
    expect(eyeFrameRect(4)).toEqual({ x: 160, y: 0, w: 40, h: 56 });
    expect(eyeFrameRect(6)).toEqual({ x: 240, y: 0, w: 40, h: 56 });
  });
  it('lists only opaque pixels relative to the cell (synthetic sheet)', () => {
    const data = new Uint8Array(80 * 56 * 4);
    const put = (x: number, y: number, rgba: number[]) => data.set(rgba, (y * 80 + x) * 4);
    put(3, 4, [240, 198, 73, 255]); put(40 + 5, 6, [24, 201, 179, 255]); put(1, 1, [255, 0, 0, 0]);
    const sheet: Rgba = { width: 80, height: 56, data };
    expect(eyePixels(sheet, 0)).toEqual([{ x: 3, y: 4, color: 0xf0c649, nokia: expect.any(Number) }]);
    expect(eyePixels(sheet, 1).map(p => [p.x, p.y, p.color])).toEqual([[5, 6, 0x18c9b3]]);
    expect(eyeBounds(sheet, 0)).toEqual({ x0: 3, y0: 4, x1: 4, y1: 5 });
    expect(eyeBounds(sheet, 1)).toEqual({ x0: 5, y0: 6, x1: 6, y1: 7 });
    expect(eyeBounds({ width: 80, height: 56, data: new Uint8Array(80 * 56 * 4) }, 0)).toBeNull();
  });
  it('matches the declared grid with binary alpha and a transparent margin around every frame', () => {
    expect([png.width, png.height]).toEqual([EYE_SHEET.cell[0] * EYE_SHEET.frames, EYE_SHEET.cell[1]]);
    for (let i = 3; i < png.data.length; i += 4) expect([0, 255]).toContain(png.data[i]);
    for (let f = 0; f < EYE_SHEET.frames; f++) {
      const b = eyeBounds(png, f)!;
      expect(b, `frame ${f} is not empty`).not.toBeNull();
      expect([b.x0 >= 2, b.y0 >= 2, b.x1 <= EYE_SHEET.cell[0] - 2, b.y1 <= EYE_SHEET.cell[1] - 2], `frame ${f} keeps a clear margin`).toEqual([true, true, true, true]);
    }
  });
  it('uses only the eight prepared opaque colors and nothing orange or red', () => {
    const palette = new Set<number>(Object.values(COLOR));
    const used = new Set(EYE_FRAMES.flatMap((_, f) => eyePixels(png, f).map(p => p.color)));
    for (const c of used) expect(palette.has(c), c.toString(16)).toBe(true);
    expect(used.size).toBe(8);
    for (const c of used) expect((c >> 16) > 0xc0 && ((c >> 8) & 255) < 0x90, c.toString(16)).toBe(false);
  });
  it('is a gold frame around a turquoise iris with violet glints', () => {
    for (const name of IDLE) {
      expect(count(name, [COLOR.gold]), name).toBeGreaterThan(40);
      expect(count(name, [COLOR.teal, COLOR.deepTeal]), name).toBeGreaterThan(30);
      expect(count(name, [COLOR.violet]), name).toBeGreaterThan(6);
    }
  });
  it('is centred horizontally in its cell so it reads as one relic', () => {
    const [cw] = EYE_SHEET.cell;
    for (let f = 0; f < EYE_SHEET.frames; f++) { const b = eyeBounds(png, f)!; expect(Math.abs((b.x0 + b.x1) / 2 - cw / 2), `frame ${f}`).toBeLessThanOrEqual(0.5); }
  });
  it('sways the cables between the four idle frames and keeps their glowing violet tips', () => {
    const sig = (name: (typeof IDLE)[number]) => eyePixels(png, index(name)).filter(p => p.y >= TENTACLES_FROM).map(p => `${p.x},${p.y},${p.color}`).join('/');
    expect(new Set(IDLE.map(sig)).size).toBe(4);
    for (const name of IDLE) {
      expect(count(name, [COLOR.tentacle, COLOR.outline], TENTACLES_FROM), name).toBeGreaterThan(40);
      expect(count(name, [COLOR.violet, COLOR.ivory], TENTACLES_FROM), name).toBeGreaterThanOrEqual(3);
      // Nothing hangs above the disc: the top rows are frame, not cable.
      expect(count(name, [COLOR.tentacle], 0, 9), name).toBe(0);
    }
  });
  it('dilates the pupil across the idle frames: the four iris cores differ', () => {
    const sig = (name: (typeof IDLE)[number]) => eyePixels(png, index(name)).filter(p => p.y < TENTACLES_FROM && p.color === COLOR.violet).map(p => `${p.x},${p.y}`).join('/');
    expect(new Set(IDLE.map(sig)).size).toBeGreaterThanOrEqual(3);
  });
  it('flashes ivory in the hit frame and cracks as it weakens', () => {
    const ivory = (name: Name) => count(name, [COLOR.ivory]);
    const others = Object.values(COLOR).filter(c => c !== COLOR.ivory && c !== COLOR.outline);
    expect(ivory('hit')).toBeGreaterThanOrEqual(250);
    expect(ivory('hit')).toBeGreaterThanOrEqual(3 * Math.max(...IDLE.map(ivory)));
    expect(ivory('hit')).toBeGreaterThanOrEqual(2 * Math.max(...others.map(c => count('hit', [c]))));
    // The flash wraps the whole idle silhouette.
    const idle = eyeBounds(png, index('idle1'))!, hit = eyeBounds(png, index('hit'))!;
    expect([hit.x0 <= idle.x0, hit.y0 <= idle.y0, hit.x1 >= idle.x1, hit.y1 >= idle.y1]).toEqual([true, true, true, true]);
    // Violet cracks run through the disc: more of them in the cracked frame than in any idle frame, even more once it breaks.
    const cracks = (name: Name) => count(name, [COLOR.violet], 0, TENTACLES_FROM);
    expect(cracks('crack')).toBeGreaterThan(Math.max(...IDLE.map(cracks)));
    expect(cracks('break')).toBeGreaterThan(cracks('crack'));
  });
  it('breaks into loose fragments: the last frame sprawls above and beside the disc', () => {
    const idle = eyeBounds(png, 0)!, broken = eyeBounds(png, index('break'))!;
    expect(broken.y0).toBeLessThanOrEqual(idle.y0 - 3);
    expect(broken.x1 - broken.x0).toBeGreaterThanOrEqual(idle.x1 - idle.x0 + 4);
    expect(count('break', [COLOR.teal, COLOR.deepTeal], 0, idle.y0 + 6)).toBeGreaterThan(0);
  });
  it('keeps every opaque pixel an exact four-green after the REVERSE conversion, with alpha untouched', () => {
    const twin = convertPixels(png.data as unknown as Uint8ClampedArray);
    for (let i = 0; i < twin.length; i += 4) {
      expect(twin[i + 3]).toBe(png.data[i + 3]);
      if (twin[i + 3] === 255) expect(NOKIA).toContain((twin[i] << 16) | (twin[i + 1] << 8) | twin[i + 2]);
    }
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
  it('keeps node HP, position and bob unchanged while expanding only manual collision to 18x20', () => {
    expect(LOOP.hp).toBe(5);
    expect(LOOP.node).toMatchObject({ x: 262, y: 97, bob: 14, body: { width: 18, height: 20 } });
    expect(EYE.lowHp).toBeLessThan(LOOP.hp);
  });
  it('anchors the eye disc on the node position, the same for every frame so the relic never jitters', () => {
    const [ax, ay] = EYE_SHEET.anchor, [cw, ch] = EYE_SHEET.cell;
    expect(ax).toBeGreaterThan(0); expect(ax).toBeLessThan(cw);
    expect(ay).toBeGreaterThan(0); expect(ay).toBeLessThan(ch);
    // The anchor is what the real alpha says (the prepared JSON origin is the centre of the largest body, not the disc).
    for (let f = 0; f < EYE_SHEET.frames; f++) {
      const [mx, my] = eyeDiscCenter(png, f), tolerance = f === index('break') ? 2.5 : f === index('hit') ? 1.5 : 1;
      expect(Math.abs(mx - ax), `frame ${f} x`).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(my - ay), `frame ${f} y`).toBeLessThanOrEqual(tolerance);
    }
    const o = eyeOrigin();
    expect(o.x * cw).toBeCloseTo(ax);
    expect(o.y * ch).toBeCloseTo(ay);
    expect(EYE.anchor).toEqual(EYE_SHEET.anchor);
  });
  it('keeps the HP pips clear above the eye in every frame but the breaking one, whose loose shards may graze them', () => {
    const [, ay] = EYE_SHEET.anchor, pipsBottom = -EYE.pipsAbove + 2; // rows -18..-17 relative to the node
    for (const name of EYE_FRAMES.filter(n => n !== 'break')) expect(eyeBounds(png, index(name))!.y0 - ay, name).toBeGreaterThan(pipsBottom);
    expect(LOOP.node.y - LOOP.node.bob - EYE.pipsAbove).toBeGreaterThan(GAME.playTop); // the pips stay inside the play area at the top of the bob
  });
  it('hangs the cables below the node: the disc is above the anchor line, tentacles below', () => {
    const ay = EYE_SHEET.anchor[1];
    for (const name of IDLE) { const b = eyeBounds(png, index(name))!; expect(b.y0).toBeLessThan(ay - 10); expect(b.y1).toBeGreaterThan(ay + 20); }
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
  it('is scaled to the prepared eye: the loosened cables start where the tentacles hung, the shards are 1-3 px', () => {
    // Tentacles hang from row TENTACLES_FROM of the sheet, TENTACLES_FROM - anchor rows below the node, spread over the cell columns they use.
    const root = TENTACLES_FROM - EYE_SHEET.anchor[1], cables = shatterPieces(0, false).filter(p => p.kind === 'cable');
    expect(cables.length).toBe(SHATTER.cables);
    for (const c of cables) { expect(Math.abs(c.y - root)).toBeLessThanOrEqual(2); expect(Math.abs(c.x)).toBeLessThanOrEqual(9); }
    expect(new Set(cables.map(c => c.x)).size).toBe(SHATTER.cables);
    const sizes = shatterPieces(120, false).filter(p => p.kind === 'shard').map(p => p.w);
    expect(Math.min(...sizes)).toBe(1); expect(Math.max(...sizes)).toBe(3);
    expect(shatterPieces(120, false).filter(p => p.kind === 'shard').every(p => p.w === p.h)).toBe(true);
  });
  it('shows a short static frame under reduced motion', () => {
    const a = shatterPieces(10, true), b = shatterPieces(SHATTER.reducedMs - 10, true);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
    expect(shatterPieces(SHATTER.reducedMs, true)).toEqual([]);
    expect(SHATTER.reducedMs).toBeLessThan(SHATTER.ms);
  });
});
