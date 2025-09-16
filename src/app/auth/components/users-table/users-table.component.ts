// import { CommonModule } from '@angular/common';
// import { Component, input, OnInit, OnDestroy } from '@angular/core';
// import { User } from '@auth/interfaces/user.interface';
// import { environment } from 'src/environments/environment';

// @Component({
//   selector: 'users-table',
//   templateUrl: './users-table.component.html',
//   imports: [CommonModule]
// })
// export class UsersTableComponent implements OnInit, OnDestroy {
//   user = input.required<User[]>();
//   private baseUrl = environment.baseUrl;
//   private imageCache = new Map<string, string>();
//   private defaultImage = `${this.baseUrl}/static/users/not_user.png`;

//   ngOnInit() {
//     // Precargar la imagen por defecto
//     this.preloadImage(this.defaultImage);
//   }

//   ngOnDestroy() {
//     // Limpiar cache al destruir el componente
//     this.imageCache.clear();
//   }

//   // Precargar imagen para evitar flickering
//   private preloadImage(url: string): void {
//     const img = new Image();
//     img.src = url;
//   }

//   // Obtener la imagen del usuario
//   getUserImage(user: User): string {
//     const cacheKey = `user-${user.id}-image`;

//     // Verificar si está en cache
//     if (this.imageCache.has(cacheKey)) {
//       return this.imageCache.get(cacheKey)!;
//     }

//     let imageUrl: string;

//     // Si el usuario tiene imágenes, usar la primera
//     if (user.images && user.images.length > 0 && user.images[0]) {
//       if (user.images[0].startsWith('http') || user.images[0].startsWith('//')) {
//         imageUrl = user.images[0];
//       } else {
//         imageUrl = `${this.baseUrl}/${user.images[0]}`;
//       }
//     } else {
//       // Si no tiene imagen, usar la imagen por defecto
//       imageUrl = this.defaultImage;
//     }

//     // Guardar en cache y precargar
//     this.imageCache.set(cacheKey, imageUrl);
//     this.preloadImage(imageUrl);

//     return imageUrl;
//   }

//   // Manejar errores de carga de imagen
//   handleImageError(event: any): void {
//     const imgElement = event.target;

//     // Solo reemplazar si no es ya la imagen por defecto
//     if (!imgElement.src.includes('not_user.png')) {
//       imgElement.src = this.defaultImage;

//       // Evitar bucles de error
//       imgElement.onerror = null;
//     }
//   }
// }

////////////////////////////////////////////////////////////////////

// import { CommonModule } from '@angular/common';
// import { Component, input, OnInit } from '@angular/core';
// import { User } from '@auth/interfaces/user.interface';
// import { environment } from 'src/environments/environment';

// @Component({
//   selector: 'users-table',
//   templateUrl: './users-table.component.html',
//   imports: [CommonModule]
// })
// export class UsersTableComponent implements OnInit {
//   user = input.required<User[]>();
//   private baseUrl = environment.baseUrl;

//   ngOnInit() {
//     console.log('DEBUG: Base URL del backend:', this.baseUrl);

//     // Verificar la estructura de datos de los usuarios
//     if (this.user() && this.user().length > 0) {
//       this.user().forEach((user, index) => {
//         console.log(`Usuario ${index + 1}:`, {
//           id: user.id,
//           nombre: `${user.fullName} ${user.surnames}`,
//           tieneImagenes: user.images && user.images.length > 0,
//           imagenes: user.images,
//           primeraImagen: user.images && user.images.length > 0 ? user.images[0] : 'N/A'
//         });
//       });
//     }
//   }

//   imageLoaded = new Map<number, boolean>();

//   onImageLoad(userId: number) {
//   this.imageLoaded.set(userId, true);
// }

//   // Obtener la imagen del usuario
//   getUserImage(user: User): string {
//     // Si no hay imágenes o el array está vacío
//     if (!user.images || user.images.length === 0) {
//       console.log(`Usuario ${user.id} no tiene imágenes, usando por defecto`);
//       return this.getDefaultImage();
//     }

//     const firstImage = user.images[0];

//     // Si la primera imagen es null, undefined o string vacío
//     if (!firstImage) {
//       console.log(`Usuario ${user.id} tiene imagen nula/vacía, usando por defecto`);
//       return this.getDefaultImage();
//     }

//     // Verificar si ya es una URL completa
//     if (this.isAbsoluteUrl(firstImage)) {
//       console.log(`Usuario ${user.id} tiene URL absoluta:`, firstImage);
//       return firstImage;
//     }

//     // Construir URL completa para rutas relativas
//     const fullImageUrl = this.buildImageUrl(firstImage);
//     console.log(`Usuario ${user.id} - URL construida:`, fullImageUrl);

//     return fullImageUrl;
//   }

//   // Verificar si es una URL absoluta
//   private isAbsoluteUrl(url: string): boolean {
//     return /^(https?:|blob:|data:|\/\/)/.test(url);
//   }

//   // Construir URL de imagen completa
//   private buildImageUrl(imagePath: string): string {
//     // Limpiar la ruta - remover slash inicial si existe
//     const cleanPath = imagePath.replace(/^\//, '');

//     // Construir URL completa
//     return `${this.baseUrl.replace(/\/$/, '')}/${cleanPath}`;
//   }

//   // Obtener imagen por defecto
//   private getDefaultImage(): string {
//     return `${this.baseUrl.replace(/\/$/, '')}/static/users/not_user.png`;
//   }

//   // Manejar errores de carga de imagen
//   handleImageError(event: any, user: User): void {
//     console.warn(`ERROR: No se pudo cargar la imagen para usuario ${user.id}`);
//     console.warn('URL que falló:', event.target.src);

//     const imgElement = event.target;

//     // Cambiar a imagen por defecto solo si no es ya la por defecto
//     if (!imgElement.src.includes('not_user.png')) {
//       imgElement.src = this.getDefaultImage();
//       // Prevenir bucles de error estableciendo onerror a null
//       imgElement.onerror = null;
//     }
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { User } from '@auth/interfaces/user.interface';
import { FormatCedulaPipe } from '@auth/pipes/format-cedula.pipe';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'users-table',
  templateUrl: './users-table.component.html',
  imports: [CommonModule, FormatCedulaPipe]
})
export class UsersTableComponent implements OnInit {
  user = input.required<User[]>();
  private baseUrl = environment.baseUrl;

  // Mapa para trackear imágenes cargadas
  imageLoaded = new Map<number, boolean>();

  ngOnInit() {
    // console.log('DEBUG: Base URL del backend:', this.baseUrl);

    // Verificar la estructura de datos de los usuarios
    if (this.user() && this.user().length > 0) {
      this.user().forEach((user, index) => {
        console.log(`Usuario ${index + 1}:`, {
          id: user.id,
          nombre: `${user.fullName} ${user.surnames}`,
          tieneImagenes: user.images && user.images.length > 0,
          imagenes: user.images,
          primeraImagen: user.images && user.images.length > 0 ? user.images[0] : 'N/A'
        });
      });
    }
  }

  onImageLoad(userId: number) {
    this.imageLoaded.set(userId, true);
  }

  // Obtener la imagen del usuario
  getUserImage(user: User): string {
    // Si no hay imágenes o el array está vacío
    if (!user.images || user.images.length === 0 || !user.images[0]) {
      // console.log(`Usuario ${user.id} no tiene imágenes válidas, usando por defecto`);
      return this.getDefaultImage();
    }

    const firstImage = user.images[0];

    // Si la imagen es null, undefined o string vacío
    if (!firstImage || firstImage.trim() === '') {
      // console.log(`Usuario ${user.id} tiene imagen nula/vacía, usando por defecto`);
      return this.getDefaultImage();
    }

    // Verificar si ya es una URL completa
    if (this.isAbsoluteUrl(firstImage)) {
      // console.log(`Usuario ${user.id} tiene URL absoluta:`, firstImage);
      return firstImage;
    }

    // Construir URL completa para rutas relativas
    const fullImageUrl = this.buildImageUrl(firstImage);
    console.log(`Usuario ${user.id} - URL construida:`, fullImageUrl);

    return fullImageUrl;
  }

  // Verificar si es una URL absoluta
  private isAbsoluteUrl(url: string): boolean {
    return /^(https?:|blob:|data:|\/\/)/.test(url);
  }

  // Construir URL de imagen completa
  private buildImageUrl(imagePath: string): string {
    // Limpiar la ruta - remover slash inicial si existe
    const cleanPath = imagePath.replace(/^\//, '');

    // Construir URL completa
    return `${this.baseUrl.replace(/\/$/, '')}/${cleanPath}`;
  }

  // Obtener imagen por defecto
  private getDefaultImage(): string {
    return `${this.baseUrl.replace(/\/$/, '')}/static/users/not_user.png`;
  }

  // Manejar errores de carga de imagen
  handleImageError(event: any, user: User): void {
    // console.warn(`ERROR: No se pudo cargar la imagen para usuario ${user.id}`);
    // console.warn('URL que falló:', event.target.src);

    const imgElement = event.target;

    // Cambiar a imagen por defecto solo si no es ya la por defecto
    if (!imgElement.src.includes('not_user.png')) {
      imgElement.src = this.getDefaultImage();
      // Prevenir bucles de error estableciendo onerror a null
      imgElement.onerror = null;
    }
  }
}
