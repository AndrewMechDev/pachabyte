import Phaser from 'phaser';
import { GAME } from './rules';
import { RETRO_FONT, CELL_WIDTH } from './retroFont';
import { HEART, formatScore, heartStates, meterFill, type MeterStyle } from './hudRules';
import { NOKIA } from './nokiaPalette';
import { TEXT } from './text';

const NORMAL = { bar: 0x16343c, line: 0x3a6770, heart: 0xe86a5a, empty: 0x3a6770, meter: 0x59d3c4, full: 0xfff1c3, text: 0xfff1c3 };
const GREEN = { bar: NOKIA[0], line: NOKIA[1], heart: NOKIA[3], empty: NOKIA[1], meter: NOKIA[2], full: NOKIA[3], text: 0xffffff };
const METER = { x: 92, y: 5, width: 40, height: 6 };

// meterStyle/meterLevel come from meterDisplay() in the guardian; the route derives them from the meter alone.
export interface HudValues { hp: number; maxHp: number; meter: number; score: number; now: number; meterStyle?: MeterStyle; meterLevel?: number; reduced?: boolean }

// Top bar (16 px): pixel hearts for HP, the ENERGÍA meter and a six-digit score. Fixed to the screen.
export class Hud {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly energy: Phaser.GameObjects.BitmapText;
  private readonly score: Phaser.GameObjects.BitmapText;
  private nokia = false;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(40);
    this.energy = scene.add.bitmapText(46, 4, RETRO_FONT, TEXT.energy, CELL_WIDTH).setScrollFactor(0).setDepth(41).setTint(NORMAL.text);
    this.score = scene.add.bitmapText(GAME.width - 4 - 6 * CELL_WIDTH, 4, RETRO_FONT, formatScore(0), CELL_WIDTH).setScrollFactor(0).setDepth(41).setTint(NORMAL.text);
  }

  get scoreText(): string { return this.score.text; }

  // Canvas BitmapText ignores tint, so the four-green mode switches to a native green atlas.
  setPalette(nokia: boolean): void {
    this.nokia = nokia;
    for (const label of [this.energy, this.score]) label.setFont(RETRO_FONT + (nokia ? '-nokia' : ''), CELL_WIDTH).setTint(nokia ? 0xffffff : NORMAL.text);
  }

  draw(values: HudValues): void {
    const c = this.nokia ? GREEN : NORMAL;
    const g = this.g.clear();
    g.fillStyle(c.bar).fillRect(0, 0, GAME.width, GAME.hudHeight - 1);
    g.fillStyle(c.line).fillRect(0, GAME.hudHeight - 1, GAME.width, 1);
    heartStates(values.hp, values.maxHp).forEach((full, index) => {
      g.fillStyle(full ? c.heart : c.empty);
      HEART.forEach((row, y) => [...row].forEach((pixel, x) => {
        // Empty hearts keep only their outline so the count reads by shape, not by color alone.
        const edge = HEART[y - 1]?.[x] !== '1' || HEART[y + 1]?.[x] !== '1' || row[x - 1] !== '1' || row[x + 1] !== '1';
        if (pixel === '1' && (full || edge)) g.fillRect(4 + index * 9 + x, 5 + y, 1, 1);
      }));
    });
    const style: MeterStyle = values.meterStyle ?? (values.meter >= 100 ? 'ready' : 'charging');
    const inner = METER.width - 2, top = METER.y + 1, height = METER.height - 2;
    const fill = values.meterLevel === undefined ? meterFill(values.meter, inner) : Math.round(Math.min(1, Math.max(0, values.meterLevel)) * inner);
    g.fillStyle(c.line).fillRect(METER.x, METER.y, METER.width, METER.height);
    g.fillStyle(c.bar).fillRect(METER.x + 1, top, inner, height);
    if (style === 'ready') {
      // A full meter glows by alternating fill colors; the pulse is slow and never flashes the screen.
      g.fillStyle(!values.reduced && Math.floor(values.now / 300) % 2 === 0 ? c.full : c.meter).fillRect(METER.x + 1, top, fill, height);
    } else if (style === 'draining') {
      g.fillStyle(c.full).fillRect(METER.x + 1, top, fill, height);
    } else if (style === 'recovering') {
      // Striped refill: the meter fills again but reads as locked until RECOVERY ends.
      g.fillStyle(c.meter);
      for (let x = 0; x < fill; x += 2) g.fillRect(METER.x + 1 + x, top, 1, height);
    } else if (style === 'returning') {
      g.fillStyle(c.full);
      for (let x = 1; x < inner; x += 4) g.fillRect(METER.x + 1 + x, top + 1, 2, height - 2);
    } else g.fillStyle(c.meter).fillRect(METER.x + 1, top, fill, height);
    const text = formatScore(values.score);
    if (this.score.text !== text) this.score.setText(text);
  }
}

export interface BossValues { hp: number; maxHp: number; phase: number; shield: number; shieldMax: number; shieldUp: boolean; vulnerable: boolean; now: number }

// Amaru's HUD below the top bar on the right: name and HP bar, phase indicator and shield pips.
export class BossHud {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.BitmapText;
  private readonly phase: Phaser.GameObjects.BitmapText;
  private nokia = false;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(40);
    this.name = scene.add.bitmapText(236, 18, RETRO_FONT, TEXT.guardianName, CELL_WIDTH).setScrollFactor(0).setDepth(41).setTint(NORMAL.text);
    this.phase = scene.add.bitmapText(236, 27, RETRO_FONT, '', CELL_WIDTH).setScrollFactor(0).setDepth(41).setTint(NORMAL.text);
  }

  get phaseText(): string { return this.phase.text; }

  setPalette(nokia: boolean): void {
    this.nokia = nokia;
    for (const label of [this.name, this.phase]) label.setFont(RETRO_FONT + (nokia ? '-nokia' : ''), CELL_WIDTH).setTint(nokia ? 0xffffff : NORMAL.text);
  }

  setVisible(visible: boolean): void { for (const item of [this.g, this.name, this.phase]) item.setVisible(visible); }

  draw(v: BossValues): void {
    const c = this.nokia ? GREEN : NORMAL, g = this.g.clear();
    const x = 268, width = 48, fill = Math.round(width * Math.max(0, v.hp) / v.maxHp);
    g.fillStyle(c.line).fillRect(x, 19, width, 5).fillStyle(c.meter).fillRect(x, 19, fill, 5);
    // Phase boundaries (HP 66 and 33) marked on the bar so the next phase is readable in advance.
    g.fillStyle(c.bar).fillRect(x + Math.round(width * 66 / v.maxHp), 19, 1, 5).fillRect(x + Math.round(width * 33 / v.maxHp), 19, 1, 5);
    const label = `${TEXT.phaseLabel} ${v.phase}`;
    if (this.phase.text !== label) this.phase.setText(label);
    if (v.phase < 2) return;
    // Shield pips: filled while standing, outlined once lost; an open window hides them behind a bright bar.
    for (let i = 0; i < v.shieldMax; i++) {
      const px = 276 + i * 6, standing = v.shieldUp && i < v.shield;
      g.fillStyle(standing ? c.full : c.line).fillRect(px, 28, 4, 4);
      if (!standing) g.fillStyle(c.bar).fillRect(px + 1, 29, 2, 2);
    }
    if (v.vulnerable) g.fillStyle(c.full).fillRect(276, 33, 6 * v.shieldMax - 2, 1);
  }
}

// "PAUSA / ESC: CONTINUAR" panel, fixed to the screen and hidden until the player pauses.
// Filled integer rectangles instead of strokes keep Canvas from antialiasing extra colors.
export class PauseOverlay {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.BitmapText[];

  constructor(scene: Phaser.Scene) {
    const cx = GAME.width / 2, cy = GAME.height / 2;
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(60).setVisible(false);
    this.labels = [TEXT.pause, TEXT.pauseHelp].map((text, row) => scene.add.bitmapText(Math.round(cx - text.length * CELL_WIDTH / 2), cy - 10 + row * 12, RETRO_FONT, text, CELL_WIDTH)
      .setScrollFactor(0).setDepth(61).setVisible(false));
    this.setPalette(false);
  }

  get visible(): boolean { return this.panel.visible; }
  setVisible(visible: boolean): void { this.panel.setVisible(visible); for (const label of this.labels) label.setVisible(visible); }
  setPalette(nokia: boolean): void {
    const c = nokia ? GREEN : NORMAL, x = GAME.width / 2 - 64, y = GAME.height / 2 - 18;
    this.panel.clear().fillStyle(c.line).fillRect(x, y, 128, 36).fillStyle(c.bar).fillRect(x + 1, y + 1, 126, 34);
    this.labels.forEach((label, row) => label.setFont(RETRO_FONT + (nokia ? '-nokia' : ''), CELL_WIDTH).setTint(nokia ? 0xffffff : row ? NORMAL.text : 0xedc76c));
  }
}
