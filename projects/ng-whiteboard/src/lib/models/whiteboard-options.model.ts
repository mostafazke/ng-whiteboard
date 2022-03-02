import { LineCapEnum } from './line-cap.enum';
import { LineJoinEnum } from './line-join.enum';
import { ToolsEnum } from './tools.enum';

export interface WhiteboardOptions {
  // imageUrl?: string;
  selectedTool?: ToolsEnum;
  aspectRatio?: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
  scaleFactor?: number;
  downloadedFileName?: string;
  lineJoin?: LineJoinEnum;
  lineCap?: LineCapEnum;

  drawingEnabled?: boolean;

  fillColor?: string;
  strokeColor?: string;
}
