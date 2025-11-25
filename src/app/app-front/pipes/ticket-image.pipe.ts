
import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Pipe({
  name: 'ticketImage'
})
export class TicketImagePipe implements PipeTransform {
  transform(value: string | string[] | undefined): string {
    if(typeof value === 'string') {
      return `${baseUrl}/files/ticket/${value}`;
    }

    const image = value && value.length > 0 ? value[0] : null;

    if(!image) {
      return 'assets/images/no-image.jpg';
    }

    return `${baseUrl}/files/ticket/${image}`;


  }
}
