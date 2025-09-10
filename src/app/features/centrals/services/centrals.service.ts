import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Central, CentralsResponse } from '../interfaces/central.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CentralsService {
  private http = inject(HttpClient);

  getCentrals(options: Options): Observable<CentralsResponse> {
    const { limit = 9, offset = 0, group = '' } = options;
    return this.http.get<CentralsResponse>(`${baseUrl}/centrals`, {
      params: {
        limit,
        offset,
        group,
      },
    });
  }
}
