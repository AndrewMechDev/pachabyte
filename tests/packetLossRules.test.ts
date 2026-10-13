import { describe, expect, it } from 'vitest';
import {
  PACKET_LOSS, blockRects, blockState, columnScreenX, packetLossColumns, packetLossWindow, solidRects, type BlockState,
} from '../src/game/packetLossRules';
import { SEGMENTS, overlaps } from '../src/game/routeRules';
import { GAME } from '../src/game/rules';

const segment = (name: string) => SEGMENTS.find(s => s.name === name)!;
const KIPU = { width: 12, height: 18 };

describe('Packet Loss: data blocks that blink out on a visible beat', () => {
  it('splits each column into lanes that fit Kipu, covering the play band', () => {
    const rects = blockRects(100);
    expect(rects).toHaveLength(PACKET_LOSS.blocks);
    expect(rects[0].y).toBeGreaterThanOrEqual(GAME.playTop);
    expect(rects.at(-1)!.y + rects.at(-1)!.height).toBeLessThanOrEqual(GAME.playBottom);
    for (const r of rects) {
      expect(r.width).toBe(PACKET_LOSS.width);
      expect(r.height).toBeGreaterThan(KIPU.height + 12);
      expect(Number.isInteger(r.y) && Number.isInteger(r.height)).toBe(true);
    }
  });
  it('alternates neighbouring blocks: never two neighbours solid, and a moment when every block is lost', () => {
    let allOpen = 0;
    for (let t = PACKET_LOSS.beat.start; t < PACKET_LOSS.beat.start + 3 * PACKET_LOSS.beat.periodMs; t += 10) {
      const states = Array.from({ length: PACKET_LOSS.blocks }, (_, i) => blockState(t, i));
      expect(states.filter(s => s === 'solid').length).toBeLessThanOrEqual(PACKET_LOSS.blocks / 2);
      for (let i = 1; i < states.length; i++) expect(states[i] === 'solid' && states[i - 1] === 'solid', `${t}`).toBe(false);
      if (states.every(s => s !== 'solid')) allOpen++;
    }
    expect(allOpen).toBeGreaterThan(0);
  });
  it('always offers a lane that stays open for a whole crossing, whenever the column arrives (A2 fairness fix)', () => {
    // Found by the browser pilot: with complementary halves that swap instantly, a crossing that straddles the swap
    // had no open lane at all. Each block is solid for only a third of the beat, so the open windows overlap.
    const crossing = Math.ceil((PACKET_LOSS.width + KIPU.width) / PACKET_LOSS.screenSpeed * 1000);
    for (let t0 = PACKET_LOSS.beat.start; t0 < PACKET_LOSS.beat.start + PACKET_LOSS.beat.periodMs; t0 += 10) {
      const lane = [0, 1].some(i => { for (let t = t0; t <= t0 + crossing; t += 5) if (blockState(t, i) === 'solid') return false; return true; });
      expect(lane, `${t0}`).toBe(true);
    }
  });
  it('telegraphs for 400 ms before every block turns solid', () => {
    expect(PACKET_LOSS.beat.telegraphMs).toBe(400);
    for (let index = 0; index < 2; index++) {
      let previous: BlockState = blockState(PACKET_LOSS.beat.start - 1, index), turns = 0;
      for (let t = PACKET_LOSS.beat.start; t < PACKET_LOSS.beat.start + 4 * PACKET_LOSS.beat.periodMs; t++) {
        const state = blockState(t, index);
        if (state === 'solid' && previous !== 'solid') {
          turns++;
          for (let back = 1; back <= PACKET_LOSS.beat.telegraphMs; back += 25) expect(blockState(t - back, index), `${t - back}`).toBe('telegraph');
        }
        previous = state;
      }
      expect(turns).toBeGreaterThanOrEqual(3);
    }
  });
  it('keeps each lane open long enough to cross at the column speed (a passable rhythm)', () => {
    const open = PACKET_LOSS.beat.periodMs - PACKET_LOSS.beat.solidMs;
    const crossing = (PACKET_LOSS.width + KIPU.width) / PACKET_LOSS.screenSpeed * 1000;
    expect(open).toBeGreaterThanOrEqual(3 * crossing);
    expect(PACKET_LOSS.beat.solidMs).toBeLessThanOrEqual(1200);
  });
  it('scrolls columns in from the right edge and out past the left edge', () => {
    const at = PACKET_LOSS.columns[0];
    expect(columnScreenX(at, at)).toBeGreaterThanOrEqual(GAME.width);
    expect(columnScreenX(at + 1000, at)).toBeCloseTo(columnScreenX(at, at) - PACKET_LOSS.screenSpeed);
    expect(packetLossColumns(at - 1)).toHaveLength(0);
    expect(packetLossColumns(at + 10)).toHaveLength(1);
    const [, end] = packetLossWindow();
    expect(packetLossColumns(end)).toHaveLength(0);
    expect(packetLossColumns(end - 50).length).toBeGreaterThan(0);
  });
  it('hurts only through solid blocks: telegraphing and lost blocks are harmless', () => {
    const at = PACKET_LOSS.columns[0];
    for (let t = at; t < at + 3000; t += 37) {
      const rects = solidRects(t);
      for (const column of packetLossColumns(t)) {
        const all = blockRects(column.x);
        column.states.forEach((state, i) => expect(rects.some(r => r.x === all[i].x && r.y === all[i].y)).toBe(state === 'solid'));
      }
    }
  });
  it('lives inside its segment, after the Firewall, and uses a bounded pool', () => {
    const [start, end] = packetLossWindow();
    expect(start).toBeGreaterThanOrEqual(segment('packetLoss').start);
    expect(end).toBeLessThanOrEqual(segment('packetLoss').end + 500);
    let most = 0;
    for (let t = start; t < end; t += 50) most = Math.max(most, packetLossColumns(t).length);
    expect(most).toBeLessThanOrEqual(PACKET_LOSS.pool);
  });
  it('leaves a lane Kipu can stand in while a column passes', () => {
    const at = PACKET_LOSS.columns[1];
    for (let t = at; t < at + 5000; t += 100) {
      const rects = solidRects(t);
      const safe = Array.from({ length: 140 }, (_, i) => GAME.playTop + i).some(y => !rects.some(r => overlaps({ x: columnScreenX(t, at), y, width: KIPU.width, height: KIPU.height }, r)));
      expect(safe, `${t}`).toBe(true);
    }
  });
});
