import { Component, computed, inject, input, output } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import Swal from 'sweetalert2';
import { UserImagePipe } from '@auth/pipes/user-image.pipe'; // Importar el pipe
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule, UserImagePipe], // Agregar CommonModule y UserImagePipe
  templateUrl: './sidebar.html',
})
export class Sidebar {
  authService = inject(AuthService);
  private themeService = inject(ThemeService);
  user = computed(() => this.authService.user());
  router = inject(Router);

  isCollapsed = input<boolean>(false);
  toggleCollapse = output<void>();
  closeMobile = output<void>();

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  onCloseMobile(): void {
    this.closeMobile.emit();
  }

  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  exitSystem() {
    Swal.fire({
      title: 'Salida del sistema',
      text: 'Estas seguro(a) que desea salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Salida del sistema exitosa.',
          html: `Hasta luego: <b>${this.user()?.fullName}</b>`.toUpperCase(),
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
        });
        this.authService.logout();
        this.router.navigateByUrl('/');
      }
    });
  }

  handleImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  // Cambiar a imagen por defecto si hay error
  imgElement.src = './assets/images/personal/not_user.png';
  // Prevenir bucles de error
  imgElement.onerror = null;
}
}
