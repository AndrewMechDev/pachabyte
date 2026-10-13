import { GAME } from './rules';
import type { Rect } from './routeRules';

// Packet Loss (A2, 2026-10-13; docs/design/GDD.md obstacle library: "camino/objetos intermitentes telegrafiados").
// Columns of data blocks scroll in from the right. Neighbouring blocks alternate on one shared, visible beat: even and
// odd blocks are solid half a beat apart, each for only a third of it, so the beat has moments when every block is
// lost and, wherever a column meets Kipu, some lane stays open for the whole crossing. Every block telegraphs for
// 400 ms (blinking outline) before it turns solid. Solid blocks cost a heart on contact and stop shots; telegraphing and lost blocks are
// harmless. Pure functions of the WORLD clock; screen-space positions. Values are tentative until playtested.
export const PACKET_LOSS = Object.freeze({
  // Entry times of the columns (the first enters right after the last Firewall column has left the screen).
  columns: [37600, 39400, 41200] as readonly number[],
  width: 10, screenSpeed: 64, enterX: GAME.width + 4,
  blocks: 4, inset: 1,
  // One beat for every column: solid 800 ms, lost 1200 ms, telegraph 400 ms; odd blocks run half a period later.
  beat: { start: 37600, periodMs: 2400, solidMs: 800, telegraphMs: 400 },
  // Bounded pool of columns drawn at once.
  pool: 3,
});

export type BlockState = 'lost' | 'telegraph' | 'solid';

export function blockState(now: number, index: number): BlockState {
  const b = PACKET_LOSS.beat, period = b.periodMs, offset = index % 2 === 1 ? period / 2 : 0;
  const phase = (((now - b.start + offset) % period) + period) % period;
  if (phase < b.solidMs) return 'solid';
  return phase >= period - b.telegraphMs ? 'telegraph' : 'lost';
}

export const columnScreenX = (now: number, at: number): number => PACKET_LOSS.enterX - (now - at) * PACKET_LOSS.screenSpeed / 1000;
export const crossMs = (): number => Math.ceil((PACKET_LOSS.enterX + PACKET_LOSS.width) / PACKET_LOSS.screenSpeed * 1000);

// Whole-pixel lanes that tile the play band, inset by one pixel so neighbouring blocks read as separate packets.
export function blockRects(x: number): Rect[] {
  const { blocks, inset, width } = PACKET_LOSS, span = GAME.playBottom - GAME.playTop;
  const edge = (i: number) => Math.round(GAME.playTop + i * span / blocks);
  return Array.from({ length: blocks }, (_, i) => ({ x, y: edge(i) + inset, width, height: edge(i + 1) - edge(i) - 2 * inset }));
}

export interface PacketColumn { at: number; index: number; x: number; states: BlockState[] }
export function packetLossColumns(now: number): PacketColumn[] {
  const out: PacketColumn[] = [];
  PACKET_LOSS.columns.forEach((at, index) => {
    const x = columnScreenX(now, at);
    if (now < at || x <= -PACKET_LOSS.width) return;
    out.push({ at, index, x, states: Array.from({ length: PACKET_LOSS.blocks }, (_, i) => blockState(now, i)) });
  });
  return out;
}

// Only solid blocks collide (with Kipu and with shots).
export function solidRects(now: number): Rect[] {
  return packetLossColumns(now).flatMap(c => blockRects(c.x).filter((_, i) => c.states[i] === 'solid'));
}

export function packetLossWindow(): [number, number] {
  const cols = PACKET_LOSS.columns;
  return [cols[0], cols[cols.length - 1] + crossMs()];
}
