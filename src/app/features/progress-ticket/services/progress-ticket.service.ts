import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ProgressTicket,
  ProgressTicketResponse,
} from '../interfaces/progress-ticket.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProgressTicketService {
  private http = inject(HttpClient);

  getProgressTicket(options: Options): Observable<ProgressTicketResponse> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<ProgressTicketResponse>(`${baseUrl}/progress-ticket`, {
      params: { limit, offset },
    });
  }

  getProgressTicketBy(id: number): Observable<ProgressTicket> {
    return this.http
      .get<ProgressTicket>(`${baseUrl}/progress-ticket/${id}`)
      .pipe(
        catchError((error) => {
          console.error('Error searching progress ticket', error);
          return of({} as ProgressTicket);
        })
      );
  }

  getProgressTicketsByTicketId(ticketId: number): Observable<ProgressTicket[]> {
    return this.http
      .get<ProgressTicket[]>(`${baseUrl}/progress-ticket/ticket/${ticketId}`, {
        params: { include: 'user,assignedUser,personal_region' } // Incluir relaciones
      })
      .pipe(
        catchError((error) => {
          console.error('Error searching progress tickets by ticketId', error);
          return of([] as ProgressTicket[]);
        })
      );
  }

  // getProgressTicketsByTicketId(ticketId: number): Observable<ProgressTicket[]> {
  //   return this.http
  //     .get<ProgressTicket[]>(`${baseUrl}/progress-ticket/ticket/${ticketId}`)
  //     .pipe(
  //       catchError((error) => {
  //         console.error('Error searching progress tickets by ticketId', error);
  //         return of([] as ProgressTicket[]);
  //       })
  //     );
  // }

  // createProgressTicket(
  //   progressTicketData: FormData
  // ): Observable<ProgressTicket> {
  //   return this.http
  //     .post<ProgressTicket>(`${baseUrl}/progress-ticket`, progressTicketData)
  //     .pipe(
  //       catchError((error) => {
  //         console.error('Error creating progress ticket', error);
  //         throw error;
  //       })
  //     );
  // }

  createProgressTicket(progressLike: Partial<ProgressTicket>): Observable<ProgressTicket> {
    return this.http.post<ProgressTicket>(`${baseUrl}/progress-ticket`, progressLike)
    // .pipe(tap((resp) => console.log(resp)));
  }
}
