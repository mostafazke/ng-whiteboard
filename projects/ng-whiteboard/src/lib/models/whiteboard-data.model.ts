import { ElementOptions } from './element-options.model';
import { ElementTypeEnum } from './element-type.enum';

export class WhiteboardData {
  elementName: ElementTypeEnum;
  id: string;
  value: string;
  x: number;
  y: number;

  elementOptions: ElementOptions;
  width: number;
  height: number;

  // order: number;

  // for Line shape
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  // for Ellipse shape
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;

  // for Text
  top?: number;
  left?: number;

  constructor(
    elementName?: ElementTypeEnum,
    value?: string,
    elementOptions?: ElementOptions,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ) {
    this.elementName = elementName;
    this.elementOptions = elementOptions;
    this.value = value;
    this.id = `element_${this.elementName}_${Math.floor(Math.random() * 1000)}`;
    this.width = width;
    this.height = height;
    this.x = x || 0;
    this.y = y || 0;

    if (this.elementName === ElementTypeEnum.LINE) {
      this.x1 = 0;
      this.y1 = 0;
      this.x2 = 0;
      this.y2 = 0;
    }

    if (this.elementName === ElementTypeEnum.ELLIPSE) {
      this.cx = 0;
      this.cy = 0;
      this.rx = 0;
      this.ry = 0;
    }

    if (this.elementName === ElementTypeEnum.RECT) {
      this.rx = 0;
    }
  }
}
