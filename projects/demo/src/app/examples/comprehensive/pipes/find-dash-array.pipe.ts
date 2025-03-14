import { Pipe, PipeTransform } from '@angular/core';
import { strokeDashArrayOptions } from '../../../shared/strokeDashArrayOptions';

@Pipe({
  name: 'findDashArray',
})
export class FindDashArrayPipe implements PipeTransform {
  transform(value: string): string {
    const dashArray = strokeDashArrayOptions.find((d) => d.value === value);
    return dashArray ? dashArray.pattern : '──────';
  }
}
