import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ReportFilter {
  createdDateStart?: string;
  createdDateEnd?: string;
  groupId?: number | number[];
  severityId?: number;
  platformId?: number;
  statusId?: number;
  failureId?: number;
  definition_problem?: string;
  limit?: number;
}

export interface FilterOption {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/tickets/reports`;

  // Opciones de filtro
  private filterOptions = {
    groups: [
      { id: 1, name: 'Conmutación' },
      { id: 2, name: 'Transmisión' },
      { id: 3, name: 'red de datos' },
      { id: 4, name: 'redes ip' },
      { id: 5, name: 'servicios ti' },
      { id: 6, name: 'energía' },
    ],
    severities: [
      { id: 1, name: 'Disponibilidad de Servicio' },
      { id: 2, name: 'gestión' },
      { id: 3, name: 'disponibilidad' },
      { id: 4, name: 'performance' },
    ],
    platforms: [
      { id: 1, name: 'pstn' },
      { id: 2, name: 'dslam' },
      { id: 3, name: 'ngn' },
      { id: 4, name: 'señalización' },
      { id: 5, name: 'gpon' },
      { id: 6, name: 'dwdm' },
      { id: 7, name: 'radio' },
      { id: 8, name: 'fibra óptica' },
      { id: 9, name: 'opsut' },
      { id: 10, name: 'pdh' },
      { id: 11, name: 'sdh' },
      { id: 13, name: 'backbone ip' },
      { id: 14, name: 'agregación' },
      { id: 15, name: 'red de gestión' },
      { id: 16, name: 'metroethernet' },
      { id: 17, name: 'servidores' },
    ],
    statuses: [
      { id: 1, name: 'en proceso' },
      { id: 2, name: 'cancelado' },
      { id: 3, name: 'resuelto' },
    ],
    failures: [
      { id: 1, name: 'revisión de alarma' },
      { id: 2, name: 'sin gestión' },
      { id: 3, name: 'repuesto' },
      { id: 4, name: 'tarjetas' },
      { id: 5, name: 'control de cambio de emergencia' },
      { id: 6, name: 'control de cambio excedido' },
      { id: 7, name: 'corte de fibra óptica' },
      { id: 8, name: 'motogenerador' },
      { id: 9, name: 'rectificador' },
      { id: 10, name: 'baterias' },
      { id: 11, name: 'ats' },
      { id: 12, name: 'lvd' },
      { id: 13, name: 'acometida eléctrica' },
      { id: 14, name: 'breakers' },
      { id: 15, name: 'climatización' },
      { id: 16, name: 'red pública' },
      { id: 17, name: 'terceros' },
      { id: 18, name: 'ambientales' },
      { id: 19, name: 'vandalismo' },
      { id: 20, name: 'hurto' },
      { id: 21, name: 'riesgo operacional' },
      { id: 22, name: 'enlace' },
      { id: 23, name: 'file system' },
      { id: 24, name: 'base de datos' },
      { id: 25, name: 'aplicación' },
      { id: 26, name: 'disco' },
      { id: 27, name: 'umbrales' },
      { id: 28, name: 'procesos' },
      { id: 29, name: 'tráfico de red' },
      { id: 30, name: 'carga' },
      { id: 31, name: 'cpu' },
      { id: 32, name: 'servidor inhibido' },
      { id: 33, name: 'falsa alarma' },
      { id: 34, name: 'fan cooler' },
    ],
  };

  getFilterOptions(): any {
    return this.filterOptions;
  }

  generatePdfReport(filters: ReportFilter): Observable<Blob> {
    const options = {
      ...this.buildParams(filters),
      responseType: 'blob' as const,
    };

    return this.http.get(`${this.baseUrl}/tickets`, options);
  }

  private buildParams(filters: ReportFilter): { params: HttpParams } {
    let params = new HttpParams();

    // Procesar cada filtro
    if (filters.createdDateStart) {
      params = params.set('createdDateStart', filters.createdDateStart);
    }
    if (filters.createdDateEnd) {
      params = params.set('createdDateEnd', filters.createdDateEnd);
    }
    if (filters.groupId) {
      if (Array.isArray(filters.groupId)) {
        filters.groupId.forEach((id) => {
          params = params.append('groupId', id.toString());
        });
      } else {
        params = params.set('groupId', filters.groupId.toString());
      }
    }
    if (filters.severityId) {
      params = params.set('severityId', filters.severityId.toString());
    }
    if (filters.platformId) {
      params = params.set('platformId', filters.platformId.toString());
    }
    if (filters.statusId) {
      params = params.set('statusId', filters.statusId.toString());
    }
    if (filters.failureId) {
      params = params.set('failureId', filters.failureId.toString());
    }
    if (filters.definition_problem) {
      params = params.set('definition_problem', filters.definition_problem);
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return { params };
  }

  downloadPdf(blob: Blob, filters: ReportFilter): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const dateStr = new Date().toISOString().split('T')[0];
    const groupStr = filters.groupId ? `-grupo-${filters.groupId}` : '';
    a.download = `reporte-tickets-${dateStr}${groupStr}.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  createPdfUrl(blob: Blob): string {
    return window.URL.createObjectURL(blob);
  }

  revokePdfUrl(url: string): void {
    window.URL.revokeObjectURL(url);
  }
}
