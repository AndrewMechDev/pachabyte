import { describe, expect, it } from 'vitest';
import { CELL_HEIGHT, CELL_WIDTH, FONT_CHARACTERS, GLYPHS, missingGlyphs } from '../src/game/retroFont';
import { TEXT } from '../src/game/text';

describe('native retro glyph atlas', () => {
  it('covers live HUD labels, all digits and separators', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789/:-.') expect(GLYPHS[char]).toBeDefined();
    expect(new Set(FONT_CHARACTERS).size).toBe(FONT_CHARACTERS.length);
  });
  it('covers Spanish accented capitals and punctuation', () => {
    for (const char of "ÁÉÍÓÚÑÜ¡!¿?,'()+%>") expect(GLYPHS[char], char).toBeDefined();
  });
  it('uses binary 5x7 matrices with one clear row and column per cell', () => {
    expect(CELL_WIDTH).toBe(6);
    expect(CELL_HEIGHT).toBe(8);
    for (const rows of Object.values(GLYPHS)) {
      expect(rows).toHaveLength(7);
      for (const row of rows) expect(row).toMatch(/^[01]{5}$/);
    }
    expect(GLYPHS[' '].join('')).not.toContain('1');
    for (const char of FONT_CHARACTERS.replace(' ', '')) expect(GLYPHS[char].join('')).toContain('1');
  });
  it('keeps accented capitals distinct from their base letters and leaves a gap under the mark', () => {
    for (const [accented, base] of [['Á', 'A'], ['É', 'E'], ['Í', 'I'], ['Ó', 'O'], ['Ú', 'U'], ['Ñ', 'N'], ['Ü', 'U']]) {
      expect(GLYPHS[accented].join('')).not.toBe(GLYPHS[base].join(''));
      expect(GLYPHS[accented][0]).toContain('1');
    }
    for (const accented of 'ÁÉÍÓÚÜ') expect(GLYPHS[accented][1]).toBe('00000');
  });
  it('reports characters the atlas cannot draw', () => {
    expect(missingGlyphs('HOLA')).toEqual([]);
    expect(missingGlyphs('hola#')).toEqual(['h', 'o', 'l', 'a', '#']);
  });
  it('can draw every player-facing canvas string', () => {
    for (const [key, value] of Object.entries(TEXT)) expect(missingGlyphs(value), key).toEqual([]);
  });
});
