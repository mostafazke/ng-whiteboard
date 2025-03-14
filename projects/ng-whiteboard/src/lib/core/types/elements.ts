import {
  PenElement,
  RectangleElement,
  EllipseElement,
  LineElement,
  ArrowElement,
  TextElement,
  ImageElement,
} from '../elements';
import { WhiteboardElementStyle } from './styles';
import { Direction } from './types';

export enum ElementType {
  Pen = 'pen',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Line = 'line',
  Arrow = 'arrow',
  Text = 'text',
  Image = 'image',
}

export type WhiteboardElements = {
  [ElementType.Pen]: PenElement;
  [ElementType.Rectangle]: RectangleElement;
  [ElementType.Ellipse]: EllipseElement;
  [ElementType.Line]: LineElement;
  [ElementType.Arrow]: ArrowElement;
  [ElementType.Text]: TextElement;
  [ElementType.Image]: ImageElement;
};

export type WhiteboardElement = WhiteboardElements[keyof WhiteboardElements];

export type ElementByType<T extends ElementType> = WhiteboardElements[T];

export interface BaseElement {
  type: ElementType;
  id: string;
  x: number;
  y: number;
  style: WhiteboardElementStyle;
  rotation: number;
  opacity: number;
}

export interface ElementUtil<T> {
  create(props: Partial<T>): T;
  resize(element: T, direction: Direction, dx: number, dy: number): T;
}
