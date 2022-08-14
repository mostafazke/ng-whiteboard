import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class RectElement {
  width: number;
  height: number;
  x1: number;
  y1: number;
  rx: number;
  strokeWidth: number;
  strokeColor: string;
  fill: string;
  dasharray: string;
  dashoffset: number;

  constructor(options: IWhiteboardElementOptions) {
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.x1 = options.x1 || 0;
    this.y1 = options.y1 || 0;
    this.rx = options.rx || 0;
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.fill = options.fill || '#000000';
    this.dasharray = options.dasharray || '';
    this.dashoffset = options.dashoffset || 0;
  }
}
