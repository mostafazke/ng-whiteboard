import { ElementTypeEnum } from '../element-type.enum';

export class Shape {
  type: ElementTypeEnum;
  src: any;

  constructor(type: ElementTypeEnum, src: any, public x: number = 0, public y: number = 0) {
    this.type = type;
    this.src = src;
  }
}
