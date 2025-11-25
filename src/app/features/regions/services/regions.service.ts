import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Region } from '../interfaces/region.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class RegionsService {

  private http = inject(HttpClient);

    getStates(): Observable<Region[]> {
      return this.http.get<Region[]>(`${baseUrl}/regions`);
    }
}
