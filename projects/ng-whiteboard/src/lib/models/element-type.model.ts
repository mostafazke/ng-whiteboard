import { ElementTypeEnum } from './element-type.enum';

interface ShapeProps {
  type: ElementTypeEnum;
}
export class ElementType<T extends ShapeProps> {
  type: ElementTypeEnum;
  id: string;
  constructor(public shape: T) {
    this.id = `element_${shape.type}_${Math.floor(Math.random() * 100)}`;
    this.type = shape.type;
  }
}
