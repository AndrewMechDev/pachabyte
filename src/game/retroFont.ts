import { NOKIA } from './nokiaPalette';

// Original 5x7 glyphs inside 6x8 line cells: no system-font rasterization.
// Accented capitals keep the full 7-row letter and add MARK_ROWS rows above the line cell
// (mark, then one clear row), so they never shrink into small caps.
export const RETRO_FONT = 'pacha-retro';
export const CELL_WIDTH = 6;
export const CELL_HEIGHT = 8;
export const LETTER_ROWS = 7;
export const MARK_ROWS = 3;
export const ATLAS_HEIGHT = CELL_HEIGHT + MARK_ROWS;
const BASE_GLYPHS: Record<string, readonly string[]> = {
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '/': ['00001','00001','00010','00100','01000','10000','10000'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'I': ['11111','00100','00100','00100','00100','00100','11111'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'G': ['01110','10001','10000','10111','10001','10001','01110'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '¡': ['00100','00000','00100','00100','00100','00100','00100'],
  '?': ['01110','10001','00001','00010','00100','00000','00100'],
  '¿': ['00100','00000','00100','01000','10000','10001','01110'],
  ',': ['00000','00000','00000','00000','00100','00100','01000'],
  "'": ['00100','00100','01000','00000','00000','00000','00000'],
  '(': ['00010','00100','01000','01000','01000','00100','00010'],
  ')': ['01000','00100','00010','00010','00010','00100','01000'],
  '+': ['00000','00100','00100','11111','00100','00100','00000'],
  '%': ['11001','11010','00010','00100','01000','01011','10011'],
  '>': ['01000','00100','00010','00001','00010','00100','01000'],
  '×': ['00000','00000','10001','01010','00100','01010','10001'],
};
// Marks drawn above the line: acute, diaeresis and tilde. The last mark row stays clear.
const ACUTE = ['00010', '00100', '00000'];
const DIAERESIS = ['00000', '01010', '00000'];
const TILDE = ['01101', '10010', '00000'];
const MARKED: Record<string, readonly [string, readonly string[]]> = {
  'Á': ['A', ACUTE], 'É': ['E', ACUTE], 'Í': ['I', ACUTE], 'Ó': ['O', ACUTE], 'Ú': ['U', ACUTE], 'Ü': ['U', DIAERESIS], 'Ñ': ['N', TILDE],
};
export const GLYPHS: Record<string, readonly string[]> = {
  ...BASE_GLYPHS,
  ...Object.fromEntries(Object.entries(MARKED).map(([char, [base, mark]]) => [char, [...mark, ...BASE_GLYPHS[base]]])),
};
export const FONT_CHARACTERS = Object.keys(GLYPHS).join('');
// Characters of text that the atlas cannot draw (lowercase is intentionally absent).
export function missingGlyphs(text: string): string[] {
  return [...text].filter(char => char !== '\n' && GLYPHS[char] === undefined);
}

// Atlas cell of one character: plain glyphs sit on the 8 px line; marked glyphs are taller and
// rise MARK_ROWS above it (negative yOffset), so unaccented text renders exactly as before.
export interface GlyphCell { x: number; y: number; width: number; height: number; yOffset: number }
export function glyphCell(char: string, index: number): GlyphCell {
  const marked = GLYPHS[char].length > LETTER_ROWS;
  return { x: index * CELL_WIDTH, y: marked ? 0 : MARK_ROWS, width: CELL_WIDTH, height: marked ? ATLAS_HEIGHT : CELL_HEIGHT, yOffset: marked ? -MARK_ROWS : 0 };
}

// Canvas ignores BitmapText tint, so every text color is its own pre-colored atlas.
// White keeps the base key and the Nokia light green keeps the existing '-nokia' key.
export const FONT_COLORS: readonly number[] = [0xffffff, 0xfff1c3, 0xedc76c, 0x59d3c4, 0xc985ef, 0x3a6770, NOKIA[3]];
export function fontKey(color: number): string {
  if (!FONT_COLORS.includes(color)) throw new Error(`No retro font atlas for color ${color.toString(16).padStart(6, '0')}`);
  if (color === 0xffffff) return RETRO_FONT;
  if (color === NOKIA[3]) return `${RETRO_FONT}-nokia`;
  return `${RETRO_FONT}-${color.toString(16).padStart(6, '0')}`;
}
