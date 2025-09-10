import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Ticket } from '@tickets/interfaces/ticket.interface';

@Component({
  selector: 'ticket-table',
  imports: [RouterLink, DatePipe],
  templateUrl: './ticket-table.component.html',
})
export class TicketTableComponent {

  authService = inject(AuthService);

  ticket = input<Ticket[]>();
  ticketBy = input<Ticket[]>();

  errorMessage = input<string|unknown>();
  isLoading = input<boolean>(false);
  isEmpty = input<boolean>(false);
}
