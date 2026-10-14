import { nodeState, type Progress } from './challengeRules';
import type { MapTextKey } from './mapText';

// Pure map decisions (no Phaser): the six sockets of the Trama artwork, their status, the selection order and the card copy keys.
export type NodeId = 'route-02' | 'route-03' | 'arequipa' | 'route-04' | 'route-05' | 'route-06';
export type NodeStatus = 'corrupted' | 'restored' | 'locked';
export type NodeAction = 'startRoute' | 'locked';
export interface MapNode { id: NodeId; labelKey: MapTextKey; x: number; y: number; playable: boolean }
export interface NodeCard { name: MapTextKey; status: MapTextKey; action: MapTextKey }

// Screen layout: text panels over the art; every marker plus its cursor must stay between them.
export const TOP_PANEL_HEIGHT = 16;
export const BOTTOM_PANEL_Y = 142;
export const CURSOR_RX = 12;
export const CURSOR_RY = 9;

// Socket centers in 320x180 coordinates of assets/prepared/map-trama-v1-320x180.png. Measured (B2, 2026-10-14) on a 12x
// zoom of each ring with a 4 px grid: midpoint of the rim's left/right and top/bottom edge pixels, rounded to integers.
// The rings are ~14x10 px ellipses; Arequipa is the glowing teal one. Ordered left to right, which is also the selection order.
// RUTA 02..06 are placeholder numbers (no lore or city names are assigned) given left to right to the five other sockets.
export const MAP_NODES: readonly MapNode[] = Object.freeze([
  { id: 'route-02', labelKey: 'route02', x: 70, y: 34, playable: false },
  { id: 'route-03', labelKey: 'route03', x: 84, y: 74, playable: false },
  { id: 'arequipa', labelKey: 'arequipa', x: 161, y: 128, playable: true },
  { id: 'route-04', labelKey: 'route04', x: 191, y: 87, playable: false },
  { id: 'route-05', labelKey: 'route05', x: 246, y: 43, playable: false },
  { id: 'route-06', labelKey: 'route06', x: 251, y: 126, playable: false },
]);
export const START_NODE: NodeId = 'arequipa';

// Arequipa follows Amaru's liberation (existing nodeState); every other node is locked until the design assigns it.
export function nodeStatus(node: MapNode, progress: Progress): NodeStatus { return node.playable ? nodeState(progress) : 'locked'; }

// Left/right walk the left-to-right order and wrap around. Up/down are intentionally not mapped: the sockets form
// one line of choices, and a 2D neighbour search over six fixed nodes would only add surprising jumps.
export function moveSelection(nodes: readonly MapNode[], currentId: string, direction: 'left' | 'right'): NodeId {
  const index = nodes.findIndex(node => node.id === currentId);
  if (index < 0) return START_NODE;
  return nodes[(index + (direction === 'right' ? 1 : nodes.length - 1)) % nodes.length].id;
}

export function cardFor(node: MapNode, status: NodeStatus): NodeCard {
  if (status === 'locked') return { name: node.labelKey, status: 'underConstruction', action: 'comingSoon' };
  return { name: node.labelKey, status, action: 'startRoute' };
}

export function actionFor(node: MapNode): NodeAction { return node.playable ? 'startRoute' : 'locked'; }
