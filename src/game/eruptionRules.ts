import { GAME, clamp } from './rules';
import type { Rect } from './routeRules';

// Erupción del Misti (A2, 2026-10-13). Embers fall from the top of the screen toward marked landing points: the
// landing marker appears 700 ms before impact and the ember falls during those 700 ms; the impact hurts in a small
// radius for 120 ms. Half the embers land on scripted points, the other half where Kipu was when the marker
// appeared (timing stays deterministic; only that landing point follows Kipu). Pure functions of the WORLD clock;
// screen-space positions. The Misti's plume and glow intensify and the sky dims a little (visual only).
export interface EmberSpec { at: number; x?: number; y?: number }
const fixed = (at: number, x: number, y: number): EmberSpec => ({ at, x, y });
const aimed = (at: number): EmberSpec => ({ at });

export const ERUPTION = Object.freeze({
  markerMs: 700, impactMs: 120, radius: 12, pool: 6,
  // The ember starts under the HUD, a little to the right (thrown from the volcano), and accelerates down.
  startY: 8, slantX: 26,
  // The marker closes in from markerFrom to the radius as the impact nears.
  markerFrom: 20,
  bounds: { left: 16, right: GAME.width - 16, top: GAME.playTop + 8, bottom: GAME.playBottom - 8 },
  level: { from: 46000, full: 47300, fadeFrom: 54800, to: 56000 },
  skyDimMax: 0.18,
  embers: Object.freeze([
    fixed(47300, 92, 60), aimed(47900), fixed(48500, 150, 130), aimed(49100), fixed(49700, 60, 104), aimed(50300),
    fixed(50900, 200, 54), aimed(51500), fixed(52100, 112, 150), aimed(52700), fixed(53300, 70, 40), aimed(53900),
    fixed(54500, 170, 96), aimed(55100),
  ]) as readonly EmberSpec[],
});

export type EmberStage = 'pending' | 'marker' | 'impact' | 'done';
export function emberStage(now: number, at: number): EmberStage {
  if (now < at - ERUPTION.markerMs) return 'pending';
  if (now < at) return 'marker';
  return now < at + ERUPTION.impactMs ? 'impact' : 'done';
}

// Markers due between the cursor and now; the caller keeps the returned cursor (like spawnsDue).
export function embersDue(cursor: number, now: number): { due: EmberSpec[]; next: number } {
  let next = cursor;
  const list = ERUPTION.embers;
  while (next < list.length && list[next].at - ERUPTION.markerMs <= now) next++;
  return { due: list.slice(cursor, next), next };
}

export interface Point { x: number; y: number }
export function emberLanding(spec: EmberSpec, kipu: Point): Point {
  const b = ERUPTION.bounds;
  if (spec.x !== undefined && spec.y !== undefined) return { x: spec.x, y: spec.y };
  return { x: Math.round(clamp(kipu.x, b.left, b.right)), y: Math.round(clamp(kipu.y, b.top, b.bottom)) };
}

// Falling ember: from above the play area to the landing point, accelerating (ease-in), exact at impact.
export function emberPosition(now: number, at: number, landing: Point): Point {
  const k = clamp((now - (at - ERUPTION.markerMs)) / ERUPTION.markerMs, 0, 1), e = k * k;
  if (k >= 1) return { x: landing.x, y: landing.y };
  return { x: Math.round(landing.x + ERUPTION.slantX * (1 - e)), y: Math.round(ERUPTION.startY + (landing.y - ERUPTION.startY) * e) };
}

// Half-size of the landing marker: wide when it appears, closing to the hurt radius at impact.
export function markerSize(now: number, at: number): number {
  const k = clamp((at - now) / ERUPTION.markerMs, 0, 1);
  return Math.round(ERUPTION.radius + (ERUPTION.markerFrom - ERUPTION.radius) * k);
}

// Circle (landing, radius) against Kipu's body rectangle.
export function emberHits(landing: Point, rect: Rect, radius: number = ERUPTION.radius): boolean {
  const nx = clamp(landing.x, rect.x, rect.x + rect.width), ny = clamp(landing.y, rect.y, rect.y + rect.height);
  return (landing.x - nx) ** 2 + (landing.y - ny) ** 2 < radius * radius;
}

export function eruptionWindow(): [number, number] {
  const list = ERUPTION.embers;
  return [list[0].at - ERUPTION.markerMs, list[list.length - 1].at + ERUPTION.impactMs];
}

// 0..1 intensity of the ambient eruption (plume, crater glow, sky dim); smooth ramps, visual only.
export function eruptionLevel(now: number): number {
  const l = ERUPTION.level;
  if (now <= l.from || now >= l.to) return 0;
  if (now < l.full) return (now - l.from) / (l.full - l.from);
  if (now <= l.fadeFrom) return 1;
  return (l.to - now) / (l.to - l.fadeFrom);
}
export const skyDim = (level: number): number => Math.round(ERUPTION.skyDimMax * clamp(level, 0, 1) * 100) / 100;
