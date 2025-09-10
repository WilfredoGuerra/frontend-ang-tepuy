import { Component, computed, inject, signal } from '@angular/core';
import { TicketTableComponent } from '@tickets/components/ticket-table/ticket-table.component';
import { TicketsService } from '@tickets/services/tickets.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { SearchInputComponent } from "@tickets/components/search-input/search-input.component";
import { of } from 'rxjs';
import { SearchTicketCriteria } from '@tickets/interfaces/ticket.interface';
import { AdvancedSearchModalComponent } from "@tickets/components/advanced-search-modal/advanced-search-modal.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [TicketTableComponent, SearchInputComponent, PaginationComponent, AdvancedSearchModalComponent, RouterLink],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  ticketsService = inject(TicketsService);
  paginationService = inject(PaginationService);
  query = signal('');

  isAdvancedSearch = signal(false);
  advancedSearchCriteria = signal<SearchTicketCriteria>({});

  ticketsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      criteria: this.advancedSearchCriteria()
    }),
    stream: ({ params }) => {
      if (this.isAdvancedSearch()) {
        return this.ticketsService.advancedSearch({
          ...params.criteria,
          page: params.page,
          limit: 9
        });
      } else {
        return this.ticketsService.getTickets({
          offset: (params.page - 1) * 9,
        });
      }
    },
  });

  ticketsResourceByNro = rxResource({
    params: () => ({ query: this.query() }),
    stream: ({ params }) => {
      if (!params.query) return of([]);
      return this.ticketsService.getTicketByNro(params.query);
    },
  });

  onAdvancedSearch(criteria: SearchTicketCriteria) {
    this.isAdvancedSearch.set(true);
    this.advancedSearchCriteria.set(criteria);
    this.query.set(''); // Limpiar búsqueda simple
    this.paginationService.setCurrentPage(1); // Resetear a primera página
  }

  clearAdvancedSearch() {
    this.isAdvancedSearch.set(false);
    this.advancedSearchCriteria.set({});
    this.paginationService.setCurrentPage(1);
  }

  onSearchInput(searchTerm: string) {
  this.query.set(searchTerm);
  // Si hay búsqueda avanzada activa, limpiarla
  if (this.isAdvancedSearch()) {
    this.clearAdvancedSearch();
  }
}

  hasActiveFilters = computed(() => {
    const criteria = this.advancedSearchCriteria();
    return Object.values(criteria).some(value =>
      value !== null && value !== undefined && value !== ''
    );
  });

    countActiveFilters(): number {
    const criteria = this.advancedSearchCriteria();
    return Object.values(criteria).filter(value =>
      value !== null && value !== undefined && value !== ''
    ).length;
  }

    getActiveFilterNames(): string[] {
    const criteria = this.advancedSearchCriteria();
    const activeFilters: string[] = [];

    if (criteria.groupId) activeFilters.push('Grupo');
    if (criteria.severityId) activeFilters.push('Severidad');
    if (criteria.statusId) activeFilters.push('Status');
    if (criteria.platformId) activeFilters.push('Plataforma');
    if (criteria.originId) activeFilters.push('Origen');
    if (criteria.failureId) activeFilters.push('Falla');
    if (criteria.definition_problem) activeFilters.push('Definición');
    if (criteria.evidences_problem) activeFilters.push('Evidencias');
    if (criteria.hypothesis) activeFilters.push('Hipótesis');
    if (criteria.createdDateStart || criteria.createdDateEnd) activeFilters.push('Fechas');

    return activeFilters;
  }

}
