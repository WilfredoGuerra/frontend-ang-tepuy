import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@shared/theme/theme.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'front-navbar',
  imports: [RouterLink],
  templateUrl: './front-navbar.component.html',
})
export class FrontNavbarComponent {
  authService = inject(AuthService);
  user = computed(() => this.authService.user());
  router = inject(Router);

  isDarkMode = signal<boolean>(false);

  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  exitSystem() {
      Swal.fire({
        title: "Salida del sistema",
        text: "Estas seguro(a) que desea salir?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, salir",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Salida del sistema exitosa.",
            html: `Hasta luego: <b>${this.user()?.fullName}</b>`,
            icon: "success",
            showConfirmButton: false,
            timer: 2000,
          });
          this.authService.logout();
          this.router.navigateByUrl('/auth/login');
        }
      });
    }
}
