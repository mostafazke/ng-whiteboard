import { LineCapEnum } from './line-cap.enum';
import { LineJoinEnum } from './line-join.enum';

export class ElementOptions {
  fill?: string;
  stroke?: string;
  size?: number;
  color?: string;
  fontFamily?: string;
  lineJoin?: LineJoinEnum;
  lineCap?: LineCapEnum;

  strokeWidth: number;
  dasharray: string;
  strokeOpacity: number;
  rotation: number;
  opacity: number;

  constructor(
    fill?: string,
    stroke?: string,
    size?: number,
    lineJoin?: LineJoinEnum,
    lineCap?: LineCapEnum,
    color?: string,
    fontFamily?: string,
    strokeWidth?: number,
    dasharray?: string,
    strokeOpacity?: number,
    rotation?: number,
    opacity?: number
  ) {
    this.fill = fill || null;
    this.stroke = stroke || '#333333';
    this.size = size || 2;
    this.color = color || '#333333';
    this.fontFamily = fontFamily || 'arial';
    this.lineJoin = lineJoin || LineJoinEnum.ROUND;
    this.lineCap = lineCap || LineCapEnum.ROUND;
    this.strokeWidth = strokeWidth || 2;
    this.dasharray = dasharray || 'none';
    this.strokeOpacity = strokeOpacity || 100;
    this.rotation = rotation || 0;
    this.opacity = opacity || 100;
  }
}
