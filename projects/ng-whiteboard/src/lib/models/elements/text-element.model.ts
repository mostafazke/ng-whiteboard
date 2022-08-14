import { LineCapEnum } from '../line-cap.enum';
import { LineJoinEnum } from '../line-join.enum';
import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class TextElement {
  left: number;
  top: number;
  width: number;
  height: number;

  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  fill: string;

  strokeWidth: number;
  strokeColor: string;
  lineJoin: LineJoinEnum;
  lineCap: LineCapEnum;
  dasharray: string;
  dashoffset: number;

  // font-size-adjust
  // font-stretch
  // font-style
  // font-variant
  // font-weight


  constructor(options: IWhiteboardElementOptions) {
    this.left = options.left || 0;
    this.top = options.top || 0;
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.fontFamily = options.fontFamily || 'Arial';
    this.fontSize = options.fontSize || 14;
    this.fontStyle = options.fontStyle || 'normal';
    this.fontWeight = options.fontWeight || 'normal';
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.fill = options.fill || '#000000';
    this.lineJoin = options.lineJoin || LineJoinEnum.ROUND;
    this.lineCap = options.lineCap || LineCapEnum.ROUND;
    this.dasharray = options.dasharray || '';
    this.dashoffset = options.dashoffset || 0;
  }
}
