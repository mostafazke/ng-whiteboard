import { defaultStyle } from '../types/styles';
import { Bounds, BrushShape, ShapeType } from '../types/types';
import { Util } from '../utils/util';
import { BaseShapeUtil } from './baseShape';

export class BrushShapeUtil extends BaseShapeUtil<BrushShape> {
  override type = ShapeType.Brush as const;

  pointsBoundsCache = new WeakMap<BrushShape['points'], Bounds>([]);

  shapeBoundsCache = new Map<string, Bounds>();

  rotatedCache = new WeakMap<BrushShape, number[][]>([]);

  pointCache: Record<string, number[]> = {};

  getShape = (props: Partial<BrushShape>): BrushShape => {
    return {
      id: props.id || 'id',
      type: ShapeType.Brush,
      name: props.name || 'Brush',
      parentId: props.parentId || 'page',
      childIndex: props.childIndex || 1,
      point: props.point || [0, 0],
      rotation: props.rotation || 0,
      style: props.style || defaultStyle,
      points: props.points || [],
      isComplete: props.isComplete || false,
    };
  };

  getBounds = (shape: BrushShape) => {
    // The goal here is to avoid recalculating the bounds from the
    // points array, which is expensive. However, we still need a
    // new bounds if the point has changed, but we will reuse the
    // previous bounds-from-points result if we can.

    const pointsHaveChanged = !this.pointsBoundsCache.has(shape.points);
    const pointHasChanged = !(this.pointCache[shape.id] === shape.point);

    if (pointsHaveChanged) {
      // If the points have changed, then bust the points cache
      const bounds = Util.getBoundsFromPoints(shape.points);
      this.pointsBoundsCache.set(shape.points, bounds);
      this.shapeBoundsCache.set(shape.id, Util.translateBounds(bounds, shape.point));
      this.pointCache[shape.id] = shape.point;
    } else if (pointHasChanged && !pointsHaveChanged) {
      // If the point have has changed, then bust the point cache
      this.pointCache[shape.id] = shape.point;
      this.shapeBoundsCache.set(
        shape.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Util.translateBounds(this.pointsBoundsCache.get(shape.points)!, shape.point)
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.shapeBoundsCache.get(shape.id)!;
  };
}
