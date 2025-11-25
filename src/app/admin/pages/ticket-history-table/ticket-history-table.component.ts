import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketHistoryService } from '@tickets/services/ticket-history.service';
import {
  TicketHistory,
  TicketHistorySearchCriteria,
} from '@tickets/interfaces/ticket.interface';
import { finalize } from 'rxjs';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-ticket-history-table',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ticket-history-table.component.html',
})
export class TicketHistoryTableComponent {
  private ticketHistoryService = inject(TicketHistoryService);

  history = signal<TicketHistory[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(0);
  totalCount = signal(0);

  searchCriteria: TicketHistorySearchCriteria = {
    page: 1,
    limit: 20,
  };

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
    this.error.set(null);

    this.ticketHistoryService
      .getAllTicketHistory(this.searchCriteria)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.history.set(response.history);
          this.totalPages.set(response.pages);
          this.totalCount.set(response.count);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar el historial');
        },
      });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.searchCriteria.page = 1;
    this.loadHistory();
  }

  clearFilters() {
    this.searchCriteria = {
      page: 1,
      limit: 20,
    };
    this.currentPage.set(1);
    this.loadHistory();
  }

  changePage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.searchCriteria.page = page;
      this.loadHistory();
    }
  }

  getPaginationRange(): (number | string)[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const delta = 2;
    const range = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');

    range.unshift(1);
    range.push(total);
    return range;
  }

  getTicketNumber(record: TicketHistory): string {
    if (record.ticket?.nro_ticket) {
      return record.ticket.nro_ticket;
    }
    return `INC-${record.ticketId.toString().padStart(6, '0')}`;
  }

  getFieldLabel(field: string): string {
    const fieldLabels: { [key: string]: string } = {
      groupId: 'Grupo',
      severityId: 'Severidad',
      statusId: 'Estatus',
      platformId: 'Plataforma',
      originId: 'Origen',
      failureId: 'Falla',
      personalRegionId: 'Responsable',
      fiberLengthId: 'Tramo Fibra',
      definition_problem: 'Definición Problema',
      evidences_problem: 'Evidencias',
      hypothesis: 'Hipótesis',
      impact: 'Impacto',
      cancellation_note: 'Nota Cancelación',
      date_hif: 'Hora Inicio Falla',
      date_hdc: 'Hora Diagnóstico COR',
      date_hct: 'Hora Contacto Técnico',
      form_open_date: 'Fecha Apertura',
    };
    return fieldLabels[field] || field;
  }

  getFirstChangedField(changedFields: string): string {
    if (!changedFields) return '';
    return changedFields.split(',')[0].trim();
  }

  getDisplayValue(
    values: any,
    changedFields: string,
    type: 'old' | 'new'
  ): string {
    if (!values || !changedFields) return 'N/A';

    const firstField = this.getFirstChangedField(changedFields);
    const value = values[firstField];

    if (value === null || value === undefined) return 'No asignado';

    if (firstField.endsWith('Id')) {
      const nameField = firstField.replace('Id', '');
      const nameValue = values[nameField];

      if (nameValue && nameValue !== value) {
        return nameValue;
      }
    }

    if (firstField.includes('date_') || firstField === 'form_open_date') {
      return this.formatVenezuelaDateTime(value);
    }

    if (typeof value === 'string' && value.length > 30) {
      return value.substring(0, 30) + '...';
    }

    return String(value);
  }

private normalizeDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    // Para formato ISO UTC: 2025-10-10T21:14:54.801Z
    if (value.endsWith('Z') || value.includes('T')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Para otros formatos de PostgreSQL
    const postgresPattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
    const match = value.match(postgresPattern);

    if (match) {
      const [_, year, month, day, hour, minute, second] = match;
      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      ));
    }
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

private convertToVenezuelaTime(date: Date): Date {
  if (date.getTime() === 0) {
    return date;
  }

  // Convertir manualmente UTC a Venezuela (UTC-4)
  const venezuelaOffset = -4 * 60; // minutos
  return new Date(date.getTime() + (venezuelaOffset * 60 * 1000));
}

formatVenezuelaDateTime(value: any): string {
  const date = this.normalizeDate(value);

  if (date.getTime() === 0) {
    return 'Fecha inválida';
  }

  const venezuelaTime = this.convertToVenezuelaTime(date);

  return venezuelaTime.toLocaleString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

formatVenezuelaDate(value: any): string {
  const date = this.normalizeDate(value);

  if (date.getTime() === 0) {
    return 'Fecha inválida';
  }

  const venezuelaTime = this.convertToVenezuelaTime(date);

  return venezuelaTime.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

formatVenezuelaTime(value: any): string {
  const date = this.normalizeDate(value);

  if (date.getTime() === 0) {
    return 'Hora inválida';
  }

  const venezuelaTime = this.convertToVenezuelaTime(date);

  return venezuelaTime.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
