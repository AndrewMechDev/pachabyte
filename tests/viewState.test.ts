import { expect, it } from 'vitest';
import { sceneForView, viewCopy, type ViewState } from '../src/game/viewState';
import { initialProgress } from '../src/game/challengeRules';
const state = (view: ViewState['view'], outcome: ViewState['outcome'] = 'playing', progress = initialProgress()): ViewState => ({view,outcome,progress});
it('maps every public choice to its actual scene', () => {
  expect(sceneForView('intro')).toBe('IntroScene');
  expect(sceneForView('guardian')).toBe('GuardianScene');
  expect(sceneForView('route')).toBe('RouteScene');
  expect(sceneForView('map')).toBe('MapScene');
});
it('gives the intro contextual controls without pretending gameplay is already running', () => {
  const copy = viewCopy(state('intro'));
  expect(copy.title).toContain('Introducción');
  expect(copy.help).toContain('Enter o Espacio');
  expect(copy.help).toContain('Esc: omitir');
  expect(copy.help).not.toContain('Disparar');
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
it('documents the phase checkpoint keys after a defeat in phase 2 or 3', () => {
  const plain = viewCopy(state('guardian', 'defeat'));
  expect(plain.help).toBe('R: reintentar · M o Enter: mapa');
  const two = viewCopy({ ...state('guardian', 'defeat'), checkpoint: 2 });
  expect(two.help).toBe('R: reintentar desde la fase 2 · Enter: desde el inicio · M: mapa');
  expect(two.result).toContain('fase 2');
  expect(viewCopy({ ...state('guardian', 'defeat'), checkpoint: 3 }).help).toContain('desde la fase 3');
  // A checkpoint never leaks into a running fight or a victory.
  expect(viewCopy({ ...state('guardian', 'playing'), checkpoint: 2 }).help).not.toContain('fase 2');
});
