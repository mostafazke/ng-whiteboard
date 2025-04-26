import { ElementByType, ElementType, ElementUtil, WhiteboardElement } from '../types';
import { ArrowElementUtil } from './arrow-element';
import { EllipseElementUtil } from './ellipse-element';
import { ImageElementUtil } from './image-element';
import { LineElementUtil } from './line-element';
import { PenElementUtil } from './pen-element';
import { RectangleElementUtil } from './rectangle-element';
import { TextElementUtil } from './text-element';

const elementUtilsMap: Record<ElementType, ElementUtil<WhiteboardElement>> = {
  [ElementType.Arrow]: new ArrowElementUtil(),
  [ElementType.Ellipse]: new EllipseElementUtil(),
  [ElementType.Image]: new ImageElementUtil(),
  [ElementType.Line]: new LineElementUtil(),
  [ElementType.Pen]: new PenElementUtil(),
  [ElementType.Rectangle]: new RectangleElementUtil(),
  [ElementType.Text]: new TextElementUtil(),
} as const;

export function getElementUtil(type: ElementType) {
  return elementUtilsMap[type];
}

export function createElement<T extends ElementType>(type: T, props: Partial<ElementByType<T>>) {
  return elementUtilsMap[type].create(props) as ElementByType<T>;
}
