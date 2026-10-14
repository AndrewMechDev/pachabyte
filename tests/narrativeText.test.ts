import { expect, it } from 'vitest';
import { NARRATIVE_LINES } from '../src/game/narrativeText';
import { CELL_WIDTH, GLYPHS } from '../src/game/retroFont';
import { GAME } from '../src/game/rules';

it('uses only the compatible canon-safe suggested intents, without new lore', () => {
  expect(NARRATIVE_LINES).toEqual([
    { segment: 'firstBug', text: 'LOS ERRORES DE LA TRAMA TE BUSCAN.' },
    { segment: 'packetLoss', text: 'LOS DATOS SE PIERDEN Y VUELVEN.' },
    { segment: 'eruption', text: 'EL MISTI TAMBIÉN SIENTE EL DESFASE.' },
    { segment: 'memoryLeak', text: 'LA ENERGÍA SE ESCAPA DE LA TRAMA.' },
  ]);
});
it('limits count/length and fits the existing one-line strip without HUD coverage', () => {
  expect(NARRATIVE_LINES.length).toBeGreaterThan(0); expect(NARRATIVE_LINES.length).toBeLessThanOrEqual(6);
  for (const { text } of NARRATIVE_LINES) {
    expect(text.length).toBeLessThanOrEqual(38); expect(text.length * CELL_WIDTH + 6).toBeLessThan(GAME.width);
    expect(text).toBe(text.toLocaleUpperCase('es')); expect(text).not.toContain('\n');
  }
});
it('has drawable accented Spanish glyphs in the existing atlas', () => {
  for (const { text } of NARRATIVE_LINES) for (const glyph of text) expect(GLYPHS[glyph], glyph).toBeDefined();
});
