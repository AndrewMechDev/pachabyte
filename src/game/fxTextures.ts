import Phaser from 'phaser';
import { paint } from './textures';
import { derive } from './amaruTextures';
import { convertPixels } from './nokiaPalette';
import { SHOT_ART, SHOT_KINDS, shotTextureKey } from './shotFx';
import { EYE_COLORS, EYE_FRAMES, eyeRows, eyeTextureKey } from './eyeRelic';

// Phaser side of the P2 juice art: registers each procedural placeholder frame once as its own texture. Swapping in the
// delivered spritesheets (SHOTS, LOOP_NODE_EYE) means slicing them into these same keys, as sheetTextures.ts does for the
// user's bug sprites; the scenes only ever call setTexture(key).

// Kipu's bolts: every frame of both kinds, and with `nokia` the exact four-green twin of each (REVERSE shows the bolts).
export function createShotTextures(scene: Phaser.Scene, nokia: boolean): void {
  for (const kind of SHOT_KINDS) {
    const art = SHOT_ART[kind];
    art.frames.forEach((rows, frame) => {
      const key = shotTextureKey(kind, frame, false);
      paint(scene, key, rows, art.colors);
      if (nokia) derive(scene, key, shotTextureKey(kind, frame, true), pixels => convertPixels(pixels));
    });
  }
}

// The Bucle's eye relic: the seven frames of the future LOOP_NODE_EYE sheet (4 idle, hit, crack, break).
export function createEyeTextures(scene: Phaser.Scene): void {
  for (const frame of EYE_FRAMES) paint(scene, eyeTextureKey(frame), eyeRows(frame), EYE_COLORS);
}
