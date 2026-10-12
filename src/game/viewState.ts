import type { Progress } from './challengeRules';

export const VIEW_EVENT = 'pacha:view';
export const FOCUS_EVENT = 'pacha:focus';
export type View = 'map' | 'training' | 'guardian';
export type ViewOutcome = 'playing' | 'complete' | 'victory' | 'defeat';
export interface ViewState { view: View; outcome: ViewOutcome; progress: Progress }
export const sceneForView = (view: View): string => ({ map: 'MapScene', training: 'ArcadeScene', guardian: 'GuardianScene' })[view];
export function viewCopy({ view, outcome }: ViewState) {
  if (view === 'map') return { title: 'Choose your challenge', help: 'Enter: Play Amaru · 2: Play Amaru · 1: Explore Arequipa', result: 'Both challenges are available. Achievements are earned by playing.' };
  const ended = outcome !== 'playing';
  return {
    title: view === 'guardian' ? 'Amaru — Guardian arena' : 'Arequipa — Training route',
    help: ended ? 'R: Retry · M or Enter: Choose challenge' : `Move: A/D or ←/→ · Jump: W/Space/↑ · Fire: J/Z${view === 'guardian' ? ' · PachaShift: X' : ''} · Retry: R · Choose challenge: M`,
    result: outcome === 'complete' ? 'Training complete — four targets cleared.' : outcome === 'victory' ? 'Victory — Amaru cleared.' : outcome === 'defeat' ? 'Defeat — retry when ready.' : view === 'guardian' ? 'Evade marked columns and aimed pulses. X slows and captures nearby bolts; stored energy returns at expiry.' : 'Practice movement and shooting. Clear four targets; Amaru is already available.',
  };
}
