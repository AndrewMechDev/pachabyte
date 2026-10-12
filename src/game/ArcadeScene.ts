/// <reference types="vite/client" />
import Phaser from 'phaser';
import { GAME, canShoot, movement, projectileExpired, shotVelocity, shouldJump } from './rules';
import { completeTraining, initialProgress } from './challengeRules';
import type { Facing } from './rules';
import { createTextures, drawStoneSurface, createRetroFont } from './textures';
import { RETRO_FONT, CELL_WIDTH } from './retroFont';
import { ParticlePool, burst, drawParticles } from './animation';
import { KipuAnimator } from './kipuAnimator';
import { ensureKipuFrames } from './kipuTextures';
import { sfx } from './sfx';
import { arenaUrl } from './demoAssets';
import { VIEW_EVENT, FOCUS_EVENT, type ViewState } from './viewState';
import kipuEvaluationUrl from '../../assets/prepared/kipu-v4-32x40.png';

type Keys = Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space' | 'j' | 'z' | 'r' | 'enter' | 'm', Phaser.Input.Keyboard.Key>;
type Bullet = Phaser.Physics.Arcade.Sprite;

export interface DebugSnapshot {
  sceneRun: number;
  scene: string;
  completed: boolean;
  background: { key: string; sourceURL: string; alpha: number; scrollFactor: number };
  logicalWidth: number;
  logicalHeight: number;
  player: { x: number; y: number; velocityX: number; velocityY: number; grounded: boolean; facing: Facing;
    texture: string; nativeWidth: number; nativeHeight: number; displayWidth: number; displayHeight: number;
    originY: number; displayOriginY: number; bodyBottom: number; sourceURL: string;
    flipX: boolean; bodyWidth: number; bodyHeight: number; bodyRelativeX: number; bodyRelativeY: number };
  cameraX: number;
  hits: number;
  targetCount: number;
  bulletCount: number;
  bulletCapacity: number;
  allocatedBullets: number;
  bullets: { x: number; velocityX: number }[];
  hudScrollFactor: number;
  fx: { active: number; capacity: number };
  audio: { played: number; muted: boolean; state: string };
  kipuFrame: string;
  hud: { type: string; text: string; width: number; height: number; font: string; fontSize: number };
}

declare global { interface Window { readonly pachaDebug?: () => DebugSnapshot; } }

export class ArcadeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys!: Keys;
  private bullets!: Phaser.Physics.Arcade.Group;
  private targets!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: Phaser.GameObjects.BitmapText;
  private facing: Facing = 1;
  private nextShotAt = 0;
  private clock = 0;
  private hits = 0;
  private jumpRequested = false;
  private restartRequested = false;
  private focused = true;
  private completed = false;
  // Visual-only layer. animClock advances while focused, even after completion, and never feeds gameplay.
  private fx!: ParticlePool;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private animator!: KipuAnimator;
  private animClock = 0;
  private glintCycle = -1;
  private hudFlashUntil = 0;
  private confettiAt = 0;

  private sceneRun = 0;

  constructor() { super('ArcadeScene'); }

  preload(): void {
    this.load.image('kipu-evaluation', kipuEvaluationUrl);
    if (!this.textures.exists('amaru-arena')) this.load.image('amaru-arena',arenaUrl);
  }

  create(): void {
    this.sceneRun += 1;
    this.facing = 1;
    this.hits = 0;
    this.completed = false;
    this.nextShotAt = 0;
    this.clock = 0;
    this.animClock = 0; this.glintCycle = -1; this.hudFlashUntil = 0; this.confettiAt = 0;
    this.time.paused = false;
    this.jumpRequested = false;
    this.restartRequested = false;
    this.focused = true;
    createTextures(this);
    ensureKipuFrames(this);
    this.cameras.main.setBackgroundColor(0x16343c);
    // Repeat the existing 16:9 source without stretching; terrain remains independent.
    for (let x=0;x<GAME.worldWidth;x+=320) this.add.image(x,0,'amaru-arena').setOrigin(0).setScrollFactor(0.25).setAlpha(0.4).setDepth(-10);
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.height);

    const platforms = this.physics.add.staticGroup();
    this.addPlatform(platforms, GAME.worldWidth / 2, GAME.groundY + 8, GAME.worldWidth, 16);
    for (const [x, y, width] of [[145, 132, 54], [340, 122, 60], [510, 132, 64], [720, 124, 72]]) {
      this.addPlatform(platforms, x, y + 3, width, 6);
    }
    this.player = this.physics.add.sprite(48, 145, 'kipu-evaluation').setOrigin(0.5, 0.55).setCollideWorldBounds(true).setDepth(5);
    // Align the occupied scarf edge to the surface while preserving the body at (-6, -8).
    this.player.setSize(12, 18).setOffset(10, 14);
    this.physics.add.collider(this.player, platforms);
    this.fx = new ParticlePool(64);
    this.fxGraphics = this.add.graphics().setDepth(6);
    this.animator = new KipuAnimator(this.player, this.fx);

    this.targets = this.physics.add.staticGroup();
    for (const x of [210, 400, 590, 840]) {
      this.targets.create(x, 154, 'target');
    }
    this.bullets = this.physics.add.group({ allowGravity: false, maxSize: GAME.bulletCapacity });
    this.bullets.createMultiple({ key: 'bullet', quantity: GAME.bulletCapacity, active: false, visible: false });
    for (const child of this.bullets.getChildren()) {
      (child as Bullet).disableBody(true, true);
    }
    this.physics.add.overlap(this.bullets, this.targets, (bulletObject, targetObject) => {
      const bullet = bulletObject as Bullet;
      const target = targetObject as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active || !target.active) return;
      bullet.disableBody(true, true);
      target.disableBody(true, true);
      sfx.play('targetHit');
      burst(this.fx, target.x, target.y, 8, 55, 380, 'gold', this.animClock, 2);
      burst(this.fx, target.x, target.y, 6, 28, 300, 'light', this.animClock);
      this.hudFlashUntil = this.animClock + 220;
      this.hits += 1;
      this.updateHud();
      if (this.hits === 4) this.finishTraining();
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable.');
    this.keys = keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', w: 'W',
      space: 'SPACE', j: 'J', z: 'Z', r: 'R', enter: 'ENTER', m: 'M',
    }) as Keys;
    this.keys.enter.setEmitOnRepeat(false).on('down', () => { if (this.focused && this.completed) this.scene.start('MapScene'); });
    this.keys.m.setEmitOnRepeat(false).on('down', () => { if (this.focused) this.scene.start('MapScene'); });
    // Queue press edges from events so even a tap shorter than one frame is retained.
    for (const key of [this.keys.w, this.keys.up, this.keys.space]) {
      key.setEmitOnRepeat(false).on('down', () => { if (this.focused) this.jumpRequested = true; });
    }
    this.keys.r.setEmitOnRepeat(false).on('down', () => { if (this.focused) this.restartRequested = true; });
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.height).startFollow(this.player, true, 1, 1);
    createRetroFont(this);
    this.add.rectangle(5, 4, 110, 14, 0x16343c).setOrigin(0).setScrollFactor(0).setDepth(19);
    this.hud = this.add.bitmapText(9, 7, RETRO_FONT, '', CELL_WIDTH).setTint(0xfff1c3).setScrollFactor(0).setDepth(20);
    this.updateHud();

    this.game.events.on(FOCUS_EVENT,this.pageFocus,this);
    this.publishView();
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      // Snapshot getter only: automation must still use real keyboard input.
      Object.defineProperty(window, 'pachaDebug', { configurable: true, value: () => this.snapshot() });
    }
  }

  update(_time: number, delta: number): void {
    if (!this.focused) return;
    if (this.restartRequested) {
      this.input.keyboard?.resetKeys();
      this.scene.restart();
      return;
    }
    this.animClock += delta;
    if (this.completed) { this.animate(delta); return; }
    const time = this.clock += delta;
    const move = movement(this.keys.a.isDown || this.keys.left.isDown, this.keys.d.isDown || this.keys.right.isDown, this.facing);
    this.facing = move.facing;
    this.player.setVelocityX(move.velocityX).setFlipX(this.facing === -1);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (shouldJump(this.jumpRequested, body.blocked.down || body.touching.down)) {
      this.player.setVelocityY(-GAME.jumpSpeed);
      sfx.play('jump');
    }
    this.jumpRequested = false;
    if ((this.keys.j.isDown || this.keys.z.isDown) && canShoot(time, this.nextShotAt, this.bullets.countActive(false))) {
      this.fire(time);
    }
    for (const child of this.bullets.getChildren()) {
      const bullet = child as Bullet;
      if (bullet.active && projectileExpired(time, Number(bullet.getData('expiresAt')), bullet.x)) {
        bullet.disableBody(true, true);
      }
    }
    this.animate(delta);
  }

  // Reads physics state only; never writes velocity, position, bodies or counters.
  private animate(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!this.completed) {
      this.animator.update({ now: this.animClock, grounded: body.blocked.down || body.touching.down, velocityX: body.velocity.x, velocityY: body.velocity.y,
        facing: this.facing, footX: this.player.x, footY: body.bottom, nokia: false });
      if (this.animator.event === 'land') sfx.play('land');
    }
    const cycle = Math.floor(this.animClock / 1100);
    if (cycle !== this.glintCycle) {
      this.glintCycle = cycle;
      const alive = this.targets.getChildren().filter(t => t.active) as Phaser.Physics.Arcade.Sprite[];
      const target = alive[cycle % Math.max(1, alive.length)];
      if (target) this.fx.emit({ x: target.x + 2, y: target.y - 6, vx: 0, vy: -9, ttl: 420, slot: 'light', size: 1 }, this.animClock);
    }
    if (this.completed && this.animClock >= this.confettiAt) {
      const cam = this.cameras.main;
      const x = cam.scrollX + (this.animClock * 0.37) % GAME.width;
      this.fx.emit({ x, y: 6, vx: Math.sin(this.animClock / 200) * 14, vy: 20, ttl: 1400, slot: (['gold', 'teal', 'light'] as const)[Math.floor(this.animClock / 160) % 3], size: 2 }, this.animClock);
      this.confettiAt = this.animClock + 90;
    }
    this.fx.step(this.animClock, delta / 1000, 70);
    this.fxGraphics.clear();
    drawParticles(this.fxGraphics, this.fx, false);
    this.hud.setTint(this.animClock < this.hudFlashUntil ? 0xedc76c : 0xfff1c3);
  }

  private addPlatform(group: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, width: number, height: number): void {
    const platform = group.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
    platform.setDisplaySize(width, height).refreshBody().setVisible(false);
    drawStoneSurface(this, x - width / 2, y - height / 2, width, height);
  }

  private fire(time: number): void {
    const bullet = this.bullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;
    bullet.enableBody(true, this.player.x + this.facing * 12, this.player.y - 1, true, true);
    (bullet.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bullet.setVelocity(shotVelocity(this.facing), 0).setFlipX(this.facing === -1);
    bullet.setData('expiresAt', time + GAME.bulletLifetimeMs);
    sfx.play('shot');
    burst(this.fx, bullet.x - this.facing * 2, bullet.y, 3, 34, 140, 'gold', this.animClock);
    this.nextShotAt = time + GAME.shotCooldownMs;
  }

  private finishTraining(): void {
    this.completed = true;
    this.registry.set('progress', completeTraining(this.registry.get('progress') ?? initialProgress(), this.hits));
    this.publishView();
    this.player.setVelocity(0, 0);
    this.animator.hold('idle', false);
    sfx.play('complete');
    burst(this.fx, this.player.x, this.player.y - 10, 14, 70, 700, 'gold', this.animClock, 2);
    burst(this.fx, this.player.x, this.player.y - 10, 10, 40, 600, 'teal', this.animClock);
    for (const child of this.bullets.getChildren()) (child as Bullet).disableBody(true, true);
    this.add.rectangle(160, 82, 280, 48, 0x16343c).setScrollFactor(0).setDepth(24);
    this.add.bitmapText(40, 66, RETRO_FONT, 'TRAINING COMPLETE - FOUR TARGETS\nENTER: MAP   R: RETRY', 6).setTint(0xfff1c3).setScrollFactor(0).setDepth(25);
  }

  private updateHud(): void {
    this.hud.setText(`KIPU  TARGETS ${this.hits}/4`);
  }

  private onBlur = (): void => {
    this.focused = false;
    this.physics.world.pause();
    this.time.paused=true;
    this.input.keyboard?.resetKeys();
    this.jumpRequested = false;
    this.restartRequested = false;
    this.player.setVelocityX(0);
  };

  private onFocus = (): void => { if(document.activeElement?.id!=='game') return; this.focused = true; this.physics.world.resume(); this.time.paused=false; };
  private pageFocus(active:boolean):void { if(active) this.onFocus(); else this.onBlur(); }
  private publishView():void { this.game.events.emit(VIEW_EVENT,{view:'training',outcome:this.completed?'complete':'playing',progress:{...this.registry.get('progress') ?? initialProgress()}} satisfies ViewState); }

  private onShutdown(): void {
    this.game.events.off(FOCUS_EVENT,this.pageFocus,this);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
    Reflect.deleteProperty(window, 'pachaDebug');
    this.input.keyboard?.resetKeys();
  }

  private snapshot(): DebugSnapshot {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return {
      sceneRun: this.sceneRun,
      scene: 'training', completed: this.completed,
      background: { key:'amaru-arena', sourceURL:arenaUrl, alpha:0.4, scrollFactor:0.25 },
      logicalWidth: GAME.width, logicalHeight: GAME.height,
      player: { x: this.player.x, y: this.player.y, velocityX: body.velocity.x, velocityY: body.velocity.y, grounded: body.blocked.down || body.touching.down, facing: this.facing,
        texture: this.player.texture.key, nativeWidth: this.player.frame.realWidth, nativeHeight: this.player.frame.realHeight,
        displayWidth: this.player.displayWidth, displayHeight: this.player.displayHeight, flipX: this.player.flipX,
        originY: this.player.originY, displayOriginY: this.player.displayOriginY, bodyBottom: body.bottom, sourceURL: kipuEvaluationUrl,
        bodyWidth: body.width, bodyHeight: body.height, bodyRelativeX: body.x - this.player.x, bodyRelativeY: body.y - this.player.y },
      cameraX: this.cameras.main.scrollX, hits: this.hits,
      targetCount: this.targets.countActive(true), bulletCount: this.bullets.countActive(true),
      bulletCapacity: GAME.bulletCapacity, allocatedBullets: this.bullets.getLength(),
      bullets: this.bullets.getChildren().filter(child => child.active).map(child => {
        const bullet = child as Bullet;
        return { x: bullet.x, velocityX: (bullet.body as Phaser.Physics.Arcade.Body).velocity.x };
      }),
      hudScrollFactor: this.hud.scrollFactorX,
      fx: { active: this.fx.activeCount, capacity: this.fx.items.length },
      audio: sfx.stats(),
      kipuFrame: this.animator.frame,
      hud: { type: this.hud.type, text: this.hud.text, width: this.hud.width, height: this.hud.height, font: this.hud.font, fontSize: this.hud.fontSize },
    };
  }
}

