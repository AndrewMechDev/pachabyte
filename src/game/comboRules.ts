// Racha (combo), approved by the user on 2026-10-13 (docs/design/DECISIONS.md): consecutive enemy hits without
// taking damage multiply the score x1 to x4; damage resets it. It multiplies enemy and boss-hit score only, never
// fragments, and the base formula stays the PROVISIONAL one in routeRules.ts. Thresholds are tentative.
export const COMBO = Object.freeze({ thresholds: Object.freeze([5, 12, 20]) as readonly number[], maxMultiplier: 4 });

export interface Combo { readonly hits: number; readonly best: number }

export const initialCombo = (hits = 0): Combo => ({ hits: readComboHits(hits), best: readComboHits(hits) });

export function comboMultiplier(hits: number): number {
  return Math.min(COMBO.maxMultiplier, 1 + COMBO.thresholds.filter(t => hits >= t).length);
}

export function registerHit(c: Combo): { combo: Combo; tierUp: boolean } {
  const hits = c.hits + 1;
  return { combo: { hits, best: Math.max(c.best, hits) }, tierUp: comboMultiplier(hits) > comboMultiplier(c.hits) };
}

// Same object when there is nothing to reset, so callers can skip feedback by identity.
export function breakCombo(c: Combo): Combo {
  return c.hits === 0 ? c : { ...c, hits: 0 };
}

// points = what the HUD shows for the event; bonus = the part above the provisional base formula.
export function comboPoints(base: number, hits: number): { points: number; bonus: number } {
  const multiplier = comboMultiplier(hits);
  return { points: base * multiplier, bonus: base * (multiplier - 1) };
}

export function readComboHits(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
