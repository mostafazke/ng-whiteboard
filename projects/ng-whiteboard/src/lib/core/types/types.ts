import { ShapeStyles } from './styles';

export interface PointerInfo {
  target: EventTarget | null;
  pointerId: number;
  origin: number[];
  point: [number, number];
  delta: number[];
  pressure: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export type ToolType = 'select' | 'erase' | ShapeType.Brush;
// | ShapeType.Text
// | ShapeType.Ellipse
// | ShapeType.Rectangle
// | ShapeType.Arrow
// | ShapeType.Sticky

export enum ShapeType {
  Brush = 'brush',
  Sticky = 'sticky',
  Ellipse = 'ellipse',
  Rectangle = 'rectangle',
  Arrow = 'arrow',
  Text = 'text',
  Group = 'group',
}

export interface Handle {
  id: string;
  index: number;
  point: number[];
}
export interface IShape {
  id: string;
  type: string;
  parentId: string;
  childIndex: number;
  name: string;
  point: number[];
  rotation?: number;
  children?: string[];
  handles?: Record<string, Handle>;
  isGhost?: boolean;
  isHidden?: boolean;
  isLocked?: boolean;
  isGenerated?: boolean;
  isAspectRatioLocked?: boolean;
}

export interface BaseShape extends IShape {
  style: ShapeStyles;
  type: ShapeType;
}

export interface RectangleShape extends BaseShape {
  type: ShapeType.Rectangle;
  size: number[];
}

export interface EllipseShape extends BaseShape {
  type: ShapeType.Ellipse;
  radius: number[];
}
export interface BrushShape extends BaseShape {
  type: ShapeType.Brush;
  points: number[][];
  isComplete: boolean;
}
export type Shape =  BrushShape;

// export const tools = {
//   [ToolType.Rectangle]: new RectangleTool(),
// };

// export type TLBrushShapeUtil<T extends AllShapes> = TLShapeUtil<T, any, TLBrushMeta>

// export const Shapes: Record<ShapeType, any> = {
//   [ShapeType.Rectangle]: Rectangle,
// };

// export function getShapeUtils<T extends AllShapes>(type: T['type']) {
//   if (!Shapes[type]) throw Error(`Could not find a util of type ${type}`);
//   return Shapes[type];
// }

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  rotation?: number;
}
