import { Shape, ShapeType } from '../types/types';
import type { BaseShapeUtil } from './baseShape';
import { BrushShapeUtil } from './brushShape';
// import { RectangleUtil } from './RectangleUtil'
// import { EllipseUtil } from './EllipseUtil'
// import { ArrowUtil } from './ArrowUtil'
// import { GroupUtil } from './GroupUtil'
// import { StickyUtil } from './StickyUtil'
// import { TextUtil } from './TextUtil'
// import { TDShape, TDShapeType } from '~types'

// export const Rectangle = new RectangleUtil()
// export const Ellipse = new EllipseUtil()
export const Brush = new BrushShapeUtil();
// export const Arrow = new ArrowUtil()
// export const Text = new TextUtil()
// export const Group = new GroupUtil()
// export const Sticky = new StickyUtil()

export const shapeUtils = {
  // [TDShapeType.Rectangle]: Rectangle,
  // [TDShapeType.Ellipse]: Ellipse,
  [ShapeType.Brush]: Brush,
  // [TDShapeType.Arrow]: Arrow,
  // [TDShapeType.Text]: Text,
  // [TDShapeType.Group]: Group,
  // [TDShapeType.Sticky]: Sticky,
};

export const getShapeUtil = <T extends Shape>(shape: T | T['type']): BaseShapeUtil<T> => {
  if (typeof shape === 'string') return shapeUtils[shape] as unknown as BaseShapeUtil<T>;
  return shapeUtils[shape.type] as unknown as BaseShapeUtil<T>;
};
