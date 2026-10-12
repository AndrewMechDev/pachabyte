import { expect, it } from 'vitest';
import { sceneForView, viewCopy, type ViewState } from '../src/game/viewState';
import { initialProgress } from '../src/game/challengeRules';
const state = (view: ViewState['view'], outcome: ViewState['outcome'] = 'playing'): ViewState => ({view,outcome,progress:initialProgress()});
it('maps every public choice to its actual scene', () => {
  expect(sceneForView('guardian')).toBe('GuardianScene');
  expect(sceneForView('training')).toBe('ArcadeScene');
  expect(sceneForView('map')).toBe('MapScene');
});
it('offers default direct Amaru and contextual controls without fake achievements', () => {
  expect(viewCopy(state('map')).help).toContain('Enter: Play Amaru');
  expect(viewCopy(state('training')).help).not.toContain('PachaShift');
  expect(viewCopy(state('guardian')).help).toContain('PachaShift: X');
  expect(viewCopy(state('training','complete')).result).not.toContain('unlock');
  expect(viewCopy(state('guardian','victory')).result).toContain('Victory');
  expect(viewCopy(state('guardian','defeat')).help).not.toContain('Fire');
});
