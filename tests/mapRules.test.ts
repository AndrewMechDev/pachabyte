import { describe, expect, it } from 'vitest';
import { initialProgress, nodeState } from '../src/game/challengeRules';
import { MAP_TEXT, type MapTextKey } from '../src/game/mapText';
import {
  BOTTOM_PANEL_Y, CURSOR_RX, CURSOR_RY, MAP_NODES, START_NODE, TOP_PANEL_HEIGHT, actionFor, cardFor, moveSelection, nodeAt, nodeStatus, tapOutcome,
} from '../src/game/mapRules';

const arequipa = MAP_NODES.find(node => node.id === 'arequipa')!;
const locked = MAP_NODES.filter(node => !node.playable);

describe('map nodes', () => {
  it('has six uniquely identified nodes ordered left to right', () => {
    expect(MAP_NODES).toHaveLength(6);
    expect(new Set(MAP_NODES.map(node => node.id)).size).toBe(6);
    const xs = MAP_NODES.map(node => node.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(6);
  });
  it('keeps every marker and its cursor on the 320x180 canvas, clear of the top and bottom panels', () => {
    for (const node of MAP_NODES) {
      expect(Number.isInteger(node.x) && Number.isInteger(node.y), node.id).toBe(true);
      expect(node.x - CURSOR_RX, node.id).toBeGreaterThanOrEqual(0);
      expect(node.x + CURSOR_RX, node.id).toBeLessThanOrEqual(320);
      expect(node.y - CURSOR_RY, node.id).toBeGreaterThanOrEqual(TOP_PANEL_HEIGHT);
      expect(node.y + CURSOR_RY, node.id).toBeLessThanOrEqual(BOTTOM_PANEL_Y);
    }
  });
  it('keeps cursors of different nodes from overlapping', () => {
    for (const a of MAP_NODES) for (const b of MAP_NODES) {
      if (a === b) continue;
      expect(Math.abs(a.x - b.x) >= 2 * CURSOR_RX || Math.abs(a.y - b.y) >= 2 * CURSOR_RY, `${a.id}/${b.id}`).toBe(true);
    }
  });
  it('has exactly one playable node: Arequipa, where the selection starts', () => {
    expect(MAP_NODES.filter(node => node.playable).map(node => node.id)).toEqual(['arequipa']);
    expect(START_NODE).toBe('arequipa');
    expect(arequipa.labelKey).toBe('arequipa');
  });
  it('names the five locked nodes RUTA 02..06 contiguously from left to right', () => {
    expect(locked).toHaveLength(5);
    expect(locked.map(node => MAP_TEXT[node.labelKey])).toEqual(['RUTA 02', 'RUTA 03', 'RUTA 04', 'RUTA 05', 'RUTA 06']);
  });
});

describe('node status', () => {
  it('is corrupted for a fresh Arequipa and restored once Amaru is freed', () => {
    expect(nodeStatus(arequipa, initialProgress())).toBe('corrupted');
    expect(nodeStatus(arequipa, { route: true, guardian: false })).toBe('corrupted');
    expect(nodeStatus(arequipa, { route: false, guardian: true })).toBe('restored');
    for (const progress of [initialProgress(), { route: true, guardian: true }]) expect(nodeStatus(arequipa, progress)).toBe(nodeState(progress));
  });
  it('keeps every other node locked whatever the progress', () => {
    for (const node of locked) for (const progress of [initialProgress(), { route: true, guardian: true }]) expect(nodeStatus(node, progress), node.id).toBe('locked');
  });
});

describe('selection movement', () => {
  const ids = MAP_NODES.map(node => node.id);
  it('moves right through the left-to-right order and wraps to the first node', () => {
    ids.forEach((id, index) => expect(moveSelection(MAP_NODES, id, 'right'), id).toBe(ids[(index + 1) % ids.length]));
  });
  it('moves left through the left-to-right order and wraps to the last node', () => {
    ids.forEach((id, index) => expect(moveSelection(MAP_NODES, id, 'left'), id).toBe(ids[(index + ids.length - 1) % ids.length]));
  });
  it('visits all six nodes in one full turn in each direction', () => {
    for (const direction of ['left', 'right'] as const) {
      const seen = new Set<string>(); let current: string = START_NODE;
      for (let step = 0; step < 6; step++) { seen.add(current); current = moveSelection(MAP_NODES, current, direction); }
      expect(seen.size).toBe(6);
      expect(current).toBe(START_NODE);
    }
  });
  it('falls back to the start node for an unknown id', () => {
    expect(moveSelection(MAP_NODES, 'nowhere', 'right')).toBe(START_NODE);
  });
});

describe('selected-node card', () => {
  it('names Arequipa with its state and one action per progress', () => {
    expect(cardFor(arequipa, 'corrupted')).toEqual({ name: 'arequipa', status: 'corrupted', action: 'startRoute' });
    expect(cardFor(arequipa, 'restored')).toEqual({ name: 'arequipa', status: 'restored', action: 'startRoute' });
  });
  it('shows a locked node as under construction with a coming-soon action', () => {
    for (const node of locked) expect(cardFor(node, 'locked'), node.id).toEqual({ name: node.labelKey, status: 'underConstruction', action: 'comingSoon' });
  });
  it('only returns keys that exist in the map text', () => {
    for (const node of MAP_NODES) for (const status of ['corrupted', 'restored', 'locked'] as const) {
      for (const key of Object.values(cardFor(node, status)) as MapTextKey[]) expect(MAP_TEXT[key], `${node.id}/${status}/${key}`).toBeTypeOf('string');
    }
  });
});

describe('node action', () => {
  it('starts the route from the playable node and refuses every locked one', () => {
    expect(actionFor(arequipa)).toBe('startRoute');
    for (const node of locked) expect(actionFor(node), node.id).toBe('locked');
  });
});

describe('touch input on the map', () => {
  it('finds the node under a point and nothing in empty space', () => {
    for (const node of MAP_NODES) expect(nodeAt(MAP_NODES, node.x, node.y)?.id).toBe(node.id);
    
    expect(nodeAt(MAP_NODES, 5, 5)).toBeUndefined();
    expect(nodeAt(MAP_NODES, 300, 100)).toBeUndefined();
  });
  it('has a tap target at least as large as the socket ring and not wider than the cursor', () => {
    const first = MAP_NODES[0];
    expect(nodeAt(MAP_NODES, first.x + 7, first.y + 5)?.id).toBe(first.id);
    expect(nodeAt(MAP_NODES, first.x + CURSOR_RX + 4, first.y)).toBeUndefined();
  });
  it('selects on the first tap and starts the route only on a selected playable node', () => {
    expect(tapOutcome(MAP_NODES, START_NODE, arequipa.x, arequipa.y)).toEqual({ selected: START_NODE, act: true });
    expect(tapOutcome(MAP_NODES, 'route-02', arequipa.x, arequipa.y)).toEqual({ selected: START_NODE, act: false });
    const first = locked[0];
    expect(tapOutcome(MAP_NODES, first.id, first.x, first.y)).toEqual({ selected: first.id, act: false });
    expect(tapOutcome(MAP_NODES, START_NODE, first.x, first.y)).toEqual({ selected: first.id, act: false });
  });
  it('ignores taps on empty space', () => {
    expect(tapOutcome(MAP_NODES, 'route-03', 5, 5)).toEqual({ selected: 'route-03', act: false });
  });
});
