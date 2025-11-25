import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortById'
})
export class SortByIdPipe implements PipeTransform {
  transform(array: any[], order: 'asc' | 'desc' = 'asc'): any[] {
    if (!array || array.length === 0) return array;

    return array.sort((a, b) => {
      if (order === 'asc') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });
  }
}
