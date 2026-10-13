import Phaser from 'phaser';
import { createRetroFont } from './textures';
import { RETRO_FONT } from './retroFont';
import { initialProgress, type Progress } from './challengeRules';
import { VIEW_EVENT, type ViewState } from './viewState';
import { headUrl, arenaUrl } from './demoAssets';
import { bossAngle, kipuFrame, kipuTextureKey } from './animation';
import { ensureKipuFrames } from './kipuTextures';
import { motion } from './motion';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';
import { sfx } from './sfx';

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
    createRetroFont(this);
    this.cameras.main.setBackgroundColor(0x122e36);
    // The title types in once per session; every later visit is instant (keyboard-initiated returns never animate).
    this.title = this.text(46, 12, 'CHOOSE YOUR CHALLENGE', 0xedc76c);
    this.titleDone = motion.reduced || this.registry.get('introSeen') === true;
    this.titleStart = -1; // anchored to the first update frame
    if (!this.titleDone) this.title.setText('');
    this.registry.set('introSeen', true);
    ensureKipuFrames(this);
    this.kipu = this.add.image(176, 94, 'kipu-evaluation');
    this.add.image(86, 78, 'amaru-arena').setDisplaySize(128,72).setAlpha(0.65);
    this.head = this.add.image(232, 78, 'amaru-head');
    this.cursor = this.add.graphics();
    this.text(25, 120, '1 EXPLORE AREQUIPA');
    this.text(184, 120, '2 PLAY AMARU');
    this.text(67, 139, 'ENTER: PLAY AMARU', 0xedc76c);
    const p = this.progress;
    this.text(16, 160, `TARGETS ${p.training?'CLEARED':'NOT CLEARED'} / AMARU ${p.guardian?'CLEARED':'NOT CLEARED'}`);
    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-ONE', this.startTraining, this);
    keyboard.on('keydown-TWO', this.startGuardian, this);
    keyboard.on('keydown-ENTER', this.startGuardian, this);
    this.game.events.emit(VIEW_EVENT, { view:'map', outcome:'playing', progress:{...p} } satisfies ViewState);
    if (new URLSearchParams(location.search).get('debug') === '1') Object.defineProperty(window,'pachaDebug',{ configurable:true, value: () => ({ scene:'map', audio:sfx.stats(), selected:2, progress:{...this.progress}, locked:false }) });
    this.events.once('shutdown', () => {
      keyboard.off('keydown-ONE',this.startTraining,this).off('keydown-TWO',this.startGuardian,this).off('keydown-ENTER',this.startGuardian,this);
      keyboard.resetKeys(); Reflect.deleteProperty(window,'pachaDebug');
    });
  }
  // Purely visual: idle sway on the guardian preview and a bobbing pixel cursor beside the default action.
  update(time: number): void {
    const reduced = motion.reduced;
    this.head.setAngle(reduced ? 0 : bossAngle('idle', 0, time));
    const frame = reduced ? 'idle' : kipuFrame({ grounded: true, velocityX: 0, velocityY: 0, now: time, landedAt: -Infinity });
    this.kipu.setTexture(kipuTextureKey(frame, false));
    if (!this.titleDone) {
      if (this.titleStart < 0) this.titleStart = time;
      const full = 'CHOOSE YOUR CHALLENGE', shown = Math.floor((time - this.titleStart) / 30);
      this.title.setText(full.slice(0, Math.max(0, shown)));
      this.titleDone = shown >= full.length;
    }
    const nudge = reduced ? 0 : Math.floor(time / 400) % 2;
    this.cursor.clear().fillStyle(0xedc76c);
    for (let column = 0; column < 4; column++) this.cursor.fillRect(57 + nudge + column, 139 + column, 1, 7 - 2 * column);
  }
  private get progress(): Progress { return this.registry.get('progress'); }
  private text(x:number,y:number,text:string,color=0xfff1c3): Phaser.GameObjects.BitmapText { return this.add.bitmapText(x,y,RETRO_FONT,text,6).setTint(color); }
  private startTraining(): void { sfx.play('select'); this.input.keyboard?.resetKeys(); this.scene.start('ArcadeScene'); }
  private startGuardian(): void { sfx.play('select'); this.input.keyboard?.resetKeys(); this.scene.start('GuardianScene'); }
}
