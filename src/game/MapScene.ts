import Phaser from 'phaser';
import { createRetroFonts } from './textures';
import { CELL_WIDTH, fontKey } from './retroFont';
import { initialProgress, nodeState, type Progress } from './challengeRules';
import { RUN_KEY } from './routeRules';
import { VIEW_EVENT, type ViewState } from './viewState';
import {
  BOTTOM_PANEL_Y, CURSOR_RX, CURSOR_RY, MAP_NODES, START_NODE, TOP_PANEL_HEIGHT, actionFor, cardFor, moveSelection, nodeStatus, tapOutcome,
  type MapNode, type NodeId, type NodeStatus,
} from './mapRules';
import { MAP_TEXT } from './mapText';
import { motion } from './motion';
import { clearDebug, exposeDebug } from './debug';
import mapUrl from '../../assets/prepared/map-trama-v1-320x180.png';
import { sfx } from './sfx';

const LIGHT = 0xfff1c3, GOLD = 0xedc76c, TEAL = 0x59d3c4, VIOLET = 0xc985ef, DIM = 0x3a6770, PANEL = 0x0d1f26;
const MAP = 'map-trama';
const STATUS_COLOR: Record<NodeStatus, number> = { corrupted: VIOLET, restored: TEAL, locked: LIGHT };
type Key = (event?: KeyboardEvent) => void;

export class MapScene extends Phaser.Scene {
  private selected: NodeId = START_NODE;
  private markers!: Phaser.GameObjects.Graphics;
  private cursor!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.BitmapText;
  private statusText!: Phaser.GameObjects.BitmapText;
  private actionText!: Phaser.GameObjects.BitmapText;
  constructor() { super('MapScene'); }
  preload(): void {
    // Route and Guardian load their own Kipu/Amaru/arena textures, so the map only needs its background.
    if (!this.textures.exists(MAP)) this.load.image(MAP, mapUrl);
  }
  create(): void {
    if (!this.registry.has('progress')) this.registry.set('progress', initialProgress());
    createRetroFonts(this);
    this.selected = START_NODE;
    this.cameras.main.setBackgroundColor(0x122e36);
    this.add.image(0, 0, MAP).setOrigin(0).setDepth(0);
    // Dark strips keep the text readable over the busy art; markers and cursor live between them.
    const panels = this.add.graphics().setDepth(1);
    panels.fillStyle(PANEL, 0.85).fillRect(0, 0, 320, TOP_PANEL_HEIGHT).fillRect(0, BOTTOM_PANEL_Y, 320, 180 - BOTTOM_PANEL_Y);
    panels.fillStyle(DIM).fillRect(0, TOP_PANEL_HEIGHT, 320, 1).fillRect(0, BOTTOM_PANEL_Y, 320, 1).fillRect(8, 168, 304, 1);
    this.markers = this.add.graphics().setDepth(2);
    this.cursor = this.add.graphics().setDepth(3);
    this.text(Math.round((320 - MAP_TEXT.title.length * CELL_WIDTH) / 2), 4, MAP_TEXT.title, GOLD);
    this.nameText = this.text(8, 147, '', LIGHT);
    this.statusText = this.text(8, 158, '', LIGHT);
    this.actionText = this.text(8, 158, '', GOLD);
    this.text(8, 170, MAP_TEXT.keyBar, TEAL);
    this.refreshCard();
    const keyboard = this.input.keyboard!;
    // Held keys auto-repeat: only fresh presses move the selection or act, so one tap is one node.
    const bindings: [string, Key][] = [
      ['keydown-LEFT', e => this.move('left', e)], ['keydown-A', e => this.move('left', e)],
      ['keydown-RIGHT', e => this.move('right', e)], ['keydown-D', e => this.move('right', e)],
      ['keydown-ENTER', e => this.act(e)], ['keydown-ONE', e => { if (!e?.repeat) this.startRoute(); }], ['keydown-TWO', e => { if (!e?.repeat) this.startGuardian(); }],
    ];
    for (const [name, handler] of bindings) keyboard.on(name, handler);
    // Touch and mouse use the 'down' event (not 'up'), so a tap responds immediately.
    const onDown = (pointer: Phaser.Input.Pointer): void => this.tap(pointer.x, pointer.y);
    this.input.on('pointerdown', onDown);
    this.game.events.emit(VIEW_EVENT, { view: 'map', outcome: 'playing', progress: { ...this.progress } } satisfies ViewState);
    exposeDebug(() => ({
      scene: 'map', audio: sfx.stats(), selected: this.node.playable ? 'route' : 'locked', selectedNode: this.selected,
      progress: { ...this.progress }, node: nodeState(this.progress), otherRoutesLocked: true, reducedMotion: motion.reduced,
      nodes: MAP_NODES.map(({ id, x, y }) => ({ id, x, y, status: nodeStatus(this.byId(id), this.progress) })),
    }));
    this.events.once('shutdown', () => {
      for (const [name, handler] of bindings) keyboard.off(name, handler);
      this.input.off('pointerdown', onDown);
      keyboard.resetKeys(); clearDebug();
    });
  }
  // Purely visual: corruption static, restored pulse, locked flicker and the bobbing cursor; all frozen under reduced motion.
  update(time: number): void {
    const reduced = motion.reduced, tick = reduced ? 0 : Math.floor(time / 110);
    this.markers.clear();
    MAP_NODES.forEach((node, index) => this.drawMarker(node, nodeStatus(node, this.progress), tick, index, reduced ? 0.5 : 0.55 + 0.25 * Math.sin(time / 350)));
    const grow = reduced ? 0 : Math.floor(time / 400) % 2, { x, y } = this.node;
    this.cursor.clear();
    for (const [color, shift] of [[PANEL, 1], [GOLD, 0]] as const) {
      this.cursor.fillStyle(color);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = x + sx * (CURSOR_RX - 1 + grow) + shift, cy = y + sy * (CURSOR_RY - 1 + grow) + shift;
        this.cursor.fillRect(sx < 0 ? cx : cx - 4, sy < 0 ? cy : cy - 1, 6, 2).fillRect(sx < 0 ? cx : cx - 1, sy < 0 ? cy : cy - 4, 2, 6);
      }
    }
  }
  private get progress(): Progress { return this.registry.get('progress'); }
  private get node(): MapNode { return this.byId(this.selected); }
  private byId(id: NodeId): MapNode { return MAP_NODES.find(node => node.id === id)!; }
  private text(x: number, y: number, text: string, color: number): Phaser.GameObjects.BitmapText { return this.add.bitmapText(x, y, fontKey(color), text, CELL_WIDTH).setDepth(5); }
  // Canvas ignores tint, so each marker is pixel rects: a dark backing keeps it readable, the socket's dark core carries the state.
  private drawMarker({ x, y }: MapNode, status: NodeStatus, tick: number, index: number, pulse: number): void {
    const g = this.markers, hash = (n: number): number => ((n * 2654435761) >>> 0) % 997;
    g.fillStyle(PANEL, 0.55).fillRect(x - 6, y - 4, 13, 9);
    if (status === 'corrupted') {
      g.fillStyle(VIOLET, 0.5).fillRect(x - 4, y - 2, 9, 5);
      for (let n = 0; n < 6; n++) g.fillStyle(n % 2 ? LIGHT : VIOLET, 0.9).fillRect(x - 4 + hash(tick * 7 + n + index) % 9, y - 2 + hash(tick * 5 + n * 3 + index) % 5, 1, 1);
    } else if (status === 'restored') {
      g.fillStyle(TEAL, pulse).fillRect(x - 4, y - 2, 9, 5);
      g.fillStyle(GOLD).fillRect(x - 2, y, 5, 1).fillRect(x, y - 2, 1, 5);
    } else {
      // Scaffold hash mark; the flicker is a brief dropout per node, never a full blackout.
      g.fillStyle(DIM, 0.85).fillRect(x - 4, y - 2, 9, 5);
      g.fillStyle(LIGHT, !motion.reduced && hash(tick + index * 13) % 7 === 0 ? 0.25 : 0.7).fillRect(x - 1, y - 2, 1, 5).fillRect(x + 1, y - 2, 1, 5).fillRect(x - 3, y - 1, 7, 1).fillRect(x - 3, y + 1, 7, 1);
    }
  }
  private refreshCard(): void {
    const node = this.node, status = nodeStatus(node, this.progress), card = cardFor(node, status), action = MAP_TEXT[card.action];
    this.nameText.setText(MAP_TEXT[card.name]);
    this.statusText.setFont(fontKey(STATUS_COLOR[status]), CELL_WIDTH).setText(MAP_TEXT[card.status]);
    this.actionText.setFont(fontKey(status === 'locked' ? LIGHT : GOLD), CELL_WIDTH).setText(action).setX(312 - action.length * CELL_WIDTH);
  }
  private move(direction: 'left' | 'right', event?: KeyboardEvent): void {
    if (event?.repeat) return;
    this.selected = moveSelection(MAP_NODES, this.selected, direction);
    sfx.play('blip'); this.refreshCard();
  }
  // Locked nodes never change scene: a dull tick and the card's "PRÓXIMAMENTE" are the whole feedback.
  private act(event?: KeyboardEvent): void {
    if (event?.repeat) return;
    if (actionFor(this.node) === 'startRoute') this.startRoute(); else sfx.play('deflect');
  }
  private tap(x: number, y: number): void {
    const { selected, act } = tapOutcome(MAP_NODES, this.selected, x, y);
    if (act) { this.startRoute(); return; }
    if (selected !== this.selected) { this.selected = selected; sfx.play('blip'); this.refreshCard(); }
  }
  private startRoute(): void { sfx.play('select'); this.input.keyboard?.resetKeys(); this.scene.start('RouteScene'); }
  // Direct entry from the map: a fresh 4 HP, empty-meter run state.
  private startGuardian(): void { sfx.play('select'); this.registry.remove(RUN_KEY); this.input.keyboard?.resetKeys(); this.scene.start('GuardianScene'); }
}
