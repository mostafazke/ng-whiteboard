import { Pipe, PipeTransform } from '@angular/core';
import { scaleShapePath } from '../utils/svg/shape-path';

@Pipe({
  name: 'shapePath',
  standalone: true,
})
export class ShapePathPipe implements PipeTransform {
  transform(path: string | undefined, width: number, height: number): string {
    if (!path) {
      return '';
    }
    try {
      return scaleShapePath(path, width, height);
    } catch {
      return '';
    }
  }
}
