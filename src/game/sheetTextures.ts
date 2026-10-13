/// <reference types="vite/client" />
import Phaser from 'phaser';
import corruptorUrl from '../../assets/prepared/bug-corruptor-v1-24x24x4.png';
import sombraUrl from '../../assets/prepared/bug-sombra-v1-20x20x4.png';
import shadowUrl from '../../assets/prepared/bug-sombra-small-v1-12x12x2.png';
import pickupsUrl from '../../assets/prepared/pickups-v1-16x16x6.png';
import { FRAME_KEYS, SHEETS, type SheetName } from './spriteFrames';
import { convertPixels } from './nokiaPalette';

// Loads the prepared user sprite sheets and slices every frame into its own texture key, so scenes keep plain
// setTexture(key) calls. Hit flashes and four-green twins are derived pixel textures (Canvas ignores tint).
const URLS: Readonly<Record<SheetName, string>> = Object.freeze({ corruptor: corruptorUrl, sombra: sombraUrl, shadow: shadowUrl, pickups: pickupsUrl });
const sheetKey = (name: SheetName): string => `sheet-${name}`;
const FLASH = 0xfff1c3;
// Hit flashes are the idle frame's silhouette in one light color.
const FLASH_FRAMES = Object.freeze({ 'corruptor-hit': 'corruptor', 'sombra-hit': 'sombra', 'shadow-hit': 'shadow' });

export function loadSpriteSheets(scene: Phaser.Scene, names: readonly SheetName[] = Object.keys(SHEETS) as SheetName[]): void {
  for (const name of names) if (!scene.textures.exists(sheetKey(name))) scene.load.image(sheetKey(name), URLS[name]);
}

function slice(scene: Phaser.Scene, name: SheetName, index: number, key: string, transform?: (pixels: Uint8ClampedArray) => Uint8ClampedArray): void {
  if (scene.textures.exists(key) || !scene.textures.exists(sheetKey(name))) return;
  const [w, h] = SHEETS[name].frame;
  const image = scene.textures.get(sheetKey(name)).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const texture = scene.textures.createCanvas(key, w, h)!;
  texture.context.drawImage(image, index * w, 0, w, h, 0, 0, w, h);
  if (transform) {
    const data = texture.context.getImageData(0, 0, w, h);
    data.data.set(transform(data.data));
    texture.context.putImageData(data, 0, 0);
  }
  texture.refresh();
}

const silhouette = (pixels: Uint8ClampedArray): Uint8ClampedArray => {
  const out = pixels.slice();
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] > 0) out.set([FLASH >> 16, (FLASH >> 8) & 255, FLASH & 255], i);
  return out;
};

// Every frame texture of the given sheets, the bug hit flashes and, with `nokia`, the four-green twin of each frame.
export function createSheetTextures(scene: Phaser.Scene, names: readonly SheetName[], nokia = false): void {
  for (const [key, [name, index]] of Object.entries(FRAME_KEYS)) {
    if (!names.includes(name)) continue;
    slice(scene, name, index, key);
    if (nokia) slice(scene, name, index, `${key}-nokia`, pixels => convertPixels(pixels));
  }
  for (const [key, base] of Object.entries(FLASH_FRAMES)) {
    const [name, index] = FRAME_KEYS[base];
    if (names.includes(name)) slice(scene, name, index, key, silhouette);
  }
}
