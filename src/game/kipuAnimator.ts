import { KIPU_EDITS, KIPU_FRAMES, kipuFrame, kipuTextureKey, reshapeRows, type KipuFrame } from './animation';

// Occupied alpha band of kipu-v4-32x40: rows 9..31 (bottom exclusive 32). Verified from the prepared PNG.
export const KIPU_BAND = Object.freeze({ top: 9, bottom: 32 });

// Structural slice of a Phaser sprite so the animator stays testable without a browser.
export interface KipuSprite { texture: { key: string }; setTexture(key: string): unknown }

export interface KipuTick { now: number; velocityY: number; nokia: boolean; reduced?: boolean }

// Pure visual follower for free flight: reads physics state, never writes it. Swaps only the texture key
// (same 32x40 frame), so origin, body size and offset are untouched. No dust: Kipu never touches ground.
export class KipuAnimator {
  frame: KipuFrame = 'idle';

  constructor(private readonly sprite: KipuSprite) {}

  update(tick: KipuTick): void {
    this.show(tick.reduced ? 'idle' : kipuFrame({ velocityY: tick.velocityY, now: tick.now }), tick.nokia);
  }

  // Hold a specific frame (for example after defeat) regardless of motion.
  hold(frame: 'idle' | 'squash', nokia: boolean): void { this.show(frame, nokia); }

  private show(frame: KipuFrame, nokia: boolean): void {
    this.frame = frame;
    const key = kipuTextureKey(frame, nokia);
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }
}

// Build the derived textures once from the loaded base image; rows are edited, pixels never recolored or blended.
export function deriveKipuTextureData(base: Uint8ClampedArray, width: number, height: number): Record<string, Uint8ClampedArray> {
  const out: Record<string, Uint8ClampedArray> = {};
  for (const frame of KIPU_FRAMES) {
    if (frame === 'idle') continue;
    out[kipuTextureKey(frame, false)] = reshapeRows(base, width, height, KIPU_BAND.top, KIPU_BAND.bottom, KIPU_EDITS[frame]);
  }
  return out;
}
