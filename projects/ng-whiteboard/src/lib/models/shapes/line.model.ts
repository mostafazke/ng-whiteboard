import { ElementTypeEnum } from '../element-type.enum';
import { Shape } from './shape.model';

export class LineShape extends Shape {
  elementName: ElementTypeEnum.LINE;
  id: string;
  value: string;
  x: number;
  y: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  strokeLinejoin;
  strokeLinecap;
  strokeOpacity: number;
  fill: string;
  rotation: number;
  opacity: number;
  constructor(
    value: string,
    stroke: string,
    lineSize: number,
    linejoin: string,
    linecap: string,
    x?: number,
    y?: number
  ) {
    super(ElementTypeEnum.BRUSH, value, x, y);
  }
}
