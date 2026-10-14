import type { SegmentName } from './routeRules';

export interface NarrativeLine { readonly segment: SegmentName; readonly text: string }
// Compatible subset of CONTINUATION_PLAN 9.4. Arrival is fully instructional; Bucle's break cue is dynamic.
export const NARRATIVE_LINES: readonly NarrativeLine[] = Object.freeze([
  { segment: 'firstBug', text: 'LOS ERRORES DE LA TRAMA TE BUSCAN.' },
  { segment: 'packetLoss', text: 'LOS DATOS SE PIERDEN Y VUELVEN.' },
  { segment: 'eruption', text: 'EL MISTI TAMBIÉN SIENTE EL DESFASE.' },
  { segment: 'memoryLeak', text: 'LA ENERGÍA SE ESCAPA DE LA TRAMA.' },
]);
