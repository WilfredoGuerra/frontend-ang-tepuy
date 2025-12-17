import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
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

  // getProgressTicketsByTicketId(ticketId: number): Observable<ProgressTicket[]> {
  //   return this.http
  //     .get<ProgressTicket[]>(`${baseUrl}/progress-ticket/ticket/${ticketId}`, {
  //       params: { include: 'user,assignedUser,personal_region' } // Incluir relaciones
  //     })
  //     .pipe(
  //       catchError((error) => {
  //         console.error('Error searching progress tickets by ticketId', error);
  //         return of([] as ProgressTicket[]);
  //       })
  //     );
  // }

  getProgressTicketsByTicketId(ticketId: number): Observable<ProgressTicket[]> {
  return this.http
    .get<ProgressTicket[]>(`${baseUrl}/progress-ticket/ticket/${ticketId}`, {
      params: { include: 'basic' } // 🔥 NUEVO: Especificar que queremos la versión básica
    })
    .pipe(
      catchError((error) => {
        console.error('Error searching progress tickets by ticketId', error);
        return of([] as ProgressTicket[]);
      })
    );
}

  createProgressTicket(progressLike: Partial<ProgressTicket>, imageFileList?: FileList): Observable<ProgressTicket> {
    return this.uploadImages(imageFileList).pipe(
      map(imageUrls => ({
        ...progressLike,
        images: [...(progressLike.images || []), ...imageUrls]
      })),
      switchMap(progressData =>
        this.http.post<ProgressTicket>(`${baseUrl}/progress-ticket`, progressData)
      )
    );
  }

  uploadImages(images?: FileList): Observable<string[]> {
    if (!images || images.length === 0) return of([]);

    const uploadObservables = Array.from(images).map((imageFile) =>
      this.uploadImage(imageFile)
    );

    return forkJoin(uploadObservables).pipe(
      tap((imageNames) => console.log('Imágenes subidas:', imageNames))
    );
  }

  uploadImage(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http
      .post<any>(`${baseUrl}/files/ticket`, formData)
      .pipe(
        map((resp) => {
          // El backend devuelve { secureUrl: string }
          if (resp && resp.secureUrl) {
            return resp.secureUrl;
          } else if (typeof resp === 'string') {
            return resp;
          } else if (resp && typeof resp === 'object') {
            return resp.fileName || resp.filename || resp.name || resp.imageName ||
                   resp.file || resp.image || `unknown_${Date.now()}`;
          } else {
            console.warn('Formato de respuesta inesperado, usando nombre temporal');
            return `temp_${Date.now()}_${imageFile.name}`;
          }
        }),
        catchError(error => {
          console.error('Error en uploadImage:', error);
          return of(`error_${Date.now()}_${imageFile.name}`);
        })
      );
  }
}
