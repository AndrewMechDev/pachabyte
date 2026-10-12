export type Facing = -1 | 1;

export const GAME = Object.freeze({
  width: 320, height: 180, worldWidth: 960, groundY: 164,
  moveSpeed: 100, jumpSpeed: 250, gravity: 750,
  bulletSpeed: 230, bulletCapacity: 12, shotCooldownMs: 180, bulletLifetimeMs: 1500,
});

export function movement(left: boolean, right: boolean, facing: Facing) {
  if (left === right) return { velocityX: 0, facing };
  const direction: Facing = right ? 1 : -1;
  return { velocityX: direction * GAME.moveSpeed, facing: direction };
}

export function shouldJump(pressed: boolean, grounded: boolean): boolean {
  return pressed && grounded;
}

export function canShoot(now: number, nextShotAt: number, freeSlots: number): boolean {
  return now >= nextShotAt && freeSlots > 0;
}

export function shotVelocity(facing: Facing): number {
  return facing * GAME.bulletSpeed;
}

export function projectileExpired(now: number, expiresAt: number, x: number): boolean {
  return now >= expiresAt || x < 0 || x > GAME.worldWidth;
}
