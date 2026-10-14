/// <reference types="vite/client" />
import Phaser from 'phaser';
import { derive } from './amaruTextures';
import { convertPixels } from './nokiaPalette';
import { SHOT_KINDS, setImpactFrames, shotTextureKey } from './shotFx';
import { SHOT_SHEETS, frameRect, opaquePixels, type ShotSheetName } from './shotSheets';
import { EYE_FRAMES, eyeTextureKey } from './eyeRelic';
import { eyeFrameRect } from './eyeSheets';
import normalUrl from '../../assets/prepared/shots-v1-normal-16x12.png';
import rafagaUrl from '../../assets/prepared/shots-v1-rafaga-24x20.png';
import impactUrl from '../../assets/prepared/shots-v1-impact-16x16.png';
import eyeUrl from '../../assets/prepared/loop-node-eye-v1-40x56.png';

// Phaser side of the SHOTS art (B4, user art prepared in B1): the three prepared sheets are loaded as whole images and every
// bolt frame is sliced into its own texture key (shot-<kind>-<frame>, plus the exact four-green twin with -nokia), as
// sheetTextures.ts does for the bug sprites; the scenes only ever call setTexture(key). The impact burst is decoded once into
// opaque pixel lists (setImpactFrames) and painted by drawImpacts, so its REVERSE look is exact too.
const SHEET_URLS: Readonly<Record<ShotSheetName, string>> = Object.freeze({ normal: normalUrl, rafaga: rafagaUrl, impact: impactUrl });
const sheetKey = (name: ShotSheetName): string => `sheet-shots-${name}`;

// Call from preload(): queues the three sheets unless a previous run of the game already loaded them (scenes restart).
export function loadShotSheets(scene: Phaser.Scene): void {
  for (const name of Object.keys(SHEET_URLS) as ShotSheetName[]) if (!scene.textures.exists(sheetKey(name))) scene.load.image(sheetKey(name), SHEET_URLS[name]);
}

type Source = HTMLImageElement | HTMLCanvasElement;
const sourceOf = (scene: Phaser.Scene, name: ShotSheetName): Source => scene.textures.get(sheetKey(name)).getSourceImage() as Source;

function sliceFrame(scene: Phaser.Scene, name: ShotSheetName, frame: number, key: string): void {
  if (scene.textures.exists(key) || !scene.textures.exists(sheetKey(name))) return;
  const { x, y, w, h } = frameRect(name, frame);
  const texture = scene.textures.createCanvas(key, w, h)!;
  texture.context.drawImage(sourceOf(scene, name), x, y, w, h, 0, 0, w, h);
  texture.refresh();
}

// Decodes the impact sheet once per game into per-frame opaque pixels (alpha is binary in the prepared art).
let impactDecoded = false;
function registerImpact(scene: Phaser.Scene): void {
  if (impactDecoded || !scene.textures.exists(sheetKey('impact'))) return;
  const image = sourceOf(scene, 'impact'), canvas = document.createElement('canvas');
  canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height), { frames, anchor } = SHOT_SHEETS.impact;
  setImpactFrames(Array.from({ length: frames }, (_, frame) => opaquePixels(rgba, 'impact', frame)), anchor);
  impactDecoded = true;
}

// Kipu's bolts: every frame of both kinds, and with `nokia` the exact four-green twin of each (REVERSE shows the bolts;
// Canvas ignores tint, so the twin is a separate texture). Also registers the impact burst frames.
export function createShotTextures(scene: Phaser.Scene, nokia: boolean): void {
  for (const kind of SHOT_KINDS) {
    for (let frame = 0; frame < SHOT_SHEETS[kind].frames; frame++) {
      const key = shotTextureKey(kind, frame, false);
      sliceFrame(scene, kind, frame, key);
      if (nokia) derive(scene, key, shotTextureKey(kind, frame, true), pixels => convertPixels(pixels));
    }
  }
  registerImpact(scene);
}

// The Bucle's eye relic (B5): the prepared LOOP_NODE_EYE sheet (7 cells in one row) is loaded as a whole image and each
// frame is sliced into its `loop-eye-<frame>` key (4 idle, hit, crack, break). The eye only appears in the Route scene
// (the Guardian scene has no Bucle), so no four-green twin is needed. Same pattern as the shot sheets: queued in preload,
// sliced in create, both safe to repeat when a scene restarts.
const EYE_SHEET_KEY = 'sheet-loop-eye';

// Call from preload(): queues the eye sheet unless a previous run of the game already loaded it.
export function loadEyeSheet(scene: Phaser.Scene): void {
  if (!scene.textures.exists(EYE_SHEET_KEY)) scene.load.image(EYE_SHEET_KEY, eyeUrl);
}

export function createEyeTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(EYE_SHEET_KEY)) return;
  const source = scene.textures.get(EYE_SHEET_KEY).getSourceImage() as Source;
  EYE_FRAMES.forEach((frame, index) => {
    const key = eyeTextureKey(frame);
    if (scene.textures.exists(key)) return;
    const { x, y, w, h } = eyeFrameRect(index);
    const texture = scene.textures.createCanvas(key, w, h)!;
    texture.context.drawImage(source, x, y, w, h, 0, 0, w, h);
    texture.refresh();
  });
}
