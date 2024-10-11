import { LineCapEnum } from '../line-cap.enum';
import { LineJoinEnum } from '../line-join.enum';
import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class ArrowElement {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeColor: string;
  lineCap: LineCapEnum;
  lineJoin: LineJoinEnum;
  dasharray: string;
  dashoffset: number;

  constructor(options: IWhiteboardElementOptions) {
    this.x1 = options.x1 || 0;
    this.y1 = options.y1 || 0;
    this.x2 = options.x2 || 0;
    this.y2 = options.y2 || 0;
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.lineCap = options.lineCap || LineCapEnum.ROUND;
    this.lineJoin = options.lineJoin || LineJoinEnum.ROUND;
    this.dasharray = options.dasharray || '';
    this.dashoffset = options.dashoffset || 0;
  }
}
