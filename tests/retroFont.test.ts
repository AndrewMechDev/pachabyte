import { describe, expect, it } from 'vitest';
import { CELL_HEIGHT, CELL_WIDTH, FONT_CHARACTERS, GLYPHS } from '../src/game/retroFont';

describe('native retro glyph atlas', () => {
  it('covers live HUD labels, all digits and separators', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789/:-.') expect(GLYPHS[char]).toBeDefined();
    expect(new Set(FONT_CHARACTERS).size).toBe(FONT_CHARACTERS.length);
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
});
