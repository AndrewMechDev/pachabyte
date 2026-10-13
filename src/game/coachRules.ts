import type { Phase } from './amaruRules';
import { TEXT } from './text';

// Contextual coaching for the capture loop ("Demasiada dificultad: telegráficos y tutorial contextual",
// docs/design/COMBAT_DESIGN.md), added after the first human playtest (2026-10-13). Lines are static text in
// the message banner: no flashing, so they read the same under reduced motion.
export type CoachEvent = 'slowStart' | 'emptySlow' | 'shieldBreak';
export interface Coach { readonly slowTaught: boolean }
export const initialCoach = (): Coach => ({ slowTaught: false });

// Returns the line to show (or null) and the updated coach; the same coach object when nothing was learned.
export function coach(c: Coach, event: CoachEvent, phase: Phase): { coach: Coach; line: string | null } {
  switch (event) {
    case 'slowStart':
      // Taught once: the first SLOW of phase 2, where rhombi first appear.
      return phase === 2 && !c.slowTaught ? { coach: { ...c, slowTaught: true }, line: TEXT.coachFlyToRhombi } : { coach: c, line: null };
    case 'emptySlow':
      // Phase 1 has no rhombi, so there is nothing to get closer to.
      return { coach: c, line: phase >= 2 ? TEXT.coachCloser : null };
    case 'shieldBreak':
      return { coach: c, line: TEXT.shieldBroken };
  }
}
