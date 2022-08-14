import { IWhiteboardElementOptions } from '../whiteboard-element-options.model';

export class ImageElement {
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: string;
  dasharray: string;
  fill: string;






  constructor(options: IWhiteboardElementOptions) {
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || '#000000';
    this.dasharray = options.dasharray || '';
    this.fill = options.fill || '#000000';
  }
}
