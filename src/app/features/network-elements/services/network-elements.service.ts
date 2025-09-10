import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NetworkElement,
  NetworksElement,
} from '../interfaces/network-element.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NetworkElementsService {
  private http = inject(HttpClient);

  getNetworkElements(options: Options): Observable<NetworksElement> {
    const { limit = 9, offset = 0, group = '' } = options;
    return this.http.get<NetworksElement>(`${baseUrl}/network-elements`, {
      params: {
        limit,
        offset,
        group,
      },
    });
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
                `No se pudo obtener un elemento de red con el termino: ${query}`
              )
          );
        })
      );
  }

  createNetworkElement(networkElementLike: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.http.post<NetworkElement>(`${baseUrl}/network-elements`, networkElementLike)
    // .pipe(tap((ticket) => this.updateTicketCache(ticket)));
  }

  getNetworkElementsSearch(query: string, options: Options = {}): Observable<NetworksElement> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<NetworksElement>(`${baseUrl}/network-elements/${query}`, {
      params: {
        limit,
        offset,
      },
    });
  }
}
