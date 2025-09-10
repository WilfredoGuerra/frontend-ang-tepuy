import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  PersonalRegion,
  PersonalsRegion,
} from '../interfaces/personal-region.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PersonalRegionService {
  private http = inject(HttpClient);

  getPersonalRegion(options: Options): Observable<PersonalsRegion> {
    const { limit = 1000, offset = 0 } = options;
    return this.http.get<PersonalsRegion>(`${baseUrl}/personal-regions`, {
      params: {
        limit,
        offset
      },
    });
  }

  getPersonalRegionBy(query: string): Observable<PersonalRegion[]> {
    query = query.toLowerCase();
    return this.http
      .get<PersonalRegion[]>(`${baseUrl}/personal-regions/personal/${query}`)
      .pipe(
        catchError((error) => {
          // console.log('Error fetching', error);
          return throwError(
            () =>
              new Error(
                `No se pudo obtener una persona con el termino: ${query}`
              )
          );
        })
      );
  }

  // En personal-region.service.ts (Angular)
getPersonalRegionByAdvanced(
  query?: string,
  stateId?: number,
  groupId?: number,
  name?: string,
  surname?: string
): Observable<PersonalRegion[]> {
  let params = new HttpParams();

  if (query) params = params.set('query', query);
  if (stateId) params = params.set('stateId', stateId.toString());
  if (groupId) params = params.set('groupId', groupId.toString());
  if (name) params = params.set('name', name);
  if (surname) params = params.set('surname', surname);

  return this.http.get<PersonalRegion[]>(`${baseUrl}/personal-regions/search/advanced`, { params });
}
}
