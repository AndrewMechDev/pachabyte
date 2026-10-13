/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from 'vitest';
import { BUGS, corruptorCharge } from '../src/game/bugRules';
import { FRAME_KEYS, PICKUP_SHINE, SHEETS, corruptorFrame, pickupFrame, shadowFrame, sombraFrame, type SheetName } from '../src/game/spriteFrames';
import corruptorPng from '../assets/prepared/bug-corruptor-v1-24x24x4.png?inline';
import sombraPng from '../assets/prepared/bug-sombra-v1-20x20x4.png?inline';
import shadowPng from '../assets/prepared/bug-sombra-small-v1-12x12x2.png?inline';
import pickupsPng from '../assets/prepared/pickups-v1-16x16x6.png?inline';

// Minimal decoder for the prepared PNGs (8-bit RGBA, non-interlaced, as written by tools/prepare_sprite.py), using
// only web APIs (base64 data URLs from Vite and DecompressionStream), so no Node typings are needed.
interface Png { width: number; height: number; data: Uint8Array }
const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
async function decodePng(dataUrl: string): Promise<Png> {
  const buf = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), c => c.charCodeAt(0));
  let pos = 8, width = 0, height = 0;
  const idat: Uint8Array[] = [];
  while (pos < buf.length) {
    const len = u32(buf, pos), type = String.fromCharCode(...buf.subarray(pos + 4, pos + 8)), body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = u32(body, 0); height = u32(body, 4);
      expect([body[8], body[9], body[12]], 'bit depth, color type RGBA, no interlace').toEqual([8, 6, 0]);
    } else if (type === 'IDAT') idat.push(body);
    pos += 12 + len;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const stride = width * 4, data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? data[y * stride + x - 4] : 0, b = y > 0 ? data[(y - 1) * stride + x] : 0, c = x >= 4 && y > 0 ? data[(y - 1) * stride + x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      data[y * stride + x] = (line[x] + pred) & 255;
    }
  }
  return { width, height, data };
}
const SOURCES: Readonly<Record<SheetName, string>> = { corruptor: corruptorPng, sombra: sombraPng, shadow: shadowPng, pickups: pickupsPng };
const decoded = {} as Record<SheetName, Png>;
beforeAll(async () => { for (const name of Object.keys(SOURCES) as SheetName[]) decoded[name] = await decodePng(SOURCES[name]); });
const sheet = (name: SheetName) => decoded[name];
const px = (png: Png, x: number, y: number) => Array.from(png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4));
function frameMask(png: Png, name: SheetName, index: number): boolean[][] {
  const [w, h] = SHEETS[name].frame;
  return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => px(png, index * w + x, y)[3] > 0));
}
const bounds = (mask: boolean[][]) => {
  const cells = mask.flatMap((row, y) => row.map((on, x) => (on ? [x, y] : null)).filter(Boolean) as number[][]);
  return { x0: Math.min(...cells.map(c => c[0])), y0: Math.min(...cells.map(c => c[1])), x1: Math.max(...cells.map(c => c[0])) + 1, y1: Math.max(...cells.map(c => c[1])) + 1 };
};

describe('prepared sprite sheets (user art, assets/incoming → assets/prepared)', () => {
  it('match their declared frame grid with binary alpha', () => {
    for (const name of Object.keys(SHEETS) as SheetName[]) {
      const png = sheet(name), spec = SHEETS[name];
      expect([png.width, png.height], name).toEqual([spec.frame[0] * spec.frames, spec.frame[1]]);
      for (let i = 3; i < png.data.length; i += 4) expect([0, 255]).toContain(png.data[i]);
    }
  });
  it('have a complete, non-empty silhouette in every frame', () => {
    for (const name of Object.keys(SHEETS) as SheetName[]) {
      const png = sheet(name);
      for (let i = 0; i < SHEETS[name].frames; i++) {
        const b = bounds(frameMask(png, name, i));
        expect(b.x1 - b.x0, `${name} ${i} width`).toBeGreaterThan(SHEETS[name].frame[0] / 2);
      }
    }
  });
  it('keep each pickup still between its two frames: only the shine changes', () => {
    const png = sheet('pickups');
    for (const base of [0, 2, 4]) {
      const a = frameMask(png, 'pickups', base), b = frameMask(png, 'pickups', base + 1);
      const same = a.flat().filter((on, i) => on === b.flat()[i]).length;
      expect(same / a.flat().length, `pickup ${base}`).toBeGreaterThan(0.95);
    }
  });
  it('keeps the Escudo hollow and the Ráfaga wider than tall (three chevrons pointing right)', () => {
    const png = sheet('pickups'), shield = frameMask(png, 'pickups', 2), b = bounds(shield);
    expect(shield[Math.floor((b.y0 + b.y1) / 2)][Math.floor((b.x0 + b.x1) / 2)]).toBe(false);
    const r = bounds(frameMask(png, 'pickups', 0));
    expect(r.x1 - r.x0).toBeGreaterThan(r.y1 - r.y0);
  });
  it('brightens the Corruptor vent (left side) in the charge frame', () => {
    const png = sheet('corruptor'), glow = (i: number) => {
      let n = 0;
      for (let y = 0; y < 24; y++) for (let x = 0; x < 9; x++) { const [r, , b, a] = px(png, i * 24 + x, y); if (a && r > 180 && b > 200) n++; }
      return n;
    };
    expect(glow(2)).toBeGreaterThan(glow(0));
  });
  it('moves the Sombra echo outline to the left in the dodge warning frame', () => {
    const png = sheet('sombra'), echoX = (i: number) => {
      const xs: number[] = [];
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) { const [, , b, a] = px(png, i * 20 + x, y); if (a && b > 200) xs.push(x); }
      return xs.reduce((s, x) => s + x, 0) / xs.length;
    };
    expect(echoX(2)).toBeLessThan(echoX(0) - 2);
    expect(echoX(2)).toBeLessThan(echoX(1) - 2);
  });
  it('maps every texture key to an existing frame', () => {
    for (const [key, [name, index]] of Object.entries(FRAME_KEYS)) expect(index, key).toBeLessThan(SHEETS[name].frames);
  });
});

describe('frame selection (visual only)', () => {
  it('Corruptor: idle sway, the charge frame during the telegraph, the fire frame right after each orb', () => {
    const shot = BUGS.corruptor.firstShotMs;
    expect(corruptorFrame(shot - 100, 0, false)).toBe('corruptor-charge');
    expect(corruptorCharge(shot - 100)).toBeGreaterThan(0);
    expect(corruptorFrame(shot + 50, 0, false)).toBe('corruptor-fire');
    expect(corruptorFrame(shot + 400, 0, false)).toBe('corruptor');
    expect(corruptorFrame(shot + 400, 300, false)).toBe('corruptor-b');
    // Reduced motion keeps the telegraph frames but stops the idle sway.
    expect(corruptorFrame(shot + 400, 300, true)).toBe('corruptor');
    expect(corruptorFrame(shot - 100, 300, true)).toBe('corruptor-charge');
  });
  it('Sombra: a three-frame drift loop and the echo-jump frame as the dodge warning', () => {
    const seen = new Set([0, 140, 280, 420].map(t => sombraFrame(false, t, false)));
    expect(seen).toEqual(new Set(['sombra', 'sombra-b', 'sombra-c']));
    expect(sombraFrame(true, 0, false)).toBe('sombra-blink');
    expect(sombraFrame(true, 0, true)).toBe('sombra-blink');
    expect(sombraFrame(false, 140, true)).toBe('sombra');
    expect(new Set([0, 140].map(t => shadowFrame(t, false)))).toEqual(new Set(['shadow', 'shadow-b']));
    expect(shadowFrame(140, true)).toBe('shadow');
  });
  it('Pickups: a short shine now and then, never under reduced motion', () => {
    expect(pickupFrame('rafaga', 0, false)).toBe('pickup-rafaga-shine');
    expect(pickupFrame('rafaga', PICKUP_SHINE.ms + 1, false)).toBe('pickup-rafaga');
    expect(pickupFrame('escudo', PICKUP_SHINE.everyMs, false)).toBe('pickup-escudo-shine');
    expect(pickupFrame('corazon', 0, true)).toBe('pickup-corazon');
    // At most a fifth of the time shining: a glint, not a flashing light.
    let shining = 0;
    for (let t = 0; t < 10000; t += 10) if (pickupFrame('corazon', t, false).endsWith('-shine')) shining++;
    expect(shining / 1000).toBeLessThanOrEqual(0.2);
  });
});
