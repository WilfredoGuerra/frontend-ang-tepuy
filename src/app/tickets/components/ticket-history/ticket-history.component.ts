import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { TicketHistory } from '@tickets/interfaces/ticket.interface';
import { TicketHistoryService } from '@tickets/services/ticket-history.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-ticket-history',
  imports: [CommonModule],
  templateUrl: './ticket-history.component.html',
})
export class TicketHistoryComponent {
  ticketId = input.required<number>();
  private ticketHistoryService = inject(TicketHistoryService);

  history = signal<TicketHistory[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
    this.error.set(null);

    this.ticketHistoryService.getTicketHistory(this.ticketId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.history.set(response.history || []);
        },
        error: (error) => {
          this.error.set(error.message || 'Error desconocido');
        }
      });
  }

  getChangedFields(changedFields: string): string[] {
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
      'impact': 'Impacto',
      'definition_problem': 'Definición problema',
      'evidences_problem': 'Evidencias',
      'hypothesis': 'Hipótesis',
      'cancellation_note': 'Nota cancelación',
      'personalRegionId': 'Responsable',
      'fiberLengthId': 'Tramo fibra',
      'date_hif': 'Hora inicio falla',
      'date_hdc': 'Hora diagnóstico COR',
      'date_hct': 'Hora contacto técnico',
      'form_open_date': 'Fecha apertura',
    };

    return fieldLabels[field] || field;
  }

  getSignificantChanges(record: TicketHistory): any[] {
    const changes: any[] = [];

    if (!record.oldValues || !record.newValues || !record.changedFields) {
      return changes;
    }

    const changedFieldsArray = this.getChangedFields(record.changedFields);

    const fieldConfig: { [key: string]: { label: string, type: 'text' | 'relation' | 'date' } } = {
      'groupId': { label: 'Grupo', type: 'relation' },
      'severityId': { label: 'Severidad', type: 'relation' },
      'statusId': { label: 'Estatus', type: 'relation' },
      'platformId': { label: 'Plataforma', type: 'relation' },
      'originId': { label: 'Origen', type: 'relation' },
      'failureId': { label: 'Falla', type: 'relation' },
      'personalRegionId': { label: 'Responsable', type: 'relation' },
      'fiberLengthId': { label: 'Tramo de fibra', type: 'relation' },
      'definition_problem': { label: 'Definición del problema', type: 'text' },
      'evidences_problem': { label: 'Evidencias', type: 'text' },
      'hypothesis': { label: 'Hipótesis', type: 'text' },
      'impact': { label: 'Impacto', type: 'text' },
      'cancellation_note': { label: 'Nota de cancelación', type: 'text' },
      'date_hif': { label: 'Hora inicio falla', type: 'date' },
      'date_hdc': { label: 'Hora diagnóstico COR', type: 'date' },
      'date_hct': { label: 'Hora contacto técnico', type: 'date' },
      'form_open_date': { label: 'Fecha apertura', type: 'date' },
    };

    changedFieldsArray.forEach(field => {
      const config = fieldConfig[field];
      if (!config) return;

      const oldValue = record.oldValues[field];
      const newValue = record.newValues[field];

      changes.push({
        field,
        label: config.label,
        oldValue: this.formatValue(field, oldValue, record.oldValues, config.type),
        newValue: this.formatValue(field, newValue, record.newValues, config.type)
      });
    });

    return changes;
  }

  formatValue(field: string, value: any, allValues: any, type: 'text' | 'relation' | 'date'): string {
    if (value === null || value === undefined) return 'No asignado';

    try {
      switch (type) {
        case 'relation':
          if (!allValues) return String(value);
          const nameField = field.replace('Id', '');
          const nameValue = allValues[nameField];
          return nameValue && nameValue !== value ? `${nameValue}` : `ID: ${value}`;

        case 'date':
          try {
            const date = this.normalizeDate(value);
            return date.toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZone: 'America/Caracas'
            });
          } catch {
            return String(value);
          }

        case 'text':
          if (typeof value === 'string') {
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
          }
          return String(value);

        default:
          return String(value);
      }
    } catch (error) {
      return String(value);
    }
  }

  private normalizeDate(value: any): Date {
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      if (value.includes('T')) {
        return new Date(value);
      }
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        return new Date(value + ':00Z');
      }
      if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        return new Date(value.replace(' ', 'T') + 'Z');
      }
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }
}
