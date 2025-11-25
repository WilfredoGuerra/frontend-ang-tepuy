import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortName',
  standalone: true
})
export class ShortNamePipe implements PipeTransform {
  transform(fullName: string, surnames: string): string {
    if (!fullName && !surnames) return '';

    const firstName = fullName?.split(' ')[0] || '';
    const firstSurname = surnames?.split(' ')[0] || '';

    return `${firstName} ${firstSurname}`.trim();
  }
}
