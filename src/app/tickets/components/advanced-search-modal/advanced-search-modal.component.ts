import { Component, inject, output, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TicketsService } from '@tickets/services/tickets.service';
import { SearchTicketCriteria } from '@tickets/interfaces/ticket.interface';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'advanced-search-modal',
  imports: [FormsModule],
  templateUrl: './advanced-search-modal.component.html',
  styles: `
  /* Estilos para los botones de limpieza */
.btn-xs.btn-ghost {
  padding: 0 0.25rem;
  min-height: 1.5rem;
  height: 1.5rem;
}

.label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label .btn-xs {
  margin-left: 0.5rem;
}
  `
})
export class AdvancedSearchModalComponent {
  private ticketsService = inject(TicketsService);

  isOpen = signal(false);
  isLoading = signal(false);

  searchForm = viewChild<NgForm>('searchForm');

  // Signals para los datos de los selects
  groups = signal<any[]>([]);
  severities = signal<any[]>([]);
  statuses = signal<any[]>([]);
  platforms = signal<any[]>([]);
  origins = signal<any[]>([]);
  failures = signal<any[]>([]);

  searchCriteria: SearchTicketCriteria = {};

  searchComplete = output<SearchTicketCriteria>();

  async open() {
    this.isOpen.set(true);
    await this.loadSelectData();
  }

  close() {
    this.isOpen.set(false);
    this.resetForm();
  }

  loadSelectData() {
    this.isLoading.set(true);

    forkJoin({
      groups: this.ticketsService.getGroups().pipe(catchError(() => of([]))),
      severities: this.ticketsService.getSeverities().pipe(catchError(() => of([]))),
      statuses: this.ticketsService.getStatuses().pipe(catchError(() => of([]))),
      platforms: this.ticketsService.getPlatforms().pipe(catchError(() => of([]))),
      origins: this.ticketsService.getOrigins().pipe(catchError(() => of([]))),
      failures: this.ticketsService.getFailures().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.groups.set(results.groups);
        this.severities.set(results.severities);
        this.statuses.set(results.statuses);
        this.platforms.set(results.platforms);
        this.origins.set(results.origins);
        this.failures.set(results.failures);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading select data:', error);
        this.isLoading.set(false);
        this.groups.set([]);
        this.severities.set([]);
        this.statuses.set([]);
        this.platforms.set([]);
        this.origins.set([]);
        this.failures.set([]);
      }
    });
  }

  search() {
    // Filtrar criterios vacíos
    const filteredCriteria = Object.fromEntries(
      Object.entries(this.searchCriteria).filter(([_, value]) =>
        value !== null && value !== undefined && value !== ''
      )
    );

    this.searchComplete.emit(filteredCriteria);
    this.resetForm()
    this.close();
  }

    resetForm() {
    this.searchCriteria = {};

    // Resetear el formulario Angular si existe
    if (this.searchForm()) {
      this.searchForm()!.resetForm();
    }
  }

  // Método para limpiar un campo específico
  clearField(fieldName: keyof SearchTicketCriteria) {
    this.searchCriteria[fieldName] = undefined as any;
  }
}
