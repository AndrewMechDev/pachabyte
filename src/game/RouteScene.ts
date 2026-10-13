import Phaser from 'phaser';
import { GAME, canShoot, flight, frameDelta, oncePerEvent, playBounds, projectileExpired, shotVelocity } from './rules';
import {
  ROUTE, RUN_KEY, WALLS, addMeter, cameraScroll, captionAt, glitchlingVelocity, mareaFront, mareaTouches, overlaps, pickupFragment,
  runningScore, segmentAt, spawnsDue, takeHit, wallRects, wallScreenX, wallTelegraph, type Health, type Rect, type RunState, type Spawn, type Tally,
} from './routeRules';
import { completeRoute, initialProgress, type Progress } from './challengeRules';
import { createTextures, createRetroFonts, createRouteTextures, drawScenery } from './textures';
import { CELL_HEIGHT, CELL_WIDTH, MARK_ROWS, fontKey } from './retroFont';
import { ParticlePool, burst, drawParticles, flightTilt } from './animation';
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

const POOL = { shots: GAME.bulletCapacity, glitchlings: 12, fragments: 10, particles: 96 } as const;
const BACKDROP = { alpha: 0.45, scrollFactor: 0.15 } as const;
const LIGHT = 0xfff1c3, GOLD = 0xedc76c, TEAL = 0x59d3c4, DIM = 0x3a6770, BAR = 0x16343c;
// Caption strip under the HUD: one clear row, the accent rows, the 8 px line cell and one more clear row.
const CAPTION = Object.freeze({ top: GAME.hudHeight + 2, textY: GAME.hudHeight + 3 + MARK_ROWS, height: 1 + MARK_ROWS + CELL_HEIGHT + 1 });

// Ruta 01: free-flight, auto-scrolling route that ends at Amaru. Two owned clocks: `clock` drives every
// gameplay decision; `anim` drives visuals only. Focus loss and Esc pause freeze both, plus physics.
export class RouteScene extends Phaser.Scene {
  private player!: Sprite;
  private keys!: Keys;
  private freshKey = oncePerEvent();
  private shots!: Phaser.Physics.Arcade.Group;
  private glitchlings!: Phaser.Physics.Arcade.Group;
  private fragments!: Phaser.Physics.Arcade.Group;
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

  private sceneRun = 0;
  private clock = 0;
  private anim = 0;
  private focused = true;
  private paused = false;
  private ending: Ending = 'playing';
  private health: Health = { hp: ROUTE.maxHp, invulnerableUntil: 0 };
  private meter = 0;
  private tally: Tally = { fragments: 0, bugs: 0, returns: 0 };
  private nextShotAt = 0;
  private spawnCursor = 0;
  private thresholdStarted = false;
  private retryRequested = false;
  private mapRequested = false;
  private nextGlintAt = 0;

  constructor() { super('RouteScene'); }

  preload(): void {
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation', kipuUrl);
    if (!this.textures.exists('amaru-arena')) this.load.image('amaru-arena', arenaUrl);
  }

  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    this.sceneRun += 1;
    this.clock = 0; this.anim = 0; this.focused = true; this.paused = false; this.ending = 'playing';
    this.health = { hp: ROUTE.maxHp, invulnerableUntil: 0 }; this.meter = 0; this.tally = { fragments: 0, bugs: 0, returns: 0 };
    this.nextShotAt = 0; this.spawnCursor = 0; this.thresholdStarted = false; this.retryRequested = false; this.mapRequested = false; this.nextGlintAt = 0;
    this.time.paused = false;
    createTextures(this); createRouteTextures(this); createRetroFonts(this); ensureKipuFrames(this);

    this.cameras.main.setBackgroundColor(BAR).setBounds(0, 0, ROUTE.worldWidth, GAME.height).setScroll(0, 0);
    // Low-contrast parallax: the existing arena art repeated without stretching, under the provisional scenery.
    const backdropWidth = (ROUTE.worldWidth - GAME.width) * BACKDROP.scrollFactor + GAME.width;
    for (let x = 0; x < backdropWidth; x += GAME.width) this.add.image(x, 0, 'amaru-arena').setOrigin(0).setScrollFactor(BACKDROP.scrollFactor).setAlpha(BACKDROP.alpha).setDepth(-12);
    drawScenery(this, ROUTE.worldWidth, 0.35);
    this.drawBrokenLinks();

    this.player = this.physics.add.sprite(56, 97, 'kipu-evaluation').setOrigin(0.5, 0.55).setDepth(5);
    // Approved 12x18 body at (-6, -8) from the sprite position; the 32x40 art is never scaled.
    this.player.setSize(12, 18).setOffset(10, 14).setCollideWorldBounds(true);
    this.fx = new ParticlePool(POOL.particles, () => motion.reduced);
    this.fxGraphics = this.add.graphics().setDepth(7);
    this.animator = new KipuAnimator(this.player);

    this.shots = this.pool('bullet', POOL.shots, 6, 3, 6);
    this.glitchlings = this.pool('glitchling', POOL.glitchlings, 8, 8, 4);
    this.fragments = this.pool('fragment', POOL.fragments, 7, 7, 3);
    this.walls = WALLS.map(wall => wallRects(wall, 0).map(rect => this.add.tileSprite(0, rect.y, rect.width, rect.height, 'firewall').setOrigin(0).setScrollFactor(0).setDepth(4).setVisible(false)));
    this.marea = this.add.tileSprite(0, GAME.playTop, ROUTE.marea.maxFront, GAME.playBottom - GAME.playTop, 'marea').setOrigin(0).setScrollFactor(0).setDepth(8).setVisible(false);
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(9);
    this.pattern = this.add.graphics().setScrollFactor(0).setDepth(2);

    this.physics.add.overlap(this.shots, this.glitchlings, (first, second) => {
      const shot = (this.shots.contains(first as Sprite) ? first : second) as Sprite;
      const bug = (shot === first ? second : first) as Sprite;
      if (!shot.active || !bug.active || this.ending !== 'playing') return;
      shot.disableBody(true, true);
      this.hitGlitchling(bug);
    });
    this.physics.add.overlap(this.player, this.glitchlings, (first, second) => {
      const bug = (this.glitchlings.contains(first as Sprite) ? first : second) as Sprite;
      if (!bug.active || this.ending !== 'playing') return;
      bug.disableBody(true, true);
      burst(this.fx, bug.x, bug.y, 6, 40, 260, 'violet', this.anim);
      this.hurt('bug');
    });
    this.physics.add.overlap(this.player, this.fragments, (first, second) => {
      const knot = (this.fragments.contains(first as Sprite) ? first : second) as Sprite;
      if (!knot.active || this.ending !== 'playing') return;
      knot.disableBody(true, true);
      const next = pickupFragment(this.meter, this.tally);
      this.meter = next.meter; this.tally = next.tally;
      sfx.play('fragment');
      burst(this.fx, knot.x, knot.y, 8, 45, 320, 'gold', this.anim, 2);
    });

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
    const now = this.clock += delta;
    if (now >= ROUTE.transitionMs) { this.transition(); return; }

    const cameraX = cameraScroll(now);
    this.cameras.main.setScroll(cameraX, 0);
    const bounds = playBounds(cameraX);
    this.physics.world.setBounds(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
    const carry = cameraX < ROUTE.worldWidth - GAME.width ? ROUTE.scrollSpeed : 0;
    const k = this.keys;
    const move = flight({ left: k.a.isDown || k.left.isDown, right: k.d.isDown || k.right.isDown, up: k.w.isDown || k.up.isDown, down: k.s.isDown || k.down.isDown }, 1);
    // Kipu is carried by the scroll: its screen-relative flight is added to the camera speed.
    this.player.setVelocity(move.velocityX + carry, move.velocityY);
    if ((k.space.isDown || k.j.isDown || k.z.isDown) && canShoot(now, this.nextShotAt, this.shots.countActive(false))) this.fire(now, carry);

    const step = spawnsDue(this.spawnCursor, now);
    this.spawnCursor = step.next;
    for (const spawn of step.due) this.spawn(spawn, cameraX);
    if (!this.thresholdStarted && segmentAt(now) === 'threshold') this.enterThreshold();

    for (const bug of this.alive(this.glitchlings)) {
      if (bug.x < cameraX - 16) { bug.disableBody(true, true); continue; }
      const v = glitchlingVelocity(bug.y, this.player.y);
      bug.setVelocity(v.vx, v.vy);
    }
    const front = mareaFront(now);
    for (const knot of this.alive(this.fragments)) {
      if (knot.x < cameraX - 12) knot.disableBody(true, true);
      else if (mareaTouches(front, knot.x - cameraX)) { knot.disableBody(true, true); burst(this.fx, knot.x, knot.y, 5, 30, 240, 'violet', this.anim); }
    }
    for (const shot of this.alive(this.shots)) {
      if (projectileExpired(now, Number(shot.getData('expiresAt')), shot.x, cameraX - 8, cameraX + GAME.width + 8)) shot.disableBody(true, true);
    }
    this.updateWalls(now, cameraX);
    this.updateMarea(front, cameraX);
    if (this.ending !== 'playing') return;

    const blinking = now < this.health.invulnerableUntil;
    this.player.setAlpha(!blinking ? 1 : motion.reduced ? 0.5 : Math.floor(now / 90) % 2 ? 0.25 : 1);
    this.updateCaption(captionAt(now));
    this.drawOverlay(now, front);
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

  private spawn(spawn: Spawn, cameraX: number): void {
    const group = spawn.kind === 'glitchling' ? this.glitchlings : this.fragments;
    const sprite = group.getFirstDead(false) as Sprite | null;
    if (!sprite) return; // bounded pool: a full pool drops the spawn by design
    sprite.enableBody(true, cameraX + GAME.width + 10, spawn.y, true, true);
    sprite.setVelocity(0, 0).setAlpha(1);
    if (spawn.kind === 'glitchling') sprite.setTexture('glitchling').setData({ hp: ROUTE.glitchling.hp, hitUntil: 0 });
  }

  private fire(now: number, carry: number): void {
    const shot = this.shots.getFirstDead(false) as Sprite | null;
    if (!shot) return;
    // Kipu always fires to the right on the route.
    shot.enableBody(true, this.player.x + 12, this.player.y - 1, true, true);
    shot.setVelocity(shotVelocity(1, carry), 0).setData('expiresAt', now + GAME.bulletLifetimeMs);
    sfx.play('shot');
    burst(this.fx, shot.x - 2, shot.y, 3, 34, 140, 'gold', this.anim);
    this.nextShotAt = now + GAME.shotCooldownMs;
  }

  private hitGlitchling(bug: Sprite): void {
    const hp = Number(bug.getData('hp')) - 1;
    this.meter = addMeter(this.meter, ROUTE.meterPerHit);
    if (hp > 0) {
      bug.setData({ hp, hitUntil: this.anim + 90 });
      sfx.play('enemyHit');
      burst(this.fx, bug.x, bug.y, 3, 30, 160, 'light', this.anim);
      return;
    }
    bug.disableBody(true, true);
    this.tally = { ...this.tally, bugs: this.tally.bugs + 1 };
    sfx.play('enemyDown');
    burst(this.fx, bug.x, bug.y, 10, 55, 360, 'violet', this.anim, 2);
  }

  private hurt(source: 'bug' | 'firewall' | 'marea'): void {
    const next = takeHit(this.health, this.clock);
    if (next === this.health) return;
    this.health = next;
    sfx.play(source === 'firewall' ? 'firewall' : 'heroHit');
    burst(this.fx, this.player.x, this.player.y - 4, 10, 60, 320, 'violet', this.anim, 2);
    if (!motion.reduced) this.cameras.main.shake(110, 0.006);
    if (next.hp <= 0) this.defeat();
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

  private enterThreshold(): void {
    // Enemies stop and dissolve; the route falls quiet before the guardian.
    this.thresholdStarted = true;
    for (const bug of this.alive(this.glitchlings)) {
      burst(this.fx, bug.x, bug.y, 6, 30, 400, 'violet', this.anim);
      bug.disableBody(true, true);
    }
  }

  private drawOverlay(now: number, front: number): void {
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
    this.drawThresholdPattern(now);
  }

  // A row of rings lights in a fixed repeating sequence: the loop motif that announces Amaru.
  private drawThresholdPattern(now: number): void {
    const g = this.pattern.clear();
    if (!this.thresholdStarted) return;
    const lit = Math.floor((now - 62000) / 350) % 7;
    for (let i = 0; i < 7; i++) {
      const x = 46 + i * 38, y = 100;
      g.fillStyle(i === lit ? GOLD : DIM).fillRect(x - 3, y - 4, 7, 1).fillRect(x - 3, y + 4, 7, 1).fillRect(x - 4, y - 3, 1, 7).fillRect(x + 4, y - 3, 1, 7);
      if (i === lit) g.fillStyle(LIGHT).fillRect(x - 1, y - 1, 3, 3);
    }
  }

  private drawBrokenLinks(): void {
    // Signals of broken links near the arrival: Trama lines with missing spans (static, world space).
    const g = this.add.graphics().setDepth(-4);
    for (const [y, offset] of [[44, 0], [150, 37]] as const) {
      for (let x = offset; x < 900; x += 46) g.fillStyle(x % 3 ? DIM : TEAL).fillRect(x, y, 28, 1);
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
    const wiggle = !motion.reduced && Math.floor(this.anim / 140) % 2 === 1;
    for (const bug of this.alive(this.glitchlings)) {
      const key = this.anim < Number(bug.getData('hitUntil')) ? 'glitchling-hit' : wiggle ? 'glitchling-b' : 'glitchling';
      if (bug.texture.key !== key) bug.setTexture(key);
    }
    if (this.anim >= this.nextGlintAt) {
      const knots = this.alive(this.fragments);
      const knot = knots[Math.floor(this.anim / 900) % Math.max(1, knots.length)];
      if (knot) this.fx.emit({ x: knot.x + 2, y: knot.y - 5, vx: 0, vy: -9, ttl: 380, slot: 'light', size: 1 }, this.anim);
      this.nextGlintAt = this.anim + 900;
    }
    this.fx.step(this.anim, delta / 1000, 20);
    this.fxGraphics.clear();
    drawParticles(this.fxGraphics, this.fx, false);
  }

  private drawHud(): void {
    this.hud.draw({ hp: this.health.hp, maxHp: ROUTE.maxHp, meter: this.meter, score: runningScore(this.tally), now: this.anim });
  }

  private runState(): RunState {
    return { hp: this.health.hp, score: runningScore(this.tally), fragments: this.tally.fragments, bugs: this.tally.bugs, meter: this.meter, routeSeconds: this.clock / 1000 };
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

  private snapshot() {
    const body = this.player.body as Body;
    return {
      scene: 'route', sceneRun: this.sceneRun, clock: this.clock, anim: this.anim, segment: segmentAt(this.clock),
      caption: this.caption.text, paused: this.paused, focused: this.focused, outcome: this.ending,
      cameraX: this.cameras.main.scrollX, scrollSpeed: ROUTE.scrollSpeed, transitionMs: ROUTE.transitionMs,
      player: {
        x: this.player.x, y: this.player.y, velocityX: body.velocity.x, velocityY: body.velocity.y,
        hp: this.health.hp, invulnerableUntil: this.health.invulnerableUntil, angle: this.player.angle, flipX: this.player.flipX,
        texture: this.player.texture.key, nativeWidth: this.player.frame.realWidth, nativeHeight: this.player.frame.realHeight,
        displayWidth: this.player.displayWidth, displayHeight: this.player.displayHeight,
        bodyWidth: body.width, bodyHeight: body.height, bodyRelativeX: body.x - this.player.x, bodyRelativeY: body.y - this.player.y,
        bodyTop: body.top, bodyBottom: body.bottom,
      },
      score: runningScore(this.tally), fragments: this.tally.fragments, bugs: this.tally.bugs, meter: this.meter,
      enemies: this.glitchlings.countActive(true), fragmentCount: this.fragments.countActive(true), shotCount: this.shots.countActive(true),
      capacity: { shots: this.shots.getLength(), enemies: this.glitchlings.getLength(), fragments: this.fragments.getLength(), particles: this.fx.items.length },
      marea: { front: mareaFront(this.clock) },
      walls: WALLS.map((wall, index) => ({ screenX: wallScreenX(this.clock, wall), gapY: wall.gapY, visible: this.walls[index][0].visible, telegraph: wallTelegraph(this.clock, wall) }))
        .filter(wall => wall.visible || wall.telegraph),
      glitchlings: this.alive(this.glitchlings).map(bug => ({ x: bug.x, y: bug.y, hp: Number(bug.getData('hp')) })),
      fragmentList: this.alive(this.fragments).map(knot => ({ x: knot.x, y: knot.y })),
      shots: this.alive(this.shots).map(shot => ({ x: shot.x, y: shot.y, screenX: shot.x - this.cameras.main.scrollX })),
      fx: { active: this.fx.activeCount, capacity: this.fx.items.length },
      audio: sfx.stats(), kipuFrame: this.animator.frame, hud: { score: this.hud.scoreText }, panel: this.panelText.text,
    };
  }
}
