import Phaser from 'phaser';
import { KIPU_BASE, kipuTextureKey } from './animation';
import { deriveKipuTextureData } from './kipuAnimator';

// Registers bob/squash/stretch once in the shared texture cache. Same 32x40 frame as the preserved
// base art, so origin, display size and the 12x18 body offset remain exactly as approved.
export function ensureKipuFrames(scene: Phaser.Scene): void {
  const textures = scene.textures;
  if (!textures.exists(KIPU_BASE) || textures.exists(kipuTextureKey('bob', false))) return;
  const image = textures.get(KIPU_BASE).getSourceImage() as HTMLImageElement;
  const { width, height } = image;
  const probe = document.createElement('canvas');
  probe.width = width; probe.height = height;
  const context = probe.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const base = context.getImageData(0, 0, width, height).data;
  for (const [key, data] of Object.entries(deriveKipuTextureData(base, width, height))) {
    const texture = textures.createCanvas(key, width, height)!;
    texture.context.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
    texture.refresh();
  }
}
