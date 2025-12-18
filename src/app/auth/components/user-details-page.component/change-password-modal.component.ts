import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth/services/auth.service';
import Swal from 'sweetalert2';
import { FormUtils } from '@app-utils/form-utils';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent],
  template: `
    <dialog id="changePasswordModal" class="modal">
      <div class="modal-box max-w-md">
        <form method="dialog">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>

        <h3 class="font-bold text-lg mb-4 text-primary">Cambiar Contraseña</h3>

        <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-bold">Nueva Contraseña</span>
            </label>
            <div
              class="tooltip w-full"
              data-tip="La contraseña debe tener: 2 mayúsculas, 2 minúsculas, 4 números, 2 símbolos (!@#$%&*), exactamente 10 caracteres y no contener '.' o saltos de línea"
            >
              <div class="relative">
                <input
                  [type]="showNewPassword() ? 'text' : 'password'"
                  class="input input-bordered w-full pr-10"
                  placeholder="Ingresa nueva contraseña"
                  formControlName="newPassword"
                  [class.border-red-500]="
                    changePasswordForm.get('newPassword')?.invalid &&
                    changePasswordForm.get('newPassword')?.touched
                  "
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3"
                  (click)="toggleNewPasswordVisibility()"
                >
                  @if (showNewPassword()) {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  }
                </button>
              </div>
            </div>
            <form-error-label
              [control]="changePasswordForm.get('newPassword')!"
            />
          </div>

          <div class="form-control mb-6">
            <label class="label">
              <span class="label-text font-bold"
                >Confirmar Nueva Contraseña</span
              >
            </label>
            <div class="relative">
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                class="input input-bordered w-full pr-10"
                placeholder="Confirma la nueva contraseña"
                formControlName="confirmPassword"
                [class.border-red-500]="
                  changePasswordForm.get('confirmPassword')?.invalid &&
                  changePasswordForm.get('confirmPassword')?.touched
                "
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
                (click)="toggleConfirmPasswordVisibility()"
              >
                @if (showConfirmPassword()) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
                } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                }
              </button>
            </div>
            <form-error-label
              [control]="changePasswordForm.get('confirmPassword')!"
            />

            @if (changePasswordForm.hasError('passwordsMismatch') &&
            changePasswordForm.get('confirmPassword')?.touched) {
            <label class="label">
              <span class="text-red-500 text-xs"
                >Las contraseñas no coinciden</span
              >
            </label>
            }
          </div>

          <div class="modal-action">
            <button type="button" class="btn" (click)="closeModal()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="changePasswordForm.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
              <span class="loading loading-spinner loading-sm"></span>
              Cambiando... } @else { Cambiar Contraseña }
            </button>
          </div>
        </form>
      </div>

      <!-- Fondo del modal -->
      <form method="dialog" class="modal-backdrop">
        <button (click)="closeModal()">Cerrar</button>
      </form>
    </dialog>
  `,
  styles: [
    `
      /* Estilos adicionales si los necesitas */
    `,
  ],
})
export class ChangePasswordModalComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  isOpen = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Formulario reactivo para cambio de contraseña
  changePasswordForm = this.fb.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=(?:.*[A-Z]){2})(?=(?:.*[a-z]){2})(?=(?:.*\d){4})(?=(?:.*[!@#$%&*]){2})(?!.*[.\n]).{10}$/
          ),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(group: any) {
    const newPassword = group.get('newPassword').value;
    const confirmPassword = group.get('confirmPassword').value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  // Método para abrir el modal
  openModal(): void {
    this.isOpen.set(true);
    this.changePasswordForm.reset();
    const modal = document.getElementById(
      'changePasswordModal'
    ) as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  // Método para cerrar el modal
  closeModal(): void {
    this.isOpen.set(false);
    this.changePasswordForm.reset();
    const modal = document.getElementById(
      'changePasswordModal'
    ) as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  // Método para enviar el formulario
  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const { newPassword } = this.changePasswordForm.value;

    // Usar el nuevo endpoint específico
    this.authService.changePassword(newPassword!).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();

        Swal.fire({
          title: '¡Éxito!',
          text: 'Contraseña actualizada correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error al cambiar contraseña:', error);

        Swal.fire({
          title: 'Error',
          text: 'No se pudo cambiar la contraseña. Por favor, intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }
}
