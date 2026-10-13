import Phaser from 'phaser';
import { createRetroFonts } from './textures';
import { CELL_WIDTH, fontKey } from './retroFont';
import { initialProgress, nodeState, type Progress } from './challengeRules';
import { RUN_KEY } from './routeRules';
import { CORRUPTED, convertPixels } from './nokiaPalette';
import { VIEW_EVENT, type ViewState } from './viewState';
import { headUrl, arenaUrl } from './demoAssets';
import { bossAngle, kipuFrame, kipuTextureKey } from './animation';
import { ensureKipuFrames } from './kipuTextures';
import { motion } from './motion';
import { TEXT } from './text';
import { clearDebug, exposeDebug } from './debug';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';
import { sfx } from './sfx';

const LIGHT = 0xfff1c3, GOLD = 0xedc76c, TEAL = 0x59d3c4, VIOLET = 0xc985ef, DIM = 0x3a6770;
const LOCKED_NODES = [[296, 44], [304, 70], [292, 96]] as const;

export class MapScene extends Phaser.Scene {
  private head!: Phaser.GameObjects.Image;
  private cursor!: Phaser.GameObjects.Graphics;
  private kipu!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.BitmapText;
  private titleStart = 0;
  private titleDone = true;
  constructor() { super('MapScene'); }
  preload(): void {
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation', kipuUrl);
    if (!this.textures.exists('amaru-head')) this.load.image('amaru-head', headUrl);
    if (!this.textures.exists('amaru-arena')) this.load.image('amaru-arena', arenaUrl);
  }
  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    createRetroFonts(this);
    this.cameras.main.setBackgroundColor(0x122e36);
    // The title types in once per session; every later visit is instant (keyboard-initiated returns never animate).
    this.title = this.centered(8, TEXT.mapTitle, GOLD);
    this.titleDone = motion.reduced || this.registry.get('introSeen') === true;
    this.titleStart = -1; // anchored to the first update frame
    if (!this.titleDone) this.title.setText('');
    this.registry.set('introSeen', true);
    ensureKipuFrames(this);
    const state = nodeState(this.progress);
    this.prepareCorrupted();
    // The Arequipa node: purple corruption until Amaru is freed, the original colors afterwards.
    const thumb = this.add.image(80, 66, state === 'restored' ? 'amaru-arena' : 'amaru-arena-corrupt').setDisplaySize(112, 63);
    const frame = this.add.graphics();
    frame.fillStyle(state === 'restored' ? TEAL : VIOLET).fillRect(thumb.x - 57, thumb.y - 33, 114, 1).fillRect(thumb.x - 57, thumb.y + 32, 114, 1)
      .fillRect(thumb.x - 57, thumb.y - 33, 1, 66).fillRect(thumb.x + 56, thumb.y - 33, 1, 66);
    this.kipu = this.add.image(170, 76, 'kipu-evaluation');
    this.head = this.add.image(232, 66, 'amaru-head');
    // Other routes exist but stay locked and unnamed (their order is not approved).
    for (const [x, y] of LOCKED_NODES) {
      for (let dx = 268; dx < x - 4; dx += 4) frame.fillStyle(DIM).fillRect(dx, y, 2, 1);
      frame.fillStyle(DIM).fillRect(x - 3, y - 3, 7, 7).fillStyle(0x122e36).fillRect(x - 2, y - 2, 5, 5).fillStyle(DIM).fillRect(x - 1, y - 1, 3, 3);
    }
    this.cursor = this.add.graphics();
    this.centered(108, TEXT.mapNode);
    this.centered(120, state === 'restored' ? TEXT.mapRestored : TEXT.mapCorrupted, state === 'restored' ? TEAL : VIOLET);
    this.text(76, 138, TEXT.mapStart, GOLD);
    this.text(76, 150, TEXT.mapGuardian);
    this.centered(168, TEXT.mapLocked, DIM);
    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-ENTER', this.startRoute, this);
    keyboard.on('keydown-ONE', this.startRoute, this);
    keyboard.on('keydown-TWO', this.startGuardian, this);
    this.game.events.emit(VIEW_EVENT, { view: 'map', outcome: 'playing', progress: { ...this.progress } } satisfies ViewState);
    exposeDebug(() => ({ scene: 'map', audio: sfx.stats(), selected: 'route', progress: { ...this.progress }, node: nodeState(this.progress), otherRoutesLocked: true }));
    this.events.once('shutdown', () => {
      keyboard.off('keydown-ENTER', this.startRoute, this).off('keydown-ONE', this.startRoute, this).off('keydown-TWO', this.startGuardian, this);
      keyboard.resetKeys(); clearDebug();
    });
  }
  // Purely visual: idle sway on the guardian preview, Kipu's hover breath and a bobbing pixel cursor.
  update(time: number): void {
    const reduced = motion.reduced;
    this.head.setAngle(reduced ? 0 : bossAngle('idle', 0, time));
    this.kipu.setTexture(kipuTextureKey(reduced ? 'idle' : kipuFrame({ velocityY: 0, now: time }), false));
    if (!this.titleDone) {
      if (this.titleStart < 0) this.titleStart = time;
      const shown = Math.floor((time - this.titleStart) / 30);
      this.title.setText(TEXT.mapTitle.slice(0, Math.max(0, shown)));
      this.titleDone = shown >= TEXT.mapTitle.length;
    }
    const nudge = reduced ? 0 : Math.floor(time / 400) % 2;
    this.cursor.clear().fillStyle(GOLD);
    for (let column = 0; column < 4; column++) this.cursor.fillRect(66 + nudge + column, 138 + column, 1, 7 - 2 * column);
  }
  private get progress(): Progress { return this.registry.get('progress'); }
  private text(x: number, y: number, text: string, color = LIGHT): Phaser.GameObjects.BitmapText { return this.add.bitmapText(x, y, fontKey(color), text, CELL_WIDTH); }
  private centered(y: number, text: string, color = LIGHT): Phaser.GameObjects.BitmapText { return this.text(Math.round((320 - text.length * CELL_WIDTH) / 2), y, text, color); }
  // Derived purple texture (Canvas ignores tint): same pixels and alpha, luminance mapped to the corruption ramp.
  private prepareCorrupted(): void {
    if (this.textures.exists('amaru-arena-corrupt')) return;
    const image = this.textures.get('amaru-arena').getSourceImage() as HTMLImageElement;
    const canvas = this.textures.createCanvas('amaru-arena-corrupt', image.width, image.height)!;
    canvas.context.drawImage(image, 0, 0);
    const data = canvas.context.getImageData(0, 0, image.width, image.height);
    data.data.set(convertPixels(data.data, CORRUPTED));
    canvas.context.putImageData(data, 0, 0); canvas.refresh();
  }
  private startRoute(): void { sfx.play('select'); this.input.keyboard?.resetKeys(); this.scene.start('RouteScene'); }
  // Direct entry from the map: a fresh 4 HP, empty-meter run state.
  private startGuardian(): void { sfx.play('select'); this.registry.remove(RUN_KEY); this.input.keyboard?.resetKeys(); this.scene.start('GuardianScene'); }
}
