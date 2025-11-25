import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Ticket } from '@tickets/interfaces/ticket.interface';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'ticket-table',
  imports: [RouterLink, DatePipe],
  templateUrl: './ticket-table.component.html',
})
export class TicketTableComponent {
  authService = inject(AuthService);

  private themeService = inject(ThemeService);

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  ticket = input<Ticket[]>();
  ticketBy = input<Ticket[]>();

  errorMessage = input<string | unknown>();
  isLoading = input<boolean>(false);
  isEmpty = input<boolean>(false);

  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }
}
