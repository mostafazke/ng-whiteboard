import { Bounds, ShapeType } from '../types/types';
import { Util } from '../utils/util';

export abstract class BaseShapeUtil<T> {
  abstract type: ShapeType;

  canBind = false;
  canEdit = false;
  canClone = false;
  isAspectRatioLocked = false;
  hideResizeHandles = false;

  abstract getShape: (props: Partial<T>) => T;
  abstract getBounds: (shape: T) => Bounds;

  create = (props: { id: string } & Partial<T>) => {
    return this.getShape(props);
  };

  getCenter = (shape: T) => {
    return Util.getBoundsCenter(this.getBounds(shape));
  };
}
