import { ElementTypeEnum } from './element-type.enum';
import { BrushElement, EllipseElement, ImageElement, LineElement, ArrowElement, RectElement, TextElement } from './elements';
import { IWhiteboardElementOptions } from './whiteboard-element-options.model';

export class WhiteboardElement {
  type: ElementTypeEnum;
  value: string;
  id: string;
  x = 0;
  y = 0;
  rotation = 0;
  opacity = 100;

  options: IWhiteboardElementOptions = {};

  constructor(type: ElementTypeEnum, options: IWhiteboardElementOptions, value?: string) {
    this.type = type;
    this.value = value || '';
    this.id = `element_${this.type}_${Math.floor(Math.random() * 1000)}`;

    switch (type) {
      case ElementTypeEnum.BRUSH:
        this.options = new BrushElement(options);
        break;
      case ElementTypeEnum.IMAGE:
        this.options = new ImageElement(options);
        break;
      case ElementTypeEnum.RECT:
        this.options = new RectElement(options);
        break;
      case ElementTypeEnum.LINE:
        this.options = new LineElement(options);
        break;
      case ElementTypeEnum.ARROW:
          this.options = new ArrowElement(options);
          break;
      case ElementTypeEnum.ELLIPSE:
        this.options = new EllipseElement(options);
        break;
      case ElementTypeEnum.TEXT:
        this.options = new TextElement(options);
        break;
      default:
        this.options = {};
        break;
    }
  }
}
