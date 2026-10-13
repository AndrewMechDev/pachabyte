import { GAME } from './rules';
import { SEGMENTS, type SegmentName } from './routeRules';

// Ambient route background (visual only, no gameplay effect): a living Misti (smoke plume and a faint ember glow at
// its crater) and drifting pixel clouds with a denser mist band that marks segment transitions. Pure and
// deterministic from the owned clocks; the scene only draws what these return. Everything stays still or off under
// reduced motion and keeps the central play band calm.
export const AMBIENT = Object.freeze({
  // Misti crater in the 320x180 arena art (assets/prepared/arequipa-arena-v1-320x180.png), measured on the image.
  summit: { x: 214, y: 72 },
  art: { width: 320 },
  plume: { puffs: 10, lifeMs: 8000, rise: 36, drift: 34, sizeFrom: 3, sizeTo: 9, alpha: 0.3 },
  // A slow warm glow at the crater: 1.4 s every 8 s, peak alpha 0.3, smoothstep in and out.
  ember: { everyMs: 8000, ms: 1400, alpha: 0.3, offset: 3100 },
  // Screen-space pixel cloud layers (far to near), all outside the calm band.
  clouds: [
    { y: 26, height: 10, factor: 0.25, drift: 4, alpha: 0.2, color: 0xe7b9c8 },
    { y: 142, height: 12, factor: 0.45, drift: 7, alpha: 0.2, color: 0xa58fc6 },
    { y: 158, height: 18, factor: 0.8, drift: 11, alpha: 0.26, color: 0x7b6aa6 },
  ],
  cloudTile: 320,
  // The rows where gameplay happens most: ambient effects stay faint here.
  calm: { top: 40, bottom: 140 },
  bands: { segments: ['firewall', 'marea', 'threshold'] as readonly SegmentName[], ms: 3200, width: 120, edgeAlpha: 0.32, calmAlpha: 0.08, color: 0xd9c6e6 },
});
export type CloudLayer = (typeof AMBIENT.clouds)[number];

// Copies of the arena art across the backdrop width; every other copy is mirrored so the edges always match.
export function backdropCopies(width: number): Array<{ x: number; flip: boolean }> {
  const out = [];
  for (let i = 0; i * AMBIENT.art.width < width; i++) out.push({ x: i * AMBIENT.art.width, flip: i % 2 === 1 });
  return out;
}
export const summitsX = (copies: ReadonlyArray<{ x: number; flip: boolean }>): number[] =>
  copies.map(c => c.x + (c.flip ? AMBIENT.art.width - 1 - AMBIENT.summit.x : AMBIENT.summit.x));

export interface Puff { x: number; y: number; size: number; alpha: number }
// Puffs relative to the crater (y up is negative). Each one lives lifeMs, rising, drifting downwind, growing and
// fading; they are evenly staggered so the plume never pops. Reduced motion freezes the plume at a fixed moment.
export function plumePuffs(t: number, reduced: boolean): Puff[] {
  const p = AMBIENT.plume, now = reduced ? p.lifeMs * 0.37 : t;
  return Array.from({ length: p.puffs }, (_, i) => {
    const age = (((now + i * p.lifeMs / p.puffs) % p.lifeMs) + p.lifeMs) % p.lifeMs, k = age / p.lifeMs;
    const sway = Math.sin(k * Math.PI * 2 + i) * 2;
    return {
      x: Math.round(p.drift * k * k + sway * k),
      y: -Math.round(p.rise * k),
      size: Math.round(p.sizeFrom + (p.sizeTo - p.sizeFrom) * k),
      alpha: Math.round(p.alpha * Math.min(1, k * 6) * (1 - k) * 100) / 100,
    };
  });
}

const smooth = (x: number): number => x * x * (3 - 2 * x);
export function emberAlpha(t: number, reduced: boolean): number {
  const e = AMBIENT.ember;
  if (reduced) return 0;
  const local = (((t - e.offset) % e.everyMs) + e.everyMs) % e.everyMs;
  if (local >= e.ms) return 0;
  const k = local / e.ms;
  return e.alpha * smooth(k < 0.5 ? k * 2 : (1 - k) * 2);
}

// Horizontal offset (0..tile) of a cloud layer: camera parallax plus its own slow drift (none under reduced motion).
export function cloudOffset(layer: CloudLayer, cameraX: number, t: number, reduced: boolean): number {
  const shift = cameraX * layer.factor + (reduced ? 0 : layer.drift * t / 1000), tile = AMBIENT.cloudTile;
  return ((-shift % tile) + tile) % tile;
}

// The denser mist band crosses the screen from right to left in AMBIENT.bands.ms after each marked segment starts.
export function transitionBand(clock: number, reduced: boolean): { x: number; progress: number; segment: SegmentName } | null {
  if (reduced) return null;
  const b = AMBIENT.bands;
  for (const name of b.segments) {
    const start = SEGMENTS.find(s => s.name === name)?.start;
    if (start === undefined || clock < start || clock > start + b.ms) continue;
    const progress = (clock - start) / b.ms;
    return { x: Math.round(GAME.width + b.width - progress * (GAME.width + 2 * b.width)), progress, segment: name };
  }
  return null;
}
// Alpha of one band row: denser toward the top and bottom edges, faint inside the calm band.
export function bandAlpha(y: number): number {
  const b = AMBIENT.bands, c = AMBIENT.calm;
  if (y >= c.top && y < c.bottom) return b.calmAlpha;
  const d = y < c.top ? (c.top - y) / (c.top - GAME.playTop) : (y - c.bottom + 1) / (GAME.playBottom - c.bottom);
  return Math.round((b.calmAlpha + (b.edgeAlpha - b.calmAlpha) * Math.min(1, Math.max(0, d))) * 100) / 100;
}
