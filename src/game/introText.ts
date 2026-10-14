import { CELL_WIDTH } from './retroFont';

// Exact approved canon cards. Wrapping replaces spaces, never words or lore.
export const INTRO_CARDS: readonly string[] = Object.freeze([
  'EN EL PERÚ DE LA TRAMA, TODO ESTÁ CONECTADO.',
  'EL DESFASE APAGA LAS RUTAS Y CORROMPE A SUS GUARDIANES.',
  'UNA CHISPA TURQUESA DESPIERTA: KIPU.',
  'REPARA LAS RUTAS. LIBERA, NO DESTRUYAS.',
]);
export const INTRO_HELP = 'ENTER/ESPACIO: SEGUIR  ESC: OMITIR';
export const INTRO_WIDTH = 288;
export function wrapIntroText(text: string): string {
  const lines: string[] = []; let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * CELL_WIDTH > INTRO_WIDTH && line) { lines.push(line); line = word; }
    else line = next;
  }
  return [...lines, line].join('\n');
}
