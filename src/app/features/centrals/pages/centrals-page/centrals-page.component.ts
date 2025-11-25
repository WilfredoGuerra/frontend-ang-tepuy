import { Component, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Components
import { CentralsTableComponent } from '@features/centrals/components/centrals-table/centrals-table.component';
import { CentralFormComponent } from '../central-form/central-form.component';

// Services
import { CentralsService } from '@features/centrals/services/centrals.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { AuthService } from '@auth/services/auth.service';

// Interfaces
import { Central } from '@features/centrals/interfaces/central.interface';

@Component({
  selector: 'centrals-page',
  imports: [CentralsTableComponent, CentralFormComponent],
  templateUrl: './centrals-page.component.html',
})
export class CentralsPageComponent {
  // Services
  private centralsService = inject(CentralsService);
  paginationService = inject(PaginationService);
  authService = inject(AuthService);

  // Inputs para modo reutilizable
  isSelectorMode = input(false);

  // Outputs para comunicación
  selected = output<Central>();
  closed = output<void>();

  // Signals
  private searchSubject = new Subject<string>();
  query = signal('');
  showModal = signal(false);
  selectedCentral = signal<Central | null>(null);
  isEdit = signal(false);

  // Resource para datos
  centralsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage() - 1,
      search: this.query(),
    }),
    stream: ({ params }) => {
      return this.centralsService.getCentrals({
        offset: params.page * 9,
        search: params.search,
      });
    },
  });

  constructor() {
    // Configurar debounce para la búsqueda (500ms)
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.query.set(searchTerm);
        this.paginationService.setCurrentPage(1);
      });
  }

  // ==================== MÉTODOS CRUD ====================

  onNewCentral(): void {
    this.selectedCentral.set(null);
    this.isEdit.set(false);
    this.showModal.set(true);
  }

  onEditCentral(central: Central): void {
    this.selectedCentral.set(central);
    this.isEdit.set(true);
    this.showModal.set(true);
  }

  onDeleteCentral(id: number): void {
    this.centralsService.deleteCentral(id).subscribe({
      next: async () => {
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'La central ha sido eliminada correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true,
        });
        this.centralsResource.reload();
      },
      error: async (error) => {
        console.error('Error al eliminar central:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la central. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  onSaveCentral(formData: any): void {
    const operation = this.isEdit() && this.selectedCentral()
      ? this.centralsService.updateCentral(this.selectedCentral()!.id, formData)
      : this.centralsService.createCentral(formData);

    operation.subscribe({
      next: async () => {
        await Swal.fire({
          title: '¡Éxito!',
          text: `Central ${this.isEdit() ? 'actualizada' : 'creada'} correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true,
        });
        this.showModal.set(false);
        this.centralsResource.reload();
      },
      error: async (error) => {
        console.error('Error al guardar central:', error);
        await Swal.fire({
          title: 'Error',
          text: `No se pudo ${this.isEdit() ? 'actualizar' : 'crear'} la central.`,
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  onCancelModal(): void {
    this.showModal.set(false);
    this.selectedCentral.set(null);
  }

  // ==================== MÉTODOS BÚSQUEDA Y PAGINACIÓN ====================

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onSearchImmediate(searchTerm: string): void {
    this.query.set(searchTerm);
    this.paginationService.setCurrentPage(1);
  }

  onPageChange(page: number): void {
    this.paginationService.setCurrentPage(page);
  }

  // ==================== MÉTODOS MODO SELECTOR ====================

  onSelectCentral(central: Central): void {
    this.selected.emit(central);
  }

  onCloseSelector(): void {
    this.closed.emit();
  }

  // ==================== MÉTODOS AUXILIARES ====================

  getPageRange(totalPages: number, currentPage: number): number[] {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
