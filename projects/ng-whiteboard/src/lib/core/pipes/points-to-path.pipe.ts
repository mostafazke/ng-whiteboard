import { Pipe, PipeTransform } from '@angular/core';
import { StrokeOptions } from '../utils/drawing';
import { getStrokePoints } from '../utils/drawing/stroke-points';
import { getSvgPathFromStroke } from '../utils/drawing/path';

@Pipe({
  name: 'pointsToPath',
  standalone: true,
})
export class PointsToPathPipe implements PipeTransform {
  /**
   * Converts an array of points to an SVG path string.
   */
  transform(points: number[][] | undefined, options?: StrokeOptions): string {
    if (!points || points.length === 0) {
      return '';
    }

    const stroke = getStrokePoints(points, options);

    return getSvgPathFromStroke(stroke);
  }
}
