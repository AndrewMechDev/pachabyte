import Phaser from 'phaser';
import { GAME, canShoot, flight, frameDelta, oncePerEvent, playBounds, projectileExpired, shotVelocity } from './rules';
import {
  ROUTE, RUN_KEY, WALLS, addMeter, cameraScroll, captionAt, defeatBug, glitchlingVelocity, mareaFront, mareaTouches, overlaps, pickupFragment, quietSegment,
  runningScore, segmentAt, segmentStart, spawnsDue, wallRects, wallScreenX, wallTelegraph, firewallWindow,
  type Health, type Rect, type RunState, type SegmentName, type Spawn, type Tally,
} from './routeRules';
import { PACKET_LOSS, blockRects, packetLossColumns, packetLossWindow, type PacketColumn } from './packetLossRules';
import { ERUPTION, emberHits, emberLanding, emberPosition, emberStage, embersDue, eruptionLevel, eruptionWindow, markerSize } from './eruptionRules';
import { MEMORY_LEAK, drainMeter, leakFragmentPosition, leakWindow, leakZones } from './memoryLeakRules';
import { LOOP, cueVisible, formationDue, hitLoopNode, initialLoop, loopActive, loopEnd, loopMarkerX, nodePosition, sceneryRewind, stepLoop, type LoopState } from './loopRules';
import {
  BUGS, BUG_STATS, corruptorCharge, corruptorScreen, corruptorShotsDue, dodgeStage, dropsFragment, linedUpShot, orbExpired, orbVelocity, shadowPosition,
  sombraWorldX, splitCount, startSombra, stepSombra, type EnemyType, type SombraMotion,
} from './bugRules';
import { breakCombo, comboMultiplier, initialCombo, registerHit, type Combo } from './comboRules';
import { umbralRestore } from './balanceRules';
import { FloaterPool, floaterView, hitStopActive, initialHitStop, triggerHitStop, worldStep, type FloaterSlot, type HitStop } from './effectsRules';
import { completeRoute, initialProgress, type Progress } from './challengeRules';
import { BUG_TEXTURES, HAZARD_TEXTURES, PICKUP_TEXTURES, createBugTextures, createHazardTextures, createTextures, createRetroFonts, createRouteTextures } from './textures';
import { createEyeTextures, createShotTextures, loadEyeSheet, loadShotSheets } from './fxTextures';
import { ImpactPool, drawImpacts, shotFrame, shotKindFor, shotOrigin, shotTextureKey, type ShotKind } from './shotFx';
import { EYE, drawShatter, eyeFrameFor, eyeOrigin, eyeTextureKey, shatterPieces } from './eyeRelic';
import { createSheetTextures, loadSpriteSheets } from './sheetTextures';
import { corruptorFrame, pickupFrame, shadowFrame, sombraFrame } from './spriteFrames';
import { backdropCopies, summitsX } from './ambientRules';
import { RouteAmbient } from './routeAmbient';
import {
  PICKUPS, ROUTE_ENTRY_X, absorbHit, bobOffset, canSpawnPickup, collectPickup, countCollected, initialPower, noPickups, pickupsDue, rafagaActive, rafagaLevel,
  rafagaRemaining, shotCooldown, shotDamage, volleyAngles, type PickupCounts, type PickupKind, type Power,
} from './pickupRules';
import { drawKipuShield, drawShieldBreak } from './pickupView';
import { CELL_HEIGHT, CELL_WIDTH, MARK_ROWS, fontKey } from './retroFont';
import { ParticlePool, burst, dissolve, drawParticles, flightTilt } from './animation';
import { KipuAnimator } from './kipuAnimator';
import { ensureKipuFrames } from './kipuTextures';
import { sfx } from './sfx';
import { motion } from './motion';
import { arenaUrl } from './demoAssets';
import { VIEW_EVENT, FOCUS_EVENT, type ViewState } from './viewState';
import { Hud, PauseOverlay } from './hud';
import { TEXT } from './text';
import { clearDebug, exposeDebug } from './debug';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type KeyName = 'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's' | 'space' | 'j' | 'z' | 'esc' | 'p' | 'r' | 'm';
type Keys = Record<KeyName, Phaser.Input.Keyboard.Key>;
type Ending = 'playing' | 'defeat' | 'transition';
type HurtSource = 'bug' | 'firewall' | 'marea' | 'packet' | 'ember';
interface EmberSlot { active: boolean; at: number; x: number; y: number; aimed: boolean; impacted: boolean }
// A2: each hazard's own stretch of the route, for the debug snapshot (hazardSchedule.test.ts proves they never overlap).
const HAZARD_WINDOWS: ReadonlyArray<readonly [string, readonly [number, number]]> = [
  ['firewall', firewallWindow()], ['packetLoss', packetLossWindow()], ['eruption', eruptionWindow()], ['memoryLeak', leakWindow()],
  ['marea', [ROUTE.marea.start, ROUTE.marea.end]], ['loop', [LOOP.start, loopEnd()]],
];

const POOL = {
  shots: PICKUPS.shotPool, glitchlings: 12, fragments: 10, particles: 128, floaters: 8, pickups: 4,
  corruptors: BUGS.caps.corruptors, shadows: BUGS.caps.shadows, orbs: BUGS.caps.orbs,
} as const;
// The arena art (with the Misti) is the whole route backdrop now: the old procedural mountains, town blocks and
// broken-link lines were removed (user feedback 2026-10-13), so it shows clearly behind the play area. It is the far
// layer and stays put: one whole Misti, no repeat seam (mirrored copies showed a symmetric seam); the three cloud
// layers carry the parallax.
const BACKDROP = { alpha: 0.85, scrollFactor: 0, depth: -12 } as const;
const ROUTE_SHEETS = ['corruptor', 'sombra', 'shadow', 'pickups'] as const;
const LIGHT = 0xfff1c3, GOLD = 0xedc76c, DIM = 0x3a6770, BAR = 0x16343c, VIOLET = 0xc985ef, SHIELD = 0x7fb8ff, EMBER = 0xf2a65a, ASH = 0x3a1a20;
const LEAK_SOUND_MS = 380, LEAK_SPARK_MS = 120;
// Caption strip under the HUD: one clear row, the accent rows, the 8 px line cell and one more clear row.
const CAPTION = Object.freeze({ top: GAME.hudHeight + 2, textY: GAME.hudHeight + 3 + MARK_ROWS, height: 1 + MARK_ROWS + CELL_HEIGHT + 1 });
// Forgiving bodies, smaller than the drawn sprites; the art is never scaled and the bodies keep their tuned sizes.
const BODY: Readonly<Record<EnemyType, readonly [number, number]>> = { glitchling: [8, 8], corruptor: [18, 16], sombra: [12, 13], shadow: [8, 8] };
const DRAWN: Readonly<Record<EnemyType, number>> = { glitchling: 12, corruptor: 24, sombra: 20, shadow: 12 };
// Small shadows ignore shots for a moment after a split, so both pieces read before they can be hit.
const SPLIT_GRACE_MS = 140;
const FLASH_MS = 90, COMBO_HOT_MS = 450;

// Ruta 01: free-flight, auto-scrolling route that ends at Amaru. Owned clocks: `real` drives Kipu (flight, shots,
// invulnerability); `clock` is the WORLD clock (camera, timeline, Firewall, Marea, bugs, orbs) and only differs from
// real by the 50 ms hit-stops on heavy hits; `anim` drives visuals. Focus loss and Esc pause freeze all of them.
export class RouteScene extends Phaser.Scene {
  private player!: Sprite;
  private keys!: Keys;
  private freshKey = oncePerEvent();
  private shots!: Phaser.Physics.Arcade.Group;
  private glitchlings!: Phaser.Physics.Arcade.Group;
  private corruptors!: Phaser.Physics.Arcade.Group;
  private shadows!: Phaser.Physics.Arcade.Group;
  private orbs!: Phaser.Physics.Arcade.Group;
  private fragments!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private walls: Phaser.GameObjects.TileSprite[][] = [];
  private marea!: Phaser.GameObjects.TileSprite;
  private overlay!: Phaser.GameObjects.Graphics;
  private pattern!: Phaser.GameObjects.Graphics;
  private captionBox!: Phaser.GameObjects.Rectangle;
  private caption!: Phaser.GameObjects.BitmapText;
  private panel!: Phaser.GameObjects.Rectangle;
  private panelText!: Phaser.GameObjects.BitmapText;
  private hud!: Hud;
  private pause!: PauseOverlay;
  private fx!: ParticlePool;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private animator!: KipuAnimator;
  private floaters = new FloaterPool(POOL.floaters);
  private floaterTexts: Phaser.GameObjects.BitmapText[] = [];

  private sceneRun = 0;
  private clock = 0;
  private real = 0;
  private anim = 0;
  private worldRate = 1;
  private focused = true;
  private paused = false;
  private ending: Ending = 'playing';
  private health: Health = { hp: ROUTE.maxHp, invulnerableUntil: 0 };
  private meter = 0;
  private tally: Tally = { fragments: 0, bugs: 0, returns: 0, bugPoints: 0, comboBonus: 0 };
  private combo: Combo = initialCombo();
  private comboHotUntil = 0;
  private hitStop: HitStop = initialHitStop();
  private fragmentsDropped = 0;
  private nextShotAt = 0;
  private spawnCursor = 0;
  // Rare pickups (B3): power-ups on the REAL clock, the pickup script cursor, counts and the Escudo break effect.
  private power: Power = initialPower();
  private pickupCursor = 0;
  private collected: PickupCounts = noPickups();
  private shieldBreakAt = -Infinity;
  private volley = { count: 0, shots: 0, lastSize: 0, lastAt: 0 };
  private thresholdStarted = false;
  // Balance round 2: what the Umbral restored (hearts and meter before and after), for the debug snapshot.
  private umbral = { applied: false, hpBefore: 0, hpAfter: 0, meterBefore: 0, meterAfter: 0 };
  private retryRequested = false;
  private mapRequested = false;
  private nextGlintAt = 0;
  private ambient!: RouteAmbient;
  // A2 hazards: bounded tile/image pools and their world-clock state.
  private hazardFx!: Phaser.GameObjects.Graphics;
  private packetTiles: Phaser.GameObjects.TileSprite[][] = [];
  private packetView: PacketColumn[] = [];
  private emberImages: Phaser.GameObjects.Image[] = [];
  private embers: EmberSlot[] = [];
  private emberCursor = 0;
  private emberImpacts = 0;
  private leakTiles: Phaser.GameObjects.TileSprite[] = [];
  private leakFragmentsSpawned = 0;
  private leak = { inside: false, drained: 0, nextSoundAt: 0, nextSparkAt: 0 };
  private loop: LoopState = initialLoop();
  private loopNode!: Phaser.GameObjects.Image;
  // P2 juice: display images that follow the pooled physics shots, the impact star bursts and the eye's shatter.
  private shotViews: Phaser.GameObjects.Image[] = [];
  private impacts = new ImpactPool();
  private shatter = { at: -Infinity, x: 0, y: 0, count: 0 };
  private loopResetAt = -Infinity;
  private loopHitUntil = 0;
  private purgedSegment: SegmentName | null = null;
  private hurts: Record<HurtSource, { damage: number; absorbed: number }> = RouteScene.noHurts();

  private static noHurts(): Record<HurtSource, { damage: number; absorbed: number }> {
    return { bug: { damage: 0, absorbed: 0 }, firewall: { damage: 0, absorbed: 0 }, marea: { damage: 0, absorbed: 0 }, packet: { damage: 0, absorbed: 0 }, ember: { damage: 0, absorbed: 0 } };
  }

  constructor() { super('RouteScene'); }

  preload(): void {
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation', kipuUrl);
    if (!this.textures.exists('amaru-arena')) this.load.image('amaru-arena', arenaUrl);
    loadSpriteSheets(this, ROUTE_SHEETS);
    loadShotSheets(this);
    loadEyeSheet(this);
  }

  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    this.sceneRun += 1;
    this.clock = 0; this.real = 0; this.anim = 0; this.worldRate = 1; this.focused = true; this.paused = false; this.ending = 'playing';
    this.health = { hp: ROUTE.maxHp, invulnerableUntil: 0 }; this.meter = 0; this.tally = { fragments: 0, bugs: 0, returns: 0, bugPoints: 0, comboBonus: 0, pickups: 0, pickupBonus: 0 };
    this.combo = initialCombo(); this.comboHotUntil = 0; this.hitStop = initialHitStop(); this.fragmentsDropped = 0;
    this.nextShotAt = 0; this.spawnCursor = 0; this.thresholdStarted = false; this.purgedSegment = null;
    this.umbral = { applied: false, hpBefore: 0, hpAfter: 0, meterBefore: 0, meterAfter: 0 };
    this.packetView = []; this.embers = Array.from({ length: ERUPTION.pool }, () => ({ active: false, at: 0, x: 0, y: 0, aimed: false, impacted: false }));
    this.emberCursor = 0; this.emberImpacts = 0; this.leakFragmentsSpawned = 0; this.leak = { inside: false, drained: 0, nextSoundAt: 0, nextSparkAt: 0 };
    this.impacts = new ImpactPool(); this.shatter = { at: -Infinity, x: 0, y: 0, count: 0 };
    this.loop = initialLoop(); this.loopResetAt = -Infinity; this.loopHitUntil = 0; this.hurts = RouteScene.noHurts();
    this.power = initialPower(); this.pickupCursor = 0; this.collected = noPickups(); this.shieldBreakAt = -Infinity;
    this.volley = { count: 0, shots: 0, lastSize: 0, lastAt: 0 };
    this.retryRequested = false; this.mapRequested = false; this.nextGlintAt = 0;
    this.time.paused = false;
    createTextures(this); createRouteTextures(this); createBugTextures(this); createSheetTextures(this, ROUTE_SHEETS); createRetroFonts(this); ensureKipuFrames(this); createHazardTextures(this); createShotTextures(this, false); createEyeTextures(this);

    this.cameras.main.setBackgroundColor(BAR).setBounds(0, 0, ROUTE.worldWidth, GAME.height).setScroll(0, 0);
    // The arena art at native size; backdropCopies would tile it (mirrored) if the far layer ever scrolls again.
    const backdropWidth = (ROUTE.worldWidth - GAME.width) * BACKDROP.scrollFactor + GAME.width, copies = backdropCopies(backdropWidth);
    for (const copy of copies) {
      this.add.image(copy.x, 0, 'amaru-arena').setOrigin(0).setFlipX(copy.flip).setScrollFactor(BACKDROP.scrollFactor).setAlpha(BACKDROP.alpha).setDepth(BACKDROP.depth).setName('backdrop');
    }
    // Living Misti and drifting mist, behind every gameplay sprite.
    this.ambient = new RouteAmbient(this, summitsX(copies), BACKDROP.scrollFactor, BACKDROP.depth);

    this.player = this.physics.add.sprite(56, 97, 'kipu-evaluation').setOrigin(0.5, 0.55).setDepth(5);
    // Approved 12x18 body at (-6, -8) from the sprite position; the 32x40 art is never scaled.
    this.player.setSize(12, 18).setOffset(10, 14).setCollideWorldBounds(true);
    this.fx = new ParticlePool(POOL.particles, () => motion.reduced);
    this.fxGraphics = this.add.graphics().setDepth(7);
    this.animator = new KipuAnimator(this.player);

    this.shots = this.pool('bullet', POOL.shots, 6, 3, 6);
    // The physics shots stay invisible 6x3 bodies; these images draw the animated bolts (never scaled), one per pool slot.
    this.shotViews = this.shots.getChildren().map(() => this.add.image(0, 0, shotTextureKey('normal', 0, false)).setDepth(6).setVisible(false));
    this.glitchlings = this.pool('glitchling', POOL.glitchlings, ...BODY.glitchling, 4);
    this.corruptors = this.pool(BUG_TEXTURES.corruptor, POOL.corruptors, ...BODY.corruptor, 4);
    this.shadows = this.pool(BUG_TEXTURES.sombra, POOL.shadows, ...BODY.sombra, 4);
    this.orbs = this.pool(BUG_TEXTURES.orb, POOL.orbs, 4, 4, 6);
    this.fragments = this.pool('fragment', POOL.fragments, 7, 7, 3);
    this.pickups = this.pool(PICKUP_TEXTURES.rafaga, POOL.pickups, PICKUPS.body, PICKUPS.body, 3);
    this.walls = WALLS.map(wall => wallRects(wall, 0).map(rect => this.add.tileSprite(0, rect.y, rect.width, rect.height, 'firewall').setOrigin(0).setScrollFactor(0).setDepth(4).setVisible(false)));
    this.marea = this.add.tileSprite(0, GAME.playTop, ROUTE.marea.maxFront, GAME.playBottom - GAME.playTop, 'marea').setOrigin(0).setScrollFactor(0).setDepth(8).setVisible(false);
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(9);
    this.pattern = this.add.graphics().setScrollFactor(0).setDepth(2);
    // A2 hazards, all screen-space and created once: Packet Loss blocks (one column of tiles per scripted column),
    // Memory Leak zones (one dithered tile each), the ember pool and the loop node. Markers and outlines go on hazardFx.
    this.hazardFx = this.add.graphics().setScrollFactor(0).setDepth(3);
    this.packetTiles = PACKET_LOSS.columns.map(() => blockRects(0).map(r => this.add.tileSprite(0, r.y, r.width, r.height, HAZARD_TEXTURES.packetBlock).setOrigin(0).setScrollFactor(0).setDepth(4).setVisible(false)));
    this.leakTiles = MEMORY_LEAK.zones.map(z => this.add.tileSprite(0, z.y, z.width, z.height, HAZARD_TEXTURES.leak).setOrigin(0).setScrollFactor(0).setDepth(1).setVisible(false));
    this.emberImages = this.embers.map(() => this.add.image(0, 0, HAZARD_TEXTURES.ember).setScrollFactor(0).setDepth(6).setVisible(false));
    // Eye relic (P2): same position and depth as the old node; the origin puts the eye's centre on the node, cables hang below.
    this.loopNode = this.add.image(LOOP.node.x, LOOP.node.y, eyeTextureKey('idle0')).setOrigin(eyeOrigin().x, eyeOrigin().y).setScrollFactor(0).setDepth(5).setVisible(false);

    for (const group of [this.glitchlings, this.corruptors, this.shadows]) {
      this.physics.add.overlap(this.shots, group, (first, second) => {
        const shot = (this.shots.contains(first as Sprite) ? first : second) as Sprite;
        const bug = (shot === first ? second : first) as Sprite;
        if (!shot.active || !bug.active || this.ending !== 'playing' || this.clock < Number(bug.getData('graceUntil') ?? 0)) return;
        shot.disableBody(true, true);
        this.impacts.spawn(shot.x + 3, shot.y, (shot.getData('kind') as ShotKind | undefined) ?? 'normal', this.anim);
        this.hitEnemy(bug, Number(shot.getData('damage') ?? PICKUPS.baseDamage));
      });
    }
    this.physics.add.overlap(this.player, this.glitchlings, (first, second) => this.touchBug(first, second, this.glitchlings, true));
    this.physics.add.overlap(this.player, this.shadows, (first, second) => this.touchBug(first, second, this.shadows, true));
    // The Corruptor is a heavy block: touching it costs a heart but does not destroy it.
    this.physics.add.overlap(this.player, this.corruptors, (first, second) => this.touchBug(first, second, this.corruptors, false));
    this.physics.add.overlap(this.player, this.orbs, (first, second) => this.touchBug(first, second, this.orbs, true));
    this.physics.add.overlap(this.player, this.fragments, (first, second) => {
      const knot = (this.fragments.contains(first as Sprite) ? first : second) as Sprite;
      if (!knot.active || this.ending !== 'playing') return;
      knot.disableBody(true, true);
      const next = pickupFragment(this.meter, this.tally);
      this.meter = next.meter; this.tally = next.tally;
      sfx.play('fragment');
      burst(this.fx, knot.x, knot.y, 8, 45, 320, 'gold', this.anim, 2);
    });
    this.physics.add.overlap(this.player, this.pickups, (first, second) => {
      const item = (this.pickups.contains(first as Sprite) ? first : second) as Sprite;
      if (!item.active || this.ending !== 'playing') return;
      item.disableBody(true, true);
      this.collect(item.getData('kind') as PickupKind, item.x, item.y);
    });

    this.floaterTexts = this.floaters.items.map(() => this.add.bitmapText(0, 0, fontKey(LIGHT), '', CELL_WIDTH).setDepth(12).setVisible(false));
    this.floaters.clear();
    this.captionBox = this.add.rectangle(0, CAPTION.top, 0, CAPTION.height, BAR).setOrigin(0).setScrollFactor(0).setDepth(29).setVisible(false);
    this.caption = this.add.bitmapText(0, CAPTION.textY, fontKey(LIGHT), '', CELL_WIDTH).setScrollFactor(0).setDepth(30);
    this.panel = this.add.rectangle(GAME.width / 2, 90, 200, 40, BAR).setScrollFactor(0).setDepth(50).setVisible(false);
    this.panelText = this.add.bitmapText(0, 78, fontKey(LIGHT), '', CELL_WIDTH).setCenterAlign().setLineSpacing(MARK_ROWS + 1).setScrollFactor(0).setDepth(51);
    this.hud = new Hud(this);
    this.pause = new PauseOverlay(this);
    this.drawHud();

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable.');
    this.keys = keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S',
      space: 'SPACE', j: 'J', z: 'Z', esc: 'ESC', p: 'P', r: 'R', m: 'M',
    }) as Keys;
    this.freshKey = oncePerEvent();
    for (const key of [this.keys.esc, this.keys.p]) key.setEmitOnRepeat(false).on('down', (_key: unknown, event?: KeyboardEvent) => {
      // Ignore OS auto-repeat and Phaser's same-frame queue replay: after resetKeys either would toggle pause again.
      if (this.focused && !event?.repeat && this.freshKey(event)) this.togglePause();
    });
    this.keys.r.setEmitOnRepeat(false).on('down', () => { if (this.focused && !this.paused) this.retryRequested = true; });
    this.keys.m.setEmitOnRepeat(false).on('down', () => { if (this.focused && !this.paused) this.mapRequested = true; });

    this.game.events.on(FOCUS_EVENT, this.pageFocus, this);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.publishView();
    exposeDebug(() => this.snapshot());
  }

  update(_time: number, rawDelta: number): void {
    if (!this.focused) return;
    if (this.mapRequested) { this.input.keyboard?.resetKeys(); this.scene.start('MapScene'); return; }
    if (this.retryRequested) { this.input.keyboard?.resetKeys(); this.scene.restart(); return; }
    if (this.paused) return;
    // Same 100 ms cap as the guardian: a stall never lets a Firewall jump through Kipu.
    const delta = frameDelta(rawDelta);
    this.anim += delta;
    if (this.ending !== 'playing') { this.animate(delta, 0); return; }
    // The world clock skips only the hit-stopped part of this real step; Kipu keeps the full step.
    const worldDelta = worldStep(this.hitStop, this.real, delta, 1);
    this.worldRate = delta > 0 ? worldDelta / delta : 1;
    const real = this.real += delta;
    const now = this.clock += worldDelta;
    if (now >= ROUTE.transitionMs) { this.transition(); return; }

    const cameraX = cameraScroll(now);
    this.cameras.main.setScroll(cameraX, 0);
    const bounds = playBounds(cameraX);
    this.physics.world.setBounds(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
    const carry = (cameraX < ROUTE.worldWidth - GAME.width ? ROUTE.scrollSpeed : 0) * this.worldRate;
    const k = this.keys;
    const move = flight({ left: k.a.isDown || k.left.isDown, right: k.d.isDown || k.right.isDown, up: k.w.isDown || k.up.isDown, down: k.s.isDown || k.down.isDown }, 1);
    // Kipu is carried by the scroll: its screen-relative flight is added to the camera speed.
    this.player.setVelocity(move.velocityX + carry, move.velocityY);
    if ((k.space.isDown || k.j.isDown || k.z.isDown) && canShoot(real, this.nextShotAt, this.shots.countActive(false))) this.fire(real, carry);

    const step = spawnsDue(this.spawnCursor, now);
    this.spawnCursor = step.next;
    const segment = segmentAt(now);
    for (const spawn of step.due) this.spawn(spawn, cameraX, now);
    const pickupStep = pickupsDue(this.pickupCursor, now);
    this.pickupCursor = pickupStep.next;
    for (const p of pickupStep.due) this.spawnPickup(p.kind, p.y, cameraX);
    if (!this.thresholdStarted && segment === 'threshold') this.enterThreshold();
    if (segment !== 'transition' && segment !== 'threshold' && segment !== this.purgedSegment && quietSegment(segment)) this.purgeRanged(segment);

    for (const bug of this.alive(this.glitchlings)) {
      if (bug.x < cameraX - 16) { bug.disableBody(true, true); continue; }
      const v = glitchlingVelocity(bug.y, this.player.y);
      bug.setVelocity(v.vx * this.worldRate, v.vy * this.worldRate);
    }
    this.stepCorruptors(now, cameraX);
    this.stepShadows(now, worldDelta / 1000, cameraX);
    this.stepOrbs(now, cameraX);
    const front = mareaFront(now);
    for (const knot of this.alive(this.fragments)) {
      if (knot.x < cameraX - 12) knot.disableBody(true, true);
      else if (mareaTouches(front, knot.x - cameraX)) { knot.disableBody(true, true); burst(this.fx, knot.x, knot.y, 5, 30, 240, 'violet', this.anim); }
    }
    this.stepPickups(front, cameraX);
    this.stepLeak(now, worldDelta, cameraX);
    this.stepLoop(now, now - worldDelta, cameraX);
    for (const shot of this.alive(this.shots)) {
      if (projectileExpired(real, Number(shot.getData('expiresAt')), shot.x, cameraX - 8, cameraX + GAME.width + 8) || shot.y < GAME.playTop || shot.y > GAME.playBottom) shot.disableBody(true, true);
    }
    this.updateWalls(now, cameraX);
    this.updatePacketLoss(now, cameraX);
    this.updateEmbers(now, cameraX);
    this.updateMarea(front, cameraX);
    if (this.ending !== 'playing') return;

    const blinking = real < this.health.invulnerableUntil;
    this.player.setAlpha(!blinking ? 1 : motion.reduced ? 0.5 : Math.floor(real / 90) % 2 ? 0.25 : 1);
    this.updateCaption(cueVisible(this.loop, now) ? TEXT.loopBroken : captionAt(now));
    this.drawOverlay(now, front, cameraX);
    this.animate(delta, carry);
    this.drawHud();
  }

  private pool(key: string, capacity: number, width: number, height: number, depth: number): Phaser.Physics.Arcade.Group {
    const group = this.physics.add.group({ allowGravity: false, maxSize: capacity });
    group.createMultiple({ key, quantity: capacity, active: false, visible: false });
    for (const child of group.getChildren()) {
      const sprite = child as Sprite;
      sprite.setDepth(depth);
      (sprite.body as Body).setSize(width, height);
      sprite.disableBody(true, true);
    }
    return group;
  }

  private alive(group: Phaser.Physics.Arcade.Group): Sprite[] {
    return group.getChildren().filter(child => child.active) as Sprite[];
  }

  private spawn(spawn: Spawn, cameraX: number, now: number): Sprite | null {
    const group = spawn.kind === 'glitchling' ? this.glitchlings : spawn.kind === 'corruptor' ? this.corruptors : spawn.kind === 'sombra' ? this.shadows : this.fragments;
    const sprite = group.getFirstDead(false) as Sprite | null;
    if (!sprite) return null; // bounded pool: a full pool drops the spawn by design (this is also the on-screen cap)
    sprite.enableBody(true, cameraX + GAME.width + 10, spawn.y, true, true);
    sprite.setVelocity(0, 0).setAlpha(1);
    switch (spawn.kind) {
      case 'glitchling': sprite.setTexture('glitchling').setData({ type: 'glitchling', hp: BUG_STATS.glitchling.hp, hitUntil: 0, graceUntil: 0, loop: false }); break;
      case 'fragment': sprite.setTexture('fragment').setData({ dropped: false, leak: -1 }); (sprite.body as Body).setSize(7, 7, true); break;
      case 'corruptor': {
        const p = corruptorScreen(0, spawn.y);
        sprite.setTexture(BUG_TEXTURES.corruptor).setData({ type: 'corruptor', hp: BUG_STATS.corruptor.hp, hitUntil: 0, graceUntil: 0, born: now, baseY: spawn.y, fired: 0, charging: false });
        (sprite.body as Body).reset(cameraX + p.x, p.y);
        break;
      }
      case 'sombra':
        sprite.setTexture(BUG_TEXTURES.sombra).setData({ type: 'sombra', hp: BUG_STATS.sombra.hp, hitUntil: 0, graceUntil: 0, born: now, spawnX: cameraX + BUGS.sombra.spawnX, motion: startSombra(spawn.y) });
        (sprite.body as Body).setSize(...BODY.sombra, true);
        (sprite.body as Body).reset(cameraX + BUGS.sombra.spawnX, spawn.y);
        break;
    }
    return sprite;
  }

  // Kipu always fires to the right on the route. A Ráfaga fires a triple spread (centre first) at the shorter cooldown;
  // each of its shots deals 2 damage (round 2), fixed when it leaves Kipu. A nearly full pool fires what it can.
  private fire(now: number, carry: number): void {
    let size = 0;
    const damage = shotDamage(this.power, now), kind = shotKindFor(rafagaActive(this.power, now));
    for (const angle of volleyAngles(this.power, now)) {
      const shot = this.shots.getFirstDead(false) as Sprite | null;
      if (!shot) break;
      // Last argument false: the body is live but the drawn bolt is the display image (see animate()).
      shot.enableBody(true, this.player.x + 12, this.player.y - 1, true, false);
      const vx = angle === 0 ? shotVelocity(1, carry) : GAME.bulletSpeed * Math.cos(angle) + carry;
      shot.setVelocity(vx, GAME.bulletSpeed * Math.sin(angle)).setData({ expiresAt: now + GAME.bulletLifetimeMs, damage, kind, born: this.anim, tilt: angle });
      size++;
    }
    if (size === 0) return;
    this.volley = { count: this.volley.count + 1, shots: this.volley.shots + size, lastSize: size, lastAt: now };
    sfx.play('shot');
    burst(this.fx, this.player.x + 10, this.player.y - 1, 3, 34, 140, 'gold', this.anim);
    this.nextShotAt = now + shotCooldown(this.power, now);
  }

  // ------------------------------------------------------------------ pickups
  private spawnPickup(kind: PickupKind, y: number, cameraX: number): void {
    const item = this.pickups.getFirstDead(false) as Sprite | null;
    if (!item) return; // bounded pool
    // At most 2 Corazón on screen (round 2); a skipped one is simply not offered.
    if (!canSpawnPickup(kind, this.alive(this.pickups).map(p => p.getData('kind') as PickupKind))) return;
    const x = cameraX + ROUTE_ENTRY_X;
    item.enableBody(true, x, y, true, true);
    item.setVelocity(0, 0).setAlpha(1).setTexture(PICKUP_TEXTURES[kind]).setData({ kind, baseY: y });
    (item.body as Body).setSize(PICKUPS.body, PICKUPS.body, true);
  }

  // Pickups stay still in the world (like fragments) with a gentle bob; the Marea swallows them like fragments.
  private stepPickups(front: number, cameraX: number): void {
    const bob = bobOffset(this.anim, motion.reduced);
    for (const item of this.alive(this.pickups)) {
      if (item.x < cameraX - 12) { item.disableBody(true, true); continue; }
      if (mareaTouches(front, item.x - cameraX)) { item.disableBody(true, true); burst(this.fx, item.x, item.y, 5, 30, 240, 'violet', this.anim); continue; }
      (item.body as Body).reset(item.x, Number(item.getData('baseY')) + bob);
    }
  }

  private collect(kind: PickupKind, x: number, y: number): void {
    const step = collectPickup(kind, this.power, this.health.hp, this.real);
    this.power = step.power;
    this.health = { ...this.health, hp: step.hp };
    this.tally = { ...this.tally, pickups: (this.tally.pickups ?? 0) + 1, pickupBonus: (this.tally.pickupBonus ?? 0) + step.bonus };
    this.collected = countCollected(this.collected, kind);
    sfx.play(kind === 'rafaga' ? 'pickupRafaga' : kind === 'escudo' ? 'pickupEscudo' : 'pickupCorazon');
    burst(this.fx, x, y, 8, 40, 300, kind === 'rafaga' ? 'gold' : kind === 'escudo' ? 'teal' : 'light', this.anim, 2);
    const label = kind === 'rafaga' ? TEXT.pickupRafaga : kind === 'escudo' ? TEXT.pickupEscudo : step.result === 'heal' ? TEXT.pickupHeal : `+${step.bonus}`;
    this.floater(label, x, y - 10, step.bonus > 0 ? 'points' : 'damage');
  }

  // ------------------------------------------------------------------ bugs
  private stepCorruptors(now: number, cameraX: number): void {
    for (const c of this.alive(this.corruptors)) {
      const age = now - Number(c.getData('born')), p = corruptorScreen(age, Number(c.getData('baseY')));
      if (p.gone) { c.disableBody(true, true); continue; }
      (c.body as Body).reset(cameraX + p.x, p.y);
      const charging = corruptorCharge(age) > 0;
      if (charging && !c.getData('charging')) sfx.play('corruptorCharge');
      c.setData('charging', charging);
      const due = corruptorShotsDue(age);
      while (Number(c.getData('fired')) < due) { c.setData('fired', Number(c.getData('fired')) + 1); this.fireOrb(c, now, cameraX); }
    }
  }

  private fireOrb(c: Sprite, now: number, cameraX: number): void {
    const orb = this.orbs.getFirstDead(false) as Sprite | null;
    if (!orb) return; // bounded pool
    const vent = { x: c.x - cameraX + BUGS.corruptor.ventDx, y: c.y + BUGS.corruptor.ventDy };
    const v = orbVelocity(vent, { x: this.player.x - cameraX, y: this.player.y });
    orb.enableBody(true, cameraX + vent.x, vent.y, true, true);
    orb.setVelocity(0, 0).setData({ born: now, ox: cameraX + vent.x, oy: vent.y, vx: v.vx, vy: v.vy });
    sfx.play('corruptorShot');
    burst(this.fx, cameraX + vent.x, vent.y, 4, 26, 180, 'violet', this.anim);
  }

  private stepOrbs(now: number, cameraX: number): void {
    for (const orb of this.alive(this.orbs)) {
      const age = now - Number(orb.getData('born'));
      const x = Number(orb.getData('ox')) + Number(orb.getData('vx')) * age / 1000, y = Number(orb.getData('oy')) + Number(orb.getData('vy')) * age / 1000;
      if (orbExpired(age, x - cameraX, y)) { orb.disableBody(true, true); continue; }
      (orb.body as Body).reset(x, y);
    }
  }

  private stepShadows(now: number, dt: number, cameraX: number): void {
    const shots = this.alive(this.shots).map(s => ({ x: s.x, y: s.y }));
    for (const s of this.alive(this.shadows)) {
      const age = now - Number(s.getData('born'));
      let x: number, y: number;
      if (s.getData('type') === 'sombra') {
        const before = s.getData('motion') as SombraMotion;
        x = sombraWorldX(Number(s.getData('spawnX')), age);
        const after = stepSombra(before, now, dt, this.player.y, linedUpShot({ x, y: before.y }, shots));
        if (after.dodgeAt !== before.dodgeAt) sfx.play('sombraDodge');
        s.setData('motion', after);
        y = after.y;
      } else {
        const p = shadowPosition({ x: Number(s.getData('ox')), y: Number(s.getData('oy')) }, Number(s.getData('dir')) as -1 | 1, age);
        x = p.x; y = p.y;
      }
      if (x < cameraX - 16) { s.disableBody(true, true); continue; }
      (s.body as Body).reset(x, y);
    }
  }

  // One shot that reaches a bug: `damage` is 1, or 2 for a Ráfaga shot (round 2). The meter and the racha count one hit
  // per shot whatever its damage.
  private hitEnemy(bug: Sprite, damage: number): void {
    const hp = Number(bug.getData('hp')) - damage;
    this.meter = addMeter(this.meter, ROUTE.meterPerHit);
    const step = registerHit(this.combo);
    this.combo = step.combo;
    if (step.tierUp) { sfx.play('comboUp'); this.comboHotUntil = this.anim + COMBO_HOT_MS; }
    if (hp > 0) {
      bug.setData({ hp, hitUntil: this.anim + FLASH_MS });
      sfx.play('enemyHit');
      burst(this.fx, bug.x, bug.y, 3, 30, 160, 'light', this.anim);
      this.floater(String(damage), bug.x, bug.y - 8, 'damage');
      return;
    }
    this.debugBug(bug);
  }

  // "Se depura": the bug dissolves into turquoise and gold sparkles, scores at the racha multiplier and, every 4th
  // time, leaves a small fragment. A Sombra splits into two small shadows. A heavy hit stops the world for 50 ms.
  private debugBug(bug: Sprite): void {
    const type = bug.getData('type') as EnemyType, x = bug.x, y = bug.y;
    const result = defeatBug(this.tally, BUG_STATS[type].score, this.combo.hits);
    this.tally = result.tally;
    bug.disableBody(true, true);
    dissolve(this.fx, x, y, DRAWN[type], DRAWN[type], this.anim);
    this.floater(`+${result.points}`, x, y - 10, 'points');
    sfx.play('enemyDown');
    if (!motion.reduced) this.hitStop = triggerHitStop(this.hitStop, this.real);
    if (type === 'sombra') this.split(x, y);
    if (dropsFragment(this.tally.bugs)) this.dropFragment(x, y);
  }

  private split(x: number, y: number): void {
    const free = this.shadows.getChildren().filter(child => !child.active).length, count = splitCount(free);
    if (count === 0) return;
    sfx.play('sombraSplit');
    for (let i = 0; i < count; i++) {
      const dir: -1 | 1 = count === 1 ? (y > (GAME.playTop + GAME.playBottom) / 2 ? -1 : 1) : i === 0 ? -1 : 1;
      const small = this.shadows.getFirstDead(false) as Sprite | null;
      if (!small) return;
      small.enableBody(true, x, y, true, true);
      small.setVelocity(0, 0).setAlpha(1).setTexture(BUG_TEXTURES.shadow)
        .setData({ type: 'shadow', hp: BUG_STATS.shadow.hp, hitUntil: 0, graceUntil: this.clock + SPLIT_GRACE_MS, born: this.clock, ox: x, oy: y, dir });
      (small.body as Body).setSize(...BODY.shadow, true);
    }
  }

  private dropFragment(x: number, y: number): void {
    const knot = this.fragments.getFirstDead(false) as Sprite | null;
    if (!knot) return; // bounded pool
    knot.enableBody(true, x, y, true, true);
    knot.setVelocity(0, 0).setAlpha(1).setTexture(BUG_TEXTURES.fragmentSmall).setData({ dropped: true, leak: -1 });
    (knot.body as Body).setSize(5, 5, true);
    this.fragmentsDropped += 1;
    burst(this.fx, x, y, 4, 22, 220, 'gold', this.anim);
  }

  private touchBug(first: unknown, second: unknown, group: Phaser.Physics.Arcade.Group, consumed: boolean): void {
    const bug = (group.contains(first as Sprite) ? first : second) as Sprite;
    if (!bug.active || this.ending !== 'playing') return;
    if (consumed) {
      // Touching a bug never debugs it: no score, no drop, no split; it just bursts into the Desfase.
      bug.disableBody(true, true);
      burst(this.fx, bug.x, bug.y, 6, 40, 260, 'violet', this.anim);
    }
    this.hurt('bug');
  }

  // Every hazard hit costs exactly one heart (or the Escudo) and starts the normal invulnerability.
  private hurt(source: HurtSource): void {
    const step = absorbHit(this.health, this.power, this.real);
    if (step.result === 'ignored') return;
    this.health = step.health; this.power = step.power;
    this.hurts[source][step.result === 'absorbed' ? 'absorbed' : 'damage'] += 1;
    if (step.result === 'absorbed') {
      // The Escudo takes the hit: no heart lost and the racha survives; the normal invulnerability still runs.
      this.shieldBreakAt = this.anim;
      sfx.play('shieldAbsorb');
      burst(this.fx, this.player.x, this.player.y, 10, 50, 280, 'teal', this.anim);
      this.floater(TEXT.shieldAbsorb, this.player.x, this.player.y - 22, 'damage');
      return;
    }
    const next = step.health;
    this.combo = breakCombo(this.combo);
    sfx.play(source === 'firewall' || source === 'packet' ? 'firewall' : 'heroHit');
    burst(this.fx, this.player.x, this.player.y - 4, 10, 60, 320, 'violet', this.anim, 2);
    if (!motion.reduced) this.cameras.main.shake(110, 0.006);
    if (next.hp <= 0) this.defeat();
  }

  private floater(text: string, x: number, y: number, slot: FloaterSlot): void {
    const f = this.floaters.spawn(text, x, y, slot, this.anim);
    const label = this.floaterTexts[this.floaters.items.indexOf(f)];
    label.setFont(fontKey(slot === 'points' ? GOLD : LIGHT), CELL_WIDTH).setText(text);
  }

  // Walls and the Marea live in screen space; the player body is converted with the camera offset.
  private playerRect(cameraX: number): Rect {
    const body = this.player.body as Body;
    return { x: body.x - cameraX, y: body.y, width: body.width, height: body.height };
  }

  private updateWalls(now: number, cameraX: number): void {
    const player = this.playerRect(cameraX);
    WALLS.forEach((wall, index) => {
      const x = Math.round(wallScreenX(now, wall));
      const visible = now >= wall.at && x > -ROUTE.firewall.width && x < GAME.width + 8;
      const rects = wallRects(wall, x);
      this.walls[index].forEach(tile => tile.setVisible(visible).setX(x));
      if (!visible) return;
      if (rects.some(rect => overlaps(player, rect))) this.hurt('firewall');
      // Shots cannot pass the barrier: they spark and vanish on contact.
      for (const shot of this.alive(this.shots)) {
        const body = shot.body as Body, rect = { x: body.x - cameraX, y: body.y, width: body.width, height: body.height };
        if (rects.some(r => overlaps(rect, r))) { shot.disableBody(true, true); burst(this.fx, shot.x, shot.y, 3, 30, 140, 'gold', this.anim); }
      }
    });
  }

  private updateMarea(front: number, cameraX: number): void {
    const width = Math.round(front);
    this.marea.setVisible(width > 0);
    if (width <= 0) return;
    // Fixed-size strip slid in from the left edge, so nothing is resized or scaled per frame.
    this.marea.setX(width - ROUTE.marea.maxFront);
    if (!motion.reduced) this.marea.setTilePosition(Math.floor(this.anim / 60), Math.floor(this.anim / 140));
    if (mareaTouches(front, this.playerRect(cameraX).x)) this.hurt('marea');
  }

  // Ranged bugs and their orbs never share the screen with the Firewall gaps: the barrier filters them out.
  private purgeRanged(segment: SegmentName): void {
    this.purgedSegment = segment;
    for (const group of [this.corruptors, this.shadows, this.orbs]) for (const sprite of this.alive(group)) {
      burst(this.fx, sprite.x, sprite.y, 5, 30, 300, 'violet', this.anim);
      sprite.disableBody(true, true);
    }
  }

  private enterThreshold(): void {
    // Enemies stop and dissolve; the route falls quiet before the guardian.
    this.thresholdStarted = true;
    // Round 2 (playtest 2026-10-13): the Umbral restores Kipu (+1 heart, meter to at least 60); runState() carries both.
    const restored = umbralRestore(this.health.hp, this.meter);
    this.umbral = { applied: true, hpBefore: this.health.hp, hpAfter: restored.hp, meterBefore: this.meter, meterAfter: restored.meter };
    this.health = { ...this.health, hp: restored.hp }; this.meter = restored.meter;
    sfx.play('pickupCorazon');
    burst(this.fx, this.player.x, this.player.y, 8, 40, 300, 'light', this.anim, 2);
    if (this.umbral.hpAfter > this.umbral.hpBefore) this.floater(TEXT.pickupHeal, this.player.x, this.player.y - 22, 'damage');
    for (const group of [this.glitchlings, this.corruptors, this.shadows, this.orbs]) for (const bug of this.alive(group)) {
      burst(this.fx, bug.x, bug.y, 6, 30, 400, 'violet', this.anim);
      bug.disableBody(true, true);
    }
  }

  private drawOverlay(now: number, front: number, cameraX: number): void {
    const g = this.overlay.clear();
    const blink = motion.reduced || Math.floor(this.anim / 200) % 2 === 0;
    for (const wall of WALLS) {
      if (!wallTelegraph(now, wall)) continue;
      // Telegraph at the right edge: the solid column is dotted, the gap is framed in bright marks.
      const [top, bottom] = wallRects(wall, GAME.width - 6);
      for (let y = top.y; y < top.y + top.height; y += 4) g.fillStyle(0xd8573f).fillRect(GAME.width - 4, y, 2, 2);
      for (let y = bottom.y; y < bottom.y + bottom.height; y += 4) g.fillStyle(0xd8573f).fillRect(GAME.width - 4, y, 2, 2);
      if (blink) g.fillStyle(LIGHT).fillRect(GAME.width - 10, top.y + top.height, 8, 1).fillRect(GAME.width - 10, bottom.y - 1, 8, 1);
    }
    WALLS.forEach((wall, index) => {
      if (!this.walls[index][0].visible) return;
      const x = this.walls[index][0].x, [top, bottom] = wallRects(wall, x);
      g.fillStyle(0xf2a65a).fillRect(x, top.y + top.height - 1, ROUTE.firewall.width, 1).fillRect(x, bottom.y, ROUTE.firewall.width, 1);
    });
    if (front > 0) {
      // Jagged interference edge; it stays still under reduced motion.
      const phase = motion.reduced ? 0 : Math.floor(this.anim / 120);
      for (let y = GAME.playTop; y < GAME.playBottom; y += 4) {
        const reach = 1 + ((y * 7 + phase * 3) % 5);
        g.fillStyle(0xc985ef).fillRect(Math.round(front), y, reach, 4);
      }
    }
    // Corruptor telegraph: the charge grows through the 600 ms before each orb, right where the orb will appear, at
    // the mouth of the sprite's glowing vent (kept under reduced motion).
    for (const c of this.alive(this.corruptors)) {
      const level = corruptorCharge(now - Number(c.getData('born')));
      if (level <= 0) continue;
      const size = 1 + 2 * Math.round(2 * level), half = Math.floor(size / 2);
      const vx = Math.round(c.x - cameraX + BUGS.corruptor.ventDx), vy = Math.round(c.y + BUGS.corruptor.ventDy);
      g.fillStyle(VIOLET).fillRect(vx - half, vy - half, size, size);
      if (size >= 3) g.fillStyle(LIGHT).fillRect(vx, vy, 1, 1);
    }
    this.drawThresholdPattern(now);
    this.drawHazards(now);
  }

  // A row of rings lights in a fixed repeating sequence: the loop motif that announces Amaru.
  private drawThresholdPattern(now: number): void {
    const g = this.pattern.clear();
    if (!this.thresholdStarted) return;
    const lit = Math.floor((now - segmentStart('threshold')) / 350) % 7;
    for (let i = 0; i < 7; i++) {
      const x = 46 + i * 38, y = 100;
      g.fillStyle(i === lit ? GOLD : DIM).fillRect(x - 3, y - 4, 7, 1).fillRect(x - 3, y + 4, 7, 1).fillRect(x - 4, y - 3, 1, 7).fillRect(x + 4, y - 3, 1, 7);
      if (i === lit) g.fillStyle(LIGHT).fillRect(x - 1, y - 1, 3, 3);
    }
  }

  private updateCaption(text: string): void {
    if (this.caption.text === text) return;
    const width = text.length * CELL_WIDTH, x = Math.round((GAME.width - width) / 2);
    this.caption.setText(text).setX(x);
    this.captionBox.setVisible(text.length > 0).setPosition(x - 3, CAPTION.top).setSize(width + 6, CAPTION.height);
  }

  // Reads physics state only; writes textures, rotation, alpha and particles, never bodies or counters.
  private animate(delta: number, carry: number): void {
    const body = this.player.body as Body;
    if (this.ending === 'playing') {
      this.animator.update({ now: this.anim, velocityY: body.velocity.y, nokia: false, reduced: motion.reduced });
      this.player.setAngle(motion.reduced ? 0 : flightTilt(body.velocity.x - carry, body.velocity.y));
    }
    const wiggle = !motion.reduced && Math.floor(this.anim / 140) % 2 === 1, reduced = motion.reduced;
    const hit = (bug: Sprite) => this.anim < Number(bug.getData('hitUntil'));
    for (const bug of this.alive(this.glitchlings)) this.setKey(bug, hit(bug) ? 'glitchling-hit' : wiggle ? 'glitchling-b' : 'glitchling');
    for (const c of this.alive(this.corruptors)) this.setKey(c, hit(c) ? BUG_TEXTURES.corruptorHit : corruptorFrame(this.clock - Number(c.getData('born')), this.anim, reduced));
    for (const s of this.alive(this.shadows)) {
      const t = BUG_TEXTURES;
      if (s.getData('type') === 'sombra') {
        const warning = dodgeStage(s.getData('motion') as SombraMotion, this.clock) === 'telegraph';
        this.setKey(s, hit(s) ? t.sombraHit : sombraFrame(warning, this.anim, reduced));
      } else this.setKey(s, hit(s) ? t.shadowHit : shadowFrame(this.anim, reduced));
    }
    for (const item of this.alive(this.pickups)) this.setKey(item, pickupFrame(item.getData('kind') as PickupKind, this.anim, reduced));
    // The Bucle rewinds the clouds at every reset (the scenery visibly repeats); the eruption thickens the Misti.
    this.ambient.update(this.anim, this.clock, this.cameras.main.scrollX - sceneryRewind(this.loop.resets), reduced, eruptionLevel(this.clock));
    if (this.anim >= this.nextGlintAt) {
      const knots = this.alive(this.fragments);
      const knot = knots[Math.floor(this.anim / 900) % Math.max(1, knots.length)];
      if (knot) this.fx.emit({ x: knot.x + 2, y: knot.y - 5, vx: 0, vy: -9, ttl: 380, slot: 'light', size: 1 }, this.anim);
      this.nextGlintAt = this.anim + 900;
    }
    this.shots.getChildren().forEach((child, i) => {
      const shot = child as Sprite, view = this.shotViews[i];
      if (!shot.active) { view.setVisible(false); return; }
      const kind = (shot.getData('kind') as ShotKind | undefined) ?? 'normal', origin = shotOrigin(kind);
      view.setTexture(shotTextureKey(kind, shotFrame(kind, this.anim - Number(shot.getData('born') ?? 0), motion.reduced), false))
        .setOrigin(origin.x, origin.y).setPosition(Math.round(shot.x), Math.round(shot.y)).setRotation(Number(shot.getData('tilt') ?? 0)).setVisible(true);
    });
    this.fx.step(this.anim, delta / 1000, 20);
    this.fxGraphics.clear();
    drawParticles(this.fxGraphics, this.fx, false);
    this.impacts.step(this.anim, motion.reduced);
    drawImpacts(this.fxGraphics, this.impacts, this.anim, false, motion.reduced);
    drawShatter(this.fxGraphics, shatterPieces(this.anim - this.shatter.at, motion.reduced), this.cameras.main.scrollX + this.shatter.x, this.shatter.y);
    if (this.ending === 'playing' && this.power.shield) drawKipuShield(this.fxGraphics, this.player.x, this.player.y, SHIELD);
    drawShieldBreak(this.fxGraphics, this.player.x, this.player.y, SHIELD, this.anim - this.shieldBreakAt, motion.reduced);
    this.floaters.step(this.anim);
    this.floaters.items.forEach((f, i) => {
      const label = this.floaterTexts[i];
      label.setVisible(f.active);
      if (!f.active) return;
      const view = floaterView(f, this.anim, motion.reduced);
      label.setPosition(Math.round(view.x - f.text.length * CELL_WIDTH / 2), view.y).setAlpha(view.alpha);
    });
  }

  private setKey(sprite: Sprite, key: string): void { if (sprite.texture.key !== key) sprite.setTexture(key); }

  private drawHud(): void {
    this.hud.draw({
      hp: this.health.hp, maxHp: ROUTE.maxHp, meter: this.meter, score: runningScore(this.tally), now: this.anim,
      combo: comboMultiplier(this.combo.hits), comboHot: this.anim < this.comboHotUntil,
      shield: this.ending === 'playing' && this.power.shield, rafaga: this.ending === 'playing' ? rafagaLevel(this.power, this.real) : 0,
      leaking: this.ending === 'playing' && this.leak.inside && this.meter > 0,
    });
  }

  private runState(): RunState {
    return {
      hp: this.health.hp, score: runningScore(this.tally), fragments: this.tally.fragments, bugs: this.tally.bugs, meter: this.meter, routeSeconds: this.clock / 1000,
      bugPoints: this.tally.bugPoints ?? 0, comboBonus: this.tally.comboBonus ?? 0, comboHits: this.combo.hits,
      pickups: this.tally.pickups ?? 0, pickupBonus: this.tally.pickupBonus ?? 0,
    };
  }

  private transition(): void {
    this.ending = 'transition';
    this.registry.set(RUN_KEY, this.runState());
    this.registry.set('progress', completeRoute(this.registry.get('progress') ?? initialProgress()));
    this.input.keyboard?.resetKeys();
    this.scene.start('GuardianScene');
  }

  private defeat(): void {
    this.ending = 'defeat';
    this.physics.world.pause();
    this.player.setAlpha(1).setAngle(0);
    this.animator.hold('squash', false);
    sfx.play('defeat');
    burst(this.fx, this.player.x, this.player.y - 4, 14, 65, 500, 'violet', this.anim, 2);
    this.updateCaption('');
    const text = `${TEXT.routeDefeat}\n${TEXT.routeDefeatHelp}`;
    this.panel.setVisible(true);
    this.panelText.setText(text).setX(Math.round((GAME.width - TEXT.routeDefeatHelp.length * CELL_WIDTH) / 2));
    this.drawHud();
    this.publishView();
  }

  private togglePause(): void {
    if (this.ending !== 'playing') return;
    this.paused = !this.paused;
    this.freeze(this.paused || !this.focused);
    this.pause.setVisible(this.paused);
    sfx.play('pause');
  }

  // Same freeze as focus loss: owned clocks stop in update(), physics and the scene clock pause, input clears.
  private freeze(frozen: boolean): void {
    if (frozen) {
      this.physics.world.pause();
      this.time.paused = true;
      this.input.keyboard?.resetKeys();
      this.retryRequested = false; this.mapRequested = false;
      this.player.setVelocity(0, 0);
    } else {
      if (this.ending === 'playing') this.physics.world.resume();
      this.time.paused = false;
    }
  }

  private onBlur = (): void => { this.focused = false; this.freeze(true); };
  private onFocus = (): void => {
    if (document.activeElement?.id !== 'game') return;
    this.focused = true;
    this.freeze(this.paused);
  };
  private pageFocus(active: boolean): void { if (active) this.onFocus(); else this.onBlur(); }

  private publishView(): void {
    const progress: Progress = { ...(this.registry.get('progress') ?? initialProgress()) };
    this.game.events.emit(VIEW_EVENT, { view: 'route', outcome: this.ending === 'defeat' ? 'defeat' : 'playing', progress } satisfies ViewState);
  }

  private onShutdown(): void {
    this.game.events.off(FOCUS_EVENT, this.pageFocus, this);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
    clearDebug();
    this.input.keyboard?.resetKeys();
  }

  // ------------------------------------------------------------------ A2 hazards
  // Packet Loss: solid blocks hurt and stop shots; telegraphing and lost blocks are only outlines (drawHazards).
  private updatePacketLoss(now: number, cameraX: number): void {
    this.packetView = packetLossColumns(now);
    for (const tiles of this.packetTiles) for (const tile of tiles) tile.setVisible(false);
    if (this.packetView.length === 0) return;
    const player = this.playerRect(cameraX);
    for (const column of this.packetView) {
      const rects = blockRects(Math.round(column.x)), tiles = this.packetTiles[column.index];
      rects.forEach((rect, i) => {
        const solid = column.states[i] === 'solid';
        tiles[i].setVisible(solid).setX(rect.x);
        if (!solid) return;
        if (overlaps(player, rect)) this.hurt('packet');
        for (const shot of this.alive(this.shots)) {
          const body = shot.body as Body;
          if (overlaps({ x: body.x - cameraX, y: body.y, width: body.width, height: body.height }, rect)) { shot.disableBody(true, true); burst(this.fx, shot.x, shot.y, 3, 30, 140, 'teal', this.anim); }
        }
      });
    }
  }

  // Erupción del Misti: each marker takes a pooled slot 700 ms before its impact; the ember falls into it and hurts
  // in a small radius for a moment.
  private updateEmbers(now: number, cameraX: number): void {
    const step = embersDue(this.emberCursor, now);
    this.emberCursor = step.next;
    for (const spec of step.due) {
      const slot = this.embers.find(e => !e.active);
      if (!slot) continue; // bounded pool
      const landing = emberLanding(spec, { x: this.player.x - cameraX, y: this.player.y });
      Object.assign(slot, { active: true, at: spec.at, x: landing.x, y: landing.y, aimed: spec.x === undefined, impacted: false });
    }
    const player = this.playerRect(cameraX);
    this.embers.forEach((e, i) => {
      const image = this.emberImages[i];
      if (!e.active) { image.setVisible(false); return; }
      const stage = emberStage(now, e.at);
      if (stage === 'done') { e.active = false; image.setVisible(false); return; }
      if (stage === 'marker') { const p = emberPosition(now, e.at, e); image.setVisible(true).setPosition(p.x, p.y); return; }
      image.setVisible(false);
      if (!e.impacted) {
        e.impacted = true; this.emberImpacts += 1;
        sfx.play('emberImpact');
        burst(this.fx, cameraX + e.x, e.y, 8, 50, 300, 'gold', this.anim, 2);
      }
      if (emberHits(e, player)) this.hurt('ember');
    });
  }

  // Memory Leak: dithered zones drain the meter while Kipu is inside; their fragments ride with them.
  private stepLeak(now: number, worldDelta: number, cameraX: number): void {
    const zones = leakZones(now);
    this.leakTiles.forEach(tile => tile.setVisible(false));
    for (const z of zones) {
      const tile = this.leakTiles[z.index].setVisible(true).setPosition(Math.round(z.rect.x), z.rect.y);
      if (!motion.reduced) tile.setTilePosition(Math.floor(this.anim / 260) % 2, 0);
    }
    while (this.leakFragmentsSpawned < MEMORY_LEAK.fragments.length && now >= MEMORY_LEAK.zones[MEMORY_LEAK.fragments[this.leakFragmentsSpawned].zone].at) {
      const index = this.leakFragmentsSpawned++, pos = leakFragmentPosition(now, MEMORY_LEAK.fragments[index]);
      const knot = pos ? this.spawn({ at: now, kind: 'fragment', y: pos.y }, cameraX, now) : null;
      if (knot && pos) { knot.setData('leak', index); (knot.body as Body).reset(cameraX + pos.x, pos.y); }
    }
    for (const knot of this.alive(this.fragments)) {
      const index = Number(knot.getData('leak') ?? -1);
      if (index < 0) continue;
      const pos = leakFragmentPosition(now, MEMORY_LEAK.fragments[index]);
      if (!pos) { knot.disableBody(true, true); continue; }
      (knot.body as Body).reset(cameraX + pos.x, pos.y);
    }
    const player = this.playerRect(cameraX);
    this.leak.inside = this.ending === 'playing' && zones.some(z => overlaps(player, z.rect));
    if (!this.leak.inside || this.meter <= 0) return;
    const before = this.meter;
    this.meter = drainMeter(this.meter, worldDelta);
    this.leak.drained += before - this.meter;
    if (this.real >= this.leak.nextSoundAt) { sfx.play('leakDrain'); this.leak.nextSoundAt = this.real + LEAK_SOUND_MS; }
    if (this.anim >= this.leak.nextSparkAt) {
      // Energy visibly leaves Kipu: a violet spark drifts up and away (particles are off under reduced motion).
      this.fx.emit({ x: this.player.x, y: this.player.y - 4, vx: -12, vy: -26, ttl: 420, slot: 'violet', size: 1 }, this.anim);
      this.leak.nextSparkAt = this.anim + LEAK_SPARK_MS;
    }
  }

  // Bucle: resets its Glitchling formation at every iteration until the node breaks (shot) or it gives up (timeout).
  private stepLoop(now: number, prev: number, cameraX: number): void {
    const step = stepLoop(this.loop, now);
    this.loop = step.state;
    if (step.reset) {
      for (const bug of this.alive(this.glitchlings)) if (bug.getData('loop') === true) { burst(this.fx, bug.x, bug.y, 5, 30, 260, 'violet', this.anim); bug.disableBody(true, true); }
      this.loopResetAt = this.anim;
      sfx.play('loopReset');
    }
    if (step.broke) this.breakLoop(cameraX);
    for (const f of formationDue(prev, now, this.loop)) this.spawn({ at: f.at, kind: 'glitchling', y: f.y }, cameraX, now)?.setData('loop', true);
    const active = loopActive(this.loop, now);
    this.loopNode.setVisible(active);
    if (!active) return;
    const p = nodePosition(now), half = LOOP.node.body / 2;
    this.loopNode.setPosition(p.x, p.y).setTexture(eyeTextureKey(eyeFrameFor({ hp: this.loop.hp, anim: this.anim, hitUntil: this.loopHitUntil, reduced: motion.reduced })));
    const node = { x: p.x - half, y: p.y - half, width: LOOP.node.body, height: LOOP.node.body };
    for (const shot of this.alive(this.shots)) {
      const body = shot.body as Body;
      if (!overlaps({ x: body.x - cameraX, y: body.y, width: body.width, height: body.height }, node)) continue;
      shot.disableBody(true, true);
      this.impacts.spawn(shot.x + 3, shot.y, (shot.getData('kind') as ShotKind | undefined) ?? 'normal', this.anim);
      const hit = hitLoopNode(this.loop, now);
      this.loop = hit.state;
      this.meter = addMeter(this.meter, ROUTE.meterPerHit);
      const combo = registerHit(this.combo);
      this.combo = combo.combo;
      if (combo.tierUp) { sfx.play('comboUp'); this.comboHotUntil = this.anim + COMBO_HOT_MS; }
      this.loopHitUntil = this.anim + FLASH_MS;
      if (hit.broke) { this.breakLoop(cameraX); return; }
      sfx.play('enemyHit');
      this.floater('1', cameraX + p.x, p.y - 10, 'damage');
      burst(this.fx, cameraX + p.x, p.y, 3, 30, 160, 'light', this.anim);
    }
  }

  // "BUCLE ROTO": a shot break debugs the loop like a bug (score at the racha multiplier, hit-stop, maybe a drop); a
  // timeout break only shows the cue.
  private breakLoop(cameraX: number): void {
    const p = nodePosition(this.clock), x = cameraX + p.x;
    this.loopNode.setVisible(false);
    // The eye shatters: shards fly and the cables loosen (screen-relative, so the burst rides the scroll with the node).
    this.shatter = { at: this.anim, x: p.x, y: p.y, count: this.shatter.count + 1 };
    sfx.play('loopBreak');
    dissolve(this.fx, x, p.y, LOOP.node.size, LOOP.node.size, this.anim);
    if (this.loop.brokenBy !== 'shot') return;
    const result = defeatBug(this.tally, LOOP.score, this.combo.hits);
    this.tally = result.tally;
    this.floater(`+${result.points}`, x, p.y - 12, 'points');
    if (!motion.reduced) this.hitStop = triggerHitStop(this.hitStop, this.real);
    if (dropsFragment(this.tally.bugs)) this.dropFragment(x, p.y);
  }

  // Telegraphs and markers, all kept under reduced motion (blinking becomes steady).
  private drawHazards(now: number): void {
    const g = this.hazardFx.clear(), blink = motion.reduced || Math.floor(this.anim / 100) % 2 === 0;
    // Packet Loss: lost blocks are a dim dotted frame; a telegraphing block blinks a bright frame before turning solid.
    for (const column of this.packetView) {
      blockRects(Math.round(column.x)).forEach((r, i) => {
        const state = column.states[i];
        if (state === 'solid') return;
        if (state === 'telegraph') {
          if (!blink) return;
          g.fillStyle(LIGHT).fillRect(r.x, r.y, r.width, 1).fillRect(r.x, r.y + r.height - 1, r.width, 1).fillRect(r.x, r.y, 1, r.height).fillRect(r.x + r.width - 1, r.y, 1, r.height);
          return;
        }
        g.fillStyle(DIM);
        for (let y = r.y; y < r.y + r.height; y += 4) g.fillRect(r.x, y, 1, 2).fillRect(r.x + r.width - 1, y, 1, 2);
      });
    }
    // Ember markers: a dark landing shadow and closing corner brackets, from 700 ms before the impact.
    for (const e of this.embers) {
      if (!e.active) continue;
      const stage = emberStage(now, e.at);
      if (stage === 'impact') { g.fillStyle(EMBER).fillRect(e.x - 3, e.y - 1, 7, 3); continue; }
      if (stage !== 'marker') continue;
      const size = markerSize(now, e.at);
      g.fillStyle(ASH).fillRect(e.x - 4, e.y - 1, 9, 3);
      g.fillStyle(EMBER);
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        const cx = e.x + dx * size, cy = e.y + dy * size;
        g.fillRect(dx < 0 ? cx : cx - 3, cy, 4, 1).fillRect(cx, dy < 0 ? cy : cy - 3, 1, 4);
      }
      if (blink) g.fillStyle(LIGHT).fillRect(e.x, e.y, 1, 1);
    }
    // Memory Leak zones: a 1 px violet frame around each dither; it blinks light while it drains Kipu.
    for (const z of leakZones(now)) {
      const x = Math.round(z.rect.x), r = z.rect;
      g.fillStyle(this.leak.inside && blink ? LIGHT : VIOLET).fillRect(x, r.y, r.width, 1).fillRect(x, r.y + r.height - 1, r.width, 1).fillRect(x, r.y, 1, r.height).fillRect(x + r.width - 1, r.y, 1, r.height);
    }
    // Bucle: the loop marker sweeps right to left; the node is framed by blinking brackets with its HP pips below.
    if (!loopActive(this.loop, now)) return;
    const mx = loopMarkerX(now);
    for (let y = GAME.playTop; y < GAME.playBottom; y += 6) g.fillStyle(y % 12 === 0 ? GOLD : VIOLET).fillRect(mx, y, 1, 3);
    if (this.anim - this.loopResetAt < 240) g.fillStyle(LIGHT).fillRect(0, GAME.playTop, 2, GAME.playBottom - GAME.playTop);
    const p = nodePosition(now), h = 10;
    if (blink) {
      g.fillStyle(GOLD);
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        const cx = p.x + dx * h, cy = p.y + dy * h;
        g.fillRect(dx < 0 ? cx : cx - 2, cy, 3, 1).fillRect(cx, dy < 0 ? cy : cy - 2, 1, 3);
      }
    }
    // HP pips sit above the eye now: its cables hang below. B5: the prepared eye reaches 14 px above the node (15 in the hit flash), so the pips ride 3 px higher (EYE.pipsAbove) to stay clear of it.
    for (let i = 0; i < LOOP.hp; i++) g.fillStyle(i < this.loop.hp ? GOLD : DIM).fillRect(p.x - 9 + i * 4, p.y - EYE.pipsAbove, 3, 2);
  }

  private hazardSnapshot() {
    const clock = this.clock, cameraX = this.cameras.main.scrollX;
    return {
      active: HAZARD_WINDOWS.filter(([, [from, to]]) => clock >= from && clock < to).map(([name]) => name),
      packetLoss: this.packetView.map(c => ({ index: c.index, screenX: c.x, states: c.states.map(s => (s === 'solid' ? 'S' : s === 'telegraph' ? 'T' : 'L')).join('') })),
      embers: this.embers.filter(e => e.active).map(e => ({ at: e.at, x: e.x, y: e.y, aimed: e.aimed, stage: emberStage(clock, e.at), size: markerSize(clock, e.at) })),
      emberImpacts: this.emberImpacts, eruption: eruptionLevel(clock),
      leak: { inside: this.leak.inside, drained: this.leak.drained, zones: leakZones(clock).map(z => ({ index: z.index, screenX: z.rect.x, y: z.rect.y, width: z.rect.width, height: z.rect.height })) },
      loop: {
        ...this.loop, active: loopActive(this.loop, clock), node: nodePosition(clock), markerX: loopMarkerX(clock), cue: cueVisible(this.loop, clock),
        eye: { texture: this.loopNode.texture.key, visible: this.loopNode.visible, frames: EYE.frames },
        shatter: { spawned: this.shatter.count, pieces: shatterPieces(this.anim - this.shatter.at, motion.reduced).length },
        formation: this.alive(this.glitchlings).filter(b => b.getData('loop') === true).map(b => ({ x: b.x - cameraX, y: b.y })),
      },
      hurts: JSON.parse(JSON.stringify(this.hurts)) as Record<HurtSource, { damage: number; absorbed: number }>,
    };
  }

  private snapshot() {
    const body = this.player.body as Body, cameraX = this.cameras.main.scrollX;
    const enemy = (e: Sprite) => {
      const type = e.getData('type') as EnemyType, age = this.clock - Number(e.getData('born') ?? 0);
      return {
        type, x: e.x, y: e.y, screenX: e.x - cameraX, hp: Number(e.getData('hp')), texture: e.texture.key,
        charging: type === 'corruptor' ? corruptorCharge(age) > 0 : false,
        dodge: type === 'sombra' ? dodgeStage(e.getData('motion') as SombraMotion, this.clock) : 'none',
      };
    };
    const enemyList = [...this.alive(this.glitchlings), ...this.alive(this.corruptors), ...this.alive(this.shadows)].map(enemy);
    return {
      scene: 'route', sceneRun: this.sceneRun, clock: this.clock, realClock: this.real, anim: this.anim, worldRate: this.worldRate, segment: segmentAt(this.clock),
      caption: this.caption.text, paused: this.paused, focused: this.focused, outcome: this.ending,
      cameraX, scrollSpeed: ROUTE.scrollSpeed, transitionMs: ROUTE.transitionMs,
      player: {
        x: this.player.x, y: this.player.y, velocityX: body.velocity.x, velocityY: body.velocity.y,
        hp: this.health.hp, invulnerableUntil: this.health.invulnerableUntil, angle: this.player.angle, flipX: this.player.flipX,
        texture: this.player.texture.key, nativeWidth: this.player.frame.realWidth, nativeHeight: this.player.frame.realHeight,
        displayWidth: this.player.displayWidth, displayHeight: this.player.displayHeight,
        bodyWidth: body.width, bodyHeight: body.height, bodyRelativeX: body.x - this.player.x, bodyRelativeY: body.y - this.player.y,
        bodyTop: body.top, bodyBottom: body.bottom,
      },
      score: runningScore(this.tally), fragments: this.tally.fragments, bugs: this.tally.bugs, meter: this.meter,
      bugPoints: this.tally.bugPoints ?? 0, comboBonus: this.tally.comboBonus ?? 0,
      combo: { hits: this.combo.hits, best: this.combo.best, multiplier: comboMultiplier(this.combo.hits) },
      hitStop: { active: hitStopActive(this.hitStop, this.real), from: this.hitStop.from, until: this.hitStop.until, count: this.hitStop.count, totalMs: this.hitStop.totalMs },
      floaters: { active: this.floaters.activeCount, capacity: this.floaters.items.length, texts: this.floaters.items.filter(f => f.active).map(f => f.text) },
      fragmentsDropped: this.fragmentsDropped,
      power: { rafaga: { active: rafagaActive(this.power, this.real), remainingMs: rafagaRemaining(this.power, this.real), until: this.power.rafagaUntil }, shield: this.power.shield, shieldBreakAt: this.shieldBreakAt },
      pickups: this.alive(this.pickups).map(p => ({ type: p.getData('kind') as PickupKind, x: p.x, y: p.y, screenX: p.x - cameraX, texture: p.texture.key })),
      pickupsCollected: { ...this.collected }, pickupBonus: this.tally.pickupBonus ?? 0, pickupCount: this.tally.pickups ?? 0,
      fire: { ...this.volley, cooldownMs: shotCooldown(this.power, this.real), damage: shotDamage(this.power, this.real) },
      umbral: { ...this.umbral },
      enemies: enemyList.length, enemyList, fragmentCount: this.fragments.countActive(true), shotCount: this.shots.countActive(true),
      orbs: this.alive(this.orbs).map(o => ({ x: o.x, y: o.y, screenX: o.x - cameraX, vx: Number(o.getData('vx')), vy: Number(o.getData('vy')) })),
      capacity: {
        shots: this.shots.getLength(), enemies: this.glitchlings.getLength(), corruptors: this.corruptors.getLength(), shadows: this.shadows.getLength(),
        orbs: this.orbs.getLength(), fragments: this.fragments.getLength(), particles: this.fx.items.length, floaters: this.floaters.items.length, pickups: this.pickups.getLength(),
      },
      marea: { front: mareaFront(this.clock) },
      background: {
        layers: this.children.list.filter(o => (o as unknown as { depth: number }).depth < 0).map(o => ({ name: o.name, type: o.type, depth: (o as unknown as { depth: number }).depth })),
        backdropAlpha: BACKDROP.alpha, ambient: this.ambient.snapshot(),
      },
      walls: WALLS.map((wall, index) => ({ screenX: wallScreenX(this.clock, wall), gapY: wall.gapY, visible: this.walls[index][0].visible, telegraph: wallTelegraph(this.clock, wall) }))
        .filter(wall => wall.visible || wall.telegraph),
      glitchlings: this.alive(this.glitchlings).map(bug => ({ x: bug.x, y: bug.y, hp: Number(bug.getData('hp')) })),
      fragmentList: this.alive(this.fragments).map(knot => ({ x: knot.x, y: knot.y, dropped: knot.getData('dropped') === true, leak: Number(knot.getData('leak') ?? -1) >= 0 })),
      hazards: this.hazardSnapshot(),
      shots: this.alive(this.shots).map(shot => ({
        x: shot.x, y: shot.y, screenX: shot.x - cameraX, damage: Number(shot.getData('damage') ?? 1),
        kind: (shot.getData('kind') as ShotKind | undefined) ?? 'normal', texture: this.shotViews[this.shots.getChildren().indexOf(shot)].texture.key,
      })),
      impacts: { active: this.impacts.activeCount, spawned: this.impacts.spawned, capacity: this.impacts.items.length },
      fx: { active: this.fx.activeCount, capacity: this.fx.items.length },
      audio: sfx.stats(), kipuFrame: this.animator.frame, hud: { score: this.hud.scoreText, combo: this.hud.comboText, rafaga: this.hud.rafagaText, shield: this.hud.shieldIcon, leak: this.hud.leakIcon }, panel: this.panelText.text,
    };
  }
}
