import { LayoutConfig } from './types';

export const NODE_WIDTH = 320;
export const NODE_HEIGHT = 200;

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  rankdir: 'TB',
  nodesep: 100,
  ranksep: 150,
  marginx: 50,
  marginy: 50
};

export const NODE_DIMENSIONS = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT
} as const;