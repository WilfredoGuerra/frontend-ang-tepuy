import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@app-utils/form-utils';
import { CoordinationsService } from '@features/coordinations/services/coordinations.service';
import { ParishesService } from '@features/parishes/services/parishes.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { PositionsService } from '@features/positions/services/positions.service';
import { LevelsEducationService } from '@features/level-education/services/levels-education.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { LevelEducation } from '@features/level-education/interfaces/level-education.interface';
import { User } from '@auth/interfaces/user.interface';
import { AuthService } from '@auth/services/auth.service';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserImagePipe } from '@auth/pipes/user-image.pipe';
import { CommonModule } from '@angular/common';

interface Gender {
  value: string;
  text: string;
}

@Component({
  selector: 'app-edit-user-page',
  templateUrl: './edit-user-page.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormErrorLabelComponent,
    UserImagePipe,
  ],
})
export class EditUserPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private parishesServices = inject(ParishesService);
  private coordinationsServices = inject(CoordinationsService);
  private positionsServices = inject(PositionsService);
  private levelsEducationServices = inject(LevelsEducationService);

  // Señales
  userId = signal<number>(0);
  currentUser = signal<User | null>(null);
  currentImage = signal<string | null>(null);
  showModal = signal(false);
  tempSelected = signal<number[]>([]);
  displayText = signal('');
  selectedFiles = signal<{ file: File; url: string }[]>([]);
  isUploading = signal(false);
  isLoading = signal(true);
  levelsDB = signal<LevelEducation[]>([]);

  genders = signal<Gender[]>([
    { value: 'masculino', text: 'Masculino' },
    { value: 'femenino', text: 'Femenino' },
  ]);

  // Formulario reactivo (similar al de registro pero con contraseña opcional)
  editForm = this.fb.group({
    email: [
      '',
      [Validators.required, Validators.pattern(FormUtils.emailPattern)],
    ],
    fullName: ['', Validators.required],
    surnames: ['', Validators.required],
    cedula: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{7,8}$/),
        Validators.minLength(7),
        Validators.maxLength(8),
      ],
    ],
    p00: ['', Validators.required],
    date_birthday: ['', Validators.required],
    gender: [
      'masculino',
      [Validators.required, Validators.pattern(/^(masculino|femenino)$/)],
    ],
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
    // Contraseña opcional en edición
    password: [
      '',
      [
        Validators.pattern(
          /^(?=(?:.*[A-Z]){2})(?=(?:.*[a-z]){2})(?=(?:.*\d){4})(?=(?:.*[!@#$%&*]){2})(?!.*[.\n]).{10}$/
        ),
      ],
    ],
  });

  // Recursos para datos
  parishesResource = rxResource({
    params: () => ({}),
    stream: () => this.parishesServices.getParishes(),
  });

  coordinationsResource = rxResource({
    params: () => ({}),
    stream: () => this.coordinationsServices.getCoordinations(),
  });

  PositionsResource = rxResource({
    params: () => ({}),
    stream: () => this.positionsServices.getPositions(),
  });

  LevelEducationsResource = rxResource({
    params: () => ({}),
    stream: () => this.levelsEducationServices.getLevelsEducation(),
  });

  constructor() {
    // Cargar niveles educativos
    this.loadEducationLevels();

    // Efecto para actualizar texto cuando cambia la selección
    effect(() => {
      const selectedIds = this.editForm.controls.levelEducationsIds.value || [];
      const allLevels = this.levelsDB();

      const selectedNames = allLevels
        .filter((level) => selectedIds.includes(level.id))
        .map((level) => level.levelEducation)
        .join(', ');

      this.displayText.set(selectedNames);
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.userId.set(id);
        this.loadUserData(id);
      }
    });
  }

  loadUserData(id: number): void {
    this.isLoading.set(true);
    this.authService.getUserById(id).subscribe({
      next: (user) => {
        console.log('✅ level_education del usuario:', user.level_education);
        console.log('📊 levelsDB tiene datos?', this.levelsDB().length > 0);
        console.log('📊 levelsDB contenido:', this.levelsDB());

        this.currentUser.set(user);
        this.patchFormWithUserData(user);
        this.isLoading.set(false);

        // Verificar valor después de patch (con timeout para asegurar)
        setTimeout(() => {
          console.log(
            '🔍 DEBUG - Valor en formulario después de patch:',
            this.editForm.controls.levelEducationsIds.value
          );
          console.log('🔍 DEBUG - levelsDB cargados:', this.levelsDB().length);
        }, 200);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuario:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.router.navigate(['/admin/auth/users']);
        });
        this.isLoading.set(false);
      },
    });
  }

  // loadUserData(id: number): void {
  //   this.isLoading.set(true);
  //   this.authService.getUserById(id).subscribe({
  //     next: (user) => {
  //       this.currentUser.set(user);
  //       this.patchFormWithUserData(user);
  //       this.isLoading.set(false);
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar usuario:', error);
  //       Swal.fire({
  //         title: 'Error',
  //         text: 'No se pudo cargar la información del usuario',
  //         icon: 'error',
  //         confirmButtonText: 'Aceptar'
  //       }).then(() => {
  //         this.router.navigate(['/admin/auth/users']);
  //       });
  //       this.isLoading.set(false);
  //     }
  //   });
  // }

  private patchFormWithUserData(user: User): void {
    console.log('🔄 DEBUG - Iniciando patchFormWithUserData');

    // Formatear fechas para input type="date"
    const formatDateForInput = (date: Date | string) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Extraer IDs de level_education (puede venir como objetos o números)
    let levelEducationIds: number[] = [];

    if (user.level_education && Array.isArray(user.level_education)) {
      console.log(
        '🔍 DEBUG - user.level_education antes de mapear:',
        user.level_education
      );

      levelEducationIds = user.level_education.map((level: any) => {
        // Si es objeto, tomar el id, si es número, usarlo directamente
        const id =
          typeof level === 'object' && level.id !== undefined
            ? level.id
            : Number(level);
        console.log(`🔍 DEBUG - Mapeando: ${JSON.stringify(level)} -> ${id}`);
        return id;
      });

      console.log('🔍 DEBUG - IDs extraídos:', levelEducationIds);
    }

    // También verificar si viene como levelEducationsIds (desde el backend de búsqueda)
    if (!levelEducationIds.length && (user as any).levelEducationsIds) {
      console.log(
        '🔍 DEBUG - Usando levelEducationsIds del objeto:',
        (user as any).levelEducationsIds
      );
      levelEducationIds = (user as any).levelEducationsIds;
    }

    console.log(
      '🔍 DEBUG - IDs finales para el formulario:',
      levelEducationIds
    );

    this.editForm.patchValue({
      email: user.email,
      fullName: user.fullName,
      surnames: user.surnames,
      cedula: user.cedula,
      p00: user.p00,
      date_birthday: formatDateForInput(user.date_birthday),
      gender: user.gender,
      company_entry_date: formatDateForInput(user.company_entry_date),
      management_entry_date: formatDateForInput(user.management_entry_date),
      full_address: user.full_address,
      parishId: user.parishId,
      personalEmail: user.personalEmail || '',
      personalPhone: user.personalPhone || '',
      officePhone: user.officePhone || '',
      coordinationId: user.coordinationId,
      positionId: user.position.id,
      levelEducationsIds: levelEducationIds,
      password: '',
    });

    console.log('🔄 Form patch completado');
    console.log(
      '📝 levelEducationsIds en form:',
      this.editForm.controls.levelEducationsIds.value
    );

    setTimeout(() => {
      this.updateDisplayText();
    }, 100);

    // Guardar imagen actual si existe
    if (user.images && user.images.length > 0) {
      this.currentImage.set(user.images[0]);
    }

    // Actualizar el texto display inmediatamente
    this.updateDisplayText();
  }

  // private patchFormWithUserData(user: User): void {
  //   // Formatear fechas para input type="date"
  //   const formatDateForInput = (date: Date | string) => {
  //     if (!date) return '';
  //     const d = new Date(date);
  //     return d.toISOString().split('T')[0];
  //   };

  //   // Extraer IDs de level_education (puede venir como objetos o números)
  //   let levelEducationIds: number[] = [];

  //   if (user.level_education && Array.isArray(user.level_education)) {
  //     levelEducationIds = user.level_education.map((level: any) => {
  //       // Si es objeto, tomar el id, si es número, usarlo directamente
  //       return typeof level === 'object' && level.id !== undefined
  //         ? level.id
  //         : Number(level);
  //     });
  //   }

  //   // También verificar si viene como levelEducationsIds (desde el backend de búsqueda)
  //   if (!levelEducationIds.length && (user as any).levelEducationsIds) {
  //     levelEducationIds = (user as any).levelEducationsIds;
  //   }

  //   this.editForm.patchValue({
  //     email: user.email,
  //     fullName: user.fullName,
  //     surnames: user.surnames,
  //     cedula: user.cedula,
  //     p00: user.p00,
  //     date_birthday: formatDateForInput(user.date_birthday),
  //     gender: user.gender,
  //     company_entry_date: formatDateForInput(user.company_entry_date),
  //     management_entry_date: formatDateForInput(user.management_entry_date),
  //     full_address: user.full_address,
  //     parishId: user.parishId,
  //     personalEmail: user.personalEmail || '',
  //     personalPhone: user.personalPhone || '',
  //     officePhone: user.officePhone || '',
  //     coordinationId: user.coordinationId,
  //     positionId: user.position.id,
  //     levelEducationsIds: levelEducationIds, // Usar los IDs extraídos
  //     password: '', // Contraseña vacía por defecto
  //   });

  //   // Guardar imagen actual si existe
  //   if (user.images && user.images.length > 0) {
  //     this.currentImage.set(user.images[0]);
  //   }

  //   // Actualizar el texto display inmediatamente
  //   this.updateDisplayText();
  // }

  updateDisplayText(): void {
    const selectedIds = this.editForm.controls.levelEducationsIds.value || [];
    const allLevels = this.levelsDB();

    console.log('🔍 DEBUG - updateDisplayText llamado');
    console.log('🔍 DEBUG - selectedIds:', selectedIds);
    console.log('🔍 DEBUG - allLevels count:', allLevels.length);
    console.log('🔍 DEBUG - allLevels:', allLevels);
    console.log(
      '🔍 DEBUG - ¿Hay nivel con ID 2 en allLevels?',
      allLevels.find((level) => level.id === 2)
    );

    const selectedNames = allLevels
      .filter((level) => selectedIds.includes(level.id))
      .map((level) => level.levelEducation)
      .join(', ');

    console.log('🔍 DEBUG - selectedNames result:', selectedNames);

    this.displayText.set(selectedNames || 'Seleccionar niveles educativos');
  }

  loadEducationLevels(): void {
    this.levelsEducationServices.getLevelsEducation().subscribe({
      next: (data) => {
        console.log('📥 Niveles cargados del servicio:', data);
        this.levelsDB.set(data);

        // ACTUALIZAR DISPLAY INMEDIATAMENTE
        this.updateDisplayText();
      },
      error: (err) => console.error('Error loading levels', err),
    });
  }

  openModal(): void {
    this.tempSelected.set([
      ...(this.editForm.controls.levelEducationsIds.value || []),
    ]);
    this.showModal.set(true);
  }

  saveSelection(): void {
    const selectedIds = [...this.tempSelected()];
    console.log('IDs seleccionados para guardar:', selectedIds); // DEBUG

    this.editForm.controls.levelEducationsIds.setValue(selectedIds);
    this.editForm.controls.levelEducationsIds.markAsTouched();
    this.showModal.set(false);

    // Forzar actualización del display
    setTimeout(() => {
      this.updateDisplayText();
    }, 0);
  }

  toggleSelection(id: number): void {
    console.log('Toggle selección - ID:', id); // DEBUG
    this.tempSelected.update((current) => {
      const newSelection = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      console.log('Nueva selección temporal:', newSelection); // DEBUG
      return newSelection;
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const validFiles: { file: File; url: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            title: 'Archivo demasiado grande',
            text: `El archivo ${file.name} excede el límite de 5MB`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          });
          continue;
        }

        // Validar tipo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) continue;

        const url = URL.createObjectURL(file);
        validFiles.push({ file, url });
      }

      // Limpiar URLs previas
      this.cleanupObjectUrls();

      // Solo permitir 1 archivo para foto de perfil
      this.selectedFiles.set(validFiles.slice(0, 1));
    }
  }

  removeSelectedFile(): void {
    this.cleanupObjectUrls();
    this.selectedFiles.set([]);
  }

  removeCurrentImage(): void {
    this.currentImage.set(null);
    // Aquí podrías llamar a un servicio para eliminar la imagen del backend
    Swal.fire({
      title: 'Imagen eliminada',
      text: 'La imagen será removida al guardar los cambios',
      icon: 'info',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private cleanupObjectUrls(): void {
    this.selectedFiles().forEach((item) => {
      URL.revokeObjectURL(item.url);
    });
  }

  getObjectUrl(index: number): string {
    const files = this.selectedFiles();
    return index < files.length ? files[index].url : '';
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      Swal.fire({
        title: '¿Guardar cambios?',
        text: 'Se actualizará la información del usuario',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.saveChanges();
        }
      });
    } else {
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos correctamente',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      this.editForm.markAllAsTouched();
    }
  }

  private saveChanges(): void {
    this.isUploading.set(true);

    const formValue = this.editForm.value;

    // Crear objeto con todos los datos del formulario
    const userData: any = {
      ...formValue,
      // Solo incluir contraseña si tiene valor
      ...(formValue.password && formValue.password.trim() !== ''
        ? {
            password: formValue.password,
          }
        : {}),
    };

    // Si se eliminó la imagen actual y no hay nueva, enviar array vacío
    if (!this.currentImage() && this.selectedFiles().length === 0) {
      userData.images = [];
    }

    const filesToUpload =
      this.selectedFiles().length > 0
        ? this.createFileListFromObjects(this.selectedFiles())
        : undefined;

    this.authService
      .updateUser(this.userId(), userData, filesToUpload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isUploading.set(false);
          let errorMessage = 'Ocurrió un error al actualizar el usuario';

          if (error.error?.message) {
            errorMessage = Array.isArray(error.error.message)
              ? error.error.message.join(', ')
              : error.error.message;
          }

          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });

          return throwError(() => error);
        })
      )
      .subscribe({
        next: (updatedUser) => {
          this.isUploading.set(false);
          Swal.fire({
            title: 'Éxito',
            text: 'Usuario actualizado correctamente',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            this.router.navigate(['/admin/auth/users']);
          });
        },
        error: () => {
          this.isUploading.set(false);
        },
      });
  }

  onCancel(): void {
    Swal.fire({
      title: '¿Cancelar cambios?',
      text: 'Perderás todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/admin/auth/users']);
      }
    });
  }

  private createFileListFromObjects(
    fileObjects: { file: File; url: string }[]
  ): FileList {
    const dataTransfer = new DataTransfer();
    fileObjects.forEach((item) => dataTransfer.items.add(item.file));
    return dataTransfer.files;
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
  }
}
