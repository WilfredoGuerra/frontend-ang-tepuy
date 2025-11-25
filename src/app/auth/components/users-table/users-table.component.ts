import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { User } from '@auth/interfaces/user.interface';
import { FormatCedulaPipe } from '@auth/pipes/format-cedula.pipe';
import { UserImagePipe } from '@auth/pipes/user-image.pipe';
import { AuthService } from '@auth/services/auth.service';
import { environment } from 'src/environments/environment';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'users-table',
  templateUrl: './users-table.component.html',
  imports: [CommonModule, FormatCedulaPipe, UserImagePipe, RouterLink]
})
export class UsersTableComponent {
  user = input.required<User[]>();
  private baseUrl = environment.baseUrl;
  authService = inject(AuthService);

  // Mapa para trackear imágenes cargadas
  imageLoaded = new Map<number, boolean>();

  imageUrl = computed(() => {
    return `http://localhost:3000/api/files/user/8123cd2d-b183-4b67-a231-2586173eaed9.png`
  })

  // ngOnInit(){
  //   console.log(this.user())
  // }

  // ngOnInit() {
  //   // Verificar la estructura de datos de los usuarios
  //   if (this.user() && this.user().length > 0) {
  //     this.user().forEach((user, index) => {
  //       console.log(`Usuario ${index + 1}:`,
  //         {
  //         id: user.id,
  //         nombre: `${user.fullName} ${user.surnames}`,
  //         tieneImagenes: user.images && user.images.length > 0,
  //         imagenes: user.images,
  //         tipoPrimeraImagen: user.images && user.images.length > 0 ? typeof user.images[0] : 'N/A'
  //       });
  //     });
  //   }
  // }

  onImageLoad(userId: number) {
    this.imageLoaded.set(userId, true);
  }

  // Obtener la imagen del usuario - CORREGIDO
  // getUserImage(user: User): string {
  //   // Si no hay imágenes o el array está vacío
  //   if (!user.images || user.images.length === 0 || !user.images[0]) {
  //     return this.getDefaultImage();
  //   }

  //   const firstImage = user.images[0];

  //   // Si la imagen es un objeto con propiedad 'url'
  //   if (typeof firstImage === 'object' && firstImage !== null && 'url' in firstImage) {
  //     const imageUrl = firstImage.url;

  //     // Si la URL es null, undefined o string vacío
  //     if (!imageUrl || imageUrl.trim() === '') {
  //       return this.getDefaultImage();
  //     }

  //     // Verificar si ya es una URL completa
  //     if (this.isAbsoluteUrl(imageUrl)) {
  //       return imageUrl;
  //     }

  //     // Construir URL completa para rutas relativas
  //     return this.buildImageUrl(imageUrl);
  //   }
  //   // Si la imagen es un string (formato antiguo)
  //   else if (typeof firstImage === 'string') {
  //     // Si el string está vacío
  //     if (firstImage === '') {
  //       return this.getDefaultImage();
  //     }

  //     // Verificar si ya es una URL completa
  //     if (this.isAbsoluteUrl(firstImage)) {
  //       return firstImage;
  //     }

  //     // Construir URL completa para rutas relativas
  //     return this.buildImageUrl(firstImage);
  //   }
  //   // Si es otro tipo de dato
  //   else {
  //     console.warn(`Formato de imagen no reconocido para usuario ${user.id}:`, firstImage);
  //     return this.getDefaultImage();
  //   }
  // }

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
    const imgElement = event.target;

    // Cambiar a imagen por defecto solo si no es ya la por defecto
    if (!imgElement.src.includes('not_user.png')) {
      imgElement.src = this.getDefaultImage();
      // Prevenir bucles de error estableciendo onerror a null
      imgElement.onerror = null;
    }
  }
}
