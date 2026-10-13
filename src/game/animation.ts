import { NOKIA } from './nokiaPalette';

// Pure animation decisions. Nothing here reads or writes gameplay state, and nothing scales a
// physics sprite: Arcade bodies follow sprite scale, so visual change must stay independent.

export const ANIM = Object.freeze({ landMs: 100, runStepMs: 110, breatheMs: 450, riseSpeed: 40, moveThreshold: 10 });

export type KipuFrame = 'idle' | 'bob' | 'squash' | 'stretch';
export interface PoseInput { grounded: boolean; velocityX: number; velocityY: number; now: number; landedAt: number }

export function kipuFrame(input: PoseInput): KipuFrame {
  if (!input.grounded) return input.velocityY < -ANIM.riseSpeed ? 'stretch' : 'idle';
  if (input.now >= input.landedAt && input.now - input.landedAt < ANIM.landMs) return 'squash';
  if (Math.abs(input.velocityX) > ANIM.moveThreshold) return Math.floor(input.now / ANIM.runStepMs) % 2 === 1 ? 'bob' : 'idle';
  return Math.floor(input.now / ANIM.breatheMs) % 2 === 1 ? 'bob' : 'idle';
}

export const KIPU_BASE = 'kipu-evaluation';
export const KIPU_FRAMES: readonly KipuFrame[] = ['idle', 'bob', 'squash', 'stretch'];
// Derived textures share the base key as prefix so identity and 32x40 dimensions stay traceable.
export function kipuTextureKey(frame: KipuFrame, nokia: boolean): string {
  return KIPU_BASE + (frame === 'idle' ? '' : `-${frame}`) + (nokia ? '-nokia' : '');
}

export interface RowEdit { remove?: readonly number[]; add?: readonly number[] }

// Rows below the eyes (19-20) and above the lowest occupied row (31) only, so identity and grounding survive.
export const KIPU_EDITS: Readonly<Record<Exclude<KipuFrame, 'idle'>, RowEdit>> = Object.freeze({
  bob: { remove: [26] },
  squash: { remove: [24, 27] },
  stretch: { add: [24, 27] },
});

// Nearest-neighbor row edit of the occupied band [top, bottom). The bottom row stays fixed, so the
// derived frame keeps the same occupied-alpha grounding as the source. Returns a new buffer.
export function reshapeRows(rgba: Uint8ClampedArray, width: number, height: number, top: number, bottom: number, edit: RowEdit): Uint8ClampedArray {
  if (top < 0 || top >= bottom || bottom > height || rgba.length !== width * height * 4) throw new RangeError('Occupied band lies outside the image.');
  const rows: number[] = [];
  for (let y = top; y < bottom; y++) {
    if (edit.remove?.includes(y)) continue;
    rows.push(y);
    if (edit.add?.includes(y)) rows.push(y);
  }
  const start = bottom - rows.length;
  if (start < 0) throw new RangeError('Derived frame would extend above the image.');
  const out = rgba.slice();
  const rowBytes = width * 4;
  out.fill(0, Math.min(start, top) * rowBytes, bottom * rowBytes);
  rows.forEach((source, index) => out.set(rgba.subarray(source * rowBytes, (source + 1) * rowBytes), (start + index) * rowBytes));
  return out;
}

export type AttackPhase = 'idle' | 'anticipation' | 'action' | 'recovery';

// Rotation only (degrees): the head's forgiving body is never visually contradicted or moved.
export function bossAngle(phase: AttackPhase, phaseElapsed: number, now: number): number {
  switch (phase) {
    case 'idle': return Math.sin(now / 600) * 2;
    case 'anticipation': {
      const ramp = Math.min(1, Math.max(0, phaseElapsed / 800));
      return -9 * ramp + Math.sin(phaseElapsed / 25) * 0.8 * ramp;
    }
    case 'action': return 7 * Math.max(0, 1 - phaseElapsed / 500);
    case 'recovery': return 3 * Math.max(0, 1 - phaseElapsed / 1500);
  }
}

export function chargeLevel(phase: AttackPhase, phaseElapsed: number): number {
  return phase === 'anticipation' ? Math.min(1, Math.max(0, phaseElapsed / 800)) : 0;
}

export type FxSlot = 'light' | 'gold' | 'teal' | 'violet';
const NORMAL: Readonly<Record<FxSlot, number>> = { light: 0xfff1c3, gold: 0xedc76c, teal: 0x59d3c4, violet: 0xc985ef };
const GREEN: Readonly<Record<FxSlot, number>> = { light: NOKIA[3], gold: NOKIA[3], teal: NOKIA[2], violet: NOKIA[2] };
export function fxColor(slot: FxSlot, nokia: boolean): number { return nokia ? GREEN[slot] : NORMAL[slot]; }

export interface Particle { x: number; y: number; vx: number; vy: number; born: number; ttl: number; slot: FxSlot; size: number; active: boolean }
export type ParticleSpec = Omit<Particle, 'born' | 'active'>;

// Fixed capacity, no allocation after construction; a full pool drops new particles by design.
export class ParticlePool {
  readonly items: Particle[];
  constructor(capacity: number, private readonly suppressed: () => boolean = () => false) {
    this.items = Array.from({ length: capacity }, () => ({ x: 0, y: 0, vx: 0, vy: 0, born: 0, ttl: 0, slot: 'light' as FxSlot, size: 1, active: false }));
  }
  get activeCount(): number { return this.items.reduce((count, p) => count + (p.active ? 1 : 0), 0); }
  emit(spec: ParticleSpec, now: number): boolean {
    if (this.suppressed()) return false;
    const slot = this.items.find(p => !p.active);
    if (!slot) return false;
    Object.assign(slot, spec, { born: now, active: true });
    return true;
  }
  step(now: number, dt: number, gravity: number): void {
    for (const p of this.items) {
      if (!p.active) continue;
      if (now - p.born >= p.ttl) { p.active = false; continue; }
      p.vy += gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  clear(): void { for (const p of this.items) p.active = false; }
}

// Evenly spaced directions keep every burst deterministic and testable.
export function burst(pool: ParticlePool, x: number, y: number, count: number, speed: number, ttl: number, slot: FxSlot, now: number, size = 1): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    if (!pool.emit({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ttl, slot, size }, now)) return;
  }
}

interface RectPainter { fillStyle(color: number): unknown; fillRect(x: number, y: number, width: number, height: number): unknown }
// Integer hard-pixel squares only: no alpha or antialiasing, so the four-green palette stays exact.
export function drawParticles(painter: RectPainter, pool: ParticlePool, nokia: boolean): void {
  for (const p of pool.items) {
    if (!p.active) continue;
    painter.fillStyle(fxColor(p.slot, nokia));
    painter.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
}
