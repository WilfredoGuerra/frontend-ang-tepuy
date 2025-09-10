import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Origin } from '../interfaces/origin.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class OriginsService {

  private http = inject(HttpClient);

  getOrigins(): Observable<Origin[]> {
    return this.http.get<Origin[]>(`${baseUrl}/origins`);
  }

}
