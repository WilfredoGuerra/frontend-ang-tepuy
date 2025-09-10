import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@app-utils/form-utils';
import { CoordinationsService } from '@features/coordinations/services/coordinations.service';
import { ParishesService } from '@features/parishes/services/parishes.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { PositionsService } from '@features/positions/services/positions.service';
import { LevelsEducationService } from '@features/level-education/services/levels-education.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { LevelEducation } from '@features/level-education/interfaces/level-education.interface';
import { User } from '@auth/interfaces/user.interface';
import { AuthService } from '@auth/services/auth.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

interface Gender {
  value: string;
  text: string;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  parishesServices = inject(ParishesService);
  coordinationsServices = inject(CoordinationsService);
  positionsServices = inject(PositionsService);
  levelsEducationServices = inject(LevelsEducationService);

  authServices = inject(AuthService);

  fb = inject(FormBuilder);
  hasError = signal(false);
  errorMessage = signal('');
  showError: boolean = false;

  router = inject(Router);

  levelsDB = signal<LevelEducation[]>([]);

  // Signal para controlar la visibilidad del modal
  showModal = signal(false);

  // Signal para los niveles seleccionados en el modal
  tempSelected = signal<number[]>([]);

  // 5. Signal para texto a mostrar en input
  displayText = signal('');

  constructor() {
    // Cargar datos al inicializar el componente
    this.loadEducationLevels();
    this.levelsDB();

    // Efecto para actualizar el texto cuando cambia la selección
    effect(() => {
      const selectedIds =
        this.registerForm.controls.levelEducationsIds.value || [];
      const allLevels = this.levelsDB();

      const selectedNames = allLevels
        .filter((level) => selectedIds.includes(level.id))
        .map((level) => level.levelEducation)
        .join(', ');

      this.displayText.set(selectedNames);
    });
  }

  // Cargar datos usando el servicio
  loadEducationLevels(): void {
    this.levelsEducationServices.getLevelsEducation().subscribe({
      next: (data) => (this.updateDisplayText(), this.levelsDB.set(data)),
      error: (err) => console.error('Error loading levels', err),
    });
  }

  // Actualizar texto mostrado
  updateDisplayText(): void {
    const selectedIds =
      this.registerForm.controls.levelEducationsIds.value || [];
    const allLevels = this.levelsDB();

    const selectedNames = allLevels
      .filter((level) => selectedIds.includes(level.id))
      .map((level) => level.levelEducation)
      .join(', ');

    this.displayText.set(selectedNames);
  }

  // Abrir modal y cargar selección temporal
  openModal(): void {
    this.tempSelected.set([
      ...(this.registerForm.controls.levelEducationsIds.value || []),
    ]);
    this.showModal.set(true);
  }

  // Guardar selección
  saveSelection(): void {
    this.registerForm.controls.levelEducationsIds.setValue([
      ...this.tempSelected(),
    ]);
    this.registerForm.controls.levelEducationsIds.markAsTouched();
    this.showModal.set(false);
    this.updateDisplayText(); // Actualización explícita
  }

  // Toggle selección individual
  toggleSelection(id: number): void {
    this.tempSelected.update((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  genders = signal<Gender[]>([
    { value: 'masculino', text: 'Masculino' },
    { value: 'femenino', text: 'Femenino' },
  ]);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(FormUtils.emailPattern)]],
    fullName: ['', Validators.required],
    surnames: ['', Validators.required],
    cedula: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{7,8}$/),
        Validators.minLength(7),
        Validators.maxLength(8)
      ]],
    p00: ['', Validators.required],
    date_birthday: ['', Validators.required],
    gender: ['masculino', [Validators.required, Validators.pattern(/^(masculino|femenino)$/)]],
    company_entry_date: ['', Validators.required],
    management_entry_date: ['', Validators.required],
    full_address: ['', [Validators.required, Validators.maxLength(200)]],
    parishId: [null as number | null, Validators.required],
    personalEmail: ['', Validators.pattern(FormUtils.emailPattern)],
    personalPhone: ['', Validators.pattern(/^(041[246]|042[246])-\d{7}$/)],
    officePhone: ['', Validators.pattern('^[0-9]{11}$')],
    coordinationId: [null as number | null, Validators.required],
    positionId: [null as number | null, Validators.required],
    levelEducationsIds: this.fb.control<number[]>([], Validators.required),
    password: [ '', [ Validators.required, Validators.pattern(/^(?=(?:.*[A-Z]){2})(?=(?:.*[a-z]){2})(?=(?:.*\d){4})(?=(?:.*[!@#$%&*]){2})(?!.*[.\n]).{10}$/)]],
  });

  onSubmit() {
    // this.prepareSubmit()
    if (this.registerForm.valid) {
      Swal.fire({
        title: 'Éxito',
        text: 'El formulario se ha guardado correctamente',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
      });
      // Aquí iría la lógica para guardar los datos
      const formValue = this.registerForm.value;

      const userLike: Partial<User> = {
        ...(formValue as any),
      };
      console.log(this.registerForm.value);
      this.authServices
        .createUser(userLike)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            // this.handleError(error);
            return throwError(() => error);
          })
        )
        .subscribe((isValid) => {
          if (isValid) {
            this.router.navigate(['/']);
          }
          this.hasError.set(true);
          setTimeout(() => {
            this.hasError.set(false);
          }, 3000);
        });
    } else {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 3000);
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos correctamente',
        icon: 'error',
        showConfirmButton: false,
        timer: 2000,
      });
      this.registerForm.markAllAsTouched();
      return;
    }
  }

  onCancel() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Perderás todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.registerForm.reset();
        this.router.navigateByUrl('/admin/tickets');
      }
    });
  }

  parishesResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.parishesServices.getParishes();
    },
  });

  coordinationsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.coordinationsServices.getCoordinations();
    },
  });

  PositionsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.positionsServices.getPositions();
    },
  });

  LevelEducationsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.levelsEducationServices.getLevelsEducation();
    },
  });

  prepareSubmit() {
    const formData = this.registerForm.value;
    // Convertir explícitamente a número (como precaución)
    formData.coordinationId = Number(formData.coordinationId);
    return formData;
  }
}
