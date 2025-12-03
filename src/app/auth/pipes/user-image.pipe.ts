import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

type UserImageInput =
  | string
  | string[]
  | Array<{ id: number; url: string }>
  | undefined
  | null;

@Pipe({
  name: 'userImage'
})
export class UserImagePipe implements PipeTransform {
  transform(value: UserImageInput): string {
    if (!value) return this.getDefaultImage();

    // String simple
    if (typeof value === 'string') {
      return `${baseUrl}/files/user/${value}`;
    }

    // Array (de cualquier tipo)
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];

      // Array de objetos con url
      if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        return `${baseUrl}/files/user/${firstItem.url}`;
      }

      // Array de strings
      if (typeof firstItem === 'string') {
        return `${baseUrl}/files/user/${firstItem}`;
      }
    }

    return this.getDefaultImage();
  }

  private getDefaultImage(): string {
    return './assets/images/personal/not_user.png';
  }
}
