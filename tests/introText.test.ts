import { expect, it } from 'vitest';
import { INTRO_CARDS, INTRO_HELP, INTRO_WIDTH, wrapIntroText } from '../src/game/introText';
import { CELL_WIDTH, GLYPHS } from '../src/game/retroFont';

it('preserves the four exact canon cards without adding lore or rewriting long text', () => {
  expect(INTRO_CARDS).toEqual([
    'EN EL PERÚ DE LA TRAMA, TODO ESTÁ CONECTADO.',
    'EL DESFASE APAGA LAS RUTAS Y CORROMPE A SUS GUARDIANES.',
    'UNA CHISPA TURQUESA DESPIERTA: KIPU.',
    'REPARA LAS RUTAS. LIBERA, NO DESTRUYAS.',
  ]);
});
it('word-wraps native lines within the padded 288 pixel card without clipping', () => {
  expect(INTRO_WIDTH).toBe(288);
  for (const text of INTRO_CARDS) {
    const lines = wrapIntroText(text).split('\n');
    expect(lines.join(' ')).toBe(text);
    expect(lines.length).toBeLessThanOrEqual(2);
    for (const line of lines) expect(line.length * CELL_WIDTH).toBeLessThanOrEqual(INTRO_WIDTH);
  }
  expect(wrapIntroText(INTRO_CARDS[1])).toContain('\n');
});
it('covers every card/control glyph and preserves a stable layout for partial typed text', () => {
  for (const text of [...INTRO_CARDS, INTRO_HELP]) for (const glyph of text) expect(GLYPHS[glyph], glyph).toBeDefined();
  const full = wrapIntroText(INTRO_CARDS[1]);
  expect(full.length).toBe(INTRO_CARDS[1].length); // replacing a space with newline preserves character timing
});
