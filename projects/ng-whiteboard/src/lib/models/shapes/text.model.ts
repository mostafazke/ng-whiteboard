import { ElementTypeEnum } from '../element-type.enum';
import { Shape } from './shape.model';

export class TextShape extends Shape {
  constructor(public src: string, public color: string, public size: number, x?: number, y?: number) {
    super(ElementTypeEnum.TEXT, src, x, y);
  }
}
