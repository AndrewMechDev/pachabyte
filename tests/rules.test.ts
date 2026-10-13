import { describe, expect, it } from 'vitest';
import { GAME, MAX_FRAME_MS, canShoot, clamp, clampToBounds, flight, frameDelta, oncePerEvent, playBounds, projectileExpired, shotVelocity } from '../src/game/rules';

const none = { left: false, right: false, up: false, down: false };

describe('free flight', () => {
  it('moves in each cardinal direction at the configured speed without gravity', () => {
    expect(flight({ ...none, right: true }, -1)).toEqual({ velocityX: GAME.flightSpeed, velocityY: 0, facing: 1 });
    expect(flight({ ...none, left: true }, 1)).toEqual({ velocityX: -GAME.flightSpeed, velocityY: 0, facing: -1 });
    expect(flight({ ...none, up: true }, 1)).toEqual({ velocityX: 0, velocityY: -GAME.flightSpeed, facing: 1 });
    expect(flight({ ...none, down: true }, -1)).toEqual({ velocityX: 0, velocityY: GAME.flightSpeed, facing: -1 });
  });
  it('normalizes diagonals so speed never exceeds the cardinal speed', () => {
    const move = flight({ ...none, right: true, up: true }, 1);
    expect(Math.hypot(move.velocityX, move.velocityY)).toBeCloseTo(GAME.flightSpeed, 6);
    expect(move.velocityX).toBeCloseTo(GAME.flightSpeed / Math.SQRT2, 6);
    expect(move.velocityY).toBeCloseTo(-GAME.flightSpeed / Math.SQRT2, 6);
  });
  it('cancels opposite keys per axis and keeps the previous facing', () => {
    expect(flight({ left: true, right: true, up: true, down: true }, -1)).toEqual({ velocityX: 0, velocityY: 0, facing: -1 });
    expect(flight({ left: true, right: true, up: true, down: false }, 1)).toEqual({ velocityX: 0, velocityY: -GAME.flightSpeed, facing: 1 });
  });
  it('stops instantly on release and keeps facing for the sprite flip', () => {
    expect(flight(none, -1)).toEqual({ velocityX: 0, velocityY: 0, facing: -1 });
  });
  it('uses the approved 110 px/s and the 18..176 play band', () => {
    expect(GAME.flightSpeed).toBe(110);
    expect([GAME.playTop, GAME.playBottom]).toEqual([18, 176]);
  });
});

describe('play area clamping', () => {
  it('follows the camera horizontally and stays below the HUD bar', () => {
    const b = playBounds(100);
    expect(b.left).toBe(100 + GAME.playMargin);
    expect(b.right).toBe(100 + GAME.width - GAME.playMargin);
    expect(b.top).toBe(GAME.playTop);
    expect(b.top).toBeGreaterThan(GAME.hudHeight);
    expect(b.bottom).toBe(GAME.playBottom);
  });
  it('clamps points into bounds and leaves inside points untouched', () => {
    const b = playBounds(0);
    expect(clampToBounds(-5, 0, b)).toEqual({ x: b.left, y: b.top });
    expect(clampToBounds(999, 999, b)).toEqual({ x: b.right, y: b.bottom });
    expect(clampToBounds(50, 90, b)).toEqual({ x: 50, y: 90 });
    expect(clamp(5, 0, 3)).toBe(3); expect(clamp(-1, 0, 3)).toBe(0);
  });
});

describe('shooting and pool', () => {
  it('can fire immediately at initial time', () => expect(canShoot(0, 0, 12)).toBe(true));
  it('rejects a shot before cooldown ends', () => expect(canShoot(179, 180, 12)).toBe(false));
  it('allows a shot exactly at cooldown boundary', () => expect(canShoot(180, 180, 1)).toBe(true));
  it('rejects firing from an exhausted pool', () => expect(canShoot(200, 180, 0)).toBe(false));
  it('rejects invalid negative free capacity', () => expect(canShoot(200, 180, -1)).toBe(false));
  it('shoots right at configured speed, plus any scroll carry', () => {
    expect(shotVelocity(1)).toBe(GAME.bulletSpeed);
    expect(shotVelocity(1, 32)).toBe(GAME.bulletSpeed + 32);
  });
  it('shoots left at configured speed', () => expect(shotVelocity(-1)).toBe(-GAME.bulletSpeed));
});

describe('projectile cleanup', () => {
  it('keeps a live projectile inside the visible range', () => expect(projectileExpired(999, 1000, 100, 0, 320)).toBe(false));
  it('expires exactly at its deadline', () => expect(projectileExpired(1000, 1000, 100, 0, 320)).toBe(true));
  it('cleans up beyond either edge of the range', () => {
    expect(projectileExpired(0, 1000, -1, 0, 320)).toBe(true);
    expect(projectileExpired(0, 1000, 321, 0, 320)).toBe(true);
  });
  it('keeps projectiles at the exact edges until they leave', () => {
    expect(projectileExpired(0, 1000, 0, 0, 320)).toBe(false);
    expect(projectileExpired(0, 1000, 320, 0, 320)).toBe(false);
  });
});

describe('frame-time cap', () => {
  it('passes normal frames through and caps a long stall at 100 ms so owned clocks never jump', () => {
    expect(MAX_FRAME_MS).toBe(100);
    expect(frameDelta(16.7)).toBe(16.7);
    expect(frameDelta(100)).toBe(100);
    expect(frameDelta(2500)).toBe(100);
  });
  it('never runs a clock backwards', () => {
    expect(frameDelta(-5)).toBe(0);
  });
});

describe('once per DOM key event', () => {
  // Phaser 3.90 re-runs the frame's key queue on every DOM key event; after resetKeys() the same keydown can
  // reach a handler twice (a release followed by Esc in one frame paused and unpaused at once).
  it('accepts each event object once and always accepts a missing event', () => {
    const fresh = oncePerEvent(), first = { type: 'keydown' }, second = { type: 'keydown' };
    expect(fresh(first)).toBe(true);
    expect(fresh(first)).toBe(false);
    expect(fresh(second)).toBe(true);
    expect(fresh(undefined)).toBe(true);
    expect(oncePerEvent()(first)).toBe(true);
  });
});
