import Phaser from 'phaser';
import { convertPixels, corruptPixels, tintPixels } from './nokiaPalette';
import { variantKey } from './liberationRules';
import { corePixels, orbPixels, returnPixels, rhombusPixels, segmentPixels, tailPixels, type Pixels } from './amaruArt';

// Registers the procedural Amaru placeholders (see amaruArt.ts) and every derived variant once per game.

export const BODY_TEXTURES = Object.freeze({ segment: 'amaru-segment', tail: 'amaru-tail', core: 'amaru-core' });
export const BOLT_TEXTURES = Object.freeze({ orb: 'bolt-orb', rhombus: 'bolt-rhombus', returned: 'bolt-return' });
export const HEAD = 'amaru-head';
export const ARENA = 'amaru-arena';
export const ARENA_DIM = 'amaru-arena-dim';
export const HEAD_FLASH = 'amaru-head-flash';

function register(scene: Phaser.Scene, key: string, pixels: Pixels): void {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, pixels.width, pixels.height)!;
  texture.context.putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
  texture.refresh();
}

// Derived texture from any loaded source (Canvas ignores sprite tint, so every variant is its own texture).
export function derive(scene: Phaser.Scene, source: string, key: string, transform: (pixels: Uint8ClampedArray) => Uint8ClampedArray): void {
  if (scene.textures.exists(key) || !scene.textures.exists(source)) return;
  const image = scene.textures.get(source).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const texture = scene.textures.createCanvas(key, image.width, image.height)!;
  const context = texture.context;
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, image.width, image.height);
  data.data.set(transform(data.data));
  context.putImageData(data, 0, 0);
  texture.refresh();
}

const toNokia = (pixels: Uint8ClampedArray): Uint8ClampedArray => convertPixels(pixels);
const silhouette = (color: number) => (pixels: Uint8ClampedArray): Uint8ClampedArray => {
  const out = pixels.slice();
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] > 0) out.set([color >> 16, (color >> 8) & 255, color & 255], i);
  return out;
};

// Every texture the fight shows, each with its exact four-green twin for REVERSE.
export function createAmaruTextures(scene: Phaser.Scene, flashColor: number, flashNokia: number): void {
  register(scene, BODY_TEXTURES.segment, segmentPixels());
  register(scene, BODY_TEXTURES.tail, tailPixels());
  register(scene, BODY_TEXTURES.core, corePixels());
  register(scene, BOLT_TEXTURES.orb, orbPixels());
  register(scene, BOLT_TEXTURES.rhombus, rhombusPixels());
  register(scene, BOLT_TEXTURES.returned, returnPixels());
  for (const base of [HEAD, ...Object.values(BODY_TEXTURES)]) {
    derive(scene, base, variantKey(base, true, false), corruptPixels);
    derive(scene, variantKey(base, true, false), variantKey(base, true, true), toNokia);
    derive(scene, base, variantKey(base, false, true), toNokia);
  }
  for (const base of Object.values(BOLT_TEXTURES)) derive(scene, base, variantKey(base, false, true), toNokia);
  // Dimmed purple arena while Amaru is corrupted; the color wave restores the original.
  derive(scene, ARENA, ARENA_DIM, pixels => tintPixels(pixels, 0x2a1438, 0.5));
  derive(scene, ARENA_DIM, variantKey(ARENA_DIM, false, true), toNokia);
  derive(scene, ARENA, variantKey(ARENA, false, true), toNokia);
  // Hit flash: the head silhouette in one light color.
  derive(scene, HEAD, HEAD_FLASH, silhouette(flashColor));
  derive(scene, HEAD, variantKey(HEAD_FLASH, false, true), silhouette(flashNokia));
}
