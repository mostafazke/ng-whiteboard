import { ElementTypeEnum } from '../element-type.enum';
import { Shape } from './shape.model';

export class ImageShape extends Shape {
  width = 100;
  height = 150;
  constructor(public src: string | ArrayBuffer, width?: number, height?: number, x?: number, y?: number) {
    super(ElementTypeEnum.IMAGE, src, x, y);
    this.width = width;
    this.height = height;
  }
}
