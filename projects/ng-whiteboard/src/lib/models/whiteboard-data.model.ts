import { ElementOptions } from './element-options.model';
import { ElementTypeEnum } from './element-type.enum';

export class WhiteboardData {
  elementName: ElementTypeEnum;
  elementOptions: ElementOptions;
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  // order: number;
  value: string;

  // for Line shape
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

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
    this.id = `element_${this.elementName}_${Math.floor(Math.random() * 100)}`;
    this.width = width;
    this.height = height;
    this.x = x || 0;
    this.y = y || 0;
  }
}
