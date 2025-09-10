// En fiber-lengths.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { FiberLength, FiberLengthsResponse } from '../interfaces/fiber-length.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FiberLengthsService {
  constructor(private http: HttpClient) { }

  // Método para obtener todos los tramos de fibra (paginado)
  getFiberLengths(options: Options): Observable<FiberLengthsResponse> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<FiberLengthsResponse>(`${baseUrl}/fiber-lengths`, {
      params: { limit, offset }
    });
  }

  // Método para buscar tramos de fibra por término (usa el findOne del backend)
  searchFiberLengths(term: string): Observable<FiberLength[]> {
    return this.http.get<FiberLength[]>(`${baseUrl}/fiber-lengths/${term}`).pipe(
      catchError(error => {
        console.error('Error searching fiber lengths', error);
        return of([]); // Retorna array vacío en caso de error
      })
    );
  }

  // Método alternativo si la URL es diferente
  searchFiberLengthsBySection(section: string): Observable<FiberLength[]> {
    return this.http.get<FiberLength[]>(`${baseUrl}/fiber-lengths/section/${section}`).pipe(
      catchError(error => {
        console.error('Error searching fiber lengths by section', error);
        return of([]);
      })
    );
  }

  getFiberLengthsSearch(query: string, options: Options = {}): Observable<FiberLengthsResponse> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<FiberLengthsResponse>(`${baseUrl}/fiber-lengths/${query}`, {
      params: {
        limit,
        offset,
      },
    });
  }

  // getNetworkElementsSearch(query: string, options: Options = {}): Observable<NetworksElement> {
  //   const { limit = 9, offset = 0 } = options;
  //   return this.http.get<NetworksElement>(`${baseUrl}/network-elements/${query}`, {
  //     params: {
  //       limit,
  //       offset,
  //     },
  //   });
  // }
}
