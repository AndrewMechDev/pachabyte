import { describe, expect, it } from 'vitest';
import { GAME, canShoot, movement, projectileExpired, shotVelocity, shouldJump } from '../src/game/rules';

describe('movement and facing', () => {
  it('moves right at a constant pixel-per-second speed', () => {
    expect(movement(false, true, -1)).toEqual({ velocityX: GAME.moveSpeed, facing: 1 });
  });
  it('moves left and faces left', () => {
    expect(movement(true, false, 1)).toEqual({ velocityX: -GAME.moveSpeed, facing: -1 });
  });
  it('stops when released without changing facing', () => {
    expect(movement(false, false, -1)).toEqual({ velocityX: 0, facing: -1 });
  });
  it('cancels opposing directions and keeps previous facing', () => {
    expect(movement(true, true, 1)).toEqual({ velocityX: 0, facing: 1 });
  });
});

describe('jump gate', () => {
  it('allows a fresh press while grounded', () => expect(shouldJump(true, true)).toBe(true));
  it('rejects another jump in the air', () => expect(shouldJump(true, false)).toBe(false));
  it('does not jump without a fresh press', () => expect(shouldJump(false, true)).toBe(false));
});

describe('shooting and pool', () => {
  it('can fire immediately at initial time', () => expect(canShoot(0, 0, 12)).toBe(true));
  it('rejects a shot before cooldown ends', () => expect(canShoot(179, 180, 12)).toBe(false));
  it('allows a shot exactly at cooldown boundary', () => expect(canShoot(180, 180, 1)).toBe(true));
  it('rejects firing from an exhausted pool', () => expect(canShoot(200, 180, 0)).toBe(false));
  it('rejects invalid negative free capacity', () => expect(canShoot(200, 180, -1)).toBe(false));
  it('shoots right at configured speed', () => expect(shotVelocity(1)).toBe(GAME.bulletSpeed));
  it('shoots left at configured speed', () => expect(shotVelocity(-1)).toBe(-GAME.bulletSpeed));
});

describe('projectile cleanup', () => {
  it('keeps a live projectile inside the world', () => expect(projectileExpired(999, 1000, 100)).toBe(false));
  it('expires exactly at its deadline', () => expect(projectileExpired(1000, 1000, 100)).toBe(true));
  it('expires after its deadline', () => expect(projectileExpired(1001, 1000, 100)).toBe(true));
  it('cleans up beyond the left edge', () => expect(projectileExpired(0, 1000, -1)).toBe(true));
  it('cleans up beyond the right edge', () => expect(projectileExpired(0, 1000, GAME.worldWidth + 1)).toBe(true));
  it('keeps projectiles at the exact world edges until they leave', () => {
    expect(projectileExpired(0, 1000, 0)).toBe(false);
    expect(projectileExpired(0, 1000, GAME.worldWidth)).toBe(false);
  });
});
