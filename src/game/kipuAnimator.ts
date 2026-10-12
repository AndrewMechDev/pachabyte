import { KIPU_EDITS, KIPU_FRAMES, ParticlePool, kipuFrame, kipuTextureKey, reshapeRows } from './animation';

// Occupied alpha band of kipu-v4-32x40: rows 9..31 (bottom exclusive 32). Verified from the prepared PNG.
export const KIPU_BAND = Object.freeze({ top: 9, bottom: 32 });

// Structural slice of a Phaser sprite so the animator stays testable without a browser.
export interface KipuSprite { texture: { key: string }; setTexture(key: string): unknown }

export interface KipuTick { now: number; grounded: boolean; velocityX: number; velocityY: number; facing: 1 | -1; footX: number; footY: number; nokia: boolean }

// Pure visual follower: reads physics state, never writes it. Swaps only the texture key (same 32x40 frame),
// so origin, body size and offset are untouched.
export class KipuAnimator {
  private wasGrounded = true;
  private lastVelocityY = 0;
  private landedAt = -Infinity;
  private nextDustAt = 0;
  frame = 'idle';
  // One-shot cue for the audio layer; reset at the start of every update.
  event: 'land' | 'takeoff' | null = null;

  constructor(private readonly sprite: KipuSprite, private readonly fx: ParticlePool) {}

  update(tick: KipuTick): void {
    const { now, grounded, velocityX, velocityY, facing, footX, footY, nokia } = tick;
    this.event = null;
    if (grounded && !this.wasGrounded && this.lastVelocityY > 60) {
      this.landedAt = now; this.event = 'land';
      this.dust(footX, footY, 6, 26, now);
    } else if (!grounded && this.wasGrounded && velocityY < 0) {
      this.event = 'takeoff';
      this.dust(footX, footY, 4, 18, now);
    }
    if (grounded && Math.abs(velocityX) > 10 && now >= this.nextDustAt) {
      this.fx.emit({ x: footX - facing * 6, y: footY - 1, vx: -facing * 12, vy: -10, ttl: 260, slot: 'light', size: 1 }, now);
      this.nextDustAt = now + 140;
    }
    this.wasGrounded = grounded;
    this.lastVelocityY = velocityY;
    const frame = kipuFrame({ grounded, velocityX, velocityY, now, landedAt: this.landedAt });
    const key = kipuTextureKey(frame, nokia);
    this.frame = frame;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }

  // Hold a specific frame (for example after defeat) regardless of motion.
  hold(frame: 'idle' | 'squash', nokia: boolean): void {
    this.frame = frame;
    const key = kipuTextureKey(frame, nokia);
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }

  private dust(x: number, y: number, count: number, speed: number, now: number): void {
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      this.fx.emit({ x: x + side * (2 + i), y: y - 1, vx: side * (speed * (0.4 + (i % 3) * 0.3)), vy: -8 - (i % 3) * 4, ttl: 300, slot: i % 3 === 0 ? 'gold' : 'light', size: 1 }, now);
    }
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
