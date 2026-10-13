// Pure HUD helpers shared by the route and the guardian arena.

export function formatScore(score: number): string {
  const value = Math.min(999999, Math.max(0, Math.floor(Number.isFinite(score) ? score : 0)));
  return String(value).padStart(6, '0');
}

export function heartStates(hp: number, max: number): boolean[] {
  return Array.from({ length: max }, (_, index) => index < hp);
}

export function meterFill(meter: number, width: number): number {
  return Math.round(Math.min(100, Math.max(0, meter)) / 100 * width);
}

// 7x6 pixel heart, drawn with filled integer rectangles (no antialiasing, exact palette).
export const HEART: readonly string[] = Object.freeze([
  '0110110',
  '1111111',
  '1111111',
  '0111110',
  '0011100',
  '0001000',
]);
