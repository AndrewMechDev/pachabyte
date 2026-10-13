import { describe, expect, it } from 'vitest';
import {
  ATLAS_HEIGHT, CELL_HEIGHT, CELL_WIDTH, FONT_CHARACTERS, FONT_COLORS, GLYPHS, LETTER_ROWS, MARK_ROWS, RETRO_FONT, fontKey, glyphCell, missingGlyphs,
} from '../src/game/retroFont';
import { NOKIA } from '../src/game/nokiaPalette';
import { TEXT } from '../src/game/text';

const MARKED = [['Á', 'A'], ['É', 'E'], ['Í', 'I'], ['Ó', 'O'], ['Ú', 'U'], ['Ñ', 'N'], ['Ü', 'U']] as const;

describe('native retro glyph atlas', () => {
  it('covers live HUD labels, all digits and separators', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789/:-.') expect(GLYPHS[char]).toBeDefined();
    expect(new Set(FONT_CHARACTERS).size).toBe(FONT_CHARACTERS.length);
  });
  it('covers Spanish accented capitals and punctuation', () => {
    for (const char of "ÁÉÍÓÚÑÜ¡!¿?,'()+%>") expect(GLYPHS[char], char).toBeDefined();
  });
  it('uses binary 5x7 letters in 6x8 line cells, with mark rows only above accented capitals', () => {
    expect(CELL_WIDTH).toBe(6);
    expect(CELL_HEIGHT).toBe(8);
    expect(LETTER_ROWS).toBe(7);
    expect(ATLAS_HEIGHT).toBe(CELL_HEIGHT + MARK_ROWS);
    const marked = new Set<string>(MARKED.map(([accented]) => accented));
    for (const [char, rows] of Object.entries(GLYPHS)) {
      expect(rows, char).toHaveLength(marked.has(char) ? LETTER_ROWS + MARK_ROWS : LETTER_ROWS);
      for (const row of rows) expect(row).toMatch(/^[01]{5}$/);
    }
    expect(GLYPHS[' '].join('')).not.toContain('1');
    for (const char of FONT_CHARACTERS.replace(' ', '')) expect(GLYPHS[char].join('')).toContain('1');
  });
  it('draws each accented capital as its full-height base letter with the mark above and a clear row between', () => {
    for (const [accented, base] of MARKED) {
      const rows = GLYPHS[accented];
      expect(rows.slice(MARK_ROWS), accented).toEqual(GLYPHS[base]);
      expect(rows.slice(0, MARK_ROWS).join(''), accented).toContain('1');
      expect(rows[MARK_ROWS - 1], accented).toBe('00000');
    }
  });
  it('places plain glyphs on the 8 px line and lets marked glyphs rise above it', () => {
    const plain = glyphCell('A', 3), marked = glyphCell('Á', 4);
    expect(plain).toEqual({ x: 3 * CELL_WIDTH, y: MARK_ROWS, width: CELL_WIDTH, height: CELL_HEIGHT, yOffset: 0 });
    expect(marked).toEqual({ x: 4 * CELL_WIDTH, y: 0, width: CELL_WIDTH, height: ATLAS_HEIGHT, yOffset: -MARK_ROWS });
    // The letter rows land on the same screen rows for both glyphs.
    // Letters start at atlas row MARK_ROWS; screen row = yOffset + (MARK_ROWS - cell y) is 0 for both glyphs.
    for (const cell of [plain, marked]) expect(cell.yOffset + MARK_ROWS - cell.y).toBe(0);
  });
  it('reports characters the atlas cannot draw', () => {
    expect(missingGlyphs('HOLA')).toEqual([]);
    expect(missingGlyphs('hola#')).toEqual(['h', 'o', 'l', 'a', '#']);
  });
  it('can draw every player-facing canvas string', () => {
    for (const [key, value] of Object.entries(TEXT)) expect(missingGlyphs(value), key).toEqual([]);
  });
});

describe('pre-colored font atlases (Canvas ignores BitmapText tint)', () => {
  it('maps white to the base atlas and the Nokia light green to the existing -nokia atlas', () => {
    expect(fontKey(0xffffff)).toBe(RETRO_FONT);
    expect(fontKey(NOKIA[3])).toBe(`${RETRO_FONT}-nokia`);
  });
  it('gives every registered color its own atlas key', () => {
    expect(fontKey(0xfff1c3)).toBe(`${RETRO_FONT}-fff1c3`);
    expect(fontKey(0xc985ef)).toBe(`${RETRO_FONT}-c985ef`);
    const keys = FONT_COLORS.map(fontKey);
    expect(new Set(keys).size).toBe(FONT_COLORS.length);
    for (const color of [0xfff1c3, 0xedc76c, 0x59d3c4, 0xc985ef, 0x3a6770, NOKIA[3], 0xffffff]) expect(FONT_COLORS).toContain(color);
  });
  it('refuses colors that have no registered atlas instead of rendering white', () => {
    expect(() => fontKey(0x123456)).toThrow(/123456/);
  });
});
