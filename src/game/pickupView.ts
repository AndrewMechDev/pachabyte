import Phaser from 'phaser';
import { shieldRing } from './amaruRules';

// Escudo visuals shared by the route and the guardian. Hard 1 px pixels from integer rectangles, so Canvas never
// antialiases extra colors and the REVERSE frame keeps the exact four greens.
export const KIPU_SHIELD = Object.freeze({ radius: 15, dy: 1, breakMs: 260, breakGrow: 8 });
const RING = shieldRing(KIPU_SHIELD.radius, 1, 1);

// Thin dotted ring around Kipu while the Escudo is up: every other ring pixel, steady (no flashing).
export function drawKipuShield(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  const cx = Math.round(x), cy = Math.round(y) + KIPU_SHIELD.dy;
  g.fillStyle(color);
  RING.forEach(([px, py], i) => { if (i % 2 === 0) g.fillRect(cx + px, cy + py, 1, 1); });
}

// Small break effect when the Escudo absorbs a hit: the ring grows and thins out by density (not alpha) over 260 ms.
// Skipped under reduced motion; the sound and the vanished ring still tell the player.
export function drawShieldBreak(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, elapsed: number, reduced: boolean): void {
  const t = elapsed / KIPU_SHIELD.breakMs;
  if (reduced || t < 0 || t >= 1) return;
  const radius = Math.round(KIPU_SHIELD.radius + KIPU_SHIELD.breakGrow * t), every = 2 + Math.floor(t * 4);
  const cx = Math.round(x), cy = Math.round(y) + KIPU_SHIELD.dy;
  g.fillStyle(color);
  shieldRing(radius, 1, 1).forEach(([px, py], i) => { if (i % every === 0) g.fillRect(cx + px, cy + py, 1, 1); });
}
