// Pure intro clock and session-entry decisions. No gameplay clock, HP or settings are changed here.
export const INTRO = Object.freeze({ cards: 4, cardMs: 3000, charMs: 30 });
export const INTRO_SEEN_KEY = 'intro.seen';
export interface IntroState { readonly card: number; readonly elapsed: number; readonly done: boolean }
export type IntroAction = 'advance' | 'skip';
export const initialIntro = (): IntroState => ({ card: 0, elapsed: 0, done: false });
export const entryScene = (view: 'route' | 'guardian', seen: boolean): string =>
  view === 'guardian' ? 'GuardianScene' : seen ? 'RouteScene' : 'IntroScene';

export function stepIntro(state: IntroState, delta: number, paused: boolean, action?: IntroAction): IntroState {
  if (state.done || paused) return state;
  if (action === 'skip') return { ...state, done: true };
  const elapsed = action === 'advance' ? 0 : state.elapsed + Math.max(0, delta);
  const card = state.card + (action === 'advance' ? 1 : Math.floor(elapsed / INTRO.cardMs));
  if (card >= INTRO.cards) return { card: INTRO.cards - 1, elapsed: INTRO.cardMs, done: true };
  return { card, elapsed: elapsed % INTRO.cardMs, done: false };
}

export const visibleCharacters = (length: number, elapsed: number, reduced: boolean): number =>
  reduced ? length : Math.min(length, Math.floor(Math.max(0, elapsed) / INTRO.charMs));
