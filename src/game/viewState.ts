import { nodeState, type Progress } from './challengeRules';

export const VIEW_EVENT = 'pacha:view';
export const FOCUS_EVENT = 'pacha:focus';
export type View = 'map' | 'intro' | 'route' | 'guardian';
export type ViewOutcome = 'playing' | 'victory' | 'defeat';
// checkpoint: the phase a guardian defeat can resume from (2 or 3); absent otherwise.
export interface ViewState { view: View; outcome: ViewOutcome; progress: Progress; checkpoint?: number }
export const sceneForView = (view: View): string => ({ map: 'MapScene', intro: 'IntroScene', route: 'RouteScene', guardian: 'GuardianScene' })[view];

// Page copy (Spanish) for the DOM bridge around the canvas.
export function viewCopy({ view, outcome, progress, checkpoint }: ViewState) {
  if (view === 'intro') return {
    title: 'La Trama de Pacha — Introducción',
    help: 'Enter o Espacio: continuar · Esc: omitir',
    result: 'Repara las rutas. Libera, no destruyas.',
  };
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
  if (outcome === 'defeat' && checkpoint) return {
    title: 'Amaru-01 — Arena del guardián',
    help: `R: reintentar desde la fase ${checkpoint} · Enter: desde el inicio · M: mapa`,
    result: `Derrota: Kipu se desconecta. Reintenta desde la fase ${checkpoint} con vidas y energía llenas.`,
  };
  return {
    title: 'Amaru-01 — Arena del guardián',
    help: outcome === 'victory' ? 'Enter: continuar · R: reintentar · M: mapa' : ended ? 'R: reintentar · M o Enter: mapa' : `${move} · PachaShift: Shift o K · Pausa: Esc · Reintentar: R · Mapa: M`,
    result: outcome === 'victory' ? 'Victoria: Amaru liberado. Nodo Arequipa restaurado.' : outcome === 'defeat' ? 'Derrota: Kipu se desconecta. Reintenta cuando quieras.'
      : 'Esquiva los orbes redondos. Con la energía llena, Shift o K ralentiza el mundo: atrapa los rombos y se devuelven solos para romper el escudo de Amaru.',
  };
}
