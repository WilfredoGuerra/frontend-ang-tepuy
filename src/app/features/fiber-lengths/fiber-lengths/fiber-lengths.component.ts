// fiber-lengths.component.ts
import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiberLengthsService } from '../services/fiber-lengths.service';
import { FiberLength, FiberLengthsResponse } from '../interfaces/fiber-length.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import Swal from 'sweetalert2';
import { StatesService } from '@features/states/services/states.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { AuthService } from '@auth/services/auth.service';

interface NewFiberLength {
  locality_a: string;
  locality_b: string;
  section_name: string;
  stateAId: number;
  stateBId: number;
  isActive: boolean;
}

interface UpdateFiberLength {
  locality_a?: string;
  locality_b?: string;
  section_name?: string;
  stateAId?: number;
  stateBId?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-fiber-lengths',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './fiber-lengths.component.html',
})
export class FiberLengthsComponent {
  @Output() fiberLengthSelected = new EventEmitter<number>();

  private fiberLengthsService = inject(FiberLengthsService);
  private statesService = inject(StatesService);
  paginationService = inject(PaginationService);
  authService = inject(AuthService);

  // Signals para estado del componente
  limit = signal(9);
  searchTerm = signal('');
  selectedFiberLength = signal<FiberLength | null>(null);

  // Estados modales
  showCreateModal = signal(false);
  showEditModal = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  // Almacenar datos originales para detectar cambios
  originalEditData = signal<UpdateFiberLength>({});

  // Formularios con tipos específicos
  newFiberLength = signal<NewFiberLength>({
    locality_a: '',
    locality_b: '',
    section_name: '',
    stateAId: 0,
    stateBId: 0,
    isActive: true
  });

  editFiberLength = signal<UpdateFiberLength & { id: number }>({
    id: 0,
    locality_a: '',
    locality_b: '',
    section_name: '',
    stateAId: 0,
    stateBId: 0,
    isActive: true
  });

  // Resource para estados
  statesResource = rxResource({
    params: () => ({}),
    stream: () => this.statesService.getStates()
  });

  // Resource para tramos de fibra - separado para búsqueda y lista normal
  fiberLengthsListResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage()
    }),
    stream: ({ params }) => {
      return this.fiberLengthsService.getFiberLengths({
        limit: this.limit(),
        offset: (params.page - 1) * this.limit()
      });
    }
  });

  fiberLengthsSearchResource = rxResource({
    params: () => ({
      search: this.searchTerm()
    }),
    stream: ({ params }) => {
      return this.fiberLengthsService.searchFiberLengths(params.search);
    }
  });

  // Computed values basados en los resources
  states = this.statesResource.value;

  // Computed para determinar qué resource usar
  get currentFiberLengthsResource() {
    return this.searchTerm().trim() ? this.fiberLengthsSearchResource : this.fiberLengthsListResource;
  }

  // Computed para los tramos de fibra
  get fiberLengths(): FiberLength[] {
    const result = this.currentFiberLengthsResource.value();

    if (this.searchTerm().trim()) {
      // Para búsqueda, es un array directo
      return (result as FiberLength[]) || [];
    } else {
      // Para lista paginada, extraemos del response
      const response = result as FiberLengthsResponse | undefined;
      return response?.fiberLengths || [];
    }
  }

  // Computed para información de paginación
  get paginationInfo() {
    if (this.searchTerm().trim()) {
      return {
        count: this.fiberLengths.length,
        pages: 1
      };
    }

    const response = this.fiberLengthsListResource.value() as FiberLengthsResponse | undefined;
    if (response) {
      return {
        count: response.count,
        pages: response.pages
      };
    }

    return {
      count: 0,
      pages: 0
    };
  }

  get totalPages() {
    return this.paginationInfo.pages;
  }

  get totalCount() {
    return this.paginationInfo.count;
  }

  get isLoading() {
    return this.statesResource.isLoading() ||
           this.currentFiberLengthsResource.isLoading() ||
           this.loading();
  }

  // Método para recargar los tramos de fibra
  reloadFiberLengths() {
    if (this.searchTerm().trim()) {
      this.searchTerm.update(term => term);
    } else {
      this.paginationService.setCurrentPage(this.paginationService.currentPage());
    }
  }

  // Métodos de búsqueda y paginación
  searchFiberLengths() {
    this.paginationService.setCurrentPage(1);
    this.searchTerm.update(term => term);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.paginationService.setCurrentPage(1);
    this.paginationService.setCurrentPage(1);
  }

  // Métodos de selección
  selectFiberLength(fiberLength: FiberLength) {
    this.selectedFiberLength.set(fiberLength);
    this.fiberLengthSelected.emit(fiberLength.id);
  }

  // Métodos de modales
  async openCreateModal() {
    const { value: confirm } = await Swal.fire({
      title: '¿Crear nuevo tramo?',
      text: 'Se abrirá el formulario para crear un nuevo tramo de fibra',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    });

    if (confirm) {
      this.showCreateModal.set(true);
      this.newFiberLength.set({
        locality_a: '',
        locality_b: '',
        section_name: '',
        stateAId: 0,
        stateBId: 0,
        isActive: true
      });
      this.errorMessage.set('');
    }
  }

  async closeCreateModal() {
    const formData = this.newFiberLength();
    const hasData = Object.values(formData).some(value =>
      value !== '' && value !== 0 && value !== false
    );

    if (hasData) {
      const { value: confirm } = await Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Seguir editando'
      });

      if (!confirm) {
        return;
      }
    }

    this.showCreateModal.set(false);
    this.errorMessage.set('');
  }

  openEditModal(fiberLength: FiberLength) {
    this.showEditModal.set(true);

    // Guardar datos originales para comparar cambios
    const originalData = {
      locality_a: fiberLength.locality_a,
      locality_b: fiberLength.locality_b,
      section_name: fiberLength.section_name,
      stateAId: fiberLength.stateA.id,
      stateBId: fiberLength.stateB.id,
      isActive: fiberLength.isActive
    };

    this.originalEditData.set(originalData);

    this.editFiberLength.set({
      id: fiberLength.id,
      ...originalData
    });

    this.errorMessage.set('');
  }

  async closeEditModal() {
    if (this.hasEditChanges()) {
      const { value: confirm } = await Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Seguir editando'
      });

      if (!confirm) {
        return;
      }
    }

    this.showEditModal.set(false);
    this.errorMessage.set('');
    this.originalEditData.set({});
  }

  // Métodos CRUD
  async createFiberLength() {
    const formData = this.newFiberLength();

    if (!this.isFormValid(formData)) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      await Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.fiberLengthsService.createFiberLength(formData).toPromise();

      // Mensaje de éxito que se cierra automáticamente
      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });

      await toast.fire({
        icon: 'success',
        title: 'Tramo creado correctamente'
      });

      this.showCreateModal.set(false);
      this.reloadFiberLengths();
    } catch (error) {
      this.errorMessage.set('Error al crear el tramo de fibra');
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el tramo de fibra',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      console.error('Error creating fiber length:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async updateFiberLength() {
    const formData = this.editFiberLength();

    if (!this.isFormValid(formData)) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      await Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      // Crear objeto sin la propiedad 'id' para el update
      const { id, ...updateData } = formData;

      await this.fiberLengthsService.updateFiberLength(id, updateData).toPromise();

      // Mensaje de éxito que se cierra automáticamente
      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });

      await toast.fire({
        icon: 'success',
        title: 'Tramo actualizado correctamente'
      });

      // Cerrar modal inmediatamente después del éxito
      this.showEditModal.set(false);
      this.originalEditData.set({});
      this.reloadFiberLengths();
    } catch (error) {
      this.errorMessage.set('Error al actualizar el tramo de fibra');
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el tramo de fibra',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      console.error('Error updating fiber length:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteFiberLength(fiberLength: FiberLength) {
    const { value: confirm } = await Swal.fire({
      title: '¿Desactivar tramo?',
      html: `¿Está seguro de que desea desactivar el tramo <strong>"${fiberLength.section_name}"</strong>?<br><br>
             <span class="text-sm text-gray-600">Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      reverseButtons: true
    });

    if (!confirm) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.fiberLengthsService.deleteFiberLength(fiberLength.id).toPromise();

      // Mensaje de éxito que se cierra automáticamente
      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });

      await toast.fire({
        icon: 'success',
        title: 'Tramo desactivado correctamente'
      });

      this.reloadFiberLengths();
    } catch (error) {
      this.errorMessage.set('Error al desactivar el tramo de fibra');
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo desactivar el tramo de fibra',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      console.error('Error deleting fiber length:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Validación de formularios
  isFormValid(form: NewFiberLength | UpdateFiberLength): boolean {
    return (form.locality_a?.trim() ?? '') !== '' &&
           (form.locality_b?.trim() ?? '') !== '' &&
           (form.section_name?.trim() ?? '') !== '' &&
           (form.stateAId ?? 0) > 0 &&
           (form.stateBId ?? 0) > 0;
  }

  // Métodos auxiliares
  private hasEditChanges(): boolean {
    const original = this.originalEditData();
    const current = this.editFiberLength();

    return original.locality_a !== current.locality_a ||
           original.locality_b !== current.locality_b ||
           original.section_name !== current.section_name ||
           original.stateAId !== current.stateAId ||
           original.stateBId !== current.stateBId ||
           original.isActive !== current.isActive;
  }

  // Métodos para manejar eventos
  handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchTerm.set(target.value);
    }
  }

  handleInputEvent(event: Event, key: keyof NewFiberLength) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateNewFiberLength(key, target.value);
    }
  }

  handleSelectEvent(event: Event, key: 'stateAId' | 'stateBId') {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateNewFiberLength(key, +target.value);
    }
  }

  handleCheckboxEvent(event: Event, key: 'isActive') {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateNewFiberLength(key, target.checked);
    }
  }

  handleEditInputEvent(event: Event, key: keyof UpdateFiberLength) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateEditFiberLength(key, target.value);
    }
  }

  handleEditSelectEvent(event: Event, key: 'stateAId' | 'stateBId') {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateEditFiberLength(key, +target.value);
    }
  }

  handleEditCheckboxEvent(event: Event, key: 'isActive') {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateEditFiberLength(key, target.checked);
    }
  }

  // Métodos para actualizar formularios reactivos
  updateNewFiberLength<T extends keyof NewFiberLength>(key: T, value: NewFiberLength[T]) {
    this.newFiberLength.update(current => ({ ...current, [key]: value }));
  }

  updateEditFiberLength<T extends keyof UpdateFiberLength>(key: T, value: UpdateFiberLength[T]) {
    this.editFiberLength.update(current => ({ ...current, [key]: value }));
  }
}
