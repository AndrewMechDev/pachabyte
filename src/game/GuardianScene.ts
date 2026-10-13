import Phaser from 'phaser';
import { GAME, flight, canShoot, frameDelta, oncePerEvent, type Facing } from './rules';
import { boltExpired, type Outcome } from './combatRules';
import {
  REVERSE, activateReverse, advanceClocks, awakenCore, captureBolt, chargeReverse, initialReverse, isSlow, resolveReturn, shiftCue,
  tickReverse, worldScale, type Clocks, type Reverse,
} from './reverseRules';
import {
  AMARU, attackFor, attackStage, bodyPositions, capturable, checkpointAt, emissionVelocity, emissionsDue, headPosition, hitBoss, initialBoss,
  isVulnerable, mouthOf, openWindow, resumeFrom, shieldBlocks, shieldRing, tickBoss, victoryReady, waveGapY, waveHits, waveX,
  type Attack, type AttackKind, type Boss, type Checkpoint, type Emission, type HitKind, type Phase, type Stage,
} from './amaruRules';
import { coach, initialCoach, type Coach, type CoachEvent } from './coachRules';
import { advanceLiberation, resultLines, stageProgress, startLiberation, tickLiberation, variantKey, type Liberation } from './liberationRules';
import { ARENA, ARENA_DIM, BODY_TEXTURES, BOLT_TEXTURES, HEAD, HEAD_FLASH, createAmaruTextures, derive } from './amaruTextures';
import { NOKIA, convertPixels } from './nokiaPalette';
import { createTextures, createRetroFonts } from './textures';
import { CELL_HEIGHT, CELL_WIDTH, MARK_ROWS, fontKey } from './retroFont';
import { KIPU_FRAMES, ParticlePool, bossAngle, burst, chargeLevel, drawParticles, flightTilt, kipuTextureKey, type AttackPhase } from './animation';
import { KipuAnimator } from './kipuAnimator';
import { ensureKipuFrames } from './kipuTextures';
import { sfx } from './sfx';
import { motion } from './motion';
import { freeGuardian, initialProgress } from './challengeRules';
import { ROUTE, RUN_KEY, readRunState, scoreBreakdown, takeHit, type Health, type RunState } from './routeRules';
import { meterDisplay, wrapLines } from './hudRules';
import { BossHud, Hud, PauseOverlay } from './hud';
import { TEXT } from './text';
import { clearDebug, exposeDebug } from './debug';
import { VIEW_EVENT, FOCUS_EVENT, type ViewState } from './viewState';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';
import headUrl from '../../assets/prepared/amaru-head-v1-64x64.png';
import arenaUrl from '../../assets/prepared/arequipa-arena-v1-320x180.png';

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type Keys = Record<'a'|'d'|'w'|'s'|'left'|'right'|'up'|'down'|'space'|'j'|'z'|'shift'|'k'|'x'|'esc'|'p'|'r'|'m'|'enter',Phaser.Input.Keyboard.Key>;

const ARENA_FLOOR = 164;
// Kipu stays left of Amaru's head, so the head's forgiving body is never a contact hazard.
const KIPU_RIGHT = 230;
const POOL = Object.freeze({ shots: GAME.bulletCapacity, returns: REVERSE.maxCaptures, enemies: 40, particles: 96 });
const TIMING = Object.freeze({ boltTtl: 7000, returnTtl: 1800, returnSpeed: 240, flashMs: 80, noCaptureMs: 900 });
const SHIELD_RADIUS = 30;
// Extra pixels between stacked lines (12 px pitch): accent marks rise MARK_ROWS above the 8 px line cell and still keep
// two clear rows to the letters above, so a mark never reads as belonging to the previous line.
const LINE_GAP = MARK_ROWS + 1;
// Status and attack signal stacked in the dark band under the HUD bar.
const BAND = Object.freeze({ status: 18, signal: 18 + CELL_HEIGHT + LINE_GAP, height: 23 });
// Message banner: top border row, then the accent rows, then the 8 px line.
const MESSAGE = Object.freeze({ top: 41, textY: 41 + 2 + MARK_ROWS });
const COLORS = Object.freeze({
  normal: { dark: 0x16343c, floor: 0x70563e, mid: 0x59d3c4, light: 0xfff1c3, gold: 0xedc76c, violet: 0xc985ef, wave: 0x8759ad, text: 0xfff1c3 },
  nokia: { dark: NOKIA[0], floor: NOKIA[1], mid: NOKIA[2], light: NOKIA[3], gold: NOKIA[3], violet: NOKIA[1], wave: NOKIA[1], text: NOKIA[3] },
});
const SIGNAL: Readonly<Record<AttackKind, string>> = Object.freeze({
  triplePulse: TEXT.attackPulse, loopDown: TEXT.attackLoop, loopUp: TEXT.attackLoop, burst: TEXT.attackBurst, wave: TEXT.attackWave, window: TEXT.attackWindow,
});
const REVERSE_LABEL = Object.freeze({
  CHARGING: TEXT.reverseCharging, READY: TEXT.reverseReady, SLOW: TEXT.reverseSlow, RELEASE: TEXT.reverseRelease, RECOVERY: TEXT.reverseRecovery,
});
const PHASE_NAME: Readonly<Record<Phase, string>> = Object.freeze({ 1: TEXT.phase1, 2: TEXT.phase2, 3: TEXT.phase3 });

interface Message { text: string; ms: number }

// Amaru-01. Two owned clocks: `clocks.real` drives Kipu, UI, REVERSE timers and the liberation;
// `clocks.world` drives Amaru, patterns and enemy bolts and advances at worldScale (0.2 while SLOW).
// Focus loss and Esc pause freeze both. Bounded pools. Debug exposes values only, never commands.
export class GuardianScene extends Phaser.Scene {
  private player!: Sprite;
  private boss!: Sprite;
  private headOverlay!: Phaser.GameObjects.Image;
  private backdrop!: Phaser.GameObjects.Image;
  private backdropDim!: Phaser.GameObjects.Image;
  private segments: Phaser.GameObjects.Image[] = [];
  private tail!: Phaser.GameObjects.Image;
  private core!: Phaser.GameObjects.Image;
  private orbit: Phaser.GameObjects.Image[] = [];
  private shots!: Phaser.Physics.Arcade.Group;
  private returns!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private keys!: Keys;
  private floor!: Phaser.GameObjects.Graphics;
  private graphics!: Phaser.GameObjects.Graphics;
  private messageBox!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private hud!: Hud;
  private bossHud!: BossHud;
  private pause!: PauseOverlay;
  private status!: Phaser.GameObjects.BitmapText;
  private signal!: Phaser.GameObjects.BitmapText;
  private cue!: Phaser.GameObjects.BitmapText;
  private message!: Phaser.GameObjects.BitmapText;
  private panelText!: Phaser.GameObjects.BitmapText;
  private panelHelp!: Phaser.GameObjects.BitmapText;
  private fx!: ParticlePool;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private animator!: KipuAnimator;

  private run = 0;
  private clocks: Clocks = { real: 0, world: 0 };
  private entry: RunState = readRunState(undefined);
  private health: Health = { hp: ROUTE.maxHp, invulnerableUntil: 0 };
  private bossState: Boss = initialBoss();
  private reverse: Reverse = initialReverse();
  private ending: Outcome = 'playing';
  private bossDown = false;
  private liberation: Liberation | null = null;
  private fightMs = 0;
  private resultText = '';
  private facing: Facing = 1;
  private focused = true;
  private paused = false;
  private palette = false;
  private shiftRequested = false;
  private advanceRequested = false;
  private retry = false;
  private fromStart = false;
  private mapRequested = false;
  // Phase checkpoints: `resume` is handed from a defeat to the next create(); `checkpoint` is what this defeat offers.
  private resume: Checkpoint | null = null;
  private resumedFrom: Checkpoint | null = null;
  private checkpoint: Checkpoint | null = null;
  private priorMs = 0;
  private coachState: Coach = initialCoach();
  private nextShot = 0;
  private cycle = 0;
  private attackStart: number = AMARU.firstAttackMs;
  private emitted = 0;
  private cycleStarted = false;
  private actionStarted = false;
  private windowOpened = false;
  private waveGap = 0;
  private patternsSeen = new Set<AttackKind>();
  private coreAwakened = false;
  private messages: Message[] = [];
  private messageUntil = 0;
  private bossFlashUntil = 0;
  private noCaptureUntil = 0;
  private cueShown = false;
  private nextAuraAt = 0;

  constructor() { super('GuardianScene'); }

  preload(): void {
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation', kipuUrl);
    if (!this.textures.exists(HEAD)) this.load.image(HEAD, headUrl);
    if (!this.textures.exists(ARENA)) this.load.image(ARENA, arenaUrl);
  }

  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    // Direct entry (map or page button) uses 4 HP and an empty meter; a finished route carries its state.
    this.entry = readRunState(this.registry.get(RUN_KEY));
    this.run++;
    // A checkpoint retry (R after a phase 2/3 defeat) resumes at that phase; every other start is a full fight.
    const resume = this.resume;
    this.resume = null; this.resumedFrom = resume; this.checkpoint = null; this.priorMs = resume?.elapsedMs ?? 0;
    this.clocks = { real: 0, world: 0 };
    this.health = { hp: this.entry.hp, invulnerableUntil: 0 };
    this.bossState = initialBoss();
    this.reverse = initialReverse(this.entry.meter);
    if (resume) {
      const start = resumeFrom(resume);
      this.health = { hp: start.heroHp, invulnerableUntil: 0 }; this.bossState = start.boss; this.reverse = start.reverse;
    }
    this.ending = 'playing'; this.bossDown = false; this.liberation = null; this.fightMs = 0; this.resultText = '';
    this.facing = 1; this.focused = true; this.paused = false; this.palette = false;
    this.shiftRequested = false; this.advanceRequested = false; this.retry = false; this.fromStart = false; this.mapRequested = false;
    this.nextShot = 0; this.cycle = 0; this.attackStart = resume ? AMARU.phaseIntroMs : AMARU.firstAttackMs; this.resetCycle();
    this.waveGap = 0; this.patternsSeen = new Set(); this.coreAwakened = resume !== null; this.coachState = initialCoach();
    this.messages = resume ? [{ text: PHASE_NAME[resume.phase], ms: 1700 }] : [{ text: TEXT.guardianAwakens, ms: 1500 }, { text: PHASE_NAME[1], ms: 1700 }];
    this.messageUntil = 0;
    this.bossFlashUntil = 0; this.noCaptureUntil = 0; this.cueShown = false; this.nextAuraAt = 0;
    this.time.paused = false;
    sfx.setDucked(false);

    createTextures(this); createRetroFonts(this); ensureKipuFrames(this);
    for (const key of [...KIPU_FRAMES.map(frame => kipuTextureKey(frame, false)), 'bullet']) derive(this, key, `${key}-nokia`, pixels => convertPixels(pixels));
    createAmaruTextures(this, 0xfff1c3, NOKIA[3]);

    this.backdrop = this.add.image(160, 90, ARENA).setDepth(-10);
    this.backdropDim = this.add.image(160, 90, ARENA_DIM).setDepth(-9);
    this.floor = this.add.graphics().setDepth(1);
    // Modular body behind the head: tail deepest, then segments, then the glowing core (all placeholders).
    this.tail = this.add.image(0, 0, BODY_TEXTURES.tail).setDepth(2);
    this.segments = Array.from({ length: AMARU.body.count }, (_, i) => this.add.image(0, 0, BODY_TEXTURES.segment).setDepth(3 - i * 0.01));
    this.core = this.add.image(0, 0, BODY_TEXTURES.core).setDepth(3.5);
    this.boss = this.physics.add.sprite(AMARU.head.x, AMARU.head.centerY, HEAD).setDepth(4);
    // Forgiving collision body on the head only; the 64x64 art is never scaled.
    (this.boss.body as Body).setAllowGravity(false).setImmovable(true);
    this.boss.setSize(32, 44).setOffset(8, 20);
    this.headOverlay = this.add.image(this.boss.x, this.boss.y, variantKey(HEAD, true, false)).setDepth(4.1).setVisible(false);
    this.graphics = this.add.graphics().setDepth(5);

    // Free flight between the HUD bar and the drawn floor line; no gravity, no floor collider.
    this.physics.world.setBounds(GAME.playMargin, GAME.playTop, KIPU_RIGHT - GAME.playMargin, ARENA_FLOOR - GAME.playTop);
    this.player = this.physics.add.sprite(48, 96, 'kipu-evaluation').setOrigin(0.5, 0.55).setDepth(7);
    // Approved 12x18 body at (-6, -8) from the sprite position; the 32x40 art is never scaled.
    this.player.setSize(12, 18).setOffset(10, 14).setCollideWorldBounds(true);
    this.animator = new KipuAnimator(this.player);
    this.fx = new ParticlePool(POOL.particles, () => motion.reduced);
    this.fxGraphics = this.add.graphics().setDepth(8);
    this.orbit = Array.from({ length: REVERSE.maxCaptures }, () => this.add.image(0, 0, variantKey(BOLT_TEXTURES.rhombus, false, true)).setDepth(6).setVisible(false));

    this.shots = this.pool(POOL.shots, 'bullet', 7);
    this.returns = this.pool(POOL.returns, BOLT_TEXTURES.returned, 7);
    this.enemies = this.pool(POOL.enemies, BOLT_TEXTURES.orb, 6);
    this.physics.add.overlap(this.shots, this.boss, (first, second) => {
      // Arcade swaps group/sprite callback order; identify the pool member explicitly.
      const shot = (this.shots.contains(first as Sprite) ? first : second) as Sprite;
      if (!shot.active || this.ending !== 'playing') return;
      shot.disableBody(true, true);
      this.hitAmaru('normal', shot.x, shot.y);
    });
    this.physics.add.overlap(this.returns, this.boss, (first, second) => {
      const shot = (this.returns.contains(first as Sprite) ? first : second) as Sprite;
      if (!shot.active || this.ending !== 'playing') return;
      shot.disableBody(true, true);
      this.reverse = resolveReturn(this.reverse, this.clocks.real, true);
      this.hitAmaru('returned', shot.x, shot.y);
    });
    this.physics.add.overlap(this.enemies, this.player, (first, second) => {
      const bolt = (this.enemies.contains(first as Sprite) ? first : second) as Sprite;
      if (!bolt.active || this.ending !== 'playing' || this.bossDown) return;
      if (this.tryCapture(bolt)) return;
      bolt.disableBody(true, true);
      this.hurt();
    });

    this.hud = new Hud(this);
    this.bossHud = new BossHud(this);
    this.status = this.text(4, BAND.status, '').setDepth(10);
    this.signal = this.text(4, BAND.signal, '').setDepth(10);
    this.cue = this.text(0, 0, '').setDepth(9);
    this.messageBox = this.add.graphics().setDepth(30);
    this.message = this.text(0, MESSAGE.textY, '').setDepth(31).setCenterAlign().setLineSpacing(LINE_GAP);
    this.panel = this.add.graphics().setDepth(50);
    this.panelText = this.text(0, 0, '').setDepth(51).setLineSpacing(LINE_GAP);
    this.panelHelp = this.text(0, 0, '').setDepth(51).setCenterAlign().setLineSpacing(LINE_GAP);
    this.pause = new PauseOverlay(this);

    this.keys = this.input.keyboard!.addKeys({ a:'A',d:'D',w:'W',s:'S',left:'LEFT',right:'RIGHT',up:'UP',down:'DOWN',space:'SPACE',j:'J',z:'Z',shift:'SHIFT',k:'K',x:'X',esc:'ESC',p:'P',r:'R',m:'M',enter:'ENTER' }) as Keys;
    for (const key of [this.keys.shift, this.keys.k, this.keys.x]) key.setEmitOnRepeat(false).on('down', () => { if (this.focused && !this.paused) this.shiftRequested = true; });
    // OS auto-repeat and Phaser's same-frame queue replay are ignored so one Esc can never toggle pause twice.
    const freshKey = oncePerEvent();
    for (const key of [this.keys.esc, this.keys.p]) key.setEmitOnRepeat(false).on('down', (_key: unknown, event?: KeyboardEvent) => { if (this.focused && !event?.repeat && freshKey(event)) this.togglePause(); });
    this.keys.r.setEmitOnRepeat(false).on('down', () => { if (this.focused && !this.paused) this.retry = true; });
    this.keys.m.setEmitOnRepeat(false).on('down', () => { if (this.focused && !this.paused) this.mapRequested = true; });
    this.keys.enter.setEmitOnRepeat(false).on('down', (_key: unknown, event?: KeyboardEvent) => {
      if (!this.focused || this.paused || event?.repeat) return;
      // After a phase 2/3 defeat Enter restarts the whole fight (R resumes the phase); otherwise it opens the map.
      if (this.ending === 'defeat' && this.checkpoint) this.fromStart = true;
      else if (this.ending === 'defeat' || this.liberation?.stage === 'result') this.mapRequested = true;
      else if (this.ending === 'victory') this.advanceRequested = true;
    });
    this.keys.space.setEmitOnRepeat(false).on('down', (_key: unknown, event?: KeyboardEvent) => {
      if (this.focused && !this.paused && !event?.repeat && this.ending === 'victory') this.advanceRequested = true;
    });
    window.addEventListener('blur', this.blur); window.addEventListener('focus', this.focus);
    this.game.events.on(FOCUS_EVENT, this.pageFocus, this);
    this.publishView();
    this.events.once('shutdown', this.shutdown, this);
    exposeDebug(() => this.snapshot());
    this.placeBody();
    this.draw();
  }

  update(_time: number, rawDelta: number): void {
    if (!this.focused) return;
    if (this.mapRequested) { this.input.keyboard?.resetKeys(); this.scene.start('MapScene'); return; }
    if (this.retry || this.fromStart) {
      // R after a phase 2/3 defeat resumes at that phase; R anywhere else, or Enter after such a defeat, starts over.
      this.resume = this.retry && !this.fromStart && this.ending === 'defeat' ? this.checkpoint : null;
      this.input.keyboard?.resetKeys(); this.scene.restart(); return;
    }
    if (this.paused) return;
    const delta = frameDelta(rawDelta);
    if (this.ending === 'playing') this.play(delta);
    else {
      // The world stops at the end; the real clock keeps the liberation and result screens moving.
      this.clocks = advanceClocks(this.clocks, delta, 0);
      if (this.liberation) this.liberate();
    }
    this.advanceRequested = false;
    this.animate(delta);
    this.draw();
  }

  private play(delta: number): void {
    this.clocks = advanceClocks(this.clocks, delta, worldScale(this.reverse));
    const now = this.clocks.real, world = this.clocks.world, k = this.keys;
    const move = flight({ left: k.a.isDown || k.left.isDown, right: k.d.isDown || k.right.isDown, up: k.w.isDown || k.up.isDown, down: k.s.isDown || k.down.isDown }, this.facing);
    this.facing = move.facing;
    // Kipu always moves at full speed, on the real clock, even while the world is slowed.
    this.player.setVelocity(move.velocityX, move.velocityY).setFlipX(this.facing === -1);

    if (this.shiftRequested && !this.bossDown) {
      const next = activateReverse(this.reverse, now);
      if (next !== this.reverse) {
        this.reverse = next;
        sfx.play('shiftOn');
        burst(this.fx, this.player.x, this.player.y - 4, 10, 75, 320, 'teal', now, 2);
        this.coachSay('slowStart');
      }
    }
    this.shiftRequested = false;
    this.stepReverse(now);
    this.togglePalette(isSlow(this.reverse));
    sfx.setDucked(isSlow(this.reverse));

    if ((k.space.isDown || k.j.isDown || k.z.isDown) && canShoot(now, this.nextShot, this.shots.countActive(false))) {
      this.spawnShot(this.shots, this.player.x + this.facing * 12, this.player.y - 1, this.facing * GAME.bulletSpeed, 0, 'bullet', now + GAME.bulletLifetimeMs);
      sfx.play('shot');
      this.nextShot = now + GAME.shotCooldownMs;
    }

    this.bossState = tickBoss(this.bossState, world);
    const head = headPosition(world);
    (this.boss.body as Body).reset(head.x, head.y);
    this.placeBody();
    this.attack(world);
    this.stepEnemies(world);
    this.stepAllied(now);
    this.checkWave();
    this.player.setVisible(now >= this.health.invulnerableUntil || Math.floor(now / 90) % 2 === 0);
    if (this.bossDown && victoryReady(this.bossState, this.reverse)) this.victory();
    this.stepMessages(now);
  }

  // ------------------------------------------------------------------ REVERSE
  private stepReverse(now: number): void {
    const before = this.reverse, step = tickReverse(before, now);
    this.reverse = step.reverse;
    if (before.state === 'SLOW' && this.reverse.state !== 'SLOW') {
      for (const image of this.orbit) image.setVisible(false);
      if (step.released === 0) { this.noCaptureUntil = now + TIMING.noCaptureMs; this.coachSay('emptySlow'); }
    }
    for (let i = 0; i < step.released; i++) this.fireReturned(i, step.released);
  }

  private tryCapture(bolt: Sprite): boolean {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bolt.x, bolt.y);
    const next = captureBolt(this.reverse, distance, bolt.getData('capturable') === true);
    if (next === this.reverse) return false;
    this.reverse = next;
    sfx.play('capture');
    burst(this.fx, bolt.x, bolt.y, 5, 38, 240, 'light', this.clocks.real);
    bolt.disableBody(true, true);
    return true;
  }

  private fireReturned(index: number, count: number): void {
    const angle = this.orbitAngle(index, count), x = this.player.x + Math.cos(angle) * 16, y = this.player.y + Math.sin(angle) * 16;
    if (index === 0) sfx.play('release');
    burst(this.fx, x, y, 3, 40, 180, 'gold', this.clocks.real);
    this.spawnShot(this.returns, x, y, TIMING.returnSpeed, 0, BOLT_TEXTURES.returned, this.clocks.real + TIMING.returnTtl);
  }

  private orbitAngle(index: number, count: number): number { return this.clocks.real / 160 + index * Math.PI * 2 / Math.max(1, count); }

  // ------------------------------------------------------------------ Amaru
  private hitAmaru(kind: HitKind, x: number, y: number): void {
    const now = this.clocks.real, step = hitBoss(this.bossState, kind, this.clocks.world);
    this.bossState = step.boss;
    // Every normal shot that reaches Amaru charges REVERSE, deflected ones included; returns do not.
    if (kind === 'normal') this.reverse = chargeReverse(this.reverse, REVERSE.perHit);
    const center = (this.boss.body as Body).center;
    switch (step.result) {
      case 'deflect':
        sfx.play('deflect'); burst(this.fx, x, y, 4, 34, 150, 'light', now); break;
      case 'shieldHit':
        sfx.play('shieldHit'); burst(this.fx, x, y, 8, 55, 260, 'teal', now, 2); break;
      case 'shieldBreak':
        sfx.play('shieldBreak');
        burst(this.fx, center.x, center.y, 16, 80, 480, 'teal', now, 2); burst(this.fx, center.x, center.y, 8, 45, 380, 'light', now, 2);
        if (!motion.reduced) this.cameras.main.shake(140, 0.006);
        this.coachSay('shieldBreak');
        break;
      case 'damage':
        sfx.play(kind === 'returned' ? 'reflectHit' : 'bossHit');
        burst(this.fx, x, y, kind === 'returned' ? 10 : 5, kind === 'returned' ? 70 : 45, kind === 'returned' ? 420 : 260, kind === 'returned' ? 'light' : 'gold', now, kind === 'returned' ? 2 : 1);
        this.bossFlashUntil = now + TIMING.flashMs * (kind === 'returned' ? 2 : 1);
        break;
    }
    if (step.phaseChanged) this.enterPhase(this.bossState.phase);
    if (this.bossState.hp <= 0 && !this.bossDown) this.bossDown = true;
  }

  // Phase transitions come only from HP events (hitBoss); the attack loop restarts after a readable pause.
  private enterPhase(phase: Phase): void {
    this.cycle = 0; this.resetCycle();
    this.attackStart = this.clocks.world + AMARU.phaseIntroMs;
    this.messages = [{ text: PHASE_NAME[phase], ms: 1400 }]; this.messageUntil = 0;
    if (phase === 2) {
      this.messages.push({ text: TEXT.amaruLoop, ms: 2200 });
      if (!this.coreAwakened) {
        this.coreAwakened = true;
        this.reverse = awakenCore(this.reverse);
        sfx.play('shiftOn');
        burst(this.fx, this.player.x, this.player.y - 4, 12, 60, 520, 'teal', this.clocks.real, 2);
        this.messages.push({ text: `${TEXT.coreAwakens}\n${TEXT.shiftPrompt}`, ms: 2800 });
      }
    }
  }

  private currentAttack(): { attack: Attack; elapsed: number; stage: Stage } | null {
    if (this.bossDown || this.ending !== 'playing' || this.clocks.world < this.attackStart) return null;
    const attack = attackFor(this.bossState.phase, this.cycle), elapsed = this.clocks.world - this.attackStart;
    return { attack, elapsed, stage: attackStage(attack, elapsed) };
  }

  private attack(world: number): void {
    const current = this.currentAttack();
    if (!current) return;
    const { attack, elapsed, stage } = current;
    if (!this.cycleStarted) {
      this.cycleStarted = true; this.patternsSeen.add(attack.kind); sfx.play('charge');
      if (attack.kind === 'wave') this.waveGap = waveGapY(this.cycle);
    }
    if (stage === 'action') {
      const actionElapsed = elapsed - attack.anticipation;
      if (attack.kind === 'window' && !this.windowOpened) {
        this.windowOpened = true; this.bossState = openWindow(this.bossState, world, attack.action, true);
      }
      if (!this.actionStarted) {
        this.actionStarted = true;
        if (attack.kind === 'wave') sfx.play('wave'); else if (attack.emissions.length) sfx.play('bossFire');
      }
      const due = emissionsDue(attack, actionElapsed);
      while (this.emitted < due) this.spawnEnemy(attack.emissions[this.emitted++], world);
    }
    if (stage === 'done') { this.cycle++; this.attackStart = world; this.resetCycle(); }
  }

  private resetCycle(): void { this.emitted = 0; this.cycleStarted = false; this.actionStarted = false; this.windowOpened = false; }

  private spawnEnemy(e: Emission, world: number): void {
    const bolt = this.enemies.getFirstDead(false) as Sprite | null;
    if (!bolt) return; // bounded pool: a full pool drops the emission by design
    const mouth = mouthOf(headPosition(world)), v = emissionVelocity(e, mouth, { x: this.player.x, y: this.player.y });
    const base = e.shape === 'rhombus' ? BOLT_TEXTURES.rhombus : BOLT_TEXTURES.orb, scale = worldScale(this.reverse);
    bolt.enableBody(true, mouth.x, mouth.y, true, true);
    bolt.setTexture(variantKey(base, false, this.palette)).setData({ vx: v.vx, vy: v.vy, base, shape: e.shape, capturable: capturable(e.shape), expires: world + TIMING.boltTtl });
    // Forgiving hitboxes, smaller than the drawn bolts.
    (bolt.body as Body).setSize(5, e.shape === 'rhombus' ? 7 : 5, true);
    bolt.setVelocity(v.vx * scale, v.vy * scale);
  }

  private stepEnemies(world: number): void {
    const scale = worldScale(this.reverse);
    for (const bolt of this.alive(this.enemies)) {
      if (isSlow(this.reverse) && this.tryCapture(bolt)) continue;
      // Enemy velocities follow the world clock: 20 % while SLOW.
      bolt.setVelocity(bolt.getData('vx') * scale, bolt.getData('vy') * scale);
      if (boltExpired(world, bolt.getData('expires'), bolt.x, bolt.y)) bolt.disableBody(true, true);
    }
  }

  private stepAllied(now: number): void {
    for (const shot of this.alive(this.shots)) if (boltExpired(now, shot.getData('expires'), shot.x, shot.y)) shot.disableBody(true, true);
    const target = (this.boss.body as Body).center;
    for (const shot of this.alive(this.returns)) {
      if (boltExpired(now, shot.getData('expires'), shot.x, shot.y)) {
        shot.disableBody(true, true); this.reverse = resolveReturn(this.reverse, now, false); continue;
      }
      // Returned bolts home on Amaru's head so a release always resolves.
      const angle = Math.atan2(target.y - shot.y, target.x - shot.x);
      shot.setVelocity(Math.cos(angle) * TIMING.returnSpeed, Math.sin(angle) * TIMING.returnSpeed);
    }
  }

  private waveState(): { x: number; gapY: number; telegraph: boolean; active: boolean } | null {
    const current = this.currentAttack();
    if (!current || current.attack.kind !== 'wave' || (current.stage !== 'anticipation' && current.stage !== 'action')) return null;
    const active = current.stage === 'action';
    return { x: active ? waveX(current.elapsed - current.attack.anticipation) : AMARU.wave.startX, gapY: this.waveGap, telegraph: !active, active };
  }

  private checkWave(): void {
    const wave = this.waveState();
    if (!wave?.active) return;
    const body = this.player.body as Body;
    if (waveHits(wave.x, wave.gapY, { x: body.x, y: body.y, width: body.width, height: body.height })) this.hurt();
  }

  private hurt(): void {
    if (this.bossDown) return;
    const next = takeHit(this.health, this.clocks.real);
    if (next === this.health) return;
    // Damage never costs or refills REVERSE.
    this.health = next;
    sfx.play('heroHit');
    burst(this.fx, this.player.x, this.player.y - 4, 10, 60, 320, 'violet', this.clocks.real, 2);
    if (!motion.reduced) this.cameras.main.shake(110, 0.006);
    if (next.hp <= 0) this.defeat();
  }

  // ------------------------------------------------------------------ endings
  private victory(): void {
    // Time spent before a checkpoint retry still counts, so resuming never earns a larger time bonus.
    this.ending = 'victory'; this.fightMs = this.priorMs + this.clocks.real;
    this.liberation = startLiberation(this.clocks.real);
    this.registry.set('progress', freeGuardian(this.registry.get('progress') ?? initialProgress()));
    this.stopWorld();
    this.messages = []; this.messageUntil = 0; this.message.setText('');
    this.headOverlay.setVisible(true);
    sfx.play('victory');
    this.publishView();
  }

  private defeat(): void {
    this.ending = 'defeat';
    this.stopWorld();
    this.animator.hold('squash', false); this.player.setAngle(0);
    sfx.play('defeat');
    burst(this.fx, this.player.x, this.player.y - 4, 14, 65, 500, 'violet', this.clocks.real, 2);
    this.checkpoint = checkpointAt(this.bossState.phase, this.reverse.returnsTotal, this.priorMs + this.clocks.real);
    const help = this.checkpoint ? `${TEXT.checkpointRetry} ${this.checkpoint.phase}\n${TEXT.checkpointHelp}` : TEXT.resultHelp;
    this.showPanel('center', TEXT.routeDefeat, help);
    this.publishView();
  }

  // Attacks stop, every bolt clears, the palette and the sound return to normal.
  private stopWorld(): void {
    for (const group of [this.shots, this.returns, this.enemies]) for (const child of group.getChildren()) (child as Sprite).disableBody(true, true);
    for (const image of this.orbit) image.setVisible(false);
    this.player.setVelocity(0, 0).setVisible(true);
    this.physics.world.pause();
    this.togglePalette(false); sfx.setDucked(false);
    this.message.setText(''); this.cue.setText('');
  }

  private liberate(): void {
    const now = this.clocks.real, before = this.liberation!;
    let next = tickLiberation(before, now);
    if (this.advanceRequested) next = advanceLiberation(next, now);
    this.liberation = next;
    if (next.stage === before.stage && next.dialogueIndex === before.dialogueIndex) return;
    switch (next.stage) {
      case 'restore': sfx.play('restore'); this.headOverlay.setVisible(false); break;
      case 'dialogue':
        sfx.play('blip');
        this.showPanel('dialogue', next.dialogueIndex === 0 ? TEXT.dialogueAmaru : TEXT.dialogueKipu, TEXT.dialogueHelp);
        break;
      case 'codex':
        sfx.play('fragment');
        this.showPanel('codex', [TEXT.codexTitle, '', ...wrapLines(TEXT.codexBody, 40), '', TEXT.codexFind].join('\n'), TEXT.dialogueHelp);
        break;
      case 'result': {
        const tally = { fragments: this.entry.fragments, bugs: this.entry.bugs, returns: this.reverse.returnsTotal };
        const seconds = this.entry.routeSeconds + this.fightMs / 1000;
        const lines = resultLines(scoreBreakdown(tally, seconds), tally, seconds);
        this.resultText = lines.join('\n');
        this.showPanel('result', lines.slice(0, -1).join('\n'), lines[lines.length - 1]);
        break;
      }
      default: break;
    }
  }

  private showPanel(kind: 'center' | 'dialogue' | 'codex' | 'result', body: string, help: string): void {
    const c = COLORS.normal, g = this.panel.clear();
    // Help may span lines (the checkpoint keys); the centered panel grows to fit them.
    const helpLines = help.split('\n'), helpWidth = Math.max(...helpLines.map(line => line.length)) * CELL_WIDTH;
    const extra = (helpLines.length - 1) * (CELL_HEIGHT + LINE_GAP), centerW = Math.max(200, helpWidth + 16);
    const box = kind === 'dialogue' ? { x: 8, y: 124, w: 304, h: 44 } : kind === 'codex' ? { x: 24, y: 40, w: 272, h: 100 } : kind === 'result' ? { x: 44, y: 40, w: 232, h: 118 }
      : { x: Math.round((GAME.width - centerW) / 2), y: 70 - Math.round(extra / 2), w: centerW, h: 40 + extra };
    g.fillStyle(c.gold).fillRect(box.x, box.y, box.w, box.h).fillStyle(c.dark).fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
    const lines = body.split('\n'), widest = Math.max(...lines.map(line => line.length)) * CELL_WIDTH;
    const textX = kind === 'dialogue' ? box.x + 6 : Math.round(box.x + (box.w - widest) / 2);
    this.panelText.setText(body).setPosition(textX, box.y + 7);
    this.panelHelp.setText(help).setPosition(Math.round(box.x + box.w - 6 - helpWidth), box.y + box.h - 12 - extra);
    if (kind === 'center') this.panelHelp.setX(Math.round(box.x + (box.w - helpWidth) / 2));
  }

  // ------------------------------------------------------------------ messages
  private coachSay(event: CoachEvent): void {
    const step = coach(this.coachState, event, this.bossState.phase);
    this.coachState = step.coach;
    if (step.line) this.say({ text: step.line, ms: 1600 }, true);
  }

  private say(message: Message, now = false): void {
    if (now) { this.messages.unshift(message); this.messageUntil = 0; } else this.messages.push(message);
  }

  private stepMessages(now: number): void {
    if (now < this.messageUntil) return;
    const next = this.messages.shift();
    if (next) { this.message.setText(next.text); this.messageUntil = now + next.ms; }
    else if (this.message.text) this.message.setText('');
  }

  // ------------------------------------------------------------------ visuals
  private placeBody(): void {
    const world = this.clocks.world, parts = bodyPositions(world, AMARU.body.count + 1);
    this.segments.forEach((segment, i) => segment.setPosition(Math.round(parts[i].x), Math.round(parts[i].y)));
    const last = parts[AMARU.body.count];
    this.tail.setPosition(Math.round(last.x + 8), Math.round(last.y + 2));
    this.core.setPosition(Math.round(parts[1].x), Math.round(parts[1].y));
    this.headOverlay.setPosition(this.boss.x, this.boss.y).setAngle(this.boss.angle);
  }

  // Reads gameplay state only; writes textures, rotation, alpha and particles, never bodies or counters.
  private animate(delta: number): void {
    const now = this.clocks.real, body = this.player.body as Body, nokia = this.palette, lib = this.liberation;
    if (this.ending === 'playing') {
      this.animator.update({ now, velocityY: body.velocity.y, nokia, reduced: motion.reduced });
      // Rotation-only tilt; flip mirrors the horizontal lean so the nose stays forward.
      this.player.setAngle(motion.reduced ? 0 : flightTilt(body.velocity.x * this.facing, body.velocity.y) * this.facing);
    } else if (this.ending === 'victory') this.animator.update({ now, velocityY: 0, nokia: false, reduced: motion.reduced });

    // Head: corrupted while fighting, flashing on hits, the original once the corruption recedes.
    const recede = lib ? (lib.stage === 'recede' ? stageProgress(lib, now) : 1) : 0;
    const flash = this.ending === 'playing' && now < this.bossFlashUntil;
    const headKey = flash ? variantKey(HEAD_FLASH, false, nokia) : variantKey(HEAD, !lib, nokia);
    if (this.boss.texture.key !== headKey) this.boss.setTexture(headKey);
    this.boss.setAngle(motion.reduced ? 0 : this.headAngle());
    this.headOverlay.setAlpha(1 - recede);
    this.placeBody();
    // The corruption leaves the body from head to tail as it recedes.
    const pieces = AMARU.body.count + 2;
    this.segments.forEach((segment, i) => this.setVariant(segment, BODY_TEXTURES.segment, !lib || recede < (i + 1) / pieces, nokia));
    this.setVariant(this.core, BODY_TEXTURES.core, !lib || recede < 0.5, nokia);
    this.setVariant(this.tail, BODY_TEXTURES.tail, !lib || recede < 1, nokia);

    // Arena: dimmed purple while corrupted; the color wave crossfades it back during 'restore'.
    const restore = lib ? (lib.stage === 'recede' ? 0 : lib.stage === 'restore' ? stageProgress(lib, now) : 1) : 0;
    this.backdrop.setTexture(variantKey(ARENA, false, nokia));
    this.backdropDim.setTexture(variantKey(ARENA_DIM, false, nokia)).setAlpha(1 - restore).setVisible(restore < 1);
    if (lib?.stage === 'restore') {
      const x = Math.round(320 * (1 - restore)), slot = Math.floor(now / 40);
      for (let i = 0; i < 2; i++) this.fx.emit({ x, y: 30 + ((slot * 37 + i * 61) % 130), vx: -40, vy: -12, ttl: 600, slot: i ? 'gold' : 'teal', size: 2 }, now);
    }
    if (!lib && this.ending === 'playing' && now >= this.nextAuraAt) {
      const center = (this.boss.body as Body).center;
      this.fx.emit({ x: center.x - 14 + (Math.floor(now / 260) * 13) % 28, y: center.y - 20, vx: 0, vy: -14, ttl: 700, slot: 'violet', size: 1 }, now);
      this.nextAuraAt = now + 260;
    }
    // Captured bolts orbit Kipu and are harmless.
    const captured = this.reverse.state === 'SLOW' && this.ending === 'playing' ? this.reverse.captured : 0;
    this.orbit.forEach((image, i) => {
      const visible = i < captured, angle = this.orbitAngle(i, captured);
      image.setVisible(visible);
      if (visible) image.setTexture(variantKey(BOLT_TEXTURES.rhombus, false, nokia)).setPosition(Math.round(this.player.x + Math.cos(angle) * 16), Math.round(this.player.y + Math.sin(angle) * 16));
    });
    this.fx.step(now, delta / 1000, 0);
    this.fxGraphics.clear(); drawParticles(this.fxGraphics, this.fx, nokia);
  }

  private setVariant(image: Phaser.GameObjects.Image, base: string, corrupt: boolean, nokia: boolean): void {
    const key = variantKey(base, corrupt, nokia);
    if (image.texture.key !== key) image.setTexture(key);
  }

  private headAngle(): number {
    if (this.ending === 'victory') return 0;
    const current = this.currentAttack();
    if (!current) return bossAngle('idle', 0, this.clocks.real);
    if (current.attack.kind === 'window') return current.stage === 'action' ? 6 : 0;
    const { attack, elapsed, stage } = current;
    const phase: AttackPhase = stage === 'done' ? 'idle' : stage;
    const offset = stage === 'anticipation' ? 0 : stage === 'action' ? attack.anticipation : attack.anticipation + attack.action;
    // bossAngle's ramps assume the default 800 ms anticipation; normalize so every telegraph reads the same.
    const scaled = stage === 'anticipation' ? (elapsed - offset) * 800 / attack.anticipation : elapsed - offset;
    return bossAngle(phase, scaled, this.clocks.real);
  }

  private draw(): void {
    const c = this.palette ? COLORS.nokia : COLORS.normal, g = this.graphics.clear(), now = this.clocks.real;
    const f = this.floor.clear();
    f.fillStyle(c.floor).fillRect(0, ARENA_FLOOR, 320, 180 - ARENA_FLOOR).fillStyle(c.light).fillRect(0, ARENA_FLOOR, 320, 2);
    f.fillStyle(c.dark).fillRect(0, GAME.hudHeight, 320, BAND.height);
    const display = meterDisplay(this.reverse.state, this.reverse.meter, (this.reverse.until - now) / REVERSE.slowMs);
    this.hud.draw({ hp: this.health.hp, maxHp: ROUTE.maxHp, meter: this.reverse.meter, score: this.score(), now, meterStyle: display.style, meterLevel: display.fill, reduced: motion.reduced });
    const b = this.bossState, world = this.clocks.world;
    this.bossHud.draw({ hp: b.hp, maxHp: AMARU.maxHP, phase: b.phase, shield: b.shield, shieldMax: AMARU.shieldMax, shieldUp: b.phase >= 2 && b.shield > 0 && !isVulnerable(b, world), vulnerable: isVulnerable(b, world), now });
    this.drawStatus();
    this.drawMessage(c);
    if (this.ending !== 'playing') { this.cue.setText(''); return; }
    const center = (this.boss.body as Body).center;
    if (!this.bossDown) this.drawAura(g, center, c);
    if (shieldBlocks(b, world)) for (const [x, y] of shieldRing(SHIELD_RADIUS, b.shield, AMARU.shieldMax)) g.fillStyle(c.mid).fillRect(Math.round(center.x) + x, Math.round(center.y) + y, 1, 1);
    this.drawTelegraph(g, c);
    if (isSlow(this.reverse)) {
      // The capture field is drawn at its real radius (REVERSE.captureRadius) in hard pixels.
      for (const [x, y] of shieldRing(REVERSE.captureRadius, 1, 1)) g.fillStyle(c.mid).fillRect(Math.round(this.player.x) + x, Math.round(this.player.y) + y, 1, 1);
    }
    this.drawCue(now);
  }

  private drawStatus(): void {
    const r = this.reverse;
    const status = this.ending === 'playing' ? `${REVERSE_LABEL[r.state]}${r.state === 'SLOW' ? `  ${r.captured}/${REVERSE.maxCaptures}` : ''}` : '';
    if (this.status.text !== status) this.status.setText(status);
    let signal = '';
    const current = this.currentAttack();
    if (this.ending === 'playing' && !this.bossDown) {
      if (!current) signal = this.clocks.world < this.attackStart && this.cycle === 0 && this.bossState.phase === 1 ? TEXT.guardianAwakens : '';
      else if (isVulnerable(this.bossState, this.clocks.world) && current.attack.kind !== 'window') signal = TEXT.shieldBroken;
      else signal = current.stage === 'recovery' || current.stage === 'done' ? TEXT.attackRecovery : SIGNAL[current.attack.kind];
    }
    if (this.signal.text !== signal) this.signal.setText(signal);
  }

  private drawMessage(c: typeof COLORS.normal): void {
    const box = this.messageBox.clear(), text = this.message.text;
    if (!text) return;
    const lines = text.split('\n'), width = Math.max(...lines.map(l => l.length)) * CELL_WIDTH, x = Math.round((GAME.width - width) / 2);
    this.message.setX(x);
    const height = MESSAGE.textY - MESSAGE.top + lines.length * (CELL_HEIGHT + LINE_GAP) - LINE_GAP + 2;
    box.fillStyle(c.dark).fillRect(x - 4, MESSAGE.top, width + 8, height).fillStyle(c.gold).fillRect(x - 4, MESSAGE.top, width + 8, 1).fillRect(x - 4, MESSAGE.top + height - 1, width + 8, 1);
  }

  private drawAura(g: Phaser.GameObjects.Graphics, center: Phaser.Math.Vector2, c: typeof COLORS.normal): void {
    // Dithered purple halo of the Desfase; static under reduced motion.
    const shift = motion.reduced ? 0 : Math.floor(this.clocks.real / 150) % 3;
    shieldRing(36, 1, 1).forEach(([x, y], i) => { if ((i + shift) % 3 === 0) g.fillStyle(c.violet).fillRect(Math.round(center.x) + x, Math.round(center.y) + y, 1, 1); });
  }

  private drawTelegraph(g: Phaser.GameObjects.Graphics, c: typeof COLORS.normal): void {
    const current = this.currentAttack();
    const wave = this.waveState();
    if (wave) this.drawWave(g, c, wave);
    if (!current || current.stage !== 'anticipation') return;
    const { attack, elapsed } = current, mouth = mouthOf(headPosition(this.clocks.world));
    const mx = Math.round(mouth.x), my = Math.round(mouth.y);
    if (attack.kind === 'wave' || attack.kind === 'window') return;
    // Mouth charge grows through the telegraph so the coming attack reads before it fires.
    const size = 1 + 2 * Math.round(3 * chargeLevel('anticipation', elapsed * 800 / attack.anticipation)), half = Math.floor(size / 2);
    g.fillStyle(c.mid).fillRect(mx - half, my - half, size, size);
    if (size >= 5) g.fillStyle(c.light).fillRect(mx - half + 1, my - half + 1, size - 2, size - 2);
    if (attack.kind === 'triplePulse') {
      // Dotted aim line toward Kipu: the pulses follow you, so move.
      const dx = this.player.x - mx, dy = this.player.y - my, steps = Math.max(1, Math.floor(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
      for (let i = 1; i <= steps; i++) g.fillStyle(c.light).fillRect(Math.round(mx + dx * i / steps), Math.round(my + dy * i / steps), 1, 1);
      return;
    }
    // Fan guides: one dash per rhombus direction (aimed ones follow Kipu), lit in firing order (the loop motif).
    const fan = attack.emissions.filter(e => e.shape === 'rhombus'), lit = Math.floor(elapsed / attack.anticipation * fan.length);
    const aim = Math.atan2(this.player.y - my, this.player.x - mx);
    fan.forEach((e, i) => {
      const angle = e.aimed ? aim + e.angle : e.angle;
      for (let d = 12; d <= 20; d += 2) g.fillStyle(i <= lit ? c.light : c.mid).fillRect(Math.round(mx + Math.cos(angle) * d), Math.round(my + Math.sin(angle) * d), 1, 1);
    });
  }

  private drawWave(g: Phaser.GameObjects.Graphics, c: typeof COLORS.normal, wave: { x: number; gapY: number; telegraph: boolean }): void {
    const top = wave.gapY - AMARU.wave.gap / 2, bottom = wave.gapY + AMARU.wave.gap / 2, x = Math.round(wave.x);
    // Gap brackets at both edges of the arena show where to cross before the wave moves.
    for (const bx of [3, Math.min(KIPU_RIGHT + 2, x + AMARU.wave.width + 2)]) g.fillStyle(c.light).fillRect(bx, top, 6, 1).fillRect(bx, bottom - 1, 6, 1).fillRect(bx, top, 1, bottom - top);
    for (let y = GAME.playTop; y < ARENA_FLOOR; y++) {
      if (y >= top && y < bottom) continue;
      if (wave.telegraph) { if (y % 4 === 0) g.fillStyle(c.violet).fillRect(x, y, 2, 2); continue; }
      g.fillStyle(c.wave).fillRect(x, y, AMARU.wave.width, 1);
      if (y % 4 === 0) g.fillStyle(c.light).fillRect(x + (y % 8 === 0 ? 0 : AMARU.wave.width - 2), y, 2, 1);
    }
    if (!wave.telegraph) g.fillStyle(c.light).fillRect(x - 1, top - 1, AMARU.wave.width + 2, 1).fillRect(x - 1, bottom, AMARU.wave.width + 2, 1);
  }

  private drawCue(now: number): void {
    const near = this.alive(this.enemies).filter(bolt => bolt.getData('capturable') === true)
      .map(bolt => Phaser.Math.Distance.Between(this.player.x, this.player.y, bolt.x, bolt.y));
    this.cueShown = shiftCue(this.reverse, near);
    // Static cue (no flashing): "¡SHIFT!" when READY with rhombi close, "SIN CAPTURAS" after an empty SLOW.
    const text = this.cueShown ? TEXT.shiftCue : now < this.noCaptureUntil ? TEXT.noCaptures : '';
    if (this.cue.text !== text) this.cue.setText(text);
    if (text) this.cue.setPosition(Phaser.Math.Clamp(Math.round(this.player.x - text.length * CELL_WIDTH / 2), 2, 318 - text.length * CELL_WIDTH), Math.max(GAME.hudHeight + BAND.height + 1, Math.round(this.player.y) - 26));
  }

  // ------------------------------------------------------------------ plumbing
  private pool(capacity: number, key: string, depth: number): Phaser.Physics.Arcade.Group {
    const group = this.physics.add.group({ allowGravity: false, maxSize: capacity });
    group.createMultiple({ key, quantity: capacity, active: false, visible: false });
    for (const child of group.getChildren()) { (child as Sprite).setDepth(depth); (child as Sprite).disableBody(true, true); }
    return group;
  }

  private alive(group: Phaser.Physics.Arcade.Group): Sprite[] { return group.getChildren().filter(child => child.active) as Sprite[]; }

  private spawnShot(group: Phaser.Physics.Arcade.Group, x: number, y: number, vx: number, vy: number, base: string, expires: number): void {
    const shot = group.getFirstDead(false) as Sprite | null;
    if (!shot) return;
    shot.enableBody(true, x, y, true, true);
    shot.setTexture(variantKey(base, false, this.palette)).setData({ base, expires });
    (shot.body as Body).setSize(base === 'bullet' ? 6 : 7, base === 'bullet' ? 3 : 5, true);
    shot.setVelocity(vx, vy);
  }

  private text(x: number, y: number, text: string): Phaser.GameObjects.BitmapText { return this.add.bitmapText(x, y, fontKey(COLORS.normal.text), text, CELL_WIDTH); }

  private togglePalette(active: boolean): void {
    if (this.palette === active) return;
    this.palette = active;
    // Bodies, head, backdrop and orbit follow `palette` in animate(); pooled bolts and labels swap here.
    for (const group of [this.shots, this.returns, this.enemies]) for (const child of group.getChildren()) {
      const sprite = child as Sprite, base = sprite.getData('base') as string | undefined;
      if (base) sprite.setTexture(variantKey(base, false, active));
    }
    // Canvas BitmapText ignores tint, so switch to the pre-colored green atlas.
    for (const label of [this.status, this.signal, this.cue, this.message, this.panelText, this.panelHelp]) {
      label.setFont(fontKey((active ? COLORS.nokia : COLORS.normal).text), CELL_WIDTH);
    }
    this.hud.setPalette(active); this.bossHud.setPalette(active); this.pause.setPalette(active);
    this.animate(0);
  }

  private score(): number { return this.entry.score + ROUTE.returnScore * this.reverse.returnsTotal; }

  private togglePause(): void {
    if (this.ending !== 'playing') return;
    this.paused = !this.paused; this.freeze(this.paused || !this.focused);
    this.pause.setVisible(this.paused); sfx.play('pause');
  }

  // Esc pause and focus loss share one freeze: both owned clocks stop in update(), physics pauses, input clears.
  private freeze(frozen: boolean): void {
    if (frozen) {
      this.physics.world.pause(); this.time.paused = true; this.input.keyboard?.resetKeys();
      this.shiftRequested = false; this.advanceRequested = false; this.retry = false; this.fromStart = false; this.mapRequested = false;
      this.player.setVelocity(0, 0);
    } else { if (this.ending === 'playing') this.physics.world.resume(); this.time.paused = false; }
  }

  private blur = (): void => { this.focused = false; this.freeze(true); };
  private focus = (): void => { if (document.activeElement?.id !== 'game') return; this.focused = true; this.freeze(this.paused); };
  private pageFocus(active: boolean): void { if (active) this.focus(); else this.blur(); }
  private publishView(): void {
    const checkpoint = this.ending === 'defeat' && this.checkpoint ? { checkpoint: this.checkpoint.phase } : {};
    this.game.events.emit(VIEW_EVENT, { view: 'guardian', outcome: this.ending, progress: { ...this.registry.get('progress') }, ...checkpoint } satisfies ViewState);
  }

  private shutdown(): void {
    this.game.events.off(FOCUS_EVENT, this.pageFocus, this);
    window.removeEventListener('blur', this.blur); window.removeEventListener('focus', this.focus);
    this.input.keyboard?.resetKeys(); clearDebug(); sfx.setDucked(false);
    // Phaser owns scene groups/graphics and destroys them during shutdown.
  }

  private snapshot() {
    const body = this.player.body as Body, bossBody = this.boss.body as Body, b = this.bossState, r = this.reverse, world = this.clocks.world;
    const current = this.currentAttack(), wave = this.waveState(), lib = this.liberation;
    return {
      scene: 'guardian', sceneRun: this.run, paused: this.paused, focused: this.focused, outcome: this.ending, nokia: this.palette,
      realClock: this.clocks.real, worldClock: world, worldScale: worldScale(r),
      run: { ...this.entry }, score: this.score(),
      phase: b.phase, bossHP: b.hp, shieldHP: b.shield, shieldUp: shieldBlocks(b, world), vulnerable: isVulnerable(b, world), vulnerableUntil: b.vulnerableUntil, doubleDamage: b.doubleDamage, bossDown: this.bossDown,
      reverse: { state: r.state, meter: r.meter, captured: r.captured, pending: r.pending, until: r.until, activations: r.activations, returnsTotal: r.returnsTotal },
      heroHP: this.health.hp, invulnerableUntil: this.health.invulnerableUntil,
      attack: current ? { kind: current.attack.kind, stage: current.stage, cycle: this.cycle } : null,
      wave: wave ? { ...wave, width: AMARU.wave.width, gap: AMARU.wave.gap } : null,
      patternsSeen: [...this.patternsSeen], cue: this.cueShown, message: this.message.text,
      liberation: lib ? { stage: lib.stage, dialogueIndex: lib.dialogueIndex, codexShown: lib.codexShown } : null,
      panel: this.panelText.text, panelHelp: this.panelHelp.text, resultText: this.resultText,
      checkpoint: this.checkpoint ? { ...this.checkpoint } : null, checkpointed: this.resumedFrom !== null, resumedFrom: this.resumedFrom?.phase ?? null,
      fightElapsedMs: this.priorMs + this.clocks.real, coach: { ...this.coachState },
      enemyBolts: this.alive(this.enemies).map(bolt => { const v = (bolt.body as Body).velocity; return { x: bolt.x, y: bolt.y, vx: v.x, vy: v.y, capturable: bolt.getData('capturable') === true, shape: bolt.getData('shape'), texture: bolt.texture.key }; }),
      alliedShots: [...this.alive(this.shots).map(s => ({ x: s.x, y: s.y, returned: false })), ...this.alive(this.returns).map(s => ({ x: s.x, y: s.y, returned: true }))],
      pools: { shots: this.shots.getLength(), returns: this.returns.getLength(), enemies: this.enemies.getLength(), orbit: this.orbit.length, particles: this.fx.items.length, particlesActive: this.fx.activeCount },
      player: {
        x: this.player.x, y: this.player.y, velocityX: body.velocity.x, velocityY: body.velocity.y, angle: this.player.angle,
        bodyWidth: body.width, bodyHeight: body.height, bodyRelativeX: body.x - this.player.x, bodyRelativeY: body.y - this.player.y,
        texture: this.player.texture.key, displayWidth: this.player.displayWidth, displayHeight: this.player.displayHeight,
      },
      boss: { x: bossBody.center.x, y: bossBody.center.y, width: bossBody.width, height: bossBody.height, angle: this.boss.angle, texture: this.boss.texture.key, displayWidth: this.boss.displayWidth, displayHeight: this.boss.displayHeight },
      assets: { background: this.backdrop.texture.key, dim: this.backdropDim.texture.key, dimAlpha: this.backdropDim.alpha, head: this.boss.texture.key, segment: this.segments[0].texture.key, overlay: this.headOverlay.visible ? this.headOverlay.alpha : 0, arenaURL: arenaUrl, headURL: headUrl },
      hud: { score: this.hud.scoreText, phase: this.bossHud.phaseText, status: this.status.text, signal: this.signal.text },
      audio: sfx.stats(), kipuFrame: this.animator.frame,
    };
  }
}
