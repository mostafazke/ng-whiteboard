import { LineCapEnum } from '../line-cap.enum';
import { LineJoinEnum } from '../line-join.enum';
import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class BrushElement {
  strokeWidth: number;
  strokeColor: string;
  lineCap: LineCapEnum;
  lineJoin: LineJoinEnum;
  dasharray: string;
  dashoffset: number;

  constructor(options: IWhiteboardElementOptions) {
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.lineCap = options.lineCap || LineCapEnum.ROUND;
    this.lineJoin = options.lineJoin || LineJoinEnum.ROUND;
    this.dasharray = options.dasharray || '';
    this.dashoffset = options.dashoffset || 0;
  }
}
