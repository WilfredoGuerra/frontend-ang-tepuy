import { Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, of } from 'rxjs';
import { TicketTableComponent } from "@tickets/components/ticket-table/ticket-table.component";
import { TicketsService } from '@tickets/services/tickets.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { SearchInputComponent } from "@tickets/components/search-input/search-input.component";

@Component({
  selector: 'app-group-page',
  imports: [TicketTableComponent, SearchInputComponent],
  templateUrl: './group-page.component.html',
})
export class GroupPageComponent {

  ticketsService = inject(TicketsService);
  activatedRoute = inject(ActivatedRoute);
  paginationService = inject(PaginationService);
  query = signal('');

  group = toSignal(this.activatedRoute.params.pipe(map(({ group }) => group)));


  ticketsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage() - 1,
      group: this.group()
    }),
    stream: ({ params }) => {
      return this.ticketsService.getTickets({
        group: params.group,
        offset: params.page * 9,
      });
    },
  });

  ticketsResourceByNro = rxResource({
    params: () => ({
      query: this.query(),
      group: this.group()
    }),
    stream: ({ params }) => {
      if (!params.query) return of([]);
      return this.ticketsService.getTicketByNro(params.query);
    },
  });

}
