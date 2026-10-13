import { expect, it } from 'vitest';
import { sceneForView, viewCopy, type ViewState } from '../src/game/viewState';
import { initialProgress } from '../src/game/challengeRules';
const state = (view: ViewState['view'], outcome: ViewState['outcome'] = 'playing', progress = initialProgress()): ViewState => ({view,outcome,progress});
it('maps every public choice to its actual scene', () => {
  expect(sceneForView('guardian')).toBe('GuardianScene');
  expect(sceneForView('route')).toBe('RouteScene');
  expect(sceneForView('map')).toBe('MapScene');
});
it('offers the route by default, direct Amaru access and contextual Spanish controls', () => {
  expect(viewCopy(state('map')).help).toContain('Enter: iniciar ruta');
  expect(viewCopy(state('map')).help).toContain('2: ir a Amaru');
  expect(viewCopy(state('route')).help).not.toContain('PachaShift');
  expect(viewCopy(state('route')).help).toContain('Pausa: Esc');
  expect(viewCopy(state('guardian')).help).toContain('PachaShift: Shift o K');
  expect(viewCopy(state('route','defeat')).result).toContain('Kipu se desconecta');
  expect(viewCopy(state('guardian','victory')).result).toContain('Victoria');
  expect(viewCopy(state('guardian','defeat')).help).not.toContain('Disparar');
});
it('reports the Arequipa node as corrupted until Amaru is freed', () => {
  expect(viewCopy(state('map')).result).toContain('corrupto');
  expect(viewCopy(state('map','playing',{ route: true, guardian: true })).result).toContain('restaurado');
});
