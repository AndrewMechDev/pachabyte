import { describe, expect, it } from 'vitest';
import { CELL_WIDTH, missingGlyphs } from '../src/game/retroFont';
import { MAP_TEXT } from '../src/game/mapText';

// 320 px canvas minus a 4 px gutter on each side.
const MAX_WIDTH = 312;
const entries = Object.entries(MAP_TEXT);

describe('map screen copy', () => {
  it('is drawable by the retro font (uppercase Spanish only)', () => {
    for (const [key, value] of entries) expect(missingGlyphs(value), key).toEqual([]);
  });
  it('fits one line of the 320 px canvas', () => {
    for (const [key, value] of entries) expect(value.length * CELL_WIDTH, key).toBeLessThanOrEqual(MAX_WIDTH);
  });
  it('has no empty strings and no line breaks', () => {
    for (const [key, value] of entries) { expect(value.trim().length, key).toBeGreaterThan(0); expect(value, key).not.toContain('\n'); }
  });
  it('says what the key bar offers: choose, act and the direct Amaru shortcut', () => {
    expect(MAP_TEXT.keyBar).toContain('A/D');
    expect(MAP_TEXT.keyBar).toContain('ENTER');
    expect(MAP_TEXT.keyBar).toContain('2');
    expect(MAP_TEXT.keyBar).toContain('AMARU');
  });
  it('keeps the approved Arequipa copy and the locked-route placeholders', () => {
    expect(MAP_TEXT.title).toBe('MAPA DE LA TRAMA');
    expect(MAP_TEXT.arequipa).toBe('SANTUARIO DE LA TRAMA - AREQUIPA');
    expect(MAP_TEXT.corrupted).toBe('NODO CORRUPTO');
    expect(MAP_TEXT.restored).toBe('NODO RESTAURADO');
    expect(MAP_TEXT.startRoute).toBe('ENTER: INICIAR RUTA');
    expect(MAP_TEXT.underConstruction).toBe('EN CONSTRUCCIÓN');
    expect(MAP_TEXT.comingSoon).toBe('PRÓXIMAMENTE');
    expect(['route02', 'route03', 'route04', 'route05', 'route06'].map(key => MAP_TEXT[key as keyof typeof MAP_TEXT])).toEqual(['RUTA 02', 'RUTA 03', 'RUTA 04', 'RUTA 05', 'RUTA 06']);
  });
  it('invents no real-city lore: Arequipa is the only place named', () => {
    const cities = ['LIMA', 'CUSCO', 'CUZCO', 'PUNO', 'TRUJILLO', 'IQUITOS', 'NAZCA', 'AYACUCHO', 'HUANCAYO', 'LORETO', 'LIBERTAD', 'TITICACA', 'MACHU'];
    const all = entries.map(([, value]) => value).join(' ');
    for (const city of cities) expect(all, city).not.toContain(city);
  });
});
