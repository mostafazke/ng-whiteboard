import { LineCapEnum } from './line-cap.enum';
import { LineJoinEnum } from './line-join.enum';
import { ToolsEnum } from './tools.enum';

export interface WhiteboardOptions {
  drawingEnabled?: boolean;
  selectedTool: ToolsEnum;
  canvasWidth?: number;
  canvasHeight?: number;
  fullScreen?: boolean;
  center?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  lineJoin: LineJoinEnum;
  lineCap: LineCapEnum;
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
