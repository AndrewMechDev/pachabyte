import { expect, it } from 'vitest';
import { NOKIA, paletteColor, convertPixels } from '../src/game/nokiaPalette';
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
