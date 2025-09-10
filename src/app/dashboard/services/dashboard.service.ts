// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getDashboardData(filters: any): Observable<any> {
    let params = new HttpParams();

    // Agregar filtros a los parámetros de la solicitud
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<any>(`${this.apiUrl}/dashboard`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching dashboard data', error);
          // En caso de error, devolver datos de ejemplo
          return of(this.getMockDashboardData());
        })
      );
  }

  getFilterOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/filter-options`)
      .pipe(
        catchError(error => {
          console.error('Error fetching filter options', error);
          // En caso de error, devolver opciones de ejemplo
          return of(this.getMockFilterOptions());
        })
      );
  }

  // Datos de ejemplo para cuando el backend no esté disponible
  private getMockDashboardData(): any {
    return {
      stats: {
        totalTickets: 73,
        openTickets: 25,
        resolvedTickets: 45,
        openPercentage: 34.2,
        resolvedPercentage: 61.6,
        averageResolutionTime: 12,
        highPriorityTickets: 15,
        criticalTickets: 5
      },
      ticketsByGroup: {
        'Conmutación': 45,
        'Transmisión': 15,
        'Acceso': 10,
        'Base de Datos': 3
      },
      ticketsByPlatform: {
        'PSTN': 25,
        'NGN': 20,
        'DSLAM': 15,
        'MSAN': 10,
        'GPON': 3
      },
      ticketsBySeverity: {
        'Disponibilidad de Servicio': 30,
        'Medio': 20,
        'Alto': 15,
        'Crítico': 5,
        'Urgente': 3
      },
      ticketsByStatus: {
        'Abierto': 25,
        'En Progreso': 15,
        'Pendiente': 10,
        'Resuelto': 20,
        'Cerrado': 3
      },
      ticketsByOrigin: {
        'Correo': 30,
        'Teléfono': 20,
        'Portal Web': 15,
        'Chat': 5,
        'Sistema Automático': 3
      },
      ticketsByFailure: {
        'Revisión de Alarma': 25,
        'Sin Gestión': 15,
        'Repuesto': 20,
        'Configuración': 10,
        'Hardware': 3
      },
      ticketsByUser: {
        'Wilfredo Enrique Guerra Avila': 15,
        'Usuario 2': 12,
        'Usuario 3': 10,
        'Admin': 20,
        'Soporte': 16
      },
      recentTickets: [
        {
          id_ticket: 111,
          nro_ticket: 'inc-wufovu4f',
          definition_problem: 'nnnnnnnnnnnnnnnnnnnnnnnn',
          user: 'Wilfredo Enrique Guerra Avila',
          group: 'Conmutación',
          status: 'En Proceso',
          severity: 'Disponibilidad de Servicio',
          createdDate: '2025-09-08T18:57:22.504Z',
          platform: 'DSLAM'
        },
        {
          id_ticket: 110,
          nro_ticket: 'inc-abc123',
          definition_problem: 'Problema de conectividad en servidor',
          user: 'Usuario 2',
          group: 'Base de Datos',
          status: 'Abierto',
          severity: 'Alto',
          createdDate: '2025-09-07T10:30:00.000Z',
          platform: 'NGN'
        }
      ]
    };
  }

  private getMockFilterOptions(): any {
    return {
      groups: [
        { id: 1, group: 'Conmutación' },
        { id: 2, group: 'Transmisión' },
        { id: 3, group: 'Acceso' },
        { id: 4, group: 'Base de Datos' }
      ],
      platforms: [
        { id: 1, platform: 'PSTN' },
        { id: 2, platform: 'NGN' },
        { id: 3, platform: 'DSLAM' },
        { id: 4, platform: 'MSAN' },
        { id: 5, platform: 'GPON' }
      ],
      severities: [
        { id: 1, severity: 'Disponibilidad de Servicio' },
        { id: 2, severity: 'Medio' },
        { id: 3, severity: 'Alto' },
        { id: 4, severity: 'Crítico' },
        { id: 5, severity: 'Urgente' }
      ],
      statuses: [
        { id: 1, status: 'Abierto' },
        { id: 2, status: 'En Proceso' },
        { id: 3, status: 'Pendiente' },
        { id: 4, status: 'Resuelto' },
        { id: 5, status: 'Cerrado' }
      ],
      origins: [
        { id: 1, origin: 'Correo' },
        { id: 2, origin: 'Teléfono' },
        { id: 3, origin: 'Portal Web' },
        { id: 4, origin: 'Chat' },
        { id: 5, origin: 'Sistema Automático' }
      ],
      failures: [
        { id: 1, failure: 'Revisión de Alarma' },
        { id: 2, failure: 'Sin Gestión' },
        { id: 3, failure: 'Repuesto' },
        { id: 4, failure: 'Configuración' },
        { id: 5, failure: 'Hardware' }
      ],
      users: [
        { id: 44, fullName: 'Wilfredo Enrique Guerra Avila' },
        { id: 2, fullName: 'Usuario 2' },
        { id: 3, fullName: 'Usuario 3' },
        { id: 4, fullName: 'Admin' },
        { id: 5, fullName: 'Soporte' }
      ]
    };
  }
}
