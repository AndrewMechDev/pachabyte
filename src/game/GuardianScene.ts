import Phaser from 'phaser';
import { GAME, flight, canShoot, type Facing } from './rules';
import { COMBAT, activateShift, attackStage, boltExpired, canTakeDamage, capture, damage, initialShift, outcome, patternAt, release, shiftActive, type Outcome, type Shift } from './combatRules';
import { NOKIA, convertPixels } from './nokiaPalette';
import { createTextures, createRetroFont } from './textures';
import { RETRO_FONT } from './retroFont';
import { KIPU_FRAMES, ParticlePool, bossAngle, burst, chargeLevel, drawParticles, flightTilt, kipuTextureKey, type AttackPhase } from './animation';
import { KipuAnimator } from './kipuAnimator';
import { ensureKipuFrames } from './kipuTextures';
import { sfx } from './sfx';
import { motion } from './motion';
import { freeGuardian, initialProgress } from './challengeRules';
import { ROUTE, RUN_KEY, finalScore, readRunState, type RunState } from './routeRules';
import { formatScore } from './hudRules';
import { Hud, PauseOverlay } from './hud';
import { TEXT } from './text';
import { clearDebug, exposeDebug } from './debug';
import { VIEW_EVENT, FOCUS_EVENT, type ViewState } from './viewState';
import kipuUrl from '../../assets/prepared/kipu-v4-32x40.png';
import headUrl from '../../assets/prepared/amaru-head-v1-64x64.png';
import arenaUrl from '../../assets/prepared/arequipa-arena-v1-320x180.png';

type Sprite = Phaser.Physics.Arcade.Sprite;
const ARENA_FLOOR = 164;
type Keys = Record<'a'|'d'|'w'|'s'|'left'|'right'|'up'|'down'|'space'|'j'|'z'|'shift'|'k'|'x'|'esc'|'p'|'r'|'m'|'enter',Phaser.Input.Keyboard.Key>;

// One arena, one owned clock, bounded pools. Debug exposes values only, never commands.
// F1 adaptation: free flight, Spanish text, shared HUD, Esc pause and the run state carried from the route.
export class GuardianScene extends Phaser.Scene {
  private player!: Sprite;
  private boss!: Sprite;
  private backdrop!: Phaser.GameObjects.Image;
  private shots!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private keys!: Keys;
  private graphics!: Phaser.GameObjects.Graphics;
  private hud!: Hud;
  private pause!: PauseOverlay;
  private status!: Phaser.GameObjects.BitmapText;
  private bossLabel!: Phaser.GameObjects.BitmapText;
  private signal!: Phaser.GameObjects.BitmapText;
  private result!: Phaser.GameObjects.BitmapText;
  private clock = 0;
  private nextShot = 0;
  private entry: RunState = readRunState(undefined);
  private heroHP: number = COMBAT.heroHP;
  private bossHP: number = COMBAT.bossHP;
  private invulnerableUntil = 0;
  private shift: Shift = initialShift();
  private ending: Outcome = 'playing';
  private facing: Facing = 1;
  private focused = true;
  private paused = false;
  private shiftRequested = false;
  private retry = false;
  private mapRequested = false;
  private run = 0;
  private cycle = 0;
  private attackStart = 1000;
  private sampled = { x: 48, y: 154 };
  private sampledCycle = -1;
  private emitted = 0;
  private patternsSeen = new Set<string>();
  private capturesTotal = 0;
  private reflectedHits = 0;
  private palette = false;
  // Visual-only layer; anim advances only while focused and never feeds gameplay decisions.
  private fx!: ParticlePool;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private animator!: KipuAnimator;
  private anim = 0;
  private bossFlashUntil = 0;
  private deathAt = 0;
  private deathBursts = 0;

  constructor() { super('GuardianScene'); }
  preload(): void {
    if (!this.textures.exists('kipu-evaluation')) this.load.image('kipu-evaluation',kipuUrl);
    this.load.image('amaru-head',headUrl);
    this.load.image('amaru-arena',arenaUrl);
  }
  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    // Direct entry (map or page button) uses 4 HP and an empty meter; a finished route carries its state.
    this.entry=readRunState(this.registry.get(RUN_KEY));
    this.run++; this.clock=0; this.nextShot=0; this.heroHP=this.entry.hp; this.bossHP=COMBAT.bossHP;
    this.invulnerableUntil=0; this.shift=initialShift(); this.ending='playing'; this.facing=1;
    this.focused=true; this.paused=false; this.shiftRequested=false; this.retry=false; this.mapRequested=false;
    this.time.paused=false;
    this.cycle=0; this.attackStart=1000; this.sampledCycle=-1; this.emitted=0;
    this.patternsSeen=new Set(); this.capturesTotal=0; this.reflectedHits=0; this.palette=false;
    this.anim=0; this.bossFlashUntil=0; this.deathAt=0; this.deathBursts=0;
    createTextures(this); createRetroFont(this); ensureKipuFrames(this);
    createRetroFont(this,RETRO_FONT+'-nokia',NOKIA[3]);
    for (const key of [...KIPU_FRAMES.map(frame => kipuTextureKey(frame,false)),'amaru-head','amaru-arena','bullet']) this.preparePalette(key);
    this.prepareFlash('amaru-head','amaru-head-flash',0xfff1c3); this.prepareFlash('amaru-head-nokia','amaru-head-flash-nokia',NOKIA[3]);
    this.backdrop=this.add.image(160,90,'amaru-arena');
    this.graphics=this.add.graphics().setDepth(3);
    // Free flight between the HUD bar and the drawn floor line; no gravity, no floor collider.
    this.physics.world.setBounds(0,GAME.playTop,GAME.width,ARENA_FLOOR-GAME.playTop);
    this.player=this.physics.add.sprite(48,120,'kipu-evaluation').setOrigin(0.5,0.55).setSize(12,18).setOffset(10,14).setCollideWorldBounds(true).setDepth(5);
    this.fx=new ParticlePool(64,() => motion.reduced); this.fxGraphics=this.add.graphics().setDepth(6);
    this.animator=new KipuAnimator(this.player);
    this.boss=this.physics.add.sprite(260,126,'amaru-head').setDepth(4);
    (this.boss.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
    this.boss.setSize(32,44).setOffset(8,20);
    this.shots=this.pool(12); this.enemies=this.pool(24);
    this.physics.add.overlap(this.shots,this.boss,(first,second) => {
      // Arcade swaps group/sprite callback order; identify the pool member explicitly.
      const shot=(this.shots.contains(first as Sprite) ? first : second) as Sprite;
      if (!shot.active || this.ending!=='playing' || !this.focused) return;
      const reflected=shot.getData('reflected')===true;
      shot.disableBody(true,true); this.bossHP=damage(this.bossHP,reflected ? 3 : 1);
      sfx.play(reflected?'reflectHit':'bossHit');
      burst(this.fx,shot.x,shot.y,reflected?10:5,reflected?70:45,reflected?420:260,reflected?'light':'gold',this.anim,reflected?2:1);
      this.bossFlashUntil=this.anim+(reflected?150:80);
      if (reflected) this.reflectedHits++;
      this.finishIfNeeded();
    });
    this.physics.add.overlap(this.enemies,this.player,(first,second) => {
      const bolt=(this.enemies.contains(first as Sprite) ? first : second) as Sprite;
      if (!bolt.active || !this.focused || this.ending!=='playing') return;
      if (this.tryCapture(bolt)) return;
      bolt.disableBody(true,true);
      if (canTakeDamage(this.clock,this.invulnerableUntil)) {
        this.heroHP=damage(this.heroHP,1); this.invulnerableUntil=this.clock+COMBAT.invulnerability;
        sfx.play('heroHit');
        burst(this.fx,this.player.x,this.player.y-4,10,60,320,'violet',this.anim,2);
        if (!motion.reduced) this.cameras.main.shake(110,0.006);
        this.finishIfNeeded();
      }
    });
    this.hud=new Hud(this);
    this.status=this.text(4,18,'').setDepth(10);
    this.bossLabel=this.text(236,18,TEXT.guardianName).setDepth(10);
    this.signal=this.text(4,27,'').setDepth(10);
    this.result=this.text(39,66,'').setDepth(20);
    this.pause=new PauseOverlay(this);
    this.keys=this.input.keyboard!.addKeys({ a:'A',d:'D',w:'W',s:'S',left:'LEFT',right:'RIGHT',up:'UP',down:'DOWN',space:'SPACE',j:'J',z:'Z',shift:'SHIFT',k:'K',x:'X',esc:'ESC',p:'P',r:'R',m:'M',enter:'ENTER' }) as Keys;
    for (const key of [this.keys.shift,this.keys.k,this.keys.x]) key.setEmitOnRepeat(false).on('down',()=>{ if(this.focused && !this.paused) this.shiftRequested=true; });
    // OS auto-repeat is ignored so a held Esc cannot toggle pause twice.
    for (const key of [this.keys.esc,this.keys.p]) key.setEmitOnRepeat(false).on('down',(_key:unknown,event?:KeyboardEvent)=>{ if(this.focused && !event?.repeat) this.togglePause(); });
    this.keys.r.setEmitOnRepeat(false).on('down',()=>{ if(this.focused && !this.paused) this.retry=true; });
    this.keys.m.setEmitOnRepeat(false).on('down',()=>{ if(this.focused && !this.paused) this.mapRequested=true; });
    this.keys.enter.setEmitOnRepeat(false).on('down',()=>{ if(this.focused && this.ending!=='playing') this.mapRequested=true; });
    window.addEventListener('blur',this.blur); window.addEventListener('focus',this.focus);
    this.game.events.on(FOCUS_EVENT,this.pageFocus,this);
    this.publishView();
    this.events.once('shutdown',this.shutdown,this);
    exposeDebug(()=>this.snapshot());
    this.draw();
  }
  update(_time: number, delta: number): void {
    if (!this.focused) return;
    if (this.mapRequested) { this.scene.start('MapScene'); return; }
    if (this.retry) { this.input.keyboard?.resetKeys(); this.scene.restart(); return; }
    if (this.paused) return;
    this.anim+=delta;
    if (this.ending!=='playing') { this.animate(delta); return; }
    this.clock+=delta;
    const k=this.keys;
    const move=flight({left:k.a.isDown||k.left.isDown,right:k.d.isDown||k.right.isDown,up:k.w.isDown||k.up.isDown,down:k.s.isDown||k.down.isDown},this.facing);
    this.facing=move.facing; this.player.setVelocity(move.velocityX,move.velocityY).setFlipX(this.facing===-1);
    if (this.shiftRequested) {
      const before=this.shift; this.shift=activateShift(this.shift,this.clock);
      if (this.shift!==before) { sfx.play('shiftOn'); burst(this.fx,this.player.x,this.player.y-4,10,75,320,'teal',this.anim,2); }
    }
    this.shiftRequested=false;
    const released=release(this.shift,this.clock); this.shift=released.state;
    for (let i=0;i<released.count;i++) this.fireReturned(i);
    this.togglePalette(shiftActive(this.shift,this.clock));
    if ((k.space.isDown||k.j.isDown||k.z.isDown) && canShoot(this.clock,this.nextShot,this.shots.countActive(false))) {
      this.spawn(this.shots,this.player.x+this.facing*12,this.player.y-1,this.facing*GAME.bulletSpeed,0,false,GAME.bulletLifetimeMs);
      sfx.play('shot');
      this.nextShot=this.clock+GAME.shotCooldownMs;
    }
    this.attack();
    for (const child of this.enemies.getChildren()) {
      const bolt=child as Sprite; if (!bolt.active) continue;
      if (this.tryCapture(bolt)) continue;
      const scale=this.palette ? COMBAT.slow : 1;
      bolt.setVelocity(bolt.getData('vx')*scale,bolt.getData('vy')*scale);
    }
    for (const group of [this.shots,this.enemies]) for (const child of group.getChildren()) {
      const bolt=child as Sprite;
      if (bolt.active && boltExpired(this.clock,bolt.getData('expires'),bolt.x,bolt.y)) bolt.disableBody(true,true);
    }
    this.player.setVisible(this.clock>=this.invulnerableUntil || Math.floor(this.clock/90)%2===0);
    this.draw();
    this.animate(delta);
  }
  // Reads gameplay state only; writes textures, rotation, alpha and particles, never bodies or counters.
  private animate(delta: number): void {
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    if (this.ending==='playing') {
      this.animator.update({now:this.anim,velocityY:body.velocity.y,nokia:this.palette,reduced:motion.reduced});
      // Rotation-only tilt; flip mirrors the horizontal lean so the nose stays forward.
      this.player.setAngle(motion.reduced ? 0 : flightTilt(body.velocity.x*this.facing,body.velocity.y)*this.facing);
    } else if (this.ending==='defeat') { this.animator.hold('squash',false); this.player.setAngle(0); }
    let flash=this.anim<this.bossFlashUntil,angle=0,alpha=1;
    if (this.ending==='victory') {
      const t=this.anim-this.deathAt;
      flash=!motion.reduced && t<500 && Math.floor(t/70)%2===0; angle=!motion.reduced && t<500 ? Math.sin(t/30)*4 : 0; alpha=t<500 ? 1 : Math.max(0,1-(t-500)/500);
      while (this.deathBursts<3 && t>=this.deathBursts*180) {
        const i=this.deathBursts++;
        burst(this.fx,this.boss.x-10+i*10,this.boss.y-8+(i%2)*14,10,70,520,i%2?'gold':'light',this.anim,2);
      }
    } else {
      let phase: AttackPhase='idle',phaseElapsed=0;
      if (this.ending==='playing' && this.clock>=this.attackStart) {
        const elapsed=this.clock-this.attackStart,stage=attackStage(elapsed);
        phase=stage; phaseElapsed=stage==='anticipation'?elapsed:stage==='action'?elapsed-800:elapsed-1300;
      }
      angle=motion.reduced ? 0 : bossAngle(phase,phaseElapsed,this.anim);
    }
    const key=flash ? (this.palette?'amaru-head-flash-nokia':'amaru-head-flash') : (this.palette?'amaru-head-nokia':'amaru-head');
    if (this.boss.texture.key!==key) this.boss.setTexture(key);
    this.boss.setAngle(angle).setAlpha(alpha);
    this.fx.step(this.anim,delta/1000,70);
    this.fxGraphics.clear(); drawParticles(this.fxGraphics,this.fx,this.palette);
  }
  private pool(capacity: number): Phaser.Physics.Arcade.Group {
    const group=this.physics.add.group({allowGravity:false,maxSize:capacity});
    group.createMultiple({key:'bullet',quantity:capacity,active:false,visible:false});
    for (const child of group.getChildren()) (child as Sprite).disableBody(true,true);
    return group;
  }
  private spawn(group: Phaser.Physics.Arcade.Group,x: number,y: number,vx: number,vy: number,reflected=false,ttl=6000): void {
    const bolt=group.getFirstDead(false) as Sprite|null; if (!bolt) return;
    bolt.setTexture(this.palette?'bullet-nokia':'bullet').clearTint();
    bolt.enableBody(true,x,y,true,true); bolt.setSize(6,3);
    (bolt.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bolt.setData({vx,vy,reflected,expires:this.clock+ttl});
    const slow=group===this.enemies && this.palette ? COMBAT.slow : 1;
    bolt.setVelocity(vx*slow,vy*slow);
    if (group===this.enemies && !this.palette) bolt.setTint(0xc985ef);
  }
  private attack(): void {
    if (this.clock<this.attackStart) return;
    const elapsed=this.clock-this.attackStart;
    const pattern=patternAt(this.cycle);
    if (this.sampledCycle!==this.cycle) {
      this.sampled={x:Phaser.Math.Clamp(this.player.x,18,205),y:this.player.y};
      this.sampledCycle=this.cycle; this.emitted=0; this.patternsSeen.add(pattern); sfx.play('charge');
    }
    if (attackStage(elapsed)==='action') {
      const due=Math.min(3,1+Math.floor((elapsed-800)/170));
      if (this.emitted===0) sfx.play('bossFire');
      while(this.emitted<due) {
        if (pattern==='pulse') {
          const angle=Math.atan2(this.sampled.y-137,this.sampled.x-229);
          this.spawn(this.enemies,229,137,Math.cos(angle)*105,Math.sin(angle)*105);
        } else this.spawn(this.enemies,this.sampled.x,44,0,110);
        this.emitted++;
      }
    }
    if (elapsed>=2800) { this.cycle++; this.attackStart=this.clock; }
  }
  private tryCapture(bolt: Sprite): boolean {
    const next=capture(this.shift,this.clock,Phaser.Math.Distance.Between(this.player.x,this.player.y,bolt.x,bolt.y));
    if (next===this.shift) return false;
    this.shift=next; this.capturesTotal++; sfx.play('capture'); burst(this.fx,bolt.x,bolt.y,5,38,240,'light',this.anim); bolt.disableBody(true,true); return true;
  }
  private fireReturned(index: number): void {
    const x=this.player.x+12,y=this.player.y-8-index*4;
    const body=this.boss.body as Phaser.Physics.Arcade.Body;
    const angle=Math.atan2(body.center.y-y,body.center.x-x);
    if (index===0) sfx.play('release');
    burst(this.fx,x,y,3,40,180,'gold',this.anim);
    this.spawn(this.shots,x,y,Math.cos(angle)*230,Math.sin(angle)*230,true,1800);
  }
  private finishIfNeeded(): void {
    this.ending=outcome(this.heroHP,this.bossHP); if(this.ending==='playing') return;
    if(this.ending==='victory') {
      this.registry.set('progress',freeGuardian(this.registry.get('progress') ?? initialProgress()));
      this.deathAt=this.anim; this.deathBursts=0; sfx.play('victory');
      burst(this.fx,this.player.x,this.player.y-10,12,60,600,'gold',this.anim,2);
    } else { sfx.play('defeat'); burst(this.fx,this.player.x,this.player.y-4,14,65,500,'violet',this.anim,2); }
    this.publishView();
    for (const group of [this.shots,this.enemies]) for(const child of group.getChildren()) (child as Sprite).disableBody(true,true);
    this.physics.world.pause(); this.player.setVisible(true); this.togglePalette(false);
    this.draw(); this.result.setText(`${this.ending==='victory'?TEXT.victory:TEXT.defeat}\n${this.statsLine()}${TEXT.guardianEndHelp}`);
  }
  // Session-only stats on the victory panel; read from the owned clock, never fed back into combat.
  private statsLine(): string {
    if (this.ending!=='victory') return '';
    const time=this.clock/1000,best=Math.min(time,this.registry.get('bestTime') ?? Infinity);
    this.registry.set('bestTime',best);
    // Provisional score: route tally plus returned bolts, with the time bonus over route + arena seconds.
    const score=finalScore({fragments:this.entry.fragments,bugs:this.entry.bugs,returns:this.reflectedHits},this.entry.routeSeconds+time);
    return `${TEXT.timeLabel} ${time.toFixed(1)}S  ${TEXT.lifeLabel} ${this.heroHP}/${ROUTE.maxHp}  ${TEXT.bestLabel} ${best.toFixed(1)}S\n${TEXT.scoreLabel} ${formatScore(score)}\n`;
  }
  private text(x:number,y:number,text:string): Phaser.GameObjects.BitmapText { return this.add.bitmapText(x,y,RETRO_FONT,text,6).setTint(0xfff1c3); }
  private preparePalette(key:string): void {
    if(this.textures.exists(`${key}-nokia`)) return;
    const image=this.textures.get(key).getSourceImage() as HTMLImageElement;
    const canvas=this.textures.createCanvas(`${key}-nokia`,image.width,image.height)!;
    const context=canvas.context; context.drawImage(image,0,0);
    const data=context.getImageData(0,0,image.width,image.height); data.data.set(convertPixels(data.data)); context.putImageData(data,0,0); canvas.refresh();
  }
  private togglePalette(active:boolean): void {
    if(this.palette===active) return; this.palette=active;
    // Player and boss textures follow their animation frame each tick; only the backdrop swaps here.
    this.backdrop.setTexture('amaru-arena'+(active?'-nokia':''));
    for(const group of [this.shots,this.enemies]) for(const child of group.getChildren()) {
      const bolt=child as Sprite; bolt.setTexture(active?'bullet-nokia':'bullet').clearTint();
      if(!active && group===this.enemies) bolt.setTint(0xc985ef);
    }
    // Canvas BitmapText ignores tint, so switch to a native green atlas.
    for(const label of [this.status,this.bossLabel,this.signal,this.result]) label.setFont(RETRO_FONT+(active?'-nokia':''),6).setTint(active?0xffffff:0xfff1c3);
    this.hud.setPalette(active); this.pause.setPalette(active);
  }
  private draw(): void {
    const colors=this.palette ? NOKIA : [0x16343c,0x70563e,0x59d3c4,0xfff1c3];
    const g=this.graphics.clear();
    g.fillStyle(colors[1]).fillRect(0,ARENA_FLOOR,320,180-ARENA_FLOOR); g.fillStyle(colors[3]).fillRect(0,ARENA_FLOOR,320,2);
    g.fillStyle(colors[0]).fillRect(0,GAME.hudHeight,320,20);
    this.hud.draw({hp:this.heroHP,maxHp:ROUTE.maxHp,meter:this.entry.meter,score:this.score(),now:this.anim});
    const active=shiftActive(this.shift,this.clock),ready=Math.max(0,Math.ceil((this.shift.readyAt-this.clock)/1000));
    this.status.setText(`${active?TEXT.shiftActive+' '+Math.ceil((this.shift.activeUntil-this.clock)/1000):ready?TEXT.shiftCooldown+' '+ready:TEXT.shiftReady}  ${TEXT.captured} ${this.shift.captured}/3`);
    // Boss health bar beside its name, drawn with filled integer rectangles.
    const barX=268,barWidth=48,fill=Math.round(barWidth*this.bossHP/COMBAT.bossHP);
    g.fillStyle(colors[1]).fillRect(barX,19,barWidth,5); g.fillStyle(colors[2]).fillRect(barX,19,fill,5);
    const elapsed=this.clock-this.attackStart,pattern=patternAt(this.cycle),stage=attackStage(elapsed);
    this.signal.setText(this.clock<this.attackStart?TEXT.guardianAwakens:stage==='anticipation'?(pattern==='pulse'?TEXT.guardianPulse:TEXT.guardianRune):stage==='action'?TEXT.guardianAttack:TEXT.guardianRecovery);
    if(this.ending!=='playing') {
      this.signal.setText(''); g.fillStyle(colors[0]).fillRect(26,60,268,48); return;
    }
    if(this.clock>=this.attackStart && stage==='anticipation') {
      // Mouth/column charge grows through the telegraph so the coming attack reads before it fires.
      const size=1+2*Math.round(3*chargeLevel('anticipation',elapsed)),cx=pattern==='pulse'?229:Math.round(this.sampled.x),cy=pattern==='pulse'?137:40,half=Math.floor(size/2);
      g.fillStyle(colors[2]).fillRect(cx-half,cy-half,size,size);
      if(size>=5) g.fillStyle(colors[3]).fillRect(cx-half+1,cy-half+1,size-2,size-2);
      if(pattern==='pulse') {
        this.pixelFrame(221,129,15,15,colors[3]);
        const dx=this.sampled.x-229,dy=this.sampled.y-137,steps=Math.max(Math.abs(dx),Math.abs(dy));
        for(let i=0;i<=steps;i++) g.fillStyle(colors[3]).fillRect(Math.round(229+dx*i/steps),Math.round(137+dy*i/steps),1,1);
      } else { this.pixelFrame(Math.round(this.sampled.x)-7,43,14,119,colors[3]); g.fillStyle(colors[2]).fillRect(Math.round(this.sampled.x)-9,160,18,3); }
    }
    if(active) {
      // Hard-pixel square aura and orbiting stored energy avoid blended fifth colors.
      const inset=!motion.reduced && Math.floor(this.anim/200)%2 ? 2 : 0;
      this.pixelFrame(Math.round(this.player.x)-52+inset,Math.round(this.player.y)-52+inset,104-2*inset,104-2*inset,colors[2]);
      for(let i=0;i<this.shift.captured;i++) {
        const angle=this.clock/190+i*Math.PI*2/3;
        g.fillStyle(colors[3]).fillRect(Math.round(this.player.x+Math.cos(angle)*22)-2,Math.round(this.player.y+Math.sin(angle)*22)-2,5,5);
      }
    }
  }
  private prepareFlash(source:string,key:string,color:number): void {
    if(this.textures.exists(key)||!this.textures.exists(source)) return;
    const image=this.textures.get(source).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
    const canvas=this.textures.createCanvas(key,image.width,image.height)!;
    const context=canvas.context; context.drawImage(image,0,0);
    const data=context.getImageData(0,0,image.width,image.height);
    for(let i=0;i<data.data.length;i+=4) if(data.data[i+3]>0) { data.data[i]=color>>16; data.data[i+1]=(color>>8)&255; data.data[i+2]=color&255; }
    context.putImageData(data,0,0); canvas.refresh();
  }
  private pixelFrame(x:number,y:number,width:number,height:number,color:number):void {
    // Filled integer pixels avoid Canvas stroke antialiasing introducing extra palette colors.
    this.graphics.fillStyle(color).fillRect(x,y,width,1).fillRect(x,y+height-1,width,1).fillRect(x,y,1,height).fillRect(x+width-1,y,1,height);
  }
  private score(): number { return this.entry.score+ROUTE.returnScore*this.reflectedHits; }
  private togglePause(): void {
    if(this.ending!=='playing') return;
    this.paused=!this.paused; this.freeze(this.paused||!this.focused);
    this.pause.setVisible(this.paused); sfx.play('pause');
  }
  // Esc pause and focus loss share one freeze: owned clocks stop in update(), physics pauses, input clears.
  private freeze(frozen:boolean): void {
    if(frozen) { this.physics.world.pause(); this.time.paused=true; this.input.keyboard?.resetKeys(); this.shiftRequested=false; this.retry=false; this.mapRequested=false; this.player.setVelocity(0,0); }
    else { if(this.ending==='playing') this.physics.world.resume(); this.time.paused=false; }
  }
  private blur=():void=> { this.focused=false; this.freeze(true); };
  private focus=():void=> { if(document.activeElement?.id!=='game') return; this.focused=true; this.freeze(this.paused); };
  private pageFocus(active:boolean):void { if(active) this.focus(); else this.blur(); }
  private publishView():void { this.game.events.emit(VIEW_EVENT,{view:'guardian',outcome:this.ending,progress:{...this.registry.get('progress')}} satisfies ViewState); }
  private shutdown():void {
    this.game.events.off(FOCUS_EVENT,this.pageFocus,this);
    window.removeEventListener('blur',this.blur); window.removeEventListener('focus',this.focus);
    this.input.keyboard?.resetKeys(); clearDebug();
    // Phaser owns scene groups/graphics and destroys them during shutdown.
    // Do not clear already-destroyed groups from a later shutdown listener.
  }
  private snapshot() {
    const body=this.player.body as Phaser.Physics.Arcade.Body,bossBody=this.boss.body as Phaser.Physics.Arcade.Body;
    return {scene:'guardian',paused:this.paused,run:{...this.entry},meter:this.entry.meter,score:this.score(),assets:{background:this.backdrop.texture.key,head:this.boss.texture.key,arenaURL:arenaUrl,headURL:headUrl},sceneRun:this.run,clock:this.clock,focused:this.focused,outcome:this.ending,heroHP:this.heroHP,bossHP:this.bossHP,invulnerableUntil:this.invulnerableUntil,
      shift:{...this.shift},nokia:this.palette,capturesTotal:this.capturesTotal,reflectedHits:this.reflectedHits,patternsSeen:[...this.patternsSeen],pattern:patternAt(this.cycle),stage:attackStage(this.clock-this.attackStart),
      player:{x:this.player.x,y:this.player.y,velocityX:body.velocity.x,velocityY:body.velocity.y,hp:this.heroHP,angle:this.player.angle,bodyWidth:body.width,bodyHeight:body.height,bodyRelativeX:body.x-this.player.x,bodyRelativeY:body.y-this.player.y,texture:this.player.texture.key,displayWidth:this.player.displayWidth,displayHeight:this.player.displayHeight},
      boss:{x:bossBody.center.x,y:bossBody.center.y,width:bossBody.width,height:bossBody.height},
      shots:this.shots.getChildren().filter(c=>c.active).map(c=>({x:(c as Sprite).x,y:(c as Sprite).y,reflected:(c as Sprite).getData('reflected')})),
      enemies:this.enemies.getChildren().filter(c=>c.active).map(c=>{const b=c as Sprite;return {x:b.x,y:b.y,vx:(b.body as Phaser.Physics.Arcade.Body).velocity.x,vy:(b.body as Phaser.Physics.Arcade.Body).velocity.y};}),
      fx:{active:this.fx.activeCount,capacity:this.fx.items.length},audio:sfx.stats(),kipuFrame:this.animator.frame,bossAngle:this.boss.angle,bossAlpha:this.boss.alpha,bossTexture:this.boss.texture.key,shotCapacity:this.shots.getLength(),enemyCapacity:this.enemies.getLength(),hud:{score:this.hud.scoreText,status:this.status.text,signal:this.signal.text},result:this.result.text};
  }
}
