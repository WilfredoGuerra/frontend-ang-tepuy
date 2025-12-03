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
    return `${this.baseUrl}/files/user/8123cd2d-b183-4b67-a231-2586173eaed9.png`
  })


  onImageLoad(userId: number) {
    this.imageLoaded.set(userId, true);
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
    const imgElement = event.target;

    // Cambiar a imagen por defecto solo si no es ya la por defecto
    if (!imgElement.src.includes('not_user.png')) {
      imgElement.src = this.getDefaultImage();
      // Prevenir bucles de error estableciendo onerror a null
      imgElement.onerror = null;
    }
  }
}
