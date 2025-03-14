import { ToolType } from './tools';
import { LineCap, LineJoin } from './types';

export interface WhiteboardOptions {
  drawingEnabled?: boolean;
  selectedTool?: ToolType;
  canvasWidth?: number;
  canvasHeight?: number;
  fullScreen?: boolean;
  center?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  lineJoin?: LineJoin;
  lineCap?: LineCap;
  fill?: string;
  zoom?: number;
  fontFamily?: string;
  fontSize?: number;
  dasharray?: string;
  dashoffset?: number;
  x?: number;
  y?: number;
  enableGrid?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
}
