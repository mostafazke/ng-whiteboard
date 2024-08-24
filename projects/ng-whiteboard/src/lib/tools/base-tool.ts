export enum TLBrushShapeType {
  PostIt = 'post-it',
  Ellipse = 'ellipse',
  Rectangle = 'rectangle',
  Brush = 'draw',
  Arrow = 'arrow',
  Text = 'text',
  Group = 'group',
}
export interface TLPointerInfo<T extends string = string> {
  target: T;
  pointerId: number;
  origin: number[];
  point: number[];
  delta: number[];
  pressure: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}
export type TLPointerEventHandler = (info: TLPointerInfo<string>, e: PointerEvent) => void;
export abstract class BaseTool {
  abstract type: TLBrushShapeType | 'select';


  onCancel?: () => void;

  onPointerMove?: TLPointerEventHandler;
  onPointerUp?: TLPointerEventHandler;
  onPointerDown?: TLPointerEventHandler;
}
