import { nodeState, type Progress } from './challengeRules';

export const VIEW_EVENT = 'pacha:view';
export const FOCUS_EVENT = 'pacha:focus';
export type View = 'map' | 'route' | 'guardian';
export type ViewOutcome = 'playing' | 'victory' | 'defeat';
export interface ViewState { view: View; outcome: ViewOutcome; progress: Progress }
export const sceneForView = (view: View): string => ({ map: 'MapScene', route: 'RouteScene', guardian: 'GuardianScene' })[view];

// Page copy (Spanish) for the DOM bridge around the canvas.
export function viewCopy({ view, outcome, progress }: ViewState) {
  if (view === 'map') return {
    title: 'Mapa de la Trama',
    help: 'Enter: iniciar ruta · 2: ir a Amaru',
    result: nodeState(progress) === 'restored'
      ? 'Santuario de la Trama (Arequipa): nodo restaurado. Las demás rutas siguen bloqueadas.'
      : 'Santuario de la Trama (Arequipa): nodo corrupto. Las demás rutas siguen bloqueadas.',
  };
  const ended = outcome !== 'playing';
  const move = 'Mover: WASD o flechas · Disparar: Espacio o J';
  if (view === 'route') return {
    title: 'Ruta 01 — Santuario de la Trama (Arequipa)',
    help: ended ? 'R: reintentar · M: mapa' : `${move} · Pausa: Esc · Reintentar: R · Mapa: M`,
    result: outcome === 'defeat' ? 'Kipu se desconecta. Reintenta cuando quieras.'
      : 'Esquiva los Glitchlings, recoge fragmentos y busca la brecha del firewall. La ruta termina en Amaru.',
  };
  return {
    title: 'Amaru-01 — Arena del guardián',
    help: ended ? 'R: reintentar · M o Enter: mapa' : `${move} · PachaShift: Shift o K · Pausa: Esc · Reintentar: R · Mapa: M`,
    result: outcome === 'victory' ? 'Victoria: Amaru liberado.' : outcome === 'defeat' ? 'Derrota: reintenta cuando quieras.'
      : 'Esquiva las columnas marcadas y los pulsos. Shift o K ralentiza y captura proyectiles cercanos; la energía guardada vuelve al terminar.',
  };
}
