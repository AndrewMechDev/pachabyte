import Phaser from 'phaser';
import { GAME } from './rules';
import { CELL_WIDTH, fontKey } from './retroFont';
import { HEART, RAFAGA_BAR, comboLabel, formatScore, heartStates, meterFill, type MeterStyle } from './hudRules';
import { SHIELD_ICON } from './pickupArt';
import { NOKIA } from './nokiaPalette';
import { TEXT } from './text';

const NORMAL = { bar: 0x16343c, line: 0x3a6770, heart: 0xe86a5a, empty: 0x3a6770, meter: 0x59d3c4, full: 0xfff1c3, text: 0xfff1c3, title: 0xedc76c, shield: 0x7fb8ff, rafaga: 0xf2a65a, leak: 0xc985ef };
const GREEN = { bar: NOKIA[0], line: NOKIA[1], heart: NOKIA[3], empty: NOKIA[1], meter: NOKIA[2], full: NOKIA[3], text: NOKIA[3], shield: NOKIA[2], rafaga: NOKIA[3], leak: NOKIA[3] };
const METER = { x: 92, y: 5, width: 40, height: 6 };

// meterStyle/meterLevel come from meterDisplay() in the guardian; the route derives them from the meter alone.
// combo is the racha multiplier (x1 hides the label); comboHot briefly colors it gold after a tier-up.
// shield shows the Escudo icon after the hearts; rafaga is the 0..1 Ráfaga time left (0 hides its bar).
export interface HudValues {
  hp: number; maxHp: number; meter: number; score: number; now: number; meterStyle?: MeterStyle; meterLevel?: number; reduced?: boolean;
  combo?: number; comboHot?: boolean; shield?: boolean; rafaga?: number;
  // A2 Memory Leak: the meter is being drained (violet frame and a small down arrow after the bar).
  leaking?: boolean;
}

// Top bar (16 px): pixel hearts for HP, the ENERGÍA meter and a six-digit score. Fixed to the screen.
export class Hud {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly energy: Phaser.GameObjects.BitmapText;
  private readonly score: Phaser.GameObjects.BitmapText;
  private readonly combo: Phaser.GameObjects.BitmapText;
  private readonly rafaga: Phaser.GameObjects.BitmapText;
  private shieldShown = false;
  private leakShown = false;
  private comboFont = '';
  private nokia = false;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(40);
    this.energy = scene.add.bitmapText(46, 4, fontKey(NORMAL.text), TEXT.energy, CELL_WIDTH).setScrollFactor(0).setDepth(41);
    this.score = scene.add.bitmapText(GAME.width - 4 - 6 * CELL_WIDTH, 4, fontKey(NORMAL.text), formatScore(0), CELL_WIDTH).setScrollFactor(0).setDepth(41);
    // "RACHA ×N" between the meter and the score.
    this.combo = scene.add.bitmapText(142, 4, fontKey(NORMAL.text), '', CELL_WIDTH).setScrollFactor(0).setDepth(41);
    // "RÁFAGA" and its draining bar between the racha and the score, only while the power-up runs.
    this.rafaga = scene.add.bitmapText(RAFAGA_BAR.labelX, 4, fontKey(NORMAL.text), TEXT.rafaga, CELL_WIDTH).setScrollFactor(0).setDepth(41).setVisible(false);
  }

  get scoreText(): string { return this.score.text; }
  get comboText(): string { return this.combo.text; }
  get rafagaText(): string { return this.rafaga.visible ? this.rafaga.text : ''; }
  get shieldIcon(): boolean { return this.shieldShown; }
  get leakIcon(): boolean { return this.leakShown; }

  // Canvas BitmapText ignores tint, so colors come from pre-colored atlases; four-green mode uses the Nokia one.
  setPalette(nokia: boolean): void {
    this.nokia = nokia;
    for (const label of [this.energy, this.score, this.rafaga]) label.setFont(fontKey((nokia ? GREEN : NORMAL).text), CELL_WIDTH);
    this.comboFont = '';
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
    // Escudo icon right after the hearts (a small closed outline, steady, never flashing).
    this.shieldShown = values.shield === true;
    if (this.shieldShown) {
      const left = 4 + values.maxHp * 9 - 1;
      g.fillStyle(c.shield);
      SHIELD_ICON.forEach((row, y) => [...row].forEach((pixel, x) => { if (pixel === '1') g.fillRect(left + x, 5 + y, 1, 1); }));
    }
    const level = Math.min(1, Math.max(0, values.rafaga ?? 0));
    this.rafaga.setVisible(level > 0);
    if (level > 0) {
      const b = RAFAGA_BAR;
      g.fillStyle(c.line).fillRect(b.x, b.y, b.width, b.height).fillStyle(c.bar).fillRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
      g.fillStyle(c.rafaga).fillRect(b.x + 1, b.y + 1, Math.ceil(level * (b.width - 2)), b.height - 2);
    }
    const style: MeterStyle = values.meterStyle ?? (values.meter >= 100 ? 'ready' : 'charging');
    const inner = METER.width - 2, top = METER.y + 1, height = METER.height - 2;
    const fill = values.meterLevel === undefined ? meterFill(values.meter, inner) : Math.round(Math.min(1, Math.max(0, values.meterLevel)) * inner);
    this.leakShown = values.leaking === true;
    g.fillStyle(this.leakShown ? c.leak : c.line).fillRect(METER.x, METER.y, METER.width, METER.height);
    g.fillStyle(c.bar).fillRect(METER.x + 1, top, inner, height);
    if (this.leakShown) {
      // A steady 5x3 down arrow right after the bar: energy flows out.
      const ax = METER.x + METER.width + 2, ay = METER.y + 1;
      g.fillStyle(c.leak).fillRect(ax, ay, 5, 1).fillRect(ax + 1, ay + 1, 3, 1).fillRect(ax + 2, ay + 2, 1, 1);
    }
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
    const label = comboLabel(values.combo ?? 1);
    if (this.combo.text !== label) this.combo.setText(label);
    // A tier-up colors the label gold for a moment (a color step, never a flash); four-green mode keeps one green.
    const font = fontKey(this.nokia ? GREEN.text : values.comboHot ? NORMAL.title : NORMAL.text);
    if (font !== this.comboFont) { this.combo.setFont(font, CELL_WIDTH); this.comboFont = font; }
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
    this.name = scene.add.bitmapText(236, 18, fontKey(NORMAL.text), TEXT.guardianName, CELL_WIDTH).setScrollFactor(0).setDepth(41);
    this.phase = scene.add.bitmapText(236, 27, fontKey(NORMAL.text), '', CELL_WIDTH).setScrollFactor(0).setDepth(41);
  }

  get phaseText(): string { return this.phase.text; }

  setPalette(nokia: boolean): void {
    this.nokia = nokia;
    for (const label of [this.name, this.phase]) label.setFont(fontKey((nokia ? GREEN : NORMAL).text), CELL_WIDTH);
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
    this.labels = [TEXT.pause, TEXT.pauseHelp].map((text, row) => scene.add.bitmapText(Math.round(cx - text.length * CELL_WIDTH / 2), cy - 10 + row * 12, fontKey(NORMAL.text), text, CELL_WIDTH)
      .setScrollFactor(0).setDepth(61).setVisible(false));
    this.setPalette(false);
  }

  get visible(): boolean { return this.panel.visible; }
  setVisible(visible: boolean): void { this.panel.setVisible(visible); for (const label of this.labels) label.setVisible(visible); }
  setPalette(nokia: boolean): void {
    const c = nokia ? GREEN : NORMAL, x = GAME.width / 2 - 64, y = GAME.height / 2 - 18;
    this.panel.clear().fillStyle(c.line).fillRect(x, y, 128, 36).fillStyle(c.bar).fillRect(x + 1, y + 1, 126, 34);
    this.labels.forEach((label, row) => label.setFont(fontKey(nokia ? GREEN.text : row ? NORMAL.text : NORMAL.title), CELL_WIDTH));
  }
}
