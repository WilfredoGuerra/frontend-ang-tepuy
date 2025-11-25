import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, format: string = 'medium'): string {
    if (!value) return '';

    const date = new Date(value);

    if (format === 'short') {
      return date.toLocaleDateString('es-ES');
    }

    return date.toLocaleString('es-ES');
  }
}
