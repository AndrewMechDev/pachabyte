import { GAME, clamp } from './rules';
import { overlaps, type Rect } from './routeRules';

// Memory Leak (A2, 2026-10-13; GDD obstacle library: "zona que drena recursos"). Translucent purple zones (a binary
// dither, never alpha-blended) flow in from the right; while Kipu's body overlaps one, the REVERSE meter drains 25 per
// second of WORLD time, never below 0. It costs no hearts. Fragments ride inside the zones as a temptation (+20 each
// against the drain). Zones are screen-space, faster than the scroll, so they reach Kipu inside the segment; they
// never overlap each other horizontally and each leaves most of the band open. Values are tentative until playtested.
export interface LeakZone { at: number; y: number; height: number; width: number }
export interface LeakFragment { zone: number; dx: number; dy: number }

export const MEMORY_LEAK = Object.freeze({
  drainPerSecond: 25, screenSpeed: 64, enterX: GAME.width + 4,
  zones: Object.freeze([
    { at: 64000, y: 28, height: 70, width: 56 },
    { at: 65000, y: 100, height: 70, width: 56 },
    { at: 66000, y: 56, height: 70, width: 56 },
  ]) as readonly LeakZone[],
  fragments: Object.freeze([
    { zone: 0, dx: 28, dy: 35 }, { zone: 1, dx: 20, dy: 22 }, { zone: 1, dx: 36, dy: 50 }, { zone: 2, dx: 28, dy: 35 },
  ]) as readonly LeakFragment[],
});

export function zoneRect(now: number, zone: LeakZone): Rect | null {
  const x = MEMORY_LEAK.enterX - (now - zone.at) * MEMORY_LEAK.screenSpeed / 1000;
  if (now < zone.at || x + zone.width <= 0) return null;
  return { x, y: zone.y, width: zone.width, height: zone.height };
}

export function leakZones(now: number): Array<{ index: number; rect: Rect }> {
  const out: Array<{ index: number; rect: Rect }> = [];
  MEMORY_LEAK.zones.forEach((zone, index) => { const rect = zoneRect(now, zone); if (rect) out.push({ index, rect }); });
  return out;
}

export const insideLeak = (now: number, body: Rect): boolean => leakZones(now).some(z => overlaps(body, z.rect));

// The meter after `worldMs` inside a zone; Memory Leak never touches the hearts.
export const drainMeter = (meter: number, worldMs: number): number => clamp(meter - MEMORY_LEAK.drainPerSecond * Math.max(0, worldMs) / 1000, 0, 100);

// Screen position of a fragment carried by its zone; null while the zone is not on screen.
export function leakFragmentPosition(now: number, f: LeakFragment): { x: number; y: number } | null {
  const rect = zoneRect(now, MEMORY_LEAK.zones[f.zone]);
  return rect ? { x: rect.x + f.dx, y: rect.y + f.dy } : null;
}

export function leakWindow(): [number, number] {
  const zones = MEMORY_LEAK.zones, last = zones[zones.length - 1];
  return [zones[0].at, last.at + Math.ceil((MEMORY_LEAK.enterX + last.width) / MEMORY_LEAK.screenSpeed * 1000)];
}
