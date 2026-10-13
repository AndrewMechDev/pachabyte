import Phaser from 'phaser';
import { ATLAS_HEIGHT, CELL_WIDTH, CELL_HEIGHT, FONT_CHARACTERS, FONT_COLORS, GLYPHS, LETTER_ROWS, fontKey, glyphCell } from './retroFont';
import type { PickupKind } from './pickupRules';
import { FRAGMENT_SMALL, ORB, ORB_COLORS } from './bugArt';
import { pickupTexture } from './spriteFrames';

// Original procedural placeholders. These are not animation spritesheets.
export function createTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('bullet')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xedc76c).fillRect(0, 0, 6, 3);
  g.fillStyle(0xfff3bf).fillRect(4, 0, 2, 3);
  g.generateTexture('bullet', 6, 3);
  g.destroy();
}

type PixelRows = readonly string[];
// '.' is transparent; every other character maps to one opaque color. Integer pixels only.
function paint(scene: Phaser.Scene, key: string, rows: PixelRows, colors: Readonly<Record<string, number>>): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  rows.forEach((row, y) => [...row].forEach((char, x) => {
    if (char !== '.') g.fillStyle(colors[char]).fillRect(x, y, 1, 1);
  }));
  g.generateTexture(key, rows[0].length, rows.length);
  g.destroy();
}

const GLITCH_COLORS = { p: 0x9b4fd0, d: 0x3b1850, e: 0xfff1c3, l: 0xd9a6f5 } as const;
// PLACEHOLDER pending an asset request: Glitchling, a small jagged purple bug facing left (toward Kipu).
// Silhouette is spiky and angular so it never reads as round turquoise Kipu or as a gold fragment ring.
const GLITCHLING_A: PixelRows = [
  '..p...p..p..',
  '.ppp.ppp.pp.',
  'pppppppppppp',
  'pdeeppppdppp',
  'pdeeppppppdp',
  'pppppppppppp',
  '.pppplppppp.',
  'pp.pp.pp.pp.',
  'p...p..p...p',
  '............',
];
const GLITCHLING_B: PixelRows = [
  '...p..p...p.',
  '.pp.ppp.ppp.',
  'pppppppppppp',
  'pdeeppppdppp',
  'pdeeppppppdp',
  'pppppppppppp',
  '.ppppplpppp.',
  '.pp.pp.pp.pp',
  '..p...p..p..',
  '............',
];
// PLACEHOLDER pending an asset request: fragment, a gold ring with a hanging knot (never a rhombus:
// rhombus silhouettes are reserved for capturable boss bolts).
const FRAGMENT: PixelRows = [
  '...ggg...',
  '..gllgg..',
  '.gl...gg.',
  '.g.....g.',
  '.g.....g.',
  '.gg...gg.',
  '..ggggg..',
  '....o....',
  '...ooo...',
];
// PLACEHOLDER pending an asset request: Firewall brick tile (repeated by a TileSprite, never scaled).
const FIREWALL: PixelRows = [
  'dddddddd',
  'rrrodrrr',
  'rrrrdrro',
  'dddddddd',
  'rdrrrrro',
  'rdrorrrr',
  'dddddddd',
  'rrrodrrr',
];

export function createRouteTextures(scene: Phaser.Scene): void {
  paint(scene, 'glitchling', GLITCHLING_A, GLITCH_COLORS);
  paint(scene, 'glitchling-b', GLITCHLING_B, GLITCH_COLORS);
  // Hit flash: same silhouette in one light color (derived texture; Canvas ignores tint).
  paint(scene, 'glitchling-hit', GLITCHLING_A, { p: 0xfff1c3, d: 0xfff1c3, e: 0xfff1c3, l: 0xfff1c3 });
  paint(scene, 'fragment', FRAGMENT, { g: 0xedc76c, l: 0xfff1c3, o: 0xa27c52 });
  paint(scene, 'firewall', FIREWALL, { d: 0x6b2a22, r: 0xd8573f, o: 0xf2a65a });
  // PLACEHOLDER pending an asset request: Marea del Desfase interference tile, purple scanlines with sparks.
  if (!scene.textures.exists('marea')) {
    const rows = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) =>
      (x * 7 + y * 3) % 11 === 0 ? 'l' : (x + y * 5) % 13 === 0 ? 'm' : y % 2 ? 'd' : 'p').join(''));
    paint(scene, 'marea', rows, { d: 0x2a1438, p: 0x4a2266, m: 0x7a3fa8, l: 0xc985ef });
  }
}

// Corruptor, Sombra de Error and its small shadows are the user's sprites (spriteFrames.ts, sliced by sheetTextures.ts);
// these are their texture keys. The Corruptor's round orb and the small fragment that every 4th debugged bug drops
// stay procedural placeholders.
export const BUG_TEXTURES = Object.freeze({
  corruptor: 'corruptor', corruptorSway: 'corruptor-b', corruptorCharge: 'corruptor-charge', corruptorFire: 'corruptor-fire', corruptorHit: 'corruptor-hit',
  sombra: 'sombra', sombraB: 'sombra-b', sombraC: 'sombra-c', sombraBlink: 'sombra-blink', sombraHit: 'sombra-hit',
  shadow: 'shadow', shadowB: 'shadow-b', shadowHit: 'shadow-hit', orb: 'corrupt-orb', fragmentSmall: 'fragment-small',
});
export function createBugTextures(scene: Phaser.Scene): void {
  paint(scene, BUG_TEXTURES.orb, ORB, ORB_COLORS);
  paint(scene, BUG_TEXTURES.fragmentSmall, FRAGMENT_SMALL, { g: 0xedc76c, l: 0xfff1c3, o: 0xa27c52 });
}

// Pickup frame keys (user sprites); the guardian also derives their four-green twins for REVERSE.
export const PICKUP_TEXTURES: Readonly<Record<PickupKind, string>> = Object.freeze({ rafaga: pickupTexture('rafaga'), escudo: pickupTexture('escudo'), corazon: pickupTexture('corazon') });

// One pre-colored atlas per text color; registered once in the shared cache and reused on restart.
// The atlas is ATLAS_HEIGHT tall: letters on the bottom 8 px line, accent marks in the rows above.
export function createRetroFont(scene: Phaser.Scene, color = 0xffffff): void {
  const font = fontKey(color);
  if (scene.cache.bitmapFont.exists(font)) return;
  const width = FONT_CHARACTERS.length * CELL_WIDTH;
  const g = scene.add.graphics().fillStyle(color);
  // Phaser reads xAdvance at runtime although its typedef omits it.
  const chars: Record<number, Phaser.Types.GameObjects.BitmapText.BitmapFontCharacterData & { xAdvance: number }> = {};
  [...FONT_CHARACTERS].forEach((char, index) => {
    const rows = GLYPHS[char], top = ATLAS_HEIGHT - CELL_HEIGHT - (rows.length - LETTER_ROWS);
    rows.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') g.fillRect(index * CELL_WIDTH + x, top + y, 1, 1);
    }));
    const cell = glyphCell(char, index);
    chars[char.charCodeAt(0)] = {
      x: cell.x, y: cell.y, width: cell.width, height: cell.height, centerX: Math.floor(cell.width / 2), centerY: Math.floor(cell.height / 2),
      xOffset: 0, yOffset: cell.yOffset, xAdvance: CELL_WIDTH, data: {}, kerning: {},
      u0: cell.x / width, v0: cell.y / ATLAS_HEIGHT, u1: (cell.x + cell.width) / width, v1: (cell.y + cell.height) / ATLAS_HEIGHT,
    };
  });
  g.generateTexture(font, width, ATLAS_HEIGHT);
  g.destroy();
  // Line height stays the 8 px cell, so multi-line spacing and every unaccented layout are unchanged.
  scene.cache.bitmapFont.add(font, { data: { font, size: CELL_WIDTH, lineHeight: CELL_HEIGHT, retroFont: true, chars }, frame: null, texture: font });
}

export function createRetroFonts(scene: Phaser.Scene): void {
  for (const color of FONT_COLORS) createRetroFont(scene, color);
}
