import { fxColor, type FxSlot } from './animation';
import { EYE_CELL, EYE_CENTER, EYE_COLORS, EYE_FLASH, eyeRows, type EyeFrameName } from './eyeArt';

// P2 (2026-10-13): frame choice, sprite origin and the shatter burst of the Bucle's eye relic. The art itself, its
// placeholder status and the future LOOP_NODE_EYE sheet mapping live in eyeArt.ts. Nothing here touches the node's
// HP (5), position, bobbing or hitbox: those stay in loopRules.ts and RouteScene.ts.
export { EYE_COLORS, EYE_FLASH, eyeRows, type EyeFrameName };

export const EYE = Object.freeze({ cell: EYE_CELL, center: EYE_CENTER, frames: 7, idleMs: 220, lowHp: 2 });
// Sheet order: four idle frames, the hit flash, then the two breaking frames.
export const EYE_FRAMES: readonly EyeFrameName[] = Object.freeze(['idle0', 'idle1', 'idle2', 'idle3', 'hit', 'crack', 'break'] as const);
const IDLE: readonly EyeFrameName[] = EYE_FRAMES.slice(0, 4);
export const eyeTextureKey = (frame: EyeFrameName): string => `loop-eye-${frame}`;

export interface EyeInput { hp: number; anim: number; hitUntil: number; reduced: boolean }
// Hit flash first, then the damage state (cracked at HP 2, breaking at HP 1), then the idle loop where the slit pupil
// dilates and the cables sway. Reduced motion keeps the first idle frame still; cracks are state, so they stay.
export function eyeFrameFor(input: EyeInput): EyeFrameName {
  if (input.anim < input.hitUntil) return 'hit';
  if (input.hp <= 1) return 'break';
  if (input.hp <= EYE.lowHp) return 'crack';
  if (input.reduced) return 'idle0';
  return IDLE[Math.floor(Math.max(0, input.anim) / EYE.idleMs) % IDLE.length];
}

// Sprite origin (0..1) that puts the eye's centre on the node position, so the cables hang below it.
export function eyeOrigin(): { x: number; y: number } {
  return { x: (EYE.center[0] + 0.5) / EYE.cell[0], y: (EYE.center[1] + 0.5) / EYE.cell[1] };
}

// ------------------------------------------------------------------ shatter
// When the node breaks: gold, ivory and turquoise shards fly out and the four cables loosen and drift down. Offsets
// from the node centre, whole pixels, deterministic angles. Reduced motion shows one short static frame instead.
export const SHATTER = Object.freeze({ shards: 10, cables: 4, ms: 650, reducedMs: 260, reducedAge: 120, gravity: 90 });
export interface ShatterPiece { kind: 'shard' | 'cable'; x: number; y: number; w: number; h: number; slot: FxSlot }
const SHARD_SLOTS: readonly FxSlot[] = ['light', 'gold', 'teal'];
const CABLE_START = Object.freeze([-5, -2, 2, 5]), CABLE_DRIFT = Object.freeze([-1, -0.4, 0.4, 1]);

export function shatterPieces(age: number, reduced: boolean): ShatterPiece[] {
  if (age < 0 || age >= (reduced ? SHATTER.reducedMs : SHATTER.ms)) return [];
  const t = (reduced ? SHATTER.reducedAge : age) / 1000, fall = 0.5 * SHATTER.gravity * t * t;
  const pieces: ShatterPiece[] = [];
  for (let i = 0; i < SHATTER.shards; i++) {
    const angle = i * 2 * Math.PI / SHATTER.shards + 0.35, speed = 40 + (i % 3) * 16, size = i % 3 === 0 ? 2 : 1;
    pieces.push({ kind: 'shard', x: Math.round(Math.cos(angle) * speed * t), y: Math.round(Math.sin(angle) * speed * t + fall), w: size, h: size, slot: SHARD_SLOTS[i % 3] });
  }
  for (let k = 0; k < SHATTER.cables; k++) {
    pieces.push({ kind: 'cable', x: Math.round(CABLE_START[k] + CABLE_DRIFT[k] * 12 * t), y: Math.round(8 + 6 * t + 1.2 * fall), w: 1, h: 5, slot: 'plum' });
  }
  return pieces;
}

interface RectPainter { fillStyle(color: number): unknown; fillRect(x: number, y: number, width: number, height: number): unknown }
export function drawShatter(painter: RectPainter, pieces: readonly ShatterPiece[], originX: number, originY: number): void {
  const ox = Math.round(originX), oy = Math.round(originY);
  for (const p of pieces) {
    painter.fillStyle(fxColor(p.slot, false)); painter.fillRect(ox + p.x, oy + p.y, p.w, p.kind === 'cable' ? p.h - 1 : p.h);
    // A loosened cable keeps its glowing violet tip.
    if (p.kind === 'cable') { painter.fillStyle(fxColor('violet', false)); painter.fillRect(ox + p.x, oy + p.y + p.h - 1, 1, 1); }
  }
}
