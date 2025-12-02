import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Failure } from '@features/failures/interfaces/failure.interface';
import { Group } from '@features/groups/interfaces/group.interface';
import {
  NetworkElement,
  NetworksElement,
} from '@features/network-elements/interfaces/network-element.interface';
import { Origin } from '@features/origins/interfaces/origin.interface';
import { Platform } from '@features/platforms/interfaces/platform.interface';
import { Severity } from '@features/severities/interfaces/severity.interface';
import { Status } from '@features/statuses/interfaces/status.interface';
import {
  SearchTicketCriteria,
  Ticket,
  TicketsResponse,
  CreateTicketResponse,
} from '@tickets/interfaces/ticket.interface';
import {
  Observable,
  of,
  tap,
  catchError,
  throwError,
  delay,
  map,
  forkJoin,
  switchMap,
} from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

const emptyTicket: Ticket = {
  id_ticket: 0,
  nro_ticket: '',
  groupId: 0,
  severityId: 0,
  statusId: 0,
  platformId: 0,
  originId: 0,
  failureId: 0,
  personalRegionId: 0,
  date_hif: new Date(Date.now()),
  date_hdc: new Date(Date.now()),
  date_hct: new Date(Date.now()),
  definition_problem: '',
  hypothesis: '',
  isActive: false,
  createdDate: new Date(Date.now()),
  updatedDate: new Date(Date.now()),
  images: [],
};

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private http = inject(HttpClient);

  // private ticketsCache = new Map<string, TicketsResponse>();
  // private ticketCache = new Map<string, Ticket>();

  getTickets(options: Options): Observable<TicketsResponse> {
    const { limit = 9, offset = 0, group = '' } = options;
    // const key = `${limit}-${offset}-${group}`;
    // if (this.ticketsCache.has(key)) {
    //   return of(this.ticketsCache.get(key)!);
    // }
    return this.http
      .get<TicketsResponse>(`${baseUrl}/tickets`, {
        params: {
          limit,
          offset,
          group,
          // sort: 'id_ticket,DESC'
        },
      })
      .pipe
      // delay(2000),
      // tap((resp) => console.log(resp))
      // tap((resp) => this.ticketsCache.set(key, resp))
      ();
  }

  getTicketById(id: number): Observable<Ticket> {
    if (id.toString() === '0') {
      return of(emptyTicket);
    }
    // const key = id.toString();
    // if (this.ticketCache.has(key)) {
    //   return of(this.ticketCache.get(key)!);
    // }
    return this.http
      .get<Ticket>(`${baseUrl}/tickets/by/${id}`)
      .pipe
      // delay(2000),
      // tap((ticket) => this.ticketCache.set(id.toString(), ticket))
      ();
  }

  getTicketByNro(query: string): Observable<Ticket[]> {
    query = query.toLowerCase();
    // console.log(`Emitiendo valor ${query}`);
    // return of([]);
    return this.http.get<Ticket[]>(`${baseUrl}/tickets/${query}`).pipe(
      // delay(2000),
      // tap((resp) => console.log(resp)),
      catchError((error) => {
        console.log('Error fetching ', error);
        return throwError(
          () =>
            new Error(`No se obtuvieron resultados de un ticket con ${query}`)
        );
      })
    );
  }

  advancedSearch(criteria: SearchTicketCriteria): Observable<any> {
    let params = new HttpParams();

    // Agregar todos los criterios no vacíos a los params
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, value.toString());
      }
    });
    //  params = params.append('sort', 'id_ticket,DESC');
    return this.http.get<any>(`${baseUrl}/tickets/search/advanced`, { params });
  }

  // En el servicio, mejorar el createTicket para manejar errores de imágenes
  createTicket(ticketLike: Partial<Ticket>): Observable<Ticket> {
    // Asegurarse de que images sea siempre un array
    const safeTicketData = {
      ...ticketLike,
      images: Array.isArray(ticketLike.images) ? ticketLike.images : [],
    };

    // console.log('Enviando ticket al backend:', safeTicketData);

    return this.http.post<Ticket>(`${baseUrl}/tickets`, safeTicketData).pipe(
      catchError((error) => {
        console.error('Error creating ticket:', error);

        // Si el error es por las imágenes, intentar sin ellas
        if (
          error.error?.message?.includes('images') &&
          safeTicketData.images.length > 0
        ) {
          console.warn(
            'Reintentando sin imágenes debido a error de validación'
          );
          const { images, ...ticketWithoutImages } = safeTicketData;
          return this.http.post<Ticket>(
            `${baseUrl}/tickets`,
            ticketWithoutImages
          );
        }

        return throwError(() => error);
      })
    );
  }

  // updateTicket(id: number, ticketLike: Partial<Ticket>): Observable<Ticket> {
  //   return this.http.patch<Ticket>(`${baseUrl}/tickets/${id}`, ticketLike);
  //   // .pipe(tap((ticket) => this.updateTicketCache(ticket)));
  // }

  updateTicket(id: number, ticketData: any): Observable<Ticket> {
    // Asegurarse de no enviar campos sensibles
    const safeTicketData = { ...ticketData };

    // Eliminar campos que no deben enviarse al backend
    delete safeTicketData.user; // No enviar información del usuario
    delete safeTicketData.createdDate; // Campos de auditoría
    delete safeTicketData.updatedDate;
    delete safeTicketData.nro_ticket; // No modificable

    // return this.http.patch<Ticket>(`${baseUrl}/${id}`, safeTicketData);
    return this.http.patch<Ticket>(`${baseUrl}/tickets/${id}`, safeTicketData);
  }

  uploadImages(fileList: FileList | undefined): Observable<string[]> {
    if (!fileList || fileList.length === 0) {
      return of([]);
    }

    const uploadObservables: Observable<string>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append('file', file);

      const upload$ = this.http
        .post<{ fileName: string }>(`${baseUrl}/files/ticket`, formData)
        .pipe(
          map((response) => response.fileName), // ✅ Solo el nombre del archivo
          catchError((error) => {
            console.error('Error uploading image:', error);
            return of(`error_${file.name}`);
          })
        );

      uploadObservables.push(upload$);
    }

    return forkJoin(uploadObservables);
  }

  uploadImage(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http.post<any>(`${baseUrl}/files/ticket`, formData).pipe(
      // tap(response => console.log('Respuesta del servidor:', response)),
      map((resp) => {
        // El backend devuelve { secureUrl: string }
        if (resp && resp.secureUrl) {
          return resp.secureUrl;
        } else if (typeof resp === 'string') {
          return resp;
        } else if (resp && typeof resp === 'object') {
          // Intentar con diferentes posibles nombres de propiedad
          return (
            resp.fileName ||
            resp.filename ||
            resp.name ||
            resp.imageName ||
            resp.file ||
            resp.image ||
            `unknown_${Date.now()}`
          );
        } else {
          console.warn(
            'Formato de respuesta inesperado, usando nombre temporal'
          );
          return `temp_${Date.now()}_${imageFile.name}`;
        }
      }),
      catchError((error) => {
        console.error('Error en uploadImage:', error);
        return of(`error_${Date.now()}_${imageFile.name}`);
      })
    );
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${baseUrl}/groups`);
  }

  getSeverities(): Observable<Severity[]> {
    return this.http.get<Severity[]>(`${baseUrl}/severities`);
  }

  getStatuses(): Observable<Status[]> {
    return this.http.get<Status[]>(`${baseUrl}/statuses`);
  }

  getPlatforms(): Observable<Platform[]> {
    return this.http.get<Platform[]>(`${baseUrl}/platforms`);
  }

  getOrigins(): Observable<Origin[]> {
    return this.http.get<Origin[]>(`${baseUrl}/origins`);
  }

  getFailures(): Observable<Failure[]> {
    return this.http.get<Failure[]>(`${baseUrl}/failures`);
  }

  generateTicketHistoryPdf(ticketId: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/tickets/${ticketId}/history-pdf`, {
      responseType: 'blob',
    });
  }
}
