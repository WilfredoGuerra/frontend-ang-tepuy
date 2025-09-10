import { Component, computed, inject, signal } from '@angular/core';
import { ThemeService } from '../../../shared/theme/theme.service';
import { ThemeToggleComponent } from "../../../shared/theme/theme-toggle/theme-toggle.component";
import { AuthService } from '@auth/services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'front-up',
  imports: [ThemeToggleComponent],
  templateUrl: './front-up.component.html',
    styles: `
    .swal2-popup .swal2-html {
    text-transform: uppercase;
}
  `,
})
export class FrontUpComponent {
  isDarkMode = signal<boolean>(false);

  authService = inject(AuthService);
  user = computed(() => this.authService.user());
  router = inject(Router);
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
              html: `Hasta luego: <b>${this.user()?.fullName}</b>`.toUpperCase(),
              icon: "success",
              showConfirmButton: false,
              timer: 2000,
            });
            this.authService.logout();
            this.router.navigateByUrl('/');
          }
        });
      }
}
