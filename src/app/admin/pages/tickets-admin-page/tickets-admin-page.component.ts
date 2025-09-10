import { Component, inject, signal } from '@angular/core';
import { TicketTableComponent } from '@tickets/components/ticket-table/ticket-table.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { TicketsService } from '@tickets/services/tickets.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ThemeService } from '@shared/theme/theme.service';
import { RouterLink } from '@angular/router';
import { SearchInputComponent } from "@tickets/components/search-input/search-input.component";
import { of } from 'rxjs';
import { SearchTicketCriteria } from '@tickets/interfaces/ticket.interface';
import { AdvancedSearchModalComponent } from "@tickets/components/advanced-search-modal/advanced-search-modal.component";

@Component({
  selector: 'app-tickets-admin-page',
  imports: [TicketTableComponent, RouterLink, SearchInputComponent, AdvancedSearchModalComponent, PaginationComponent],
  templateUrl: './tickets-admin-page.component.html',
})
export class TicketsAdminPageComponent {
  ticketsService = inject(TicketsService);
  paginationService = inject(PaginationService);
  private themeService = inject(ThemeService);

  ticketsPerPage = signal(10);
  query = signal('');

    isAdvancedSearch = signal(false);
    advancedSearchCriteria = signal<SearchTicketCriteria>({});

  // ticketsResource = rxResource({
  //   params: () => ({
  //     page: this.paginationService.currentPage() - 1,
  //     limit: this.ticketsPerPage(),
  //   }),
  //   stream: ({ params }) => {
  //     return this.ticketsService.getTickets({
  //       offset: params.page * 9,
  //       limit: params.limit,
  //     });
  //   },
  // });

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

  // ticketsResourceByNro = rxResource({
  //   params: () => ({query: this.query()}),
  //   stream: ({ params }) => {
  //     if(!params.query) return of([]);
  //     return this.ticketsService.getTicketByNro(params.query);
  //   },
  // });

    ticketsResourceByNro = rxResource({
    params: () => ({ query: this.query() }),
    stream: ({ params }) => {
      if (!params.query) return of([]);
      return this.ticketsService.getTicketByNro(params.query);
    },
  });

  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  // onSearch(value: string) {
  //   console.log({value})
  // }

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
}
