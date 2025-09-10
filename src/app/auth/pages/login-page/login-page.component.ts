import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styles: `
    .swal2-popup .swal2-html {
    text-transform: uppercase;
}
  `,
})
export class LoginPageComponent {
  currentYear = new Date().getFullYear();

  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  router = inject(Router);

  authService = inject(AuthService);
  user = computed(() => this.authService.user());

  showPassword = signal(false);

  toggleShowPassword() {
    this.showPassword.set(!this.showPassword());
  }

  constructor() {
    // Efecto que reacciona a cambios en hasError
    effect(() => {
      if (this.hasError()) {
        this.mostrarError();
      }
    });
  }

  mostrarError() {
    Swal.fire({
      icon: 'error',
      title: 'Error en la autenticación',
      text: 'Usuario y/o contraseña invalidos',
      showConfirmButton: false,
      timer: 2000,
    }).then(() => {
      // Resetear el error después de mostrar el mensaje
      this.hasError.set(false);
    });
  }

  mostrarExito() {
    Swal.fire({
      icon: 'success',
      title: "<b>Bienvenido a <strong>TEPUY</strong></b>",
      html: `<b>${this.user()?.fullName}</b>`.toUpperCase(),
      showConfirmButton: false,
      timer: 3000,
    });
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 2000);
      return;
    }
    const { email = '', password = '' } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe((isAuthenticated) => {
      if (isAuthenticated && this.authService.isAdmin()) {
        this.router.navigateByUrl('/dashboard');
        this.mostrarExito();
        return;
      }
      if (isAuthenticated) {
        this.router.navigateByUrl('/dashboard');
        this.mostrarExito();
        return;
      }

      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 2000);
    });
  }
}

// Check Authentication

// Register

// Logout
