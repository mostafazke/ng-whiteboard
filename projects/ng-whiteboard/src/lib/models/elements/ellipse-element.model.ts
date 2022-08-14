import { LineCapEnum } from '../line-cap.enum';
import { LineJoinEnum } from '../line-join.enum';
import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class EllipseElement {
  cx: number;
  cy: number;
  rx: number;
  ry: number;

  strokeWidth: number;
  strokeColor: string;
  fill: string;
  dasharray: string;
  dashoffset: number;
  lineCap: LineCapEnum;
  lineJoin: LineJoinEnum;

  constructor(options: IWhiteboardElementOptions) {
    this.cx = options.cx || 0;
    this.cy = options.cy || 0;
    this.rx = options.rx || 0;
    this.ry = options.ry || 0;
    this.dasharray = options.dasharray || '';
    this.dashoffset = options.dashoffset || 0;
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.fill = options.fill || '#000000';
    this.lineCap = options.lineCap || LineCapEnum.ROUND;
    this.lineJoin = options.lineJoin || LineJoinEnum.ROUND;
  }
}
