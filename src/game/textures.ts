import Phaser from 'phaser';
import { RETRO_FONT, CELL_WIDTH, CELL_HEIGHT, FONT_CHARACTERS, GLYPHS } from './retroFont';

// Original procedural placeholders. These are not animation spritesheets.
export function createTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('kipu')) return;
  const g = scene.add.graphics();
  g.fillStyle(0x163c43).fillRect(4, 2, 9, 16);
  g.fillStyle(0x59d3c4).fillRect(3, 5, 10, 12).fillRect(5, 2, 7, 8);
  g.fillStyle(0xedc76c).fillRect(2, 1, 3, 6).fillRect(12, 1, 3, 6);
  g.fillRect(4, 13, 8, 3).fillRect(3, 18, 4, 2).fillRect(10, 18, 4, 2);
  g.fillStyle(0x122e36).fillRect(9, 6, 2, 2);
  g.fillStyle(0xf1efdb).fillRect(11, 9, 3, 2);
  g.generateTexture('kipu', 16, 20);
  g.clear().fillStyle(0xedc76c).fillRect(0, 0, 6, 3);
  g.fillStyle(0xfff3bf).fillRect(4, 0, 2, 3);
  g.generateTexture('bullet', 6, 3);
  g.clear().fillStyle(0x493d35).fillRect(0, 0, 16, 8);
  g.fillStyle(0xa27c52).fillRect(0, 2, 16, 3);
  g.fillStyle(0xf1d18b).fillRect(0, 0, 16, 2);
  g.fillStyle(0x70563e).fillRect(2, 5, 4, 1).fillRect(10, 5, 4, 1);
  g.generateTexture('platform', 16, 8);
  g.clear().fillStyle(0x473f43).fillRect(0, 0, 14, 20);
  g.fillStyle(0xe2a170).fillRect(1, 1, 12, 18);
  g.fillStyle(0x8d584e).fillRect(3, 4, 8, 12);
  g.fillStyle(0xedc76c).fillRect(5, 7, 4, 6);
  g.generateTexture('target', 14, 20);
  g.destroy();
}

// Register once in the shared cache; restarting the scene reuses the native atlas.
export function createRetroFont(scene: Phaser.Scene, font = RETRO_FONT, color = 0xffffff): void {
  if (scene.cache.bitmapFont.exists(font)) return;
  const g = scene.add.graphics().fillStyle(color);
  [...FONT_CHARACTERS].forEach((char, index) => {
    GLYPHS[char].forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === '1') g.fillRect(index * CELL_WIDTH + x, y, 1, 1);
      });
    });
  });
  g.generateTexture(font, FONT_CHARACTERS.length * CELL_WIDTH, CELL_HEIGHT);
  g.destroy();
  scene.cache.bitmapFont.add(font, Phaser.GameObjects.RetroFont.Parse(scene, {
    image: font, width: CELL_WIDTH, height: CELL_HEIGHT,
    chars: FONT_CHARACTERS, charsPerRow: FONT_CHARACTERS.length,
    'offset.x': 0, 'offset.y': 0, 'spacing.x': 0, 'spacing.y': 0, lineSpacing: 0,
  }));
}

// Independent native graphics preserve the invisible static body's original bounds.
export function drawStoneSurface(scene: Phaser.Scene, x: number, y: number, width: number, height: number): void {
  const g = scene.add.graphics().setDepth(-1);
  g.fillStyle(0x8f8066).fillRect(x, y, width, height);
  g.fillStyle(0xd5c5a1).fillRect(x, y + 1, width, height - 3);
  g.fillStyle(0xf1d799).fillRect(x, y, width, 1);
  g.fillStyle(0x655d50).fillRect(x, y + height - 2, width, 2);
  for (let column = 12; column < width; column += 18) {
    g.fillStyle(0xad9d7e).fillRect(x + column, y + 2, 1, Math.min(3, height - 4));
  }
  if (height > 8) {
    g.fillStyle(0xb2a17f).fillRect(x, y + 7, width, 1);
    for (let column = 4; column < width - 1; column += 18) {
      g.fillStyle(0xa29173).fillRect(x + column, y + 8, 1, height - 10);
      g.fillStyle(0xe1cfaa).fillRect(x + column + 4, y + 4, 2, 1);
      g.fillStyle(0x8f8066).fillRect(x + column + 8, y + 10, 2, 1);
    }
  }
}

// Provisional original native art; decorative roofs never use the playable gold rim.
export function drawScenery(scene: Phaser.Scene, width: number): void {
  const sky = scene.add.graphics().setScrollFactor(0.25).setDepth(-10);
  sky.fillStyle(0x243d4a).fillRect(0, 0, width, 180);
  sky.fillStyle(0x958e69).fillRect(235, 29, 12, 12);
  sky.fillStyle(0x294552).fillRect(0, 112, width, 68);
  for (let x = -60; x < width; x += 240) {
    sky.fillStyle(0x314b5a).fillTriangle(x, 140, x + 100, 47, x + 215, 140);
    sky.fillStyle(0x3c5662).fillTriangle(x + 100, 47, x + 127, 112, x + 215, 140);
    sky.fillStyle(0x526771).fillTriangle(x + 86, 61, x + 100, 47, x + 114, 61);
    sky.fillStyle(0x465e69).fillTriangle(x + 98, 60, x + 103, 69, x + 114, 61);
    sky.fillStyle(0x304a55).fillTriangle(x - 25, 147, x + 25, 110, x + 110, 147);
    sky.fillStyle(0x354e59).fillTriangle(x + 100, 153, x + 167, 119, x + 236, 153);
  }
  const town = scene.add.graphics().setScrollFactor(0.65).setDepth(-5);
  for (let x = 0, index = 0; x < width; x += 84, index += 1) {
    const height = [29, 46, 34, 41][index % 4];
    const top = 154 - height;
    town.fillStyle(index % 2 ? 0x47616a : 0x425d67).fillRect(x, top, 62, height);
    town.fillStyle(0x506a72).fillRect(x, top, 62, 2);
    town.fillStyle(0x3c5661).fillRect(x + 54, top + 2, 8, height - 2);
    for (let row = top + 9; row < 154; row += 9) {
      town.fillStyle(0x4b656d).fillRect(x + 1, row, 52, 1);
    }
    for (const offset of [10, 39]) {
      town.fillStyle(0x304a55).fillRect(x + offset, top + 9, 8, 10);
      town.fillStyle(0x304a55).fillRect(x + offset + 2, top + 7, 4, 2);
    }
    town.fillStyle(0x304a55).fillRect(x + 25, 141, 10, 13).fillRect(x + 27, 138, 6, 3);
    if (index % 3 === 1) {
      town.fillStyle(0x405b65).fillRect(x + 6, top - 5, 20, 5);
      town.fillStyle(0x4d6770).fillRect(x + 6, top - 5, 20, 1);
    }
  }
}
