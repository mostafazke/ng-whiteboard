import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dragInputCursor',
})
export class DragInputCursorPipe implements PipeTransform {
  transform(value: number): number {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      return 0;
    }
    return 70 - (value / 100) * 70;
  }
}
