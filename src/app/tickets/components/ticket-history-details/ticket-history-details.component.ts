import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TicketHistoryService } from '@tickets/services/ticket-history.service';
import { TicketsService } from '@tickets/services/tickets.service';
import { TicketHistory, Ticket } from '@tickets/interfaces/ticket.interface';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-ticket-history-details',
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-history-details.component.html',
})
export class TicketHistoryDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketHistoryService = inject(TicketHistoryService);
  private ticketsService = inject(TicketsService);

  ticketId = signal<number | null>(null);
  history = signal<TicketHistory[]>([]);
  ticket = signal<Ticket | null>(null);
  ticketNumber = signal('Cargando...');
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Obtener el ID de la ruta
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && !isNaN(id)) {
        this.ticketId.set(id);
        this.loadTicketInfo();
        this.loadHistory();
      } else {
        this.error.set('ID de ticket inválido');
      }
    });
  }

  loadTicketInfo() {
    const id = this.ticketId();
    if (!id) return;

    this.ticketsService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.ticketNumber.set(ticket.nro_ticket);
      },
      error: (error) => {
        console.error('Error loading ticket:', error);
        this.ticketNumber.set(`Ticket #${id}`);
      }
    });
  }

  loadHistory() {
    const id = this.ticketId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.ticketHistoryService.getTicketHistory(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.history.set(response.history || []);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar el historial');
        }
      });
  }

  getChangedFields(changedFields: string): string[] {
    if (!changedFields) return [];
    return changedFields.split(',').map(field => field.trim()).filter(field => field);
  }

  getFieldLabel(field: string): string {
    const fieldLabels: { [key: string]: string } = {
      'groupId': 'Grupo',
      'severityId': 'Severidad',
      'statusId': 'Estatus',
      'platformId': 'Plataforma',
      'originId': 'Origen',
      'failureId': 'Falla',
      'personalRegionId': 'Responsable',
      'fiberLengthId': 'Tramo Fibra',
      'definition_problem': 'Definición del Problema',
      'evidences_problem': 'Evidencias',
      'hypothesis': 'Hipótesis',
      'impact': 'Impacto',
      'cancellation_note': 'Nota de Cancelación',
      'date_hif': 'Hora Inicio Falla',
      'date_hdc': 'Hora Diagnóstico COR',
      'date_hct': 'Hora Contacto Técnico',
      'form_open_date': 'Fecha Apertura'
    };
    return fieldLabels[field] || field;
  }

  getDetailedChanges(record: TicketHistory): any[] {
    const changes: any[] = [];

    if (!record.oldValues || !record.newValues || !record.changedFields) {
      return changes;
    }

    const changedFieldsArray = this.getChangedFields(record.changedFields);

    changedFieldsArray.forEach(field => {
      const oldValue = record.oldValues[field];
      const newValue = record.newValues[field];

      // Solo mostrar si realmente hay cambio
      if (oldValue !== newValue && !(oldValue == null && newValue == null)) {
        changes.push({
          field,
          label: this.getFieldLabel(field),
          oldValue: this.formatDisplayValue(field, oldValue, record.oldValues),
          newValue: this.formatDisplayValue(field, newValue, record.newValues)
        });
      }
    });

    return changes;
  }

  formatDisplayValue(field: string, value: any, allValues: any): string {
    if (value === null || value === undefined) return 'No asignado';

    try {
      // Para campos de relación, mostrar el nombre en lugar del ID
      if (field.endsWith('Id')) {
        const nameField = field.replace('Id', '');
        const nameValue = allValues[nameField];

        if (nameValue && nameValue !== value) {
          return nameValue;
        }
      }

      // Para fechas, formatear correctamente
      if (field.includes('date_') || field === 'form_open_date') {
        return this.formatVenezuelaDateTime(value);
      }

      // Para textos largos, truncar
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 50) + '...';
      }

      return String(value);
    } catch (error) {
      return String(value);
    }
  }

  // MÉTODO BASE PARA CONVERSIÓN UTC A VENEZUELA
  private convertToVenezuelaTime(date: Date): Date {
    if (date.getTime() === 0) {
      return date;
    }

    // Convertir manualmente UTC a Venezuela (UTC-4)
    const venezuelaOffset = -4 * 60; // minutos
    return new Date(date.getTime() + (venezuelaOffset * 60 * 1000));
  }

  // MÉTODO ACTUALIZADO - Fecha y hora completa
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

  // MÉTODO ACTUALIZADO - Solo fecha
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

  // MÉTODO ACTUALIZADO - Solo hora
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

  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    return fullName.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
