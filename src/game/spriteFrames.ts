import { corruptorCharge, corruptorShotsDue } from './bugRules';
import type { PickupKind } from './pickupRules';

// User-made sprites (2026-10-13), prepared from assets/incoming/ with `tools/prepare_sprite.py --auto` (commands in
// docs/design/ASSET_REQUESTS.md). Pure data and frame choice; the Phaser slicing lives in sheetTextures.ts.
// Visual size is independent of the physics bodies, which keep their tuned sizes in the scenes.
export const SHEETS = Object.freeze({
  corruptor: { file: 'bug-corruptor-v1-24x24x4.png', frame: [24, 24], frames: 4 },
  sombra: { file: 'bug-sombra-v1-20x20x4.png', frame: [20, 20], frames: 4 },
  shadow: { file: 'bug-sombra-small-v1-12x12x2.png', frame: [12, 12], frames: 2 },
  // 16x16 cells: the art's own grid (22 art pixels) loses the three Ráfaga chevrons at 12x12.
  pickups: { file: 'pickups-v1-16x16x6.png', frame: [16, 16], frames: 6 },
} as const);
export type SheetName = keyof typeof SHEETS;

// Texture key -> [sheet, frame]. Corruptor: idle, idle sway, vent charging, firing. Sombra: drift loop (0, 1, 3) and
// the echo jumping left (2) as the dodge warning. Shadow: two drift frames. Pickups: normal and shine per kind.
export const FRAME_KEYS: Readonly<Record<string, readonly [SheetName, number]>> = Object.freeze({
  corruptor: ['corruptor', 0], 'corruptor-b': ['corruptor', 1], 'corruptor-charge': ['corruptor', 2], 'corruptor-fire': ['corruptor', 3],
  sombra: ['sombra', 0], 'sombra-b': ['sombra', 1], 'sombra-blink': ['sombra', 2], 'sombra-c': ['sombra', 3],
  shadow: ['shadow', 0], 'shadow-b': ['shadow', 1],
  'pickup-rafaga': ['pickups', 0], 'pickup-rafaga-shine': ['pickups', 1],
  'pickup-escudo': ['pickups', 2], 'pickup-escudo-shine': ['pickups', 3],
  'pickup-corazon': ['pickups', 4], 'pickup-corazon-shine': ['pickups', 5],
});

const IDLE_MS = 260, DRIFT_MS = 140, FIRE_MS = 160;
const SOMBRA_DRIFT = Object.freeze(['sombra', 'sombra-b', 'sombra-c']);

// Charge and fire frames follow the world-clock attack timing, so they stay under reduced motion (telegraphs);
// only the idle sway stops.
export function corruptorFrame(age: number, anim: number, reduced: boolean): string {
  if (corruptorCharge(age) > 0) return 'corruptor-charge';
  if (corruptorShotsDue(age) > corruptorShotsDue(age - FIRE_MS)) return 'corruptor-fire';
  return !reduced && Math.floor(anim / IDLE_MS) % 2 === 1 ? 'corruptor-b' : 'corruptor';
}

export function sombraFrame(dodgeWarning: boolean, anim: number, reduced: boolean): string {
  if (dodgeWarning) return 'sombra-blink';
  return reduced ? 'sombra' : SOMBRA_DRIFT[Math.floor(anim / DRIFT_MS) % SOMBRA_DRIFT.length];
}

export const shadowFrame = (anim: number, reduced: boolean): string => (!reduced && Math.floor(anim / DRIFT_MS) % 2 === 1 ? 'shadow-b' : 'shadow');

// A 180 ms glint every 1.2 s; the frames share the same silhouette, so nothing moves or flashes.
export const PICKUP_SHINE = Object.freeze({ ms: 180, everyMs: 1200 });
export const pickupTexture = (kind: PickupKind): string => `pickup-${kind}`;
export function pickupFrame(kind: PickupKind, anim: number, reduced: boolean): string {
  const shine = !reduced && ((anim % PICKUP_SHINE.everyMs) + PICKUP_SHINE.everyMs) % PICKUP_SHINE.everyMs < PICKUP_SHINE.ms;
  return shine ? `${pickupTexture(kind)}-shine` : pickupTexture(kind);
}
