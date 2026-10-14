// Every string the map screen draws, in Spanish and uppercase so the retro font can render it (tests/mapText.test.ts).
// One line each: the map shows a single selected-node card, never paragraphs. Locked routes use neutral
// placeholder numbers; no city or region other than Arequipa is named until the design assigns them.
export const MAP_TEXT = Object.freeze({
  title: 'MAPA DE LA TRAMA',
  arequipa: 'SANTUARIO DE LA TRAMA - AREQUIPA',
  route02: 'RUTA 02',
  route03: 'RUTA 03',
  route04: 'RUTA 04',
  route05: 'RUTA 05',
  route06: 'RUTA 06',
  corrupted: 'NODO CORRUPTO',
  restored: 'NODO RESTAURADO',
  underConstruction: 'EN CONSTRUCCIÓN',
  startRoute: 'ENTER: INICIAR RUTA',
  comingSoon: 'PRÓXIMAMENTE',
  // The font has no arrow glyphs, so the choose keys are spelled out.
  keyBar: 'A/D: ELEGIR  ENTER: ACTUAR  2: AMARU',
});
export type MapTextKey = keyof typeof MAP_TEXT;
