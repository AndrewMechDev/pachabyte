export type Facing = -1 | 1;

// Shared flight and shot tuning. The world has no gravity: Kipu floats and moves freely.
export const GAME = Object.freeze({
  width: 320, height: 180, hudHeight: 16,
  flightSpeed: 110, playTop: 18, playBottom: 176, playMargin: 6,
  bulletSpeed: 230, bulletCapacity: 12, shotCooldownMs: 180, bulletLifetimeMs: 1500,
});

export interface FlightInput { left: boolean; right: boolean; up: boolean; down: boolean }
export interface Flight { velocityX: number; velocityY: number; facing: Facing }

// 8-direction flight: opposite keys cancel per axis and diagonals are normalized to the same speed.
export function flight(input: FlightInput, facing: Facing): Flight {
  const dx = Number(input.right) - Number(input.left);
  const dy = Number(input.down) - Number(input.up);
  const nextFacing: Facing = dx === 0 ? facing : dx > 0 ? 1 : -1;
  if (dx === 0 && dy === 0) return { velocityX: 0, velocityY: 0, facing: nextFacing };
  const scale = GAME.flightSpeed / Math.hypot(dx, dy);
  return { velocityX: dx * scale, velocityY: dy * scale, facing: nextFacing };
}

export interface Bounds { left: number; right: number; top: number; bottom: number }

// Visible play area below the HUD bar; it follows the camera so Kipu is carried by the scroll.
export function playBounds(cameraX: number): Bounds {
  return { left: cameraX + GAME.playMargin, right: cameraX + GAME.width - GAME.playMargin, top: GAME.playTop, bottom: GAME.playBottom };
}

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function clampToBounds(x: number, y: number, bounds: Bounds): { x: number; y: number } {
  return { x: clamp(x, bounds.left, bounds.right), y: clamp(y, bounds.top, bounds.bottom) };
}

export function canShoot(now: number, nextShotAt: number, freeSlots: number): boolean {
  return now >= nextShotAt && freeSlots > 0;
}

// carry adds the camera scroll so the shot keeps its screen speed while the route scrolls.
export function shotVelocity(facing: Facing, carry = 0): number {
  return facing * GAME.bulletSpeed + carry;
}

export function projectileExpired(now: number, expiresAt: number, x: number, minX: number, maxX: number): boolean {
  return now >= expiresAt || x < minX || x > maxX;
}
