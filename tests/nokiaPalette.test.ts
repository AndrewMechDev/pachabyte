import { expect, it } from 'vitest';
import { CORRUPTED, NOKIA, paletteColor, convertPixels, corruptPixels, tintPixels } from '../src/game/nokiaPalette';
it('maps luminance into all four greens and preserves alpha and source bytes', () => {
  expect([0,80,150,255].map(n => paletteColor(n,n,n))).toEqual([...NOKIA]);
  const pixels = new Uint8ClampedArray([255,255,255,128,0,0,0,0]); const converted = convertPixels(pixels);
  expect([...converted]).toEqual([155,188,15,128,15,56,15,0]);
  expect(pixels[0]).toBe(255);
});

it('keeps alpha unchanged across all 256 values and converts every RGB into the palette', () => {
  const pixels = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) pixels.set([i, 255-i, (i*7)%256, i], i*4);
  const converted = convertPixels(pixels);
  for (let i = 0; i < 256; i++) {
    expect(converted[i*4+3]).toBe(i);
    expect(NOKIA).toContain((converted[i*4]<<16)|(converted[i*4+1]<<8)|converted[i*4+2]);
  }
});

it('derives a purple corrupted variant with the same luminance mapping, keeping alpha', () => {
  expect([0,80,150,255].map(n => paletteColor(n,n,n,CORRUPTED))).toEqual([...CORRUPTED]);
  const pixels = new Uint8ClampedArray([255,255,255,200,10,10,10,0]);
  const out = convertPixels(pixels, CORRUPTED);
  expect((out[0]<<16)|(out[1]<<8)|out[2]).toBe(CORRUPTED[3]);
  expect([out[3], out[7]]).toEqual([200, 0]);
  expect(pixels[0]).toBe(255);
  for (const color of CORRUPTED) expect((color & 0xff)).toBeGreaterThan((color >> 8) & 0xff);
});

it('corrupts only cool (turquoise) pixels and keeps warm gold ornaments and alpha', () => {
  const pixels = new Uint8ClampedArray([0x35,0xb9,0xae,255, 0xe7,0xbd,0x67,255, 0x35,0xb9,0xae,0]);
  const out = corruptPixels(pixels);
  expect(CORRUPTED).toContain((out[0]<<16)|(out[1]<<8)|out[2]);
  expect([out[4],out[5],out[6],out[7]]).toEqual([0xe7,0xbd,0x67,255]);
  expect(out[11]).toBe(0);
  expect(pixels[0]).toBe(0x35);
});

it('tints toward a color by a clamped amount, keeping alpha', () => {
  const pixels = new Uint8ClampedArray([200,100,0,77]);
  expect([...tintPixels(pixels, 0x000000, 0.5)]).toEqual([100,50,0,77]);
  expect([...tintPixels(pixels, 0xffffff, 0)]).toEqual([200,100,0,77]);
  expect([...tintPixels(pixels, 0x102030, 2)]).toEqual([16,32,48,77]);
});
