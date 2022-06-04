import { ElementTypeEnum } from '../element-type.enum';
import { Shape } from './shape.model';

export class LineShape extends Shape {
  constructor(
    public src: string,
    public stroke: string,
    public lineSize: number,
    public linejoin: string,
    public linecap: string,
    x?: number,
    y?: number
  ) {
    super(ElementTypeEnum.BRUSH, src, x, y);
  }
}
