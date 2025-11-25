import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NetworkElement,
  NetworksElement,
} from '../interfaces/network-element.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NetworkElementsService {
  private http = inject(HttpClient);

  getNetworkElements(options: Options = {}): Observable<NetworksElement> {
    const { limit = 9, offset = 0, isActive = true } = options;

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('isActive', isActive.toString());

    return this.http.get<NetworksElement>(`${baseUrl}/network-elements`, { params });
  }

  getNetworkElementBy(query: string): Observable<NetworkElement[]> {
    query = query.toLowerCase();
    return this.http
      .get<NetworkElement[]>(`${baseUrl}/network-elements/${query}`)
      .pipe(
        catchError((error) => {
          console.log('Error fetching', error);
          return throwError(
            () =>
              new Error(
                `No se pudo obtener un elemento de red con el término: ${query}`
              )
          );
        })
      );
  }

  searchNetworkElements(term: string, options: Options = {}): Observable<NetworksElement> {
    const { limit = 9, offset = 0 } = options;

    return this.http.get<NetworkElement[]>(`${baseUrl}/network-elements/${term}`)
      .pipe(
        catchError((error) => {
          console.log('Error searching network elements:', error);
          return throwError(
            () => new Error(`No se encontraron elementos con: ${term}`)
          );
        })
      )
      .pipe(
        map((elements: NetworkElement[]) => ({
          count: elements.length,
          pages: Math.ceil(elements.length / limit),
          networksElements: elements.slice(offset, offset + limit)
        }))
      );
  }

  createNetworkElement(networkElementLike: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.http.post<NetworkElement>(`${baseUrl}/network-elements`, networkElementLike);
  }

  updateNetworkElement(id: number, networkElementLike: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.http.patch<NetworkElement>(`${baseUrl}/network-elements/${id}`, networkElementLike);
  }

  deleteNetworkElement(id: number): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/network-elements/${id}`);
  }
}
