import Phaser from 'phaser';
import { AMBIENT, bandAlpha, cloudOffset, emberAlpha, plumePuffs, transitionBand } from './ambientRules';
import { GAME } from './rules';
import { skyDim } from './eruptionRules';

// Draws the ambient route background from ambientRules.ts: the Misti plume and ember in the backdrop's parallax
// space, and the cloud layers and transition mist in screen space. Fixed-size graphics redrawn each frame (no
// allocations per puff), all behind the gameplay sprites. Visual only: never touches bodies or clocks.
const SMOKE = 0xc9b4c4, EMBER = 0xf2a65a, EMBER_CORE = 0xffd27a, ASH = 0x1a1020;
// One pixel cloud: rows of [x offset, width] stacked from the top, drawn at each layer's color and alpha.
const CLOUD: ReadonlyArray<readonly [number, number]> = Object.freeze([[10, 18], [4, 34], [0, 46], [6, 30]]);
// Cloud positions inside one 320 px tile, per layer (x, y offset inside the layer, scale).
const CLOUD_SPOTS: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = Object.freeze([
  [[20, 0, 1], [150, 3, 0.7], [250, 1, 0.9]],
  [[60, 2, 0.8], [200, 0, 1]],
  [[0, 6, 1.3], [110, 2, 1], [230, 4, 1.2]],
]);

export class RouteAmbient {
  private volcano: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Graphics;
  private last = { puffs: 0, ember: 0, band: null as string | null, eruption: 0, dim: 0 };

  constructor(scene: Phaser.Scene, private summits: readonly number[], scrollFactor: number, depth: number) {
    this.volcano = scene.add.graphics().setScrollFactor(scrollFactor).setDepth(depth + 1).setName('ambient-volcano');
    this.clouds = scene.add.graphics().setScrollFactor(0).setDepth(depth + 2).setName('ambient-clouds');
  }

  // eruption is the 0..1 eruptionLevel (A2): the sky dims a little (one flat ash layer over the backdrop), the plume
  // thickens and the crater glows steadily. All of it ramps slowly and none of it moves, so reduced motion is safe.
  update(anim: number, clock: number, cameraX: number, reduced: boolean, eruption = 0): void {
    const v = this.volcano.clear(), puffs = plumePuffs(anim, reduced), sy = AMBIENT.summit.y, dim = skyDim(eruption);
    const ember = Math.max(emberAlpha(anim, reduced), Math.round(0.5 * eruption * 100) / 100), thicken = 1 + 0.8 * eruption;
    if (dim > 0) v.fillStyle(ASH, dim).fillRect(0, 0, GAME.width, GAME.height);
    for (const sx of this.summits) {
      if (ember > 0) {
        v.fillStyle(EMBER, ember * 0.6).fillRect(sx - 3, sy - 1, 7, 3);
        v.fillStyle(EMBER_CORE, ember).fillRect(sx - 1, sy - 1, 3, 2);
      }
      for (const p of puffs) {
        if (p.alpha <= 0) continue;
        // A rounded pixel blob: two overlapping rectangles, so a puff never reads as a hard square.
        const size = p.size + Math.round(2 * eruption), alpha = Math.min(0.6, p.alpha * thicken);
        const x = sx + p.x - Math.floor(size / 2), y = sy - 2 + p.y - Math.floor(size / 2), inset = size > 4 ? 1 : 0;
        v.fillStyle(SMOKE, alpha).fillRect(x, y + inset, size, size - 2 * inset);
        if (inset) v.fillRect(x + inset, y, size - 2 * inset, size);
      }
    }
    const c = this.clouds.clear();
    AMBIENT.clouds.forEach((layer, i) => {
      const offset = Math.round(cloudOffset(layer, cameraX, anim, reduced));
      c.fillStyle(layer.color, layer.alpha);
      for (const [cx, cy, scale] of CLOUD_SPOTS[i]) {
        for (const base of [offset - AMBIENT.cloudTile, offset]) {
          const x0 = base + cx;
          if (x0 > GAME.width || x0 + 60 < 0) continue;
          CLOUD.forEach(([dx, w], row) => c.fillRect(Math.round(x0 + dx * scale), layer.y + cy + row * 2, Math.round(w * scale), 2));
        }
      }
    });
    const band = transitionBand(clock, reduced);
    if (band) {
      const half = AMBIENT.bands.width / 2;
      for (let y = GAME.playTop; y < GAME.playBottom; y += 2) {
        // Two overlapping halves of the row alpha: soft ragged edges and the full density only in the middle.
        const ragged = ((y * 7) % 11) - 5, x0 = band.x - half + ragged, w = AMBIENT.bands.width - Math.abs(ragged), alpha = bandAlpha(y) / 2;
        c.fillStyle(AMBIENT.bands.color, alpha).fillRect(x0, y, w, 2).fillRect(x0 + 20, y, w - 40, 2);
      }
    }
    this.last = { puffs: puffs.filter(p => p.alpha > 0).length * this.summits.length, ember, band: band?.segment ?? null, eruption, dim };
  }

  snapshot() { return { ...this.last, summits: [...this.summits], cloudLayers: AMBIENT.clouds.length }; }
}
