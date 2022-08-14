import { LineCapEnum } from './line-cap.enum';
import { LineJoinEnum } from './line-join.enum';

export interface IWhiteboardElementOptions {
  width?: number;
  height?: number;

  strokeWidth?: number;
  strokeColor?: string;
  fill?: string;

  lineJoin?: LineJoinEnum;
  lineCap?: LineCapEnum;

  left?: number;
  top?: number;

  fontSize?: number;
  fontFamily?: string;

  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold';
  color?: string;

  dasharray?: string;
  dashoffset?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  rx?: number;
  ry?: number;
  cx?: number;
  cy?: number;
}
