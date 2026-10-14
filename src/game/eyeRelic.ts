import { fxColor, type FxSlot } from './animation';
import type { EyeFrameName } from './eyeArt';
import { EYE_SHEET } from './eyeSheets';

// P2 (2026-10-13), B5 (2026-10-14): frame choice, sprite origin and the shatter burst of the Bucle's eye relic. The art is
// the prepared LOOP_NODE_EYE sheet: its slicing and anchor math live in eyeSheets.ts, its loading in fxTextures.ts. Nothing
// here touches the node's HP (5), position, bobbing or hitbox: those stay in loopRules.ts and RouteScene.ts.
export type { EyeFrameName };

// pipsAbove: the HP pips (2 px tall) have their top row this many px above the node, i.e. they fill rows -18..-17 of the
// node, while the eye reaches up to row -14 (-15 in the hit flash): the pips never overlap it.
export const EYE = Object.freeze({ cell: EYE_SHEET.cell, anchor: EYE_SHEET.anchor, frames: EYE_SHEET.frames, idleMs: 220, lowHp: 2, pipsAbove: 18 });
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

// Sprite origin (0..1) that puts the eye disc's centre (the measured anchor, the same for all seven frames) on the node
// position, so the cables hang below it. The display image is never scaled: its size is independent of the 12x12 hitbox.
export function eyeOrigin(): { x: number; y: number } {
  return { x: EYE.anchor[0] / EYE.cell[0], y: EYE.anchor[1] / EYE.cell[1] };
}

// ------------------------------------------------------------------ shatter
// When the node breaks: gold, ivory and turquoise shards fly out and the four cables loosen and drift down. Offsets
// from the node centre, whole pixels, deterministic angles. Reduced motion shows one short static frame instead.
// B5: scaled to the prepared eye (disc 26 px, cables rooted about 14 px below the node and spread +-9 px): the shards
// are 1-3 px and about 1.3x faster, and the loosened cables start where the real tentacles hung.
export const SHATTER = Object.freeze({ shards: 10, cables: 4, ms: 650, reducedMs: 260, reducedAge: 120, gravity: 90 });
export interface ShatterPiece { kind: 'shard' | 'cable'; x: number; y: number; w: number; h: number; slot: FxSlot }
const SHARD_SLOTS: readonly FxSlot[] = ['light', 'gold', 'teal'];
const CABLE_START = Object.freeze([-7, -3, 3, 7]), CABLE_DRIFT = Object.freeze([-1, -0.4, 0.4, 1]), CABLE_TOP = 14;

export function shatterPieces(age: number, reduced: boolean): ShatterPiece[] {
  if (age < 0 || age >= (reduced ? SHATTER.reducedMs : SHATTER.ms)) return [];
  const t = (reduced ? SHATTER.reducedAge : age) / 1000, fall = 0.5 * SHATTER.gravity * t * t;
  const pieces: ShatterPiece[] = [];
  for (let i = 0; i < SHATTER.shards; i++) {
    const angle = i * 2 * Math.PI / SHATTER.shards + 0.35, speed = 52 + (i % 3) * 20, size = 3 - (i % 3);
    pieces.push({ kind: 'shard', x: Math.round(Math.cos(angle) * speed * t), y: Math.round(Math.sin(angle) * speed * t + fall), w: size, h: size, slot: SHARD_SLOTS[i % 3] });
  }
  for (let k = 0; k < SHATTER.cables; k++) {
    pieces.push({ kind: 'cable', x: Math.round(CABLE_START[k] + CABLE_DRIFT[k] * 12 * t), y: Math.round(CABLE_TOP + 6 * t + 1.2 * fall), w: 1, h: 5, slot: 'plum' });
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
