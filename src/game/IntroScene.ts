import Phaser from 'phaser';
import { createRetroFonts } from './textures';
import { CELL_WIDTH, fontKey } from './retroFont';
import { initialProgress } from './challengeRules';
import { oncePerEvent } from './rules';
import { FOCUS_EVENT, VIEW_EVENT, type ViewState } from './viewState';
import { motion } from './motion';
import { sfx } from './sfx';
import { clearDebug, exposeDebug } from './debug';
import { INTRO_SEEN_KEY, initialIntro, stepIntro, visibleCharacters, type IntroAction, type IntroState } from './introRules';
import { INTRO_CARDS, INTRO_HELP, wrapIntroText } from './introText';
import { arenaUrl } from './demoAssets';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';

interface EntryInput { entryKeys?: string[]; entryEvent?: KeyboardEvent }
const CONTROL_CODES = new Set(['Enter', 'Space', 'Escape']);
const LIGHT = 0xfff1c3, GOLD = 0xedc76c, TEAL = 0x59d3c4;

export class IntroScene extends Phaser.Scene {
  private state: IntroState = initialIntro();
  private focused = true;
  private skipDelta = true;
  private clock = 0;
  private held = new Set<string>();
  private fresh = oncePerEvent();
  private pendingBlip = true;
  private waitForRelease = false;
  private fullLines: string[] = [];
  private lines: Phaser.GameObjects.BitmapText[] = [];
  private number!: Phaser.GameObjects.BitmapText;
  constructor() { super('IntroScene'); }
  // Key bookkeeping starts here, before preload(): on a first visit preload downloads two textures, and the key that opened
  // the intro can be released while they load. A keyup that fires before the listener exists would leave it "held" forever,
  // and a manual skip would then wait for a release that never comes.
  init(data: EntryInput = {}): void {
    this.held = new Set(data.entryKeys ?? []); this.fresh = oncePerEvent(); this.fresh(data.entryEvent);
    window.addEventListener('keyup', this.keyUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  preload(): void {
    if (!this.textures.exists('amaru-arena')) this.load.image('amaru-arena', arenaUrl);
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation', kipuUrl);
  }
  create(): void {
    this.state = initialIntro(); this.clock = 0; this.focused = true; this.skipDelta = true;
    this.pendingBlip = true; this.waitForRelease = false;
    // Set only when this scene actually appears; bypassing to Amaru never consumes the intro.
    this.registry.set(INTRO_SEEN_KEY, true);
    createRetroFonts(this);
    this.add.image(0, 0, 'amaru-arena').setOrigin(0);
    this.add.graphics().fillStyle(0x07131c, 0.78).fillRect(0, 0, 320, 180)
      .fillStyle(TEAL, 0.6).fillRect(16, 148, 288, 1);
    this.add.image(160, 65, 'kipu-evaluation'); // image only, native size: no physics or collider
    this.number = this.add.bitmapText(16, 14, fontKey(GOLD), '', CELL_WIDTH);
    this.lines = [108, 124].map(y => this.add.bitmapText(16, y, fontKey(LIGHT), '', CELL_WIDTH));
    this.add.bitmapText(Math.round((320 - INTRO_HELP.length * CELL_WIDTH) / 2), 160, fontKey(TEAL), INTRO_HELP, CELL_WIDTH);
    this.showCard();
    this.input.keyboard!.on('keydown', this.keyDown, this);
    window.addEventListener('blur', this.blur);
    window.addEventListener('focus', this.focus);
    document.addEventListener('visibilitychange', this.visibility);
    this.game.events.on(FOCUS_EVENT, this.pageFocus, this);
    this.game.events.emit(VIEW_EVENT, { view: 'intro', outcome: 'playing', progress: { ...(this.registry.get('progress') ?? initialProgress()) } } satisfies ViewState);
    exposeDebug(() => ({
      scene: 'intro', card: this.state.card, elapsed: this.state.elapsed, clock: this.clock, done: this.state.done,
      text: INTRO_CARDS[this.state.card], displayText: this.lines.map(line => line.text).filter(Boolean).join('\n'),
      paused: !this.focused, focused: this.focused, reducedMotion: motion.reduced,
      seen: this.registry.get(INTRO_SEEN_KEY) === true, audio: sfx.stats(),
      progress: { ...(this.registry.get('progress') ?? initialProgress()) },
    }));
  }
  update(_time: number, delta: number): void {
    if (!this.focused) return;
    if (this.pendingBlip) { sfx.play('blip'); this.pendingBlip = false; }
    const dt = this.skipDelta ? 0 : Math.max(0, delta); this.skipDelta = false;
    const previous = this.state.card;
    this.state = stepIntro(this.state, dt, false); this.clock += dt;
    if (this.state.done) {
      // Manual completion waits for release so Esc cannot pause Route and Space cannot fire through the transition.
      if (!this.waitForRelease || ![...this.held].some(code => CONTROL_CODES.has(code))) {
        this.input.keyboard?.resetKeys(); this.scene.start('RouteScene');
      }
      return;
    }
    if (previous !== this.state.card) this.showCard();
    this.drawText();
  }
  private showCard(): void {
    this.fullLines = wrapIntroText(INTRO_CARDS[this.state.card]).split('\n');
    this.number.setText(`${this.state.card + 1}/4`);
    this.lines.forEach((line, i) => line.setX(Math.round((320 - (this.fullLines[i]?.length ?? 0) * CELL_WIDTH) / 2)).setText(''));
    this.pendingBlip = true; this.drawText();
  }
  private drawText(): void {
    const full = this.fullLines.join('\n');
    const typed = full.slice(0, visibleCharacters(full.length, this.state.elapsed, motion.reduced)).split('\n');
    this.lines.forEach((line, i) => line.setText(typed[i] ?? ''));
  }
  private keyDown(event: KeyboardEvent): void {
    if (!this.focused || event.repeat || !CONTROL_CODES.has(event.code) || !this.fresh(event) || this.held.has(event.code)) return;
    this.held.add(event.code);
    const action: IntroAction = event.code === 'Escape' ? 'skip' : 'advance';
    this.state = stepIntro(this.state, 0, false, action);
    if (this.state.done) this.waitForRelease = true; else this.showCard();
  }
  // Native keyup still arrives while the DOM navigation disables Phaser keyboard input.
  private keyUp = (event: KeyboardEvent): void => { this.held.delete(event.code); };
  private blur = (): void => { this.focused = false; this.held.clear(); };
  private focus = (): void => {
    if (document.hasFocus() && !document.hidden && document.activeElement?.id === 'game') { this.focused = true; this.skipDelta = true; }
  };
  private visibility = (): void => { if (document.hidden) this.blur(); else this.focus(); };
  private pageFocus(active: boolean): void { if (active) this.focus(); else this.focused = false; }
  private shutdown(): void {
    this.input.keyboard?.off('keydown', this.keyDown, this); this.input.keyboard?.resetKeys();
    window.removeEventListener('keyup', this.keyUp); window.removeEventListener('blur', this.blur); window.removeEventListener('focus', this.focus);
    document.removeEventListener('visibilitychange', this.visibility);
    this.game.events.off(FOCUS_EVENT, this.pageFocus, this); this.held.clear(); clearDebug();
  }
}
