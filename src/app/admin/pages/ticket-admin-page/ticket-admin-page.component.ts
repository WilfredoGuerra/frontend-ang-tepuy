import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketsService } from '@tickets/services/tickets.service';
import { map } from 'rxjs';
import { TicketDetailsComponent } from "./ticket-details/ticket-details.component";

@Component({
  selector: 'app-ticket-admin-page',
  imports: [TicketDetailsComponent],
  templateUrl: './ticket-admin-page.component.html',
})
export class TicketAdminPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  ticketsService = inject(TicketsService);

  ticketId = toSignal(this.activatedRoute.params.pipe(map((params) => params['id'])));

  ticketResource = rxResource({
    params: () => ({id: this.ticketId()}),
    stream: ({params}) => this.ticketsService.getTicketById(params.id)
  })

  redirectEffect = effect(() => {
    if(this.ticketResource.error()){
      this.router.navigate(['/admin/tickets']);
    }
  })

 }
