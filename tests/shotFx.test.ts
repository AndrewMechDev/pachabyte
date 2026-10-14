/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from 'vitest';
import {
  IMPACT, ImpactPool, SHOT_BODY, SHOT_FLICKER_MS, SHOT_KINDS, drawImpacts, impactFrame, setImpactFrames, shotFrame, shotKindFor, shotOrigin, shotTextureKey,
} from '../src/game/shotFx';
import { SHOT_SHEETS, frameBounds, frameRect, headAnchor, opaquePixels, type Rgba, type ShotSheetName } from '../src/game/shotSheets';
import { NOKIA, convertPixels } from '../src/game/nokiaPalette';
import normalPng from '../assets/prepared/shots-v1-normal-16x12.png?inline';
import rafagaPng from '../assets/prepared/shots-v1-rafaga-24x20.png?inline';
import impactPng from '../assets/prepared/shots-v1-impact-16x16.png?inline';
import { decodePng } from './pngDecode';

// The prepared SHOTS sheets (B1, assets/prepared) are decoded once; every art check below reads the real bytes.
const SOURCES: Readonly<Record<ShotSheetName, string>> = { normal: normalPng, rafaga: rafagaPng, impact: impactPng };
const NAMES = Object.keys(SOURCES) as ShotSheetName[];
const png = {} as Record<ShotSheetName, Rgba>;
beforeAll(async () => { for (const name of NAMES) png[name] = await decodePng(SOURCES[name]); });
const frames = (name: ShotSheetName) => Array.from({ length: SHOT_SHEETS[name].frames }, (_, i) => i);
const colorsOf = (name: ShotSheetName) => new Set(frames(name).flatMap(f => opaquePixels(png[name], name, f).map(p => p.color)));
const channels = (c: number) => ({ r: c >> 16, g: (c >> 8) & 255, b: c & 255 });

describe('frame slicing math (pure, synthetic pixels)', () => {
  it('cuts each cell at its own x offset on one row', () => {
    expect(frameRect('normal', 0)).toEqual({ x: 0, y: 0, w: 16, h: 12 });
    expect(frameRect('normal', 3)).toEqual({ x: 48, y: 0, w: 16, h: 12 });
    expect(frameRect('rafaga', 2)).toEqual({ x: 48, y: 0, w: 24, h: 20 });
    expect(frameRect('impact', 1)).toEqual({ x: 16, y: 0, w: 16, h: 16 });
  });
  it('lists only opaque pixels, relative to the cell, with their exact color and four-green twin', () => {
    // A 32x12 sheet in two 16x12 cells: one pixel in frame 0 at (3,4), one in frame 1 at (5,6); alpha 0 pixels are skipped.
    const data = new Uint8Array(32 * 12 * 4);
    const put = (x: number, y: number, rgba: number[]) => data.set(rgba, (y * 32 + x) * 4);
    put(3, 4, [252, 216, 37, 255]); put(16 + 5, 6, [0, 92, 102, 255]); put(1, 1, [255, 0, 0, 0]);
    const sheet: Rgba = { width: 32, height: 12, data };
    const sliced = (frame: number) => opaquePixels(sheet, 'normal', frame);
    expect(sliced(0)).toEqual([{ x: 3, y: 4, color: 0xfcd825, nokia: NOKIA[3] }]);
    expect(sliced(1)).toEqual([{ x: 5, y: 6, color: 0x005c66, nokia: NOKIA[1] }]);
    expect(frameBounds(sheet, 'normal', 0)).toEqual({ x0: 3, y0: 4, x1: 4, y1: 5 });
    expect(frameBounds(sheet, 'normal', 1)).toEqual({ x0: 5, y0: 6, x1: 6, y1: 7 });
  });
  it('finds the bolt head: its rightmost edge across frames, 3 px ahead of the axis column, on the head rows', () => {
    // 16x12 cell, two frames: the head ends at x=12 (frame 0) and x=11 (frame 1) on rows 5-7; a tail pixel sits at (1,2).
    const data = new Uint8Array(32 * 12 * 4);
    const put = (x: number, y: number) => data.set([250, 200, 40, 255], (y * 32 + x) * 4);
    for (let x = 8; x < 12; x++) for (let y = 5; y < 8; y++) put(x, y);
    for (let x = 16 + 8; x < 16 + 11; x++) for (let y = 5; y < 8; y++) put(x, y);
    put(1, 2);
    const [ax, ay] = headAnchor({ width: 32, height: 12, data }, 'normal', 3);
    expect(ax).toBe(12 - 3);
    expect(ay).toBe(6.5);
  });
});

describe('prepared SHOTS sheets', () => {
  it('match their declared cell grid with binary alpha and a transparent margin around every frame', () => {
    for (const name of NAMES) {
      const { cell, frames: count } = SHOT_SHEETS[name], img = png[name];
      expect([img.width, img.height], name).toEqual([cell[0] * count, cell[1]]);
      expect(count).toBe(4);
      for (let i = 3; i < img.data.length; i += 4) expect([0, 255]).toContain(img.data[i]);
      for (const f of frames(name)) {
        const b = frameBounds(img, name, f)!;
        expect(b, `${name} ${f} is not empty`).not.toBeNull();
        expect([b.x0 >= 1, b.y0 >= 1, b.x1 <= cell[0] - 1, b.y1 <= cell[1] - 1], `${name} ${f} keeps a clear margin`).toEqual([true, true, true, true]);
      }
    }
  });
  it('tells the Ráfaga from the normal bolt by color AND shape', () => {
    const size = (name: ShotSheetName) => {
      const bs = frames(name).map(f => frameBounds(png[name], name, f)!);
      return { w: Math.max(...bs.map(b => b.x1 - b.x0)), h: Math.max(...bs.map(b => b.y1 - b.y0)) };
    };
    const normal = size('normal'), rafaga = size('rafaga');
    expect(rafaga.w).toBeGreaterThanOrEqual(normal.w + 4);
    expect(rafaga.h).toBeGreaterThan(normal.h);
    const gold = (c: number) => { const { r, g, b } = channels(c); return r > 0xd0 && g > 0xa0 && b < 0x80; };
    const turquoise = (c: number) => { const { r, g, b } = channels(c); return r < 0x60 && g > 0xa0 && b > 0x90; };
    const normalColors = [...colorsOf('normal')], rafagaColors = [...colorsOf('rafaga')];
    expect(normalColors.some(gold)).toBe(true);
    expect(normalColors.some(turquoise)).toBe(false);
    expect(normalColors.every(c => channels(c).r > 0x60)).toBe(true);
    expect(rafagaColors.some(turquoise)).toBe(true);
    expect(rafagaColors.some(gold)).toBe(true);
  });
  it('never uses a rhombus silhouette, which is reserved for capturable boss bolts', () => {
    // A rhombus is symmetric top to bottom, starts and ends on a single pixel and widens strictly to its middle row.
    const isRhombus = (counts: number[]): boolean => {
      const mid = counts.indexOf(Math.max(...counts));
      return counts[0] === 1 && counts[counts.length - 1] === 1 && counts.every((count, i) => count === counts[counts.length - 1 - i])
        && counts.slice(0, mid + 1).every((count, i, all) => i === 0 || count > all[i - 1]);
    };
    for (const name of ['normal', 'rafaga'] as const) for (const f of frames(name)) {
      const perRow = new Map<number, number>();
      for (const p of opaquePixels(png[name], name, f)) perRow.set(p.y, (perRow.get(p.y) ?? 0) + 1);
      expect(isRhombus([...perRow.keys()].sort((a, b) => a - b).map(y => perRow.get(y)!)), `${name} ${f}`).toBe(false);
    }
  });
  it('keeps every opaque pixel an exact four-green after the REVERSE conversion, with alpha untouched', () => {
    for (const name of NAMES) {
      const twin = convertPixels(png[name].data as unknown as Uint8ClampedArray);
      for (let i = 0; i < twin.length; i += 4) {
        expect(twin[i + 3]).toBe(png[name].data[i + 3]);
        if (twin[i + 3] === 255) expect(NOKIA).toContain((twin[i] << 16) | (twin[i + 1] << 8) | twin[i + 2]);
      }
    }
  });
});

describe('animated bolts from the prepared sheets', () => {
  it('keeps the tuned 6x3 physics body: only the drawn bolt changed', () => {
    expect(SHOT_BODY).toEqual({ width: 6, height: 3 });
    expect(SHOT_KINDS).toEqual(['normal', 'rafaga']);
  });
  it('anchors the bolt head on the front edge of the physics body, the same for every frame so the bolt never jitters', () => {
    for (const kind of SHOT_KINDS) {
      const sheet = SHOT_SHEETS[kind], [ax, ay] = sheet.anchor;
      // The anchor is what the real alpha says: computed from the PNG, not hand-tuned.
      expect([ax, ay]).toEqual(headAnchor(png[kind], kind, SHOT_BODY.width / 2));
      const bs = frames(kind).map(f => frameBounds(png[kind], kind, f)!);
      expect(Math.max(...bs.map(b => b.x1))).toBe(ax + SHOT_BODY.width / 2);
      for (const b of bs) {
        expect(b.x1).toBeLessThanOrEqual(ax + SHOT_BODY.width / 2);
        expect(b.x1).toBeGreaterThanOrEqual(ax + SHOT_BODY.width / 2 - 1);
        expect(ay).toBeGreaterThan(b.y0);
        expect(ay).toBeLessThan(b.y1);
        // The tail trails behind the head: the art extends well to the left of the anchor.
        expect(b.x0).toBeLessThan(ax - 4);
      }
    }
  });
  it('derives a 0..1 sprite origin from the anchor that positions the image on the physics body', () => {
    for (const kind of SHOT_KINDS) {
      const sheet = SHOT_SHEETS[kind], origin = shotOrigin(kind);
      expect(origin.x).toBeGreaterThan(0.5);
      expect(origin.x).toBeLessThan(1);
      expect(origin.y).toBeGreaterThan(0);
      expect(origin.y).toBeLessThan(1);
      expect(origin.x * sheet.cell[0]).toBeCloseTo(sheet.anchor[0]);
      expect(origin.y * sheet.cell[1]).toBeCloseTo(sheet.anchor[1]);
    }
  });
  it('flickers the tail through its four frames every few milliseconds and stays on the first frame when motion is reduced', () => {
    for (const kind of SHOT_KINDS) {
      const count = SHOT_SHEETS[kind].frames;
      expect(count).toBe(4);
      expect(shotFrame(kind, 0, false)).toBe(0);
      expect(shotFrame(kind, SHOT_FLICKER_MS, false)).toBe(1);
      expect(shotFrame(kind, SHOT_FLICKER_MS * count, false)).toBe(0);
      expect(new Set(Array.from({ length: count * 3 }, (_, i) => shotFrame(kind, i * SHOT_FLICKER_MS, false))).size).toBe(count);
      for (const age of [-5, 0, 61, 500, 4000]) expect(shotFrame(kind, age, true)).toBe(0);
      expect(shotFrame(kind, -40, false)).toBe(0);
    }
  });
  it('names one texture per kind, frame and palette, so the two kinds never share a bolt texture', () => {
    expect(shotTextureKey('normal', 1, false)).toBe('shot-normal-1');
    expect(shotTextureKey('rafaga', 2, true)).toBe('shot-rafaga-2-nokia');
    const keys = new Set<string>();
    for (const kind of SHOT_KINDS) for (let f = 0; f < SHOT_SHEETS[kind].frames; f++) for (const nokia of [false, true]) {
      const key = shotTextureKey(kind, f, nokia);
      expect(key).toMatch(nokia ? /^shot-(normal|rafaga)-\d-nokia$/ : /^shot-(normal|rafaga)-\d$/);
      keys.add(key);
    }
    expect(keys.size).toBe(SHOT_SHEETS.normal.frames * 2 + SHOT_SHEETS.rafaga.frames * 2);
  });
  it('picks the kind from the Ráfaga state', () => {
    expect(shotKindFor(false)).toBe('normal');
    expect(shotKindFor(true)).toBe('rafaga');
  });
});

describe('impact burst from the prepared sheet', () => {
  const sprite = () => frames('impact').map(f => opaquePixels(png.impact, 'impact', f));
  it('has four frames over a short time and ends', () => {
    expect(IMPACT.frames).toBe(4);
    expect(SHOT_SHEETS.impact.frames).toBe(IMPACT.frames);
    expect(IMPACT.ms).toBeLessThanOrEqual(220);
    expect([0, IMPACT.ms / 4 - 1, IMPACT.ms / 4, IMPACT.ms / 2, IMPACT.ms * 0.75, IMPACT.ms - 1].map(age => impactFrame(age, false))).toEqual([0, 0, 1, 2, 3, 3]);
    expect(impactFrame(IMPACT.ms, false)).toBe(-1);
    expect(impactFrame(-1, false)).toBe(-1);
  });
  it('shows one static frame briefly under reduced motion', () => {
    for (const age of [0, 20, IMPACT.reducedMs - 1]) expect(impactFrame(age, true)).toBe(IMPACT.reducedFrame);
    expect(impactFrame(IMPACT.reducedMs, true)).toBe(-1);
    expect(IMPACT.reducedMs).toBeLessThanOrEqual(IMPACT.ms);
    expect(IMPACT.capacity).toBe(12);
  });
  it('decodes four non-empty frames of whole opaque pixels inside the 16x16 cell, centred on the hit point', () => {
    const [w, h] = SHOT_SHEETS.impact.cell;
    for (const [i, pixels] of sprite().entries()) {
      expect(pixels.length, `frame ${i}`).toBeGreaterThan(5);
      for (const p of pixels) {
        expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
        expect(p.x >= 0 && p.x < w && p.y >= 0 && p.y < h).toBe(true);
        expect(p.color).toBeGreaterThanOrEqual(0);
        expect(p.color).toBeLessThanOrEqual(0xffffff);
        expect(NOKIA).toContain(p.nokia);
      }
      const b = frameBounds(png.impact, 'impact', i)!, [cx, cy] = SHOT_SHEETS.impact.anchor;
      expect(Math.abs((b.x0 + b.x1) / 2 - cx)).toBeLessThanOrEqual(2);
      expect(Math.abs((b.y0 + b.y1) / 2 - cy)).toBeLessThanOrEqual(2);
    }
  });
  it('expands from a small flash to a wide star and then breaks into fragments', () => {
    const area = (f: number) => { const b = frameBounds(png.impact, 'impact', f)!; return (b.x1 - b.x0) * (b.y1 - b.y0); };
    expect(area(1)).toBeGreaterThan(area(0));
    expect(area(2)).toBeGreaterThan(area(1));
    const count = (f: number) => opaquePixels(png.impact, 'impact', f).length;
    expect(count(3)).toBeLessThan(count(2));
  });
  it('uses a bounded pool that recycles its oldest burst and expires them', () => {
    const pool = new ImpactPool(3);
    expect(pool.items.length).toBe(3);
    pool.spawn(1, 1, 'normal', 0); pool.spawn(2, 2, 'rafaga', 10); pool.spawn(3, 3, 'normal', 20);
    expect(pool.activeCount).toBe(3);
    pool.spawn(4, 4, 'normal', 30);
    expect(pool.items.length).toBe(3);
    expect(pool.items.map(i => i.x).sort()).toEqual([2, 3, 4]);
    expect(pool.spawned).toBe(4);
    pool.step(IMPACT.ms + 25, false);
    expect(pool.items.filter(i => i.active).map(i => i.x)).toEqual([4]);
    pool.step(IMPACT.ms + 40, false);
    expect(pool.activeCount).toBe(0);
    pool.spawn(9, 9, 'normal', 1000); pool.step(1000 + IMPACT.reducedMs, true);
    expect(pool.activeCount).toBe(0);
    pool.spawn(9, 9, 'normal', 2000); pool.clear();
    expect(pool.activeCount).toBe(0);
    expect(new ImpactPool().items.length).toBe(IMPACT.capacity);
  });
  it('draws hard-pixel squares in exact four-green colors during REVERSE and a static frame under reduced motion', () => {
    setImpactFrames(sprite(), SHOT_SHEETS.impact.anchor);
    const calls: Array<[number, number, number, number, number]> = [];
    let color = 0;
    const painter = { fillStyle(c: number) { color = c; }, fillRect(x: number, y: number, w: number, h: number) { calls.push([color, x, y, w, h]); } };
    const pool = new ImpactPool(4);
    pool.spawn(100.4, 50.6, 'normal', 0);
    drawImpacts(painter, pool, 0, true, false);
    expect(calls.length).toBe(sprite()[0].length);
    for (const [c, x, y, w, h] of calls) { expect(NOKIA).toContain(c); expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true); expect([w, h]).toEqual([1, 1]); }
    // The burst is centred on the (rounded) hit point: its bounding box straddles (100, 51).
    expect(Math.min(...calls.map(c => c[1]))).toBeLessThan(100);
    expect(Math.max(...calls.map(c => c[1]))).toBeGreaterThanOrEqual(100);
    expect(Math.min(...calls.map(c => c[2]))).toBeLessThan(51);
    expect(Math.max(...calls.map(c => c[2]))).toBeGreaterThanOrEqual(51);
    calls.length = 0;
    drawImpacts(painter, pool, 0, false, false);
    expect(new Set(calls.map(c => c[0]))).toEqual(new Set(sprite()[0].map(p => p.color)));
    calls.length = 0;
    drawImpacts(painter, pool, 20, false, true);
    const staticA = calls.map(c => c.join()).join('|');
    expect(staticA.length).toBeGreaterThan(0);
    expect(calls.length).toBe(sprite()[IMPACT.reducedFrame].length);
    calls.length = 0;
    drawImpacts(painter, pool, 90, false, true);
    expect(calls.map(c => c.join()).join('|')).toBe(staticA);
    calls.length = 0;
    drawImpacts(painter, pool, IMPACT.ms + 5, false, false);
    expect(calls.length).toBe(0);
  });
  it('plays the four frames in order, each with more or different pixels than a blank', () => {
    setImpactFrames(sprite(), SHOT_SHEETS.impact.anchor);
    const painted: number[] = [];
    const painter = { fillStyle() {}, fillRect() { painted[painted.length - 1] += 1; } };
    const pool = new ImpactPool(1);
    pool.spawn(50, 50, 'rafaga', 0);
    for (const age of [0, 46, 91, 136]) { painted.push(0); drawImpacts(painter, pool, age, false, false); }
    expect(painted).toEqual(sprite().map(frame => frame.length));
  });
});
