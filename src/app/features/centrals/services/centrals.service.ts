import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Central, CentralsResponse } from '../interfaces/central.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CentralsService {
  private http = inject(HttpClient);

  getCentrals(options: Options): Observable<CentralsResponse> {
    const { limit = 9, offset = 0, search = '' } = options;

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    // Agregar parámetro de búsqueda si existe
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CentralsResponse>(`${baseUrl}/centrals`, { params });
  }

  getCentral(id: number): Observable<Central> {
    return this.http.get<Central>(`${baseUrl}/centrals/${id}`);
  }

  createCentral(central: any): Observable<Central> {
    return this.http.post<Central>(`${baseUrl}/centrals`, central);
  }

  updateCentral(id: number, central: any): Observable<Central> {
    return this.http.patch<Central>(`${baseUrl}/centrals/${id}`, central);
  }

  deleteCentral(id: number): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/centrals/${id}`);
  }
}
