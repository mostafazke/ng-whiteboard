import { WhiteboardConfig, WhiteboardElementStyle } from '../types';

/** The style new shape-like elements are drawn with, taken from the board config. */
export function drawingStyle(config: WhiteboardConfig): WhiteboardElementStyle {
  return {
    strokeColor: config.strokeColor,
    strokeWidth: config.strokeWidth,
    lineJoin: config.lineJoin,
    fill: config.fill,
    dasharray: config.dasharray,
    dashoffset: config.dashoffset,
  };
}
